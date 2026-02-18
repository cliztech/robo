import type { Track } from "../../../shared/src/types";

export function separationOk(next: Track, recent: Track[]): boolean {
  return !recent.some((t) => t.id === next.id);
}
