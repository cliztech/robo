import { spawn } from "node:child_process";
import fs from "node:fs";
import type { Track } from "../../../shared/src/types";
import type { NatsBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";

export class PlayoutEngine {
  private queue: Track[] = [];
  private playing = false;

  constructor(
    private bus: NatsBus,
    private fifoPath: string,
    private fallbackPath?: string
  ) {}

  enqueue(t: Track) {
    this.queue.push(t);
  }

  async startLoop() {
    if (!fs.existsSync(this.fifoPath)) {
      // SECURITY: Avoid shell execution for mkfifo to prevent unexpected behavior
      spawn("mkfifo", [this.fifoPath]);
    }

    setInterval(async () => {
      if (this.playing) return;
      const next = this.queue.shift();
      if (!next) return;
      await this.playTrackToFifo(next);
    }, 250);
  }

  private async playTrackToFifo(t: Track) {
    this.playing = true;

    await this.bus.publish(
      "now_playing",
      mkEvent("now_playing", "audio-engine", {
        trackId: t.id,
        title: t.title,
        artist: t.artist,
        startedAt: new Date().toISOString(),
        bpm: t.bpm,
        keyCamelot: t.keyCamelot,
      })
    );

    // SECURITY: Prevent unexpected behavior by avoiding shell execution (bash -c)
    // Pass args directly to ffmpeg, including -y to overwrite and the FIFO path instead of shell redirection (>)
    const p = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-re",
      "-i", t.filepath,
      "-f", "s16le",
      "-ac", "2",
      "-ar", "44100",
      this.fifoPath
    ], { stdio: "ignore" });

    p.on("exit", () => {
      this.playing = false;
    });
  }
}
