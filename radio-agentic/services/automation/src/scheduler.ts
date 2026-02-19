import { mkEvent } from "../../../shared/src/events";
import type { NatsBus } from "../../../shared/src/nats";

export class Scheduler {
  private interval?: NodeJS.Timeout;

  constructor(private bus: NatsBus, private stationId = "station-1") {}

  start() {
    this.interval = setInterval(async () => {
      await this.bus.publish(
        "playout.next_requested",
        mkEvent("playout.next_requested", "automation", { stationId: this.stationId })
      );
    }, Number(process.env.AUTOMATION_INTERVAL_MS ?? 10_000));
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
