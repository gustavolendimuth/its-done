import {
  getActiveSession,
  setActiveSession,
  clearActiveSession,
  enqueueEvent,
  LocalWorkSession,
  LocalWorkSessionStatus,
  SyncEvent,
} from "./work-timer-db";

// Cross-referenced with WorkSessionSchedulerService (backend,
// apps/backend/src/work-sessions/services/work-session-scheduler.service.ts):
// the SAME 60min-prompt / 15min-auto-pause rule is replicated here so the
// timer keeps working (prompt + auto-pause) even fully offline (spec.md
// WKT-09 AC4). If either number changes, update both sides.
const HOURLY_PROMPT_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_PAUSE_GRACE_MS = 15 * 60 * 1000;

// Interval at which the engine re-evaluates elapsed time / the hourly rule
// and notifies subscribers. 1s matches the "updated every second" UI
// requirement (spec.md P1 "Iniciar e ver o timer rodando", AC2).
const TICK_INTERVAL_MS = 1000;

const ACTIVE_STATUSES: LocalWorkSessionStatus[] = [
  "RUNNING",
  "PAUSED",
  "STOPPING",
];

export type EngineListener = (session: LocalWorkSession | null) => void;

let state: LocalWorkSession | null = null;
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<EngineListener>();
let tickTimer: ReturnType<typeof setInterval> | null = null;

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isActive(session: LocalWorkSession): boolean {
  return ACTIVE_STATUSES.includes(session.status);
}

function secondsBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000
  );
}

// Mirrors backend's roundHoursToQuarter
// (apps/backend/src/work-sessions/work-sessions.service.ts): always rounds UP
// to the next 15-minute increment (never to the nearest one; an exact
// multiple is left unchanged), floored to the 0.25h minimum billable
// increment for any session with real recorded time (never 0).
function roundHoursToQuarter(totalSeconds: number): number {
  const minutes = totalSeconds / 60;
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  if (totalSeconds > 0 && roundedMinutes === 0) return 0.25;
  return roundedMinutes / 60;
}

function notify(): void {
  Array.from(listeners).forEach((listener) => listener(state));
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (!loadingPromise) {
    loadingPromise = getActiveSession().then((session) => {
      state = session;
      loaded = true;
    });
  }
  await loadingPromise;
}

async function persist(
  session: LocalWorkSession | null,
  event: SyncEvent
): Promise<void> {
  if (session) {
    await setActiveSession(session);
  } else {
    await clearActiveSession();
  }
  await enqueueEvent(event);
}

export interface StartDetails {
  clientId?: string;
  projectId?: string;
  description?: string;
}

// WKT-10 "preencher detalhes antes de iniciar" — `details` is optional so
// the plain "Iniciar" flow (no upfront details) keeps working exactly as
// before.
export async function start(details?: StartDetails): Promise<LocalWorkSession> {
  await ensureLoaded();

  if (state && isActive(state)) {
    // WKT-01 AC3: a locally-known active session is shown instead of
    // creating a new one.
    return state;
  }

  const now = new Date().toISOString();
  const sessionId = genId();
  const session: LocalWorkSession = {
    id: sessionId,
    status: "RUNNING",
    startedAt: now,
    currentSegmentStartedAt: now,
    accumulatedSeconds: 0,
    lastPromptAt: null,
    lastConfirmedAt: null,
    hours: null,
    clientId: details?.clientId ?? null,
    projectId: details?.projectId ?? null,
    description: details?.description ?? null,
  };

  state = session;
  notify();

  await persist(session, {
    eventId: genId(),
    sessionId,
    type: "start",
    clientTimestamp: now,
    ...(details?.clientId ? { clientId: details.clientId } : {}),
    ...(details?.projectId ? { projectId: details.projectId } : {}),
    ...(details?.description ? { description: details.description } : {}),
  });

  return session;
}

export async function confirm(): Promise<void> {
  await ensureLoaded();
  if (!state || !isActive(state)) return;

  const now = new Date().toISOString();
  const wasPaused = state.status === "PAUSED";

  state = {
    ...state,
    lastConfirmedAt: now,
    lastPromptAt: null,
    status: wasPaused ? "RUNNING" : state.status,
    currentSegmentStartedAt: wasPaused ? now : state.currentSegmentStartedAt,
  };
  notify();

  await persist(state, {
    eventId: genId(),
    sessionId: state.id,
    type: "confirm",
    clientTimestamp: now,
  });
}

export async function pause(): Promise<void> {
  await ensureLoaded();
  if (!state || state.status !== "RUNNING") return;

  const now = new Date().toISOString();
  const segmentSeconds = state.currentSegmentStartedAt
    ? secondsBetween(state.currentSegmentStartedAt, now)
    : 0;

  state = {
    ...state,
    accumulatedSeconds: state.accumulatedSeconds + segmentSeconds,
    currentSegmentStartedAt: null,
    status: "PAUSED",
  };
  notify();

  await persist(state, {
    eventId: genId(),
    sessionId: state.id,
    type: "pause",
    clientTimestamp: now,
  });
}

export async function stop(): Promise<void> {
  await ensureLoaded();
  if (!state || (state.status !== "RUNNING" && state.status !== "PAUSED")) {
    return;
  }

  const now = new Date().toISOString();
  let accumulatedSeconds = state.accumulatedSeconds;

  if (state.status === "RUNNING" && state.currentSegmentStartedAt) {
    accumulatedSeconds += secondsBetween(state.currentSegmentStartedAt, now);
  }

  const hours = roundHoursToQuarter(accumulatedSeconds);

  state = {
    ...state,
    accumulatedSeconds,
    currentSegmentStartedAt: null,
    status: "STOPPING",
    hours,
  };
  notify();

  await persist(state, {
    eventId: genId(),
    sessionId: state.id,
    type: "stop",
    clientTimestamp: now,
  });
}

export async function discard(): Promise<void> {
  await ensureLoaded();
  if (!state || !isActive(state)) return;

  const sessionId = state.id;
  const now = new Date().toISOString();

  state = null;
  notify();

  await persist(null, {
    eventId: genId(),
    sessionId,
    type: "discard",
    clientTimestamp: now,
  });
}

// Clears the local mirror after a session was finished server-side via the
// non-outbox `finish()` endpoint (see work-session-finish-form.tsx). Distinct
// from discard(): no sync event is enqueued here, since the server already
// marked the session ENDED through a separate authenticated call, not the
// local-first event flow.
export async function reset(): Promise<void> {
  state = null;
  notify();
  await clearActiveSession();
}

// Overwrites the in-memory reactive state with an authoritative session
// fetched/synced from the server (GET /work-sessions/active or a sync
// response), notifying subscribers immediately so the UI updates without a
// page reload (WKT-03 AC1, AC2). Unlike start/confirm/pause/stop/discard,
// this does not enqueue a sync event or write to IndexedDB itself — the
// caller (work-timer-sync.ts) already owns persisting the authoritative
// value there; this only keeps the live engine state consistent with it.
export function applyAuthoritativeSession(
  session: LocalWorkSession | null
): void {
  state = session;
  loaded = true;
  notify();
}

export function getElapsedSeconds(): number {
  if (!state) return 0;

  let seconds = state.accumulatedSeconds;
  if (state.status === "RUNNING" && state.currentSegmentStartedAt) {
    seconds += secondsBetween(
      state.currentSegmentStartedAt,
      new Date().toISOString()
    );
  }
  return seconds;
}

function checkHourlyRule(): void {
  if (!state || state.status !== "RUNNING") return;

  const now = Date.now();
  const referenceTime = new Date(
    state.lastConfirmedAt ?? state.startedAt
  ).getTime();
  const promptedAt = state.lastPromptAt
    ? new Date(state.lastPromptAt).getTime()
    : null;

  const dueForPrompt =
    now - referenceTime >= HOURLY_PROMPT_INTERVAL_MS &&
    (promptedAt === null || promptedAt < referenceTime);

  if (dueForPrompt) {
    state = { ...state, lastPromptAt: new Date(now).toISOString() };
    notify();
    // Persisted locally so a reload doesn't re-trigger the same prompt; the
    // prompt itself isn't a synced event (mirrors the backend scheduler,
    // which also updates lastPromptAt directly, not via applyEvents).
    void setActiveSession(state);
    return;
  }

  const dueForAutoPause =
    promptedAt !== null && now - promptedAt >= AUTO_PAUSE_GRACE_MS;
  if (dueForAutoPause) {
    // Reuses pause()'s freeze math + event enqueue instead of duplicating it.
    void pause();
  }
}

function startTicking(): void {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    checkHourlyRule();
    notify();
  }, TICK_INTERVAL_MS);
}

function stopTicking(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function subscribe(listener: EngineListener): () => void {
  listeners.add(listener);

  void ensureLoaded().then(() => {
    listener(state);
    startTicking();
  });

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopTicking();
    }
  };
}
