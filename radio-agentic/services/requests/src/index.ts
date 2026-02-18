import express from "express";
import http from "node:http";
import { WebSocketServer } from "ws";
import { createBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";
import type { RequestMsg } from "../../../shared/src/types";

const PORT = Number(process.env.PORT ?? 4002);
const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";

const inbox: RequestMsg[] = [];

async function main() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const bus = await createBus(NATS_URL);

  function broadcast(payload: unknown) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  app.get("/requests", (_req, res) => res.json(inbox.slice().reverse()));

  app.post("/requests", async (req, res) => {
    const { name, message } = req.body ?? {};
    const r: RequestMsg = {
      id: `req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: String(name ?? "Anonymous"),
      message: String(message ?? ""),
      createdAt: new Date().toISOString(),
    };
    inbox.push(r);
    broadcast({ type: "request.created", data: r });
    await bus.publish("request.created", mkEvent("request.created", "requests", r));
    res.json({ ok: true, id: r.id });
  });

  server.listen(PORT, () => console.log(`requests listening :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
