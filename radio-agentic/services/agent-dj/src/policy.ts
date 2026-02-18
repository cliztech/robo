import type { AgentPolicy, Track, RequestMsg } from "../../../shared/src/types";

function scoreCandidate(t: Track, recentIds: Set<string>, reqs: RequestMsg[]): number {
  let s = 0;
  if (!recentIds.has(t.id)) s += 2;
  if (typeof t.energy === "number") s += t.energy;
  if (typeof t.bpm === "number") s += Math.min(1, t.bpm / 200);

  for (const r of reqs) {
    const m = r.message.toLowerCase();
    if (t.artist.toLowerCase().includes(m) || t.title.toLowerCase().includes(m)) s += 5;
  }
  return s + Math.random() * 0.25;
}

export function createDefaultPolicy(): AgentPolicy {
  return {
    async pickNext({ candidates, recentTrackIds, requests }) {
      const recent = new Set(recentTrackIds);
      const ranked = candidates
        .map((t) => ({ t, s: scoreCandidate(t, recent, requests) }))
        .sort((a, b) => b.s - a.s);

      const pick = ranked[0]?.t ?? candidates[0];
      return { track: pick, reason: "highest_score" };
    },
  };
}
