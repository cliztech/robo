import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApp, enforceInboxCap } from "./index";
import type { RequestMsg } from "../../../shared/src/types";

type PublishRecord = { subject: string; payload: unknown };

async function withServer(run: (baseUrl: string, publishes: PublishRecord[]) => Promise<void>) {
  const publishes: PublishRecord[] = [];
  const bus = {
    publish: async (subject: string, payload: unknown) => {
      publishes.push({ subject, payload });
    },
  };

  const { app } = createApp(bus);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl, publishes);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /requests returns 400 for invalid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "  Listener  ", message: "    " }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(body.error.issues));
    assert.equal(body.error.issues[0].field, "message");
    assert.equal(body.error.issues[0].code, "required");
  });
});

test("enforceInboxCap evicts oldest entries", () => {
  const inbox: RequestMsg[] = [
    { id: "1", name: "A", message: "m1", createdAt: "2024-01-01T00:00:00Z" },
    { id: "2", name: "B", message: "m2", createdAt: "2024-01-01T00:00:01Z" },
    { id: "3", name: "C", message: "m3", createdAt: "2024-01-01T00:00:02Z" },
  ];

  enforceInboxCap(inbox, 2);

  assert.equal(inbox.length, 2);
  assert.deepEqual(
    inbox.map((entry) => entry.id),
    ["2", "3"],
  );
});

test("POST /requests accepts valid payload, normalizes fields, and publishes event", async () => {
  await withServer(async (baseUrl, publishes) => {
    const createResponse = await fetch(`${baseUrl}/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "  DJ   Nova  ", message: "  Play    synthwave   please  " }),
    });

    assert.equal(createResponse.status, 200);
    const createBody = await createResponse.json();
    assert.equal(createBody.ok, true);
    assert.ok(createBody.id.startsWith("req_"));

    const listResponse = await fetch(`${baseUrl}/requests`);
    assert.equal(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.equal(listBody.length, 1);
    assert.equal(listBody[0].name, "DJ Nova");
    assert.equal(listBody[0].message, "Play synthwave please");

    assert.equal(publishes.length, 1);
    assert.equal(publishes[0].subject, "request.created");
  });
});
