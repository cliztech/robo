export type EventName =
  | "track.added"
  | "track.analyzed"
  | "request.created"
  | "playout.next_requested"
  | "playout.enqueue"
  | "now_playing"
  | "stream.listeners"
  | "system.health";

export type EventEnvelope<T> = {
  id: string;
  name: EventName;
  ts: string;
  source: string;
  data: T;
};

export const topic = (name: EventName) => name;

export const mkEvent = <T>(name: EventName, source: string, data: T): EventEnvelope<T> => ({
  id: cryptoRandomId(),
  name,
  ts: new Date().toISOString(),
  source,
  data,
});

function cryptoRandomId(): string {
  // @ts-ignore
  return globalThis.crypto?.randomUUID?.() ?? `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
