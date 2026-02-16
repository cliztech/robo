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
      spawn("bash", ["-lc", `mkfifo ${this.fifoPath}`]);
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

    const cmd = `ffmpeg -hide_banner -loglevel error -re -i "${t.filepath}" -f s16le -ac 2 -ar 44100 pipe:1 > "${this.fifoPath}"`;
    const p = spawn("bash", ["-lc", cmd], { stdio: "ignore" });

    p.on("exit", () => {
      this.playing = false;
    });
  }
}
