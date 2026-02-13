// GENERATED FILE - DO NOT EDIT DIRECTLY.
// Source of truth: schemas/source/contracts_source.json

export interface Track {
  schema_version: "1.0.0";
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  intro_duration_seconds?: number;
  outro_duration_seconds?: number;
  file_uri: string;
  bpm?: number;
  energy?: number;
}

export interface BroadcastQueueItem {
  schema_version: "1.0.0";
  id: string;
  scheduled_time: string;
  item_type: "track" | "voice_link" | "jingle";
  item_id: string;
  status: "pending" | "playing" | "played" | "failed";
  priority?: number;
  estimated_duration_seconds?: number;
}

export interface Schedule {
  schema_version: "1.0.0";
  id: string;
  name: string;
  timezone: string;
  start_time?: string;
  end_time?: string;
  clock_wheel: {
  offset_seconds: number;
  slot_type: "station_id" | "track" | "voice_link" | "ad" | "jingle";
  target?: string;
}[];
  active: boolean;
}

export interface PromptVariableConfig {
  schema_version: "1.0.0";
  station_id: string;
  variables: {
  name: string;
  value_type: "string" | "number" | "boolean" | "json";
  required: boolean;
  default_value?: string | number | boolean | Record<string, unknown> | unknown[] | null;
  description?: string;
}[];
}

export interface NowPlaying {
  schema_version: "1.0.0";
  station_id: string;
  stream_status: "online" | "offline" | "degraded";
  started_at?: string;
  current_item: BroadcastQueueItem;
  current_track?: Track;
  up_next: BroadcastQueueItem[];
  listener_count?: number;
}
