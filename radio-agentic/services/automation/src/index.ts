import { createBus } from "../../../shared/src/nats";
import { Scheduler } from "./scheduler";

const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";

async function main() {
  const bus = await createBus(NATS_URL);
  const sched = new Scheduler(bus);
  sched.start();
  console.log("automation running");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
