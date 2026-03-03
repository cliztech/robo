import express, { type Request, type Response } from "express";
import http from "node:http";
import { WebSocketServer } from "ws";
import { createBus } from "../../../shared/src/nats";
import { mkEvent } from "../../../shared/src/events";
import type { RequestMsg } from "../../../shared/src/types";

const PORT = Number(process.env.PORT ?? 4002);
const NATS_URL = process.env.NATS_URL ?? "nats://nats:4222";

const REQUEST_INBOX_MAX = Number(process.env.REQUEST_INBOX_MAX ?? 500);
const REQUEST_NAME_MAX_LENGTH = Number(process.env.REQUEST_NAME_MAX_LENGTH ?? 80);
const REQUEST_MESSAGE_MAX_LENGTH = Number(process.env.REQUEST_MESSAGE_MAX_LENGTH ?? 500);
const REQUEST_RATE_LIMIT_WINDOW_MS = Number(process.env.REQUEST_RATE_LIMIT_WINDOW_MS ?? 60_000);
const REQUEST_RATE_LIMIT_MAX = Number(process.env.REQUEST_RATE_LIMIT_MAX ?? 30);

type PublishBus = {
  publish(subject: string, payload: unknown): Promise<void>;
};

type ValidationIssue = {
  field: "name" | "message";
  code: "required" | "max_length";
  maxLength?: number;
  message: string;
};

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function validatePayload(name: string, message: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!message) {
    issues.push({ field: "message", code: "required", message: "Message is required" });
  }

  if (name.length > REQUEST_NAME_MAX_LENGTH) {
    issues.push({
      field: "name",
      code: "max_length",
      maxLength: REQUEST_NAME_MAX_LENGTH,
      message: `Name must be at most ${REQUEST_NAME_MAX_LENGTH} characters`,
    });
  }

  if (message.length > REQUEST_MESSAGE_MAX_LENGTH) {
    issues.push({
      field: "message",
      code: "max_length",
      maxLength: REQUEST_MESSAGE_MAX_LENGTH,
      message: `Message must be at most ${REQUEST_MESSAGE_MAX_LENGTH} characters`,
    });
  }

  return issues;
}

function createRateLimiter(windowMs: number, maxRequests: number) {
  const requestLog = new Map<string, number[]>();

  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = requestLog.get(ip) ?? [];
    const activeTimestamps = timestamps.filter((ts) => ts > windowStart);

    if (activeTimestamps.length >= maxRequests) {
      res.status(429).json({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
      });
      return;
    }

    activeTimestamps.push(now);
    requestLog.set(ip, activeTimestamps);
    next();
  };
}

function enforceInboxCap(inbox: RequestMsg[], maxEntries: number) {
  if (inbox.length > maxEntries) {
    inbox.splice(0, inbox.length - maxEntries);
  }
}

export function createApp(bus: PublishBus, opts?: { inbox?: RequestMsg[]; onRequestCreated?: (r: RequestMsg) => void }) {
  const inbox = opts?.inbox ?? [];
  const onRequestCreated = opts?.onRequestCreated ?? (() => {});
  const app = express();
  app.use(express.json());

  app.get("/requests", (_req, res) => res.json(inbox.slice().reverse()));

  app.post(
    "/requests",
    createRateLimiter(REQUEST_RATE_LIMIT_WINDOW_MS, REQUEST_RATE_LIMIT_MAX),
    async (req, res) => {
      const name = normalizeWhitespace(req.body?.name || "Anonymous");
      const message = normalizeWhitespace(req.body?.message);
      const issues = validatePayload(name, message);

      if (issues.length > 0) {
        res.status(400).json({
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload",
            issues,
          },
        });
        return;
      }

      const r: RequestMsg = {
        id: `req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name,
        message,
        createdAt: new Date().toISOString(),
      };

      inbox.push(r);
      enforceInboxCap(inbox, REQUEST_INBOX_MAX);
      onRequestCreated(r);
      await bus.publish("request.created", mkEvent("request.created", "requests", r));
      res.json({ ok: true, id: r.id });
    },
  );

  return { app, inbox };
}

async function main() {
  const bus = await createBus(NATS_URL);

  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  function broadcast(payload: unknown) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  const { app } = createApp(bus, {
    onRequestCreated: (r) => broadcast({ type: "request.created", data: r }),
  });
  server.on("request", app);

  server.listen(PORT, () => console.log(`requests listening :${PORT}`));
}

if (process.env.NODE_ENV !== "test") {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { enforceInboxCap, normalizeWhitespace, validatePayload };
