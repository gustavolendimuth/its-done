// jsdom (Jest's testEnvironment) doesn't implement structuredClone, which
// fake-indexeddb needs internally to store/retrieve values.
if (typeof structuredClone === "undefined") {
  (globalThis as { structuredClone?: <T>(value: T) => T }).structuredClone = (
    value
  ) => JSON.parse(JSON.stringify(value));
}

import "fake-indexeddb/auto";

import type {
  LocalWorkSession,
  SyncEvent,
} from "./work-timer-db";

const DB_NAME = "work-timer";

async function freshDbModule() {
  jest.resetModules();
  return import("./work-timer-db");
}

function deleteDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

function makeSession(overrides: Partial<LocalWorkSession> = {}): LocalWorkSession {
  return {
    id: "session-1",
    status: "RUNNING",
    startedAt: "2026-01-01T00:00:00.000Z",
    currentSegmentStartedAt: "2026-01-01T00:00:00.000Z",
    accumulatedSeconds: 0,
    lastPromptAt: null,
    lastConfirmedAt: null,
    hours: null,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<SyncEvent> = {}): SyncEvent {
  return {
    eventId: "event-1",
    sessionId: "session-1",
    type: "start",
    clientTimestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("work-timer-db", () => {
  beforeEach(async () => {
    await deleteDb();
  });

  it("round-trips the active session (setActiveSession -> getActiveSession)", async () => {
    const db = await freshDbModule();
    const session = makeSession();

    await db.setActiveSession(session);
    const result = await db.getActiveSession();

    expect(result).toEqual(session);
  });

  it("returns null when no active session was ever set", async () => {
    const db = await freshDbModule();

    const result = await db.getActiveSession();

    expect(result).toBeNull();
  });

  it("enqueues events preserving insertion order", async () => {
    const db = await freshDbModule();
    const first = makeEvent({ eventId: "event-1", type: "start" });
    const second = makeEvent({ eventId: "event-2", type: "pause" });
    const third = makeEvent({ eventId: "event-3", type: "stop" });

    await db.enqueueEvent(first);
    await db.enqueueEvent(second);
    await db.enqueueEvent(third);

    const pending = await db.getPendingEvents();

    expect(pending).toEqual([first, second, third]);
  });

  it("ackEvents removes exactly the acked events, preserving the order of the rest", async () => {
    const db = await freshDbModule();
    const first = makeEvent({ eventId: "event-1", type: "start" });
    const second = makeEvent({ eventId: "event-2", type: "confirm" });
    const third = makeEvent({ eventId: "event-3", type: "stop" });

    await db.enqueueEvent(first);
    await db.enqueueEvent(second);
    await db.enqueueEvent(third);

    await db.ackEvents(["event-2"]);

    const pending = await db.getPendingEvents();
    expect(pending).toEqual([first, third]);
  });

  it("clearActiveSession leaves the outbox untouched", async () => {
    const db = await freshDbModule();
    const session = makeSession();
    const event = makeEvent();

    await db.setActiveSession(session);
    await db.enqueueEvent(event);

    await db.clearActiveSession();

    expect(await db.getActiveSession()).toBeNull();
    expect(await db.getPendingEvents()).toEqual([event]);
  });

  it("persists the active session and outbox across a simulated app close/reopen (WKT-09 AC6)", async () => {
    const before = await freshDbModule();
    const session = makeSession({ status: "PAUSED" });
    const event = makeEvent({ eventId: "event-reopen" });

    await before.setActiveSession(session);
    await before.enqueueEvent(event);

    // Simulate closing and reopening the app: reset the JS module registry
    // (a fresh module instance and a fresh `dbPromise`, exactly like a page
    // reload discards the JS heap) WITHOUT touching the underlying
    // IndexedDB storage — that's the part that's supposed to survive.
    const after = await freshDbModule();

    expect(await after.getActiveSession()).toEqual(session);
    expect(await after.getPendingEvents()).toEqual([event]);
  });
});
