export type Track = {
  id: string;
  title: string;
  artist: string;
  filepath: string;
  bpm?: number;
  keyCamelot?: string;
  energy?: number;
  durationSec?: number;
  tags?: string[];
};

export type RequestMsg = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  desiredArtist?: string;
  desiredTitle?: string;
};

export type NowPlaying = {
  trackId: string;
  title: string;
  artist: string;
  startedAt: string;
  bpm?: number;
  keyCamelot?: string;
};

export interface AudioGraph {
  loadTrack(deckId: string, track: Track): Promise<void>;
  play(deckId: string): Promise<void>;
  stop(deckId: string): Promise<void>;
  setFx(deckId: string, fx: { name: string; wet: number }): Promise<void>;
  setStem(deckId: string, stem: { name: string; gain: number; mute: boolean }): Promise<void>;
}

export interface DeckController {
  deckId: string;
  state(): DeckState;
  load(track: Track): Promise<void>;
  play(): Promise<void>;
  stop(): Promise<void>;
}

export type DeckState =
  | { status: "IDLE" }
  | { status: "LOADING"; trackId: string }
  | { status: "READY"; trackId: string }
  | { status: "PLAYING"; trackId: string; startedAt: string }
  | { status: "ERROR"; message: string };

export interface TransitionPlanner {
  plan(from: Track | null, to: Track): Promise<{ type: "cut" | "xfade"; xfadeMs?: number }>;
}

export interface TrackAnalyzer {
  analyze(filepath: string): Promise<{ bpm?: number; keyCamelot?: string; energy?: number; durationSec?: number }>;
}

export interface StemRenderer {
  prepare(filepath: string): Promise<void>;
  setStem(name: string, gain: number, mute: boolean): Promise<void>;
}

export interface AdInserter {
  maybeInsert(next: Track): Promise<Track[]>;
}

export interface AgentPolicy {
  pickNext(args: {
    candidates: Track[];
    recentTrackIds: string[];
    requests: RequestMsg[];
    nowPlaying: Track | null;
  }): Promise<{ track: Track; reason: string }>;
}

export interface MemoryStore {
  pushRecent(trackId: string): Promise<void>;
  getRecent(limit: number): Promise<string[]>;
}
