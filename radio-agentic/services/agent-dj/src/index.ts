import { createBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";
import type { RequestMsg, Track } from "../../../shared/src/types";
import { createDefaultPolicy } from "./policy";
import { createRedisMemory } from "./memory";

const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

const tracks = new Map<string, Track>();
const requests: RequestMsg[] = [];

async function main() {
  const bus = await createBus(NATS_URL);
  const memory = await createRedisMemory(REDIS_URL);
  const policy = createDefaultPolicy();

  await bus.subscribe<Track>("track.added", async (evt) => {
    tracks.set(evt.data.id, evt.data);
  });

  await bus.subscribe<RequestMsg>("request.created", async (evt) => {
    requests.push(evt.data);
    if (requests.length > 100) requests.shift();
  });

  await bus.subscribe<{ stationId: string }>("playout.next_requested", async () => {
    const candidates = Array.from(tracks.values());
    if (candidates.length === 0) return;

    const recent = await memory.getRecent(20);
    const { track, reason } = await policy.pickNext({
      candidates,
      recentTrackIds: recent,
      requests: requests.slice(-10),
      nowPlaying: null,
    });

    await bus.publish("playout.enqueue", mkEvent("playout.enqueue", "agent-dj", { track, reason }));
  });

  console.log("agent-dj running");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
