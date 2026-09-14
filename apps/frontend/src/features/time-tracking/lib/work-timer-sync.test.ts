import type { SyncEvent, LocalWorkSession } from "./work-timer-db";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock("./work-timer-db", () => ({
  getPendingEvents: jest.fn(),
  ackEvents: jest.fn(),
  getActiveSession: jest.fn(),
  setActiveSession: jest.fn(),
  clearActiveSession: jest.fn(),
}));

jest.mock("./work-timer-engine", () => ({
  applyAuthoritativeSession: jest.fn(),
}));

import api from "@/lib/axios";
import * as db from "./work-timer-db";
import * as engine from "./work-timer-engine";
import { syncNow, startSyncLoop, hydrateFromServer } from "./work-timer-sync";

const mockedApi = api as unknown as { post: jest.Mock; get: jest.Mock };
const mockedDb = db as unknown as {
  getPendingEvents: jest.Mock;
  ackEvents: jest.Mock;
  getActiveSession: jest.Mock;
  setActiveSession: jest.Mock;
  clearActiveSession: jest.Mock;
};
const mockedEngine = engine as unknown as {
  applyAuthoritativeSession: jest.Mock;
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
    // Fix 1: a sync response must also update the LIVE engine state, not
    // just IndexedDB, so the UI reflects the change without a page reload.
    expect(mockedEngine.applyAuthoritativeSession).toHaveBeenCalledWith(
      remoteSession
    );
  });

  it("carries clientId/projectId/description from the authoritative response instead of dropping them (WKT-10)", async () => {
    const remoteSession = {
      ...makeLocalSession(),
      clientId: "client-1",
      projectId: "project-1",
      description: "Planejado com antecedência",
    };
    mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
    mockedApi.post.mockResolvedValue({ data: { session: remoteSession } });

    await syncNow();

    expect(mockedDb.setActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        projectId: "project-1",
        description: "Planejado com antecedência",
      })
    );
  });

  it("clears the local active session when the response has no active session", async () => {
    mockedDb.getPendingEvents.mockResolvedValue([makeEvent()]);
    mockedApi.post.mockResolvedValue({ data: { session: null } });

    await syncNow();

    expect(mockedDb.clearActiveSession).toHaveBeenCalled();
    expect(mockedDb.setActiveSession).not.toHaveBeenCalled();
    expect(mockedEngine.applyAuthoritativeSession).toHaveBeenCalledWith(null);
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
    // Fix 1: the losing device's reactive engine state must switch to the
    // winning session too, not just IndexedDB — that's what makes the UI
    // stop showing the discarded session without a manual reload.
    expect(mockedEngine.applyAuthoritativeSession).toHaveBeenCalledWith(
      winningSession
    );
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

  describe("hydrateFromServer", () => {
    it("does not call GET /work-sessions/active when a local session already exists", async () => {
      mockedDb.getActiveSession.mockResolvedValue(makeLocalSession());

      await hydrateFromServer();

      expect(mockedApi.get).not.toHaveBeenCalled();
    });

    it("fetches GET /work-sessions/active and hydrates IndexedDB + the reactive engine when there is no local session (WKT-03 AC1)", async () => {
      mockedDb.getActiveSession.mockResolvedValue(null);
      const remoteSession = makeLocalSession({ status: "RUNNING" });
      mockedApi.get.mockResolvedValue({ data: { session: remoteSession } });

      await hydrateFromServer();

      expect(mockedApi.get).toHaveBeenCalledWith("/work-sessions/active");
      expect(mockedDb.setActiveSession).toHaveBeenCalledWith(remoteSession);
      expect(mockedEngine.applyAuthoritativeSession).toHaveBeenCalledWith(
        remoteSession
      );
    });

    it("carries clientId/projectId/description when hydrating a fresh device from the server (WKT-10)", async () => {
      mockedDb.getActiveSession.mockResolvedValue(null);
      const remoteSession = {
        ...makeLocalSession({ status: "RUNNING" }),
        clientId: "client-1",
        projectId: null,
        description: "Planejado com antecedência",
      };
      mockedApi.get.mockResolvedValue({ data: { session: remoteSession } });

      await hydrateFromServer();

      expect(mockedDb.setActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "client-1",
          projectId: null,
          description: "Planejado com antecedência",
        })
      );
    });

    it("does nothing when there is no local session and the server has none either", async () => {
      mockedDb.getActiveSession.mockResolvedValue(null);
      mockedApi.get.mockResolvedValue({ data: { session: null } });

      await hydrateFromServer();

      expect(mockedDb.setActiveSession).not.toHaveBeenCalled();
      expect(mockedEngine.applyAuthoritativeSession).not.toHaveBeenCalled();
    });

    it("fails silently (no throw) when the fetch errors, leaving local state untouched", async () => {
      mockedDb.getActiveSession.mockResolvedValue(null);
      mockedApi.get.mockRejectedValue(new Error("network error"));

      await expect(hydrateFromServer()).resolves.toBeUndefined();

      expect(mockedDb.setActiveSession).not.toHaveBeenCalled();
      expect(mockedEngine.applyAuthoritativeSession).not.toHaveBeenCalled();
    });
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
