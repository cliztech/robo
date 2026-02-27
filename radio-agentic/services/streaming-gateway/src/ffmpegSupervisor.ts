import { spawn, type ChildProcess } from "node:child_process";

export type StreamingHealthSnapshot = {
  live: boolean;
  ready: boolean;
  degraded: boolean;
  state: "idle" | "starting" | "running" | "backing_off" | "degraded" | "stopping" | "stopped";
  restartCount: number;
  maxRestarts: number;
  lastExitCode: number | null;
  lastExitSignal: NodeJS.Signals | null;
  nextRestartInMs: number | null;
  lastStartAt: string | null;
  updatedAt: string;
};

type FfmpegSupervisorOptions = {
  ffmpegArgs: string[];
  maxRestarts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  jitterRatio: number;
  logger?: (event: string, payload?: Record<string, unknown>) => void;
  onStateChange?: (snapshot: StreamingHealthSnapshot) => void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class FfmpegSupervisor {
  private readonly ffmpegArgs: string[];
  private readonly maxRestarts: number;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly jitterRatio: number;
  private readonly logger: (event: string, payload?: Record<string, unknown>) => void;
  private readonly onStateChange?: (snapshot: StreamingHealthSnapshot) => void;

  private child: ChildProcess | null = null;
  private stopping = false;
  private launchInFlight = false;

  private health: StreamingHealthSnapshot;

  constructor(options: FfmpegSupervisorOptions) {
    this.ffmpegArgs = options.ffmpegArgs;
    this.maxRestarts = options.maxRestarts;
    this.baseBackoffMs = options.baseBackoffMs;
    this.maxBackoffMs = options.maxBackoffMs;
    this.jitterRatio = options.jitterRatio;
    this.logger = options.logger ?? (() => undefined);
    this.onStateChange = options.onStateChange;

    this.health = {
      live: true,
      ready: false,
      degraded: false,
      state: "idle",
      restartCount: 0,
      maxRestarts: this.maxRestarts,
      lastExitCode: null,
      lastExitSignal: null,
      nextRestartInMs: null,
      lastStartAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  public getHealth(): StreamingHealthSnapshot {
    return { ...this.health };
  }

  public async start(): Promise<void> {
    if (this.launchInFlight) {
      return;
    }
    this.stopping = false;
    this.launchInFlight = true;

    this.transition({
      state: "starting",
      live: true,
      ready: false,
      degraded: false,
      nextRestartInMs: null,
    });

    this.launchProcess();
    this.launchInFlight = false;
  }

  public async stop(signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
    this.stopping = true;

    this.transition({
      state: "stopping",
      ready: false,
      nextRestartInMs: null,
    });

    const current = this.child;
    if (!current || current.killed) {
      this.transition({ state: "stopped", live: false, ready: false });
      return;
    }

    current.kill(signal);
    await new Promise<void>((resolve) => {
      current.once("exit", () => resolve());
      setTimeout(() => {
        if (!current.killed) {
          current.kill("SIGKILL");
        }
      }, 5_000);
    });

    this.transition({ state: "stopped", live: false, ready: false });
  }

  private launchProcess(): void {
    if (this.stopping || this.health.degraded) {
      return;
    }

    const nowIso = new Date().toISOString();
    this.logger("ffmpeg_start", {
      attempt: this.health.restartCount + 1,
      args: this.ffmpegArgs,
    });

    const child = spawn("ffmpeg", this.ffmpegArgs, {
      stdio: ["ignore", "inherit", "inherit"],
    });
    this.child = child;

    this.transition({
      state: "running",
      ready: true,
      live: true,
      nextRestartInMs: null,
      lastStartAt: nowIso,
    });

    child.once("error", (error) => {
      this.logger("ffmpeg_spawn_error", { message: error.message });
    });

    child.once("exit", (code, signal) => {
      this.child = null;
      this.transition({
        ready: false,
        lastExitCode: code,
        lastExitSignal: signal,
      });

      this.logger("ffmpeg_exit", {
        code,
        signal,
        restartCount: this.health.restartCount,
        stopping: this.stopping,
      });

      if (this.stopping) {
        this.transition({ state: "stopped", live: false, nextRestartInMs: null });
        return;
      }

      if (this.health.restartCount >= this.maxRestarts) {
        this.transition({
          state: "degraded",
          degraded: true,
          live: true,
          ready: false,
          nextRestartInMs: null,
        });
        this.logger("ffmpeg_degraded", {
          restartCount: this.health.restartCount,
          maxRestarts: this.maxRestarts,
        });
        return;
      }

      const attempt = this.health.restartCount + 1;
      const backoffMs = this.computeBackoffWithJitter(attempt);

      this.transition({
        state: "backing_off",
        restartCount: attempt,
        nextRestartInMs: backoffMs,
      });

      this.logger("ffmpeg_restart_scheduled", {
        attempt,
        maxRestarts: this.maxRestarts,
        backoffMs,
      });

      void this.restartAfterDelay(backoffMs);
    });
  }

  private async restartAfterDelay(delayMs: number): Promise<void> {
    await wait(delayMs);
    if (this.stopping || this.health.degraded) {
      return;
    }

    this.transition({ state: "starting", nextRestartInMs: null });
    this.launchProcess();
  }

  private computeBackoffWithJitter(attempt: number): number {
    const exponentialMs = Math.min(this.maxBackoffMs, this.baseBackoffMs * 2 ** (attempt - 1));
    const jitterSpan = Math.max(1, Math.floor(exponentialMs * this.jitterRatio));
    const jitter = Math.floor(Math.random() * (jitterSpan * 2 + 1)) - jitterSpan;
    return Math.max(100, exponentialMs + jitter);
  }

  private transition(next: Partial<StreamingHealthSnapshot>): void {
    this.health = {
      ...this.health,
      ...next,
      updatedAt: new Date().toISOString(),
    };
    this.onStateChange?.(this.getHealth());
  }
}
