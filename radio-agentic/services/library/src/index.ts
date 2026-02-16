import express from "express";
import { createBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";
import { ingestFolder } from "./ingest";

const PORT = Number(process.env.PORT ?? 4001);
const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";
const MUSIC_DIR = process.env.MUSIC_DIR ?? "/music";

async function main() {
  const app = express();
  app.use(express.json());

  const bus = await createBus(NATS_URL);

  app.post("/ingest", async (_req, res) => {
    const tracks = await ingestFolder(MUSIC_DIR);
    for (const t of tracks) {
      await bus.publish("track.added", mkEvent("track.added", "library", t));
    }
    res.json({ ok: true, ingested: tracks.length });
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => console.log(`library listening :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
