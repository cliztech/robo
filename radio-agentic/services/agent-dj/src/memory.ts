import { createClient } from "redis";
import type { MemoryStore } from "../../../shared/src/types";

export async function createRedisMemory(redisUrl: string, key = "recent_tracks"): Promise<MemoryStore> {
  const client = createClient({ url: redisUrl });
  await client.connect();

  return {
    async pushRecent(trackId: string) {
      await client.lPush(key, trackId);
      await client.lTrim(key, 0, 49);
    },
    async getRecent(limit: number) {
      return await client.lRange(key, 0, Math.max(0, limit - 1));
    },
  };
}
