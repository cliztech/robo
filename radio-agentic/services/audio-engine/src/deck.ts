import type { DeckController, DeckState, Track } from "../../../shared/src/types";

export class SimpleDeck implements DeckController {
  private st: DeckState = { status: "IDLE" };
  private current?: Track;

  constructor(public deckId: string) {}

  state(): DeckState {
    return this.st;
  }

  async load(track: Track): Promise<void> {
    this.st = { status: "LOADING", trackId: track.id };
    this.current = track;
    await new Promise((r) => setTimeout(r, 50));
    this.st = { status: "READY", trackId: track.id };
  }

  async play(): Promise<void> {
    if (!this.current) throw new Error("no track loaded");
    this.st = { status: "PLAYING", trackId: this.current.id, startedAt: new Date().toISOString() };
  }

  async stop(): Promise<void> {
    this.current = undefined;
    this.st = { status: "IDLE" };
  }

  getTrack(): Track | undefined {
    return this.current;
  }
}
