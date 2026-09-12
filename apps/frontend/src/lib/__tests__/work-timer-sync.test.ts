import type { SyncEvent, LocalWorkSession } from "../work-timer-db";

jest.mock("../axios", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock("../work-timer-db", () => ({
  getPendingEvents: jest.fn(),
  ackEvents: jest.fn(),
  getActiveSession: jest.fn(),
  setActiveSession: jest.fn(),
  clearActiveSession: jest.fn(),
}));

import api from "../axios";
import * as db from "../work-timer-db";
import { syncNow, startSyncLoop } from "../work-timer-sync";

const mockedApi = api as unknown as { post: jest.Mock };
const mockedDb = db as unknown as {
  getPendingEvents: jest.Mock;
  ackEvents: jest.Mock;
  getActiveSession: jest.Mock;
  setActiveSession: jest.Mock;
  clearActiveSession: jest.Mock;
};

function makeEvent(overrides: Partial<SyncEvent> = {}): SyncEvent {
  return {
    eventId: "event-1",
    sessionId: "session-1",
    type: "start",
    clientTimestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeLocalSession(
  overrides: Partial<LocalWorkSession> = {}
): LocalWorkSession {
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

describe("work-timer-sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.getActiveSession.mockResolvedValue(null);
  });

  it("sends all pending events in order and acks exactly the ones the server confirms", async () => {
    const events = [
      makeEvent({ eventId: "e1", type: "start" }),
      makeEvent({ eventId: "e2", type: "pause" }),
    ];
    mockedDb.getPendingEvents.mockResolvedValue(events);
    mockedApi.post.mockResolvedValue({
      data: { session: makeLocalSession() },
    });

    await syncNow();

    expect(mockedApi.post).toHaveBeenCalledWith("/work-sessions/sync", {
      events,
    });
    expect(mockedDb.ackEvents).toHaveBeenCalledWith(["e1", "e2"]);
  });

  it("does nothing (no request, no re-enqueue) when the outbox is already empty", async () => {
    mockedDb.getPendingEvents.mockResolvedValue([]);

    await syncNow();

    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedDb.ackEvents).not.toHaveBeenCalled();
  });

  it("leaves the outbox untouched when the sync request fails", async () => {
    mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
    mockedApi.post.mockRejectedValue(new Error("network error"));

    await syncNow();

    expect(mockedDb.ackEvents).not.toHaveBeenCalled();
  });

  it("overwrites the local active session with the authoritative response", async () => {
    const remoteSession = makeLocalSession({
      accumulatedSeconds: 42,
      status: "PAUSED",
    });
    mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
    mockedApi.post.mockResolvedValue({ data: { session: remoteSession } });

    await syncNow();

    expect(mockedDb.setActiveSession).toHaveBeenCalledWith(remoteSession);
  });

  it("clears the local active session when the response has no active session", async () => {
    mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
    mockedApi.post.mockResolvedValue({ data: { session: null } });

    await syncNow();

    expect(mockedDb.clearActiveSession).toHaveBeenCalled();
    expect(mockedDb.setActiveSession).not.toHaveBeenCalled();
  });

  it("invokes the discard callback and clears/replaces local state when this device's session was discarded", async () => {
    const localSession = makeLocalSession({ id: "my-session" });
    const winningSession = makeLocalSession({ id: "other-device-session" });
    mockedDb.getActiveSession.mockResolvedValue(localSession);
    mockedDb.getPendingEvents.mockResolvedValue([
      makeEvent({ sessionId: "my-session", type: "start" }),
    ]);
    mockedApi.post.mockResolvedValue({
      data: {
        session: winningSession,
        discarded: { sessionId: "my-session", reason: "conflict" },
      },
    });
    const onDiscarded = jest.fn();

    await syncNow(onDiscarded);

    expect(onDiscarded).toHaveBeenCalledWith({
      sessionId: "my-session",
      reason: "conflict",
    });
    expect(mockedDb.setActiveSession).toHaveBeenCalledWith(winningSession);
  });

  it("does not invoke the discard callback when the discarded session belongs to another device", async () => {
    const localSession = makeLocalSession({ id: "my-session" });
    mockedDb.getActiveSession.mockResolvedValue(localSession);
    mockedDb.getPendingEvents.mockResolvedValue([
      makeEvent({ sessionId: "my-session", type: "start" }),
    ]);
    mockedApi.post.mockResolvedValue({
      data: {
        session: localSession,
        discarded: { sessionId: "someone-elses-session", reason: "conflict" },
      },
    });
    const onDiscarded = jest.fn();

    await syncNow(onDiscarded);

    expect(onDiscarded).not.toHaveBeenCalled();
  });

  describe("startSyncLoop", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("triggers a sync when the browser comes back online (WKT-09 AC3)", async () => {
      mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
      mockedApi.post.mockResolvedValue({ data: { session: null } });

      const stop = startSyncLoop();
      window.dispatchEvent(new Event("online"));
      await jest.advanceTimersByTimeAsync(0);

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      stop();
    });

    it("triggers a sync periodically", async () => {
      mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
      mockedApi.post.mockResolvedValue({ data: { session: null } });

      const stop = startSyncLoop();
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      stop();
    });

    it("stops both the listener and the interval once the returned cleanup runs", async () => {
      mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
      mockedApi.post.mockResolvedValue({ data: { session: null } });

      const stop = startSyncLoop();
      stop();

      window.dispatchEvent(new Event("online"));
      await jest.advanceTimersByTimeAsync(60_000);

      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });
});
