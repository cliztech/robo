import { createServer } from "node:http";
import { createBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";
import type { NowPlaying } from "../../../shared/src/types";
import { FfmpegSupervisor, type StreamingHealthSnapshot } from "./ffmpegSupervisor";
import { icecastUrl } from "./icecast";
import {
  buildIcecastStatsUrl,
  resolveListenerPollingConfigFromEnv,
  startListenerPolling,
} from "./listeners";

const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";
const FIFO_PATH = process.env.AUDIO_FIFO ?? "/tmp/radio.pcm";

const ICE_HOST = process.env.ICECAST_HOST ?? "icecast";
const ICE_PORT = Number(process.env.ICECAST_PORT ?? 8000);
const ICE_MOUNT = process.env.ICECAST_MOUNT ?? "/stream";
const ICE_USER = process.env.ICECAST_USER ?? "source";
const ICE_PASS = process.env.ICECAST_PASS ?? "__SET_IN_ENV__";

const HEALTH_PORT = Number(process.env.STREAMING_HEALTH_PORT ?? 8090);
const HEARTBEAT_INTERVAL_MS = Number(process.env.STREAMING_HEARTBEAT_INTERVAL_MS ?? 5000);
const MAX_RESTARTS = Number(process.env.FFMPEG_MAX_RESTARTS ?? 8);
const BASE_BACKOFF_MS = Number(process.env.FFMPEG_BACKOFF_BASE_MS ?? 1_000);
const MAX_BACKOFF_MS = Number(process.env.FFMPEG_BACKOFF_MAX_MS ?? 30_000);
const BACKOFF_JITTER_RATIO = Number(process.env.FFMPEG_BACKOFF_JITTER_RATIO ?? 0.25);

const INVALID_CREDENTIAL_PLACEHOLDERS = new Set(["", "__SET_IN_ENV__", "hackme", "changeme"]);

function log(event: string, payload: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: "streaming-gateway",
      event,
      ...payload,
    }),
  );
}
const statsConfig = resolveListenerPollingConfigFromEnv();

const INVALID_CREDENTIAL_PLACEHOLDERS = new Set([
  "",
  "__SET_IN_ENV__",
  "hackme",
  "changeme",
]);

function assertValidCredential(name: string, value: string): void {
  if (INVALID_CREDENTIAL_PLACEHOLDERS.has(value.trim().toLowerCase())) {
    throw new Error(`Invalid ${name}: set a real value in your environment before starting streaming-gateway.`);
  }
}

function buildFfmpegArgs(): string[] {
  const url = icecastUrl({
    host: ICE_HOST,
    port: ICE_PORT,
    mount: ICE_MOUNT,
    user: ICE_USER,
    pass: ICE_PASS,
  });

  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "s16le",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-i",
    FIFO_PATH,
    "-content_type",
    "audio/mpeg",
    "-f",
    "mp3",
    "-b:a",
    "192k",
    url,
  ];
}

async function main() {
  assertValidCredential("ICECAST_PASS", ICE_PASS);

  const bus = await createBus(NATS_URL);

  let latestHealth: StreamingHealthSnapshot = {
    live: true,
    ready: false,
    degraded: false,
    state: "idle",
    restartCount: 0,
    maxRestarts: MAX_RESTARTS,
    lastExitCode: null,
    lastExitSignal: null,
    nextRestartInMs: null,
    lastStartAt: null,
    updatedAt: new Date().toISOString(),
  };

  const supervisor = new FfmpegSupervisor({
    ffmpegArgs: buildFfmpegArgs(),
    maxRestarts: MAX_RESTARTS,
    baseBackoffMs: BASE_BACKOFF_MS,
    maxBackoffMs: MAX_BACKOFF_MS,
    jitterRatio: BACKOFF_JITTER_RATIO,
    logger: (event, payload) => log(event, payload),
    onStateChange: (snapshot) => {
      latestHealth = snapshot;
      log("stream_health_transition", snapshot);
    },
  });

  const heartbeatTimer = setInterval(() => {
    void bus.publish(
      "system.health",
      mkEvent("system.health", "streaming-gateway", {
        component: "ffmpeg",
        ...latestHealth,
      }),
    );
  }, HEARTBEAT_INTERVAL_MS);

  const healthServer = createServer((req, res) => {
    const path = req.url ?? "/";
    const health = supervisor.getHealth();

    if (path === "/live") {
      res.statusCode = health.live ? 200 : 503;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ live: health.live, state: health.state, updatedAt: health.updatedAt }));
      return;
    }

    if (path === "/ready") {
      res.statusCode = health.ready ? 200 : 503;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          ready: health.ready,
          degraded: health.degraded,
          state: health.state,
          restartCount: health.restartCount,
          updatedAt: health.updatedAt,
        }),
      );
      return;
    }

    if (path === "/health" || path === "/") {
      const code = health.live && health.ready && !health.degraded ? 200 : 503;
      res.statusCode = code;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(health));
      return;
    }

    res.statusCode = 404;
    res.end("not found");
  });

  healthServer.listen(HEALTH_PORT, () => log("health_server_started", { port: HEALTH_PORT }));

  const listenerPoller = startListenerPolling(bus, {
    ...statsConfig,
    statsUrl: buildIcecastStatsUrl(ICE_HOST, ICE_PORT, statsConfig.statsUrl),
  });

  const shutdown = async () => {
    listenerPoller.stop();
    await bus.close();
  };

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });

  process.once("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });

  await bus.subscribe<NowPlaying>("now_playing", async (evt) => {
    const np = evt.data;
    log("now_playing", { artist: np.artist, title: np.title });
  });

  await supervisor.start();

  let shutdownInProgress = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shutdownInProgress) {
      return;
    }
    shutdownInProgress = true;

    log("shutdown_started", { signal });

    clearInterval(heartbeatTimer);
    healthServer.close();

    await supervisor.stop(signal);
    await bus.close();

    log("shutdown_completed", { signal });
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  log("streaming_gateway_running", {
    natsUrl: NATS_URL,
    healthPort: HEALTH_PORT,
    heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  log("startup_failed", { message, stack });
  process.exit(1);
});
