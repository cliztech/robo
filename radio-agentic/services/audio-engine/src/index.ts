import { createBus } from "../../../shared/src/nats";
import type { Track } from "../../../shared/src/types";
import { PlayoutEngine } from "./playout";

const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";
const FIFO_PATH = process.env.AUDIO_FIFO ?? "/tmp/radio.pcm";

async function main() {
  const bus = await createBus(NATS_URL);
  const playout = new PlayoutEngine(bus, FIFO_PATH);

  await bus.subscribe<{ track: Track; reason: string }>("playout.enqueue", async (evt) => {
    playout.enqueue(evt.data.track);
  });

  await playout.startLoop();
  console.log("audio-engine running");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
