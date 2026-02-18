import { connect, StringCodec, NatsConnection, Subscription } from "nats";
import type { EventEnvelope, EventName } from "./events";

const sc = StringCodec();

export type NatsBus = {
  nc: NatsConnection;
  publish: <T>(name: EventName, evt: EventEnvelope<T>) => Promise<void>;
  subscribe: <T>(name: EventName, handler: (evt: EventEnvelope<T>) => Promise<void> | void) => Promise<Subscription>;
  close: () => Promise<void>;
};

export async function createBus(url: string): Promise<NatsBus> {
  const nc = await connect({ servers: url });

  async function publish<T>(name: EventName, evt: EventEnvelope<T>) {
    nc.publish(name, sc.encode(JSON.stringify(evt)));
  }

  async function subscribe<T>(name: EventName, handler: (evt: EventEnvelope<T>) => Promise<void> | void) {
    const sub = nc.subscribe(name);
    (async () => {
      for await (const msg of sub) {
        const parsed = JSON.parse(sc.decode(msg.data)) as EventEnvelope<T>;
        await handler(parsed);
      }
    })().catch((err) => console.error(`Error in NATS subscription for topic "${name}":`, err));
    return sub;
  }

  async function close() {
    await nc.drain();
    await nc.close();
  }

  return { nc, publish, subscribe, close };
}
