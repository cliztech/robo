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
      // ✅ GOOD: Avoid command injection by executing mkfifo directly with arguments
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

    // ✅ GOOD: Avoid command injection by executing ffmpeg directly and passing arguments as array
    // Note: Passing the FIFO path as an argument to ffmpeg instead of using shell redirection (>).
    // The -y flag ensures ffmpeg can overwrite the named pipe if necessary without waiting for user input.
    const p = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-re", "-i", t.filepath, "-f", "s16le", "-ac", "2", "-ar", "44100", this.fifoPath], { stdio: "ignore" });

    p.on("exit", () => {
      this.playing = false;
    });
  }
}
