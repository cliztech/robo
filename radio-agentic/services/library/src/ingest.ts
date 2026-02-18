import fs from "node:fs";
import path from "node:path";
import type { Track } from "../../../shared/src/types";

const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus"]);

export async function ingestFolder(dir: string): Promise<Track[]> {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const tracks: Track[] = [];

  for (const f of files) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (!stat.isFile()) continue;
    const ext = path.extname(p).toLowerCase();
    if (!AUDIO_EXT.has(ext)) continue;

    const base = path.basename(p, ext);
    const [artistRaw, titleRaw] = base.split(" - ");
    tracks.push({
      id: `trk_${base.toLowerCase().replace(/\W+/g, "_")}_${stat.size}`,
      artist: titleRaw ? artistRaw : "Unknown",
      title: titleRaw ?? artistRaw,
      filepath: p,
      tags: [],
    });
  }
  return tracks;
}
