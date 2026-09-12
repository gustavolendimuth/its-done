import type { LocalWorkSession } from "../work-timer-db";

const HOUR_MS = 60 * 60 * 1000;
const GRACE_MS = 15 * 60 * 1000;

describe("work-timer-engine", () => {
  const START_TIME = new Date("2026-01-01T00:00:00.000Z").getTime();

  let dbMock: {
    getActiveSession: jest.Mock;
    setActiveSession: jest.Mock;
    clearActiveSession: jest.Mock;
    enqueueEvent: jest.Mock;
  };
  let engine: typeof import("../work-timer-engine");

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.setSystemTime(START_TIME);

    dbMock = {
      getActiveSession: jest.fn().mockResolvedValue(null),
      setActiveSession: jest.fn().mockResolvedValue(undefined),
      clearActiveSession: jest.fn().mockResolvedValue(undefined),
      enqueueEvent: jest.fn().mockResolvedValue(undefined),
    };

    jest.doMock("../work-timer-db", () => dbMock);

    engine = require("../work-timer-engine");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("start() creates a RUNNING session with startedAt = now when none exists", async () => {
    const session = await engine.start();

    expect(session).toMatchObject({
      status: "RUNNING",
      startedAt: new Date(START_TIME).toISOString(),
      currentSegmentStartedAt: new Date(START_TIME).toISOString(),
      accumulatedSeconds: 0,
    });
    expect(dbMock.setActiveSession).toHaveBeenCalledWith(session);
    expect(dbMock.enqueueEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: session.id, type: "start" })
    );
  });

  it("start() returns the existing session (from IndexedDB) instead of creating a new one", async () => {
    const existing: LocalWorkSession = {
      id: "existing-session",
      status: "RUNNING",
      startedAt: new Date(START_TIME - 5000).toISOString(),
      currentSegmentStartedAt: new Date(START_TIME - 5000).toISOString(),
      accumulatedSeconds: 0,
      lastPromptAt: null,
      lastConfirmedAt: null,
      hours: null,
    };
    dbMock.getActiveSession.mockResolvedValue(existing);

    const result = await engine.start();

    expect(result).toEqual(existing);
    expect(dbMock.enqueueEvent).not.toHaveBeenCalled();
  });

  it("reflects the full elapsed time on the first read after a reload/reopen, without resetting to zero (WKT-01 AC4, WKT-02 AC2)", async () => {
    const twoHoursAgo = new Date(START_TIME - 2 * 60 * 60 * 1000).toISOString();
    dbMock.getActiveSession.mockResolvedValue({
      id: "existing-session",
      status: "RUNNING",
      startedAt: twoHoursAgo,
      currentSegmentStartedAt: twoHoursAgo,
      accumulatedSeconds: 0,
      lastPromptAt: null,
      lastConfirmedAt: null,
      hours: null,
    });

    // Simulate the module having just been freshly loaded after a page
    // reload/reopen: the first interaction is subscribe() — exactly what
    // useWorkTimerEngine() does on mount — not start(); no clock has ticked
    // forward within this fresh module instance yet.
    const states: (LocalWorkSession | null)[] = [];
    const unsubscribe = engine.subscribe((s) => states.push(s));
    await jest.advanceTimersByTimeAsync(0);

    expect(states.at(-1)?.status).toBe("RUNNING");
    expect(engine.getElapsedSeconds()).toBe(2 * 60 * 60);

    unsubscribe();
  });

  it("start() called twice in-memory returns the same session without a second start event", async () => {
    const first = await engine.start();
    const second = await engine.start();

    expect(second.id).toBe(first.id);
    expect(dbMock.enqueueEvent).toHaveBeenCalledTimes(1);
  });

  it("getElapsedSeconds() excludes paused intervals across multiple pause/resume cycles", async () => {
    await engine.start();

    jest.setSystemTime(START_TIME + 10_000); // 10s running
    expect(engine.getElapsedSeconds()).toBe(10);

    await engine.pause();
    jest.setSystemTime(START_TIME + 40_000); // 30s paused (doesn't count)
    expect(engine.getElapsedSeconds()).toBe(10);

    await engine.confirm(); // resumes at +40s
    jest.setSystemTime(START_TIME + 55_000); // +15s running
    expect(engine.getElapsedSeconds()).toBe(25);

    await engine.pause();
    jest.setSystemTime(START_TIME + 90_000); // paused again, doesn't count
    expect(engine.getElapsedSeconds()).toBe(25);
  });

  it("pause() freezes accumulatedSeconds and clears currentSegmentStartedAt", async () => {
    await engine.start();
    jest.setSystemTime(START_TIME + 20_000);

    await engine.pause();

    expect(dbMock.setActiveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "PAUSED",
        accumulatedSeconds: 20,
        currentSegmentStartedAt: null,
      })
    );
    expect(dbMock.enqueueEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "pause" })
    );
  });

  it("confirm() while PAUSED resumes to RUNNING from the confirmation timestamp", async () => {
    await engine.start();
    jest.setSystemTime(START_TIME + 20_000);
    await engine.pause();

    jest.setSystemTime(START_TIME + 50_000);
    await engine.confirm();

    expect(dbMock.setActiveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "RUNNING",
        currentSegmentStartedAt: new Date(START_TIME + 50_000).toISOString(),
        lastConfirmedAt: new Date(START_TIME + 50_000).toISOString(),
      })
    );
  });

  it("confirm() while RUNNING keeps status unchanged but resets the confirmation timestamp", async () => {
    await engine.start();
    jest.setSystemTime(START_TIME + 5_000);

    await engine.confirm();

    expect(dbMock.setActiveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "RUNNING",
        lastConfirmedAt: new Date(START_TIME + 5_000).toISOString(),
        lastPromptAt: null,
      })
    );
  });

  it("does not prompt before 60 minutes have elapsed, but does once past that mark", async () => {
    const states: (LocalWorkSession | null)[] = [];
    const unsubscribe = engine.subscribe((s) => states.push(s));
    await jest.advanceTimersByTimeAsync(0);

    await engine.start();

    jest.setSystemTime(START_TIME + HOUR_MS - 5000); // 59min55s elapsed
    await jest.advanceTimersByTimeAsync(1000);
    expect(states.at(-1)?.lastPromptAt).toBeNull();

    jest.setSystemTime(START_TIME + HOUR_MS + 5000); // 60min05s elapsed
    await jest.advanceTimersByTimeAsync(1000);

    const latest = states.at(-1);
    expect(latest?.lastPromptAt).not.toBeNull();
    expect(latest?.status).toBe("RUNNING"); // not paused yet

    unsubscribe();
  });

  it("auto-pauses locally 15 minutes after an unanswered prompt", async () => {
    const states: (LocalWorkSession | null)[] = [];
    const unsubscribe = engine.subscribe((s) => states.push(s));
    await jest.advanceTimersByTimeAsync(0);

    await engine.start();

    jest.setSystemTime(START_TIME + HOUR_MS + 1000);
    await jest.advanceTimersByTimeAsync(1000); // prompt fires here

    jest.setSystemTime(START_TIME + HOUR_MS + 1000 + GRACE_MS + 1000);
    await jest.advanceTimersByTimeAsync(1000); // grace window elapsed

    const latest = states.at(-1);
    expect(latest?.status).toBe("PAUSED");
    expect(dbMock.enqueueEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "pause" })
    );

    unsubscribe();
  });

  it("confirming before the 15min grace window prevents the auto-pause and restarts the 60min cycle", async () => {
    const states: (LocalWorkSession | null)[] = [];
    const unsubscribe = engine.subscribe((s) => states.push(s));
    await jest.advanceTimersByTimeAsync(0);

    await engine.start();

    jest.setSystemTime(START_TIME + HOUR_MS + 1000);
    await jest.advanceTimersByTimeAsync(1000); // prompt fires

    jest.setSystemTime(START_TIME + HOUR_MS + 1000 + 5000);
    await engine.confirm(); // answered well within the 15min grace window

    jest.setSystemTime(START_TIME + HOUR_MS + 1000 + GRACE_MS + 1000);
    await jest.advanceTimersByTimeAsync(1000); // would've been due to auto-pause, but was confirmed

    const latest = states.at(-1);
    expect(latest?.status).toBe("RUNNING");

    unsubscribe();
  });

  it("stop() rounds the duration to the nearest 15min and transitions to STOPPING", async () => {
    await engine.start();
    // 68 minutes elapsed -> rounds to 75min (1.25h), per spec.md's rounding rule.
    jest.setSystemTime(START_TIME + 68 * 60 * 1000);

    await engine.stop();

    expect(dbMock.setActiveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "STOPPING", hours: 1.25 })
    );
    expect(dbMock.enqueueEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "stop" })
    );
  });

  it("stop() floors a very short session (1min) to the 0.25h minimum instead of 0", async () => {
    await engine.start();
    jest.setSystemTime(START_TIME + 60 * 1000);

    await engine.stop();

    expect(dbMock.setActiveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "STOPPING", hours: 0.25 })
    );
  });

  it("discard() clears the local session and enqueues a discard event", async () => {
    const session = await engine.start();

    await engine.discard();

    expect(dbMock.clearActiveSession).toHaveBeenCalled();
    expect(dbMock.enqueueEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: session.id, type: "discard" })
    );
    expect(engine.getElapsedSeconds()).toBe(0);
  });
});
