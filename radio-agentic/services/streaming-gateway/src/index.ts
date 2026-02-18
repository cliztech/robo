import { spawn } from "node:child_process";
import { createBus } from "../../../shared/src/nats";
import type { NowPlaying } from "../../../shared/src/types";
import { icecastUrl } from "./icecast";

const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";
const FIFO_PATH = process.env.AUDIO_FIFO ?? "/tmp/radio.pcm";

const ICE_HOST = process.env.ICECAST_HOST ?? "icecast";
const ICE_PORT = Number(process.env.ICECAST_PORT ?? 8000);
const ICE_MOUNT = process.env.ICECAST_MOUNT ?? "/stream";
const ICE_USER = process.env.ICECAST_USER ?? "source";
const ICE_PASS = process.env.ICECAST_PASS ?? "__SET_IN_ENV__";

const INVALID_CREDENTIAL_PLACEHOLDERS = new Set([
  "",
  "__SET_IN_ENV__",
  "hackme",
  "changeme",
]);

function assertValidCredential(name: string, value: string): void {
  if (INVALID_CREDENTIAL_PLACEHOLDERS.has(value.trim().toLowerCase())) {
    throw new Error(
      `Invalid ${name}: set a real value in your environment before starting streaming-gateway.`,
    );
  }
}

async function main() {
  assertValidCredential("ICECAST_PASS", ICE_PASS);

  const bus = await createBus(NATS_URL);

  const url = icecastUrl({
    host: ICE_HOST,
    port: ICE_PORT,
    mount: ICE_MOUNT,
    user: ICE_USER,
    pass: ICE_PASS,
  });

  const cmd = [
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

  const ff = spawn("ffmpeg", cmd, { stdio: "inherit" });
  ff.on("exit", (code) => console.log(`ffmpeg exited ${code}`));

  await bus.subscribe<NowPlaying>("now_playing", async (evt) => {
    const np = evt.data;
    console.log(`NOW PLAYING: ${np.artist} - ${np.title}`);
  });

  console.log("streaming-gateway running");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
