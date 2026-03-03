import { mkEvent } from "../../../shared/src/events";
import type { NatsBus } from "../../../shared/src/nats";
import type {
  StreamListenerSourceMetric,
  StreamListenersEvent,
  StreamPollingAlertEvent,
} from "../../../shared/src/types";

type IcecastStatsSource = {
  listenurl?: string;
  listener_peak?: number;
  listeners?: number;
  server_name?: string;
  server_description?: string;
  stream_start?: string;
};

type IcecastStatsResponse = {
  icestats?: {
    source?: IcecastStatsSource | IcecastStatsSource[];
  };
};

export type ListenerPollingConfig = {
  intervalMs: number;
  failureThreshold: number;
  statsUrl: string;
};

const DEFAULT_INTERVAL_MS = 10_000;
const DEFAULT_FAILURE_THRESHOLD = 3;

export function resolveListenerPollingConfigFromEnv(): ListenerPollingConfig {
  const intervalMs = Number(process.env.ICECAST_STATS_POLL_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  const failureThreshold = Number(process.env.ICECAST_STATS_FAILURE_THRESHOLD ?? DEFAULT_FAILURE_THRESHOLD);
  const statsPath = process.env.ICECAST_STATS_PATH ?? "/status-json.xsl";

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error(`Invalid ICECAST_STATS_POLL_INTERVAL_MS: \"${process.env.ICECAST_STATS_POLL_INTERVAL_MS}\"`);
  }

  if (!Number.isFinite(failureThreshold) || failureThreshold < 1) {
    throw new Error(
      `Invalid ICECAST_STATS_FAILURE_THRESHOLD: \"${process.env.ICECAST_STATS_FAILURE_THRESHOLD}\"`,
    );
  }

  return {
    intervalMs,
    failureThreshold,
    statsUrl: statsPath,
  };
}

export function buildIcecastStatsUrl(host: string, port: number, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `http://${host}:${port}${path}`;
}

export type ListenerPollerControl = {
  stop: () => void;
};

export function startListenerPolling(
  bus: NatsBus,
  cfg: ListenerPollingConfig,
): ListenerPollerControl {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;
  let consecutiveFailures = 0;

  const pollOnce = async () => {
    if (stopped) {
      return;
    }

    try {
      const evt = await fetchListenerMetrics(cfg.statsUrl);
      consecutiveFailures = 0;
      await bus.publish("stream.listeners", mkEvent("stream.listeners", "streaming-gateway", evt));
    } catch (error) {
      consecutiveFailures += 1;
      const message = error instanceof Error ? error.message : String(error);

      console.error(
        `[streaming-gateway] failed to poll Icecast stats (${consecutiveFailures}/${cfg.failureThreshold}): ${message}`,
      );

      if (consecutiveFailures >= cfg.failureThreshold) {
        const alert: StreamPollingAlertEvent = {
          status: "degraded",
          consecutiveFailures,
          threshold: cfg.failureThreshold,
          statsUrl: cfg.statsUrl,
          message,
          detectedAt: new Date().toISOString(),
        };

        await bus.publish("system.health", mkEvent("system.health", "streaming-gateway", alert));
      }
    } finally {
      if (!stopped) {
        timer = setTimeout(() => {
          void pollOnce();
        }, cfg.intervalMs);
      }
    }
  };

  void pollOnce();

  return {
    stop: () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}

async function fetchListenerMetrics(statsUrl: string): Promise<StreamListenersEvent> {
  const response = await fetch(statsUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as IcecastStatsResponse;
  const source = payload.icestats?.source;

  if (!source) {
    throw new Error("Icecast response missing icestats.source");
  }

  const sourceList = Array.isArray(source) ? source : [source];
  const streams = sourceList.map(mapSourceMetric);

  return {
    totalListeners: streams.reduce((sum, stream) => sum + stream.listeners, 0),
    streamCount: streams.length,
    streams,
    polledAt: new Date().toISOString(),
  };
}

function mapSourceMetric(source: IcecastStatsSource): StreamListenerSourceMetric {
  return {
    mount: extractMount(source.listenurl),
    listeners: source.listeners ?? 0,
    listenerPeak: source.listener_peak ?? 0,
    listenUrl: source.listenurl ?? "",
    streamName: source.server_name ?? "",
    description: source.server_description ?? "",
    startedAt: source.stream_start,
  };
}

function extractMount(listenUrl: string | undefined): string {
  if (!listenUrl) {
    return "";
  }

  try {
    return new URL(listenUrl).pathname;
  } catch {
    return "";
  }
}
