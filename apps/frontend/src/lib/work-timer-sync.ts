import api from "./axios";
import {
  getPendingEvents,
  ackEvents,
  getActiveSession,
  setActiveSession,
  clearActiveSession,
  LocalWorkSession,
  LocalWorkSessionStatus,
} from "./work-timer-db";

export interface DiscardedNotice {
  sessionId: string;
  reason: string;
}

export type DiscardedListener = (notice: DiscardedNotice) => void;

interface RemoteWorkSession {
  id: string;
  status: LocalWorkSessionStatus;
  startedAt: string;
  currentSegmentStartedAt: string | null;
  accumulatedSeconds: number;
  lastPromptAt: string | null;
  lastConfirmedAt: string | null;
  hours: number | null;
}

interface SyncResponse {
  session: RemoteWorkSession | null;
  discarded?: DiscardedNotice;
}

// Periodic fallback in addition to the `online` browser event (design.md /
// context.md leave the exact interval to Design's discretion).
const SYNC_INTERVAL_MS = 30 * 1000;

function mapRemoteSession(remote: RemoteWorkSession): LocalWorkSession {
  return {
    id: remote.id,
    status: remote.status,
    startedAt: remote.startedAt,
    currentSegmentStartedAt: remote.currentSegmentStartedAt,
    accumulatedSeconds: remote.accumulatedSeconds,
    lastPromptAt: remote.lastPromptAt,
    lastConfirmedAt: remote.lastConfirmedAt,
    hours: remote.hours,
  };
}

export async function syncNow(onDiscarded?: DiscardedListener): Promise<void> {
  const pending = await getPendingEvents();
  if (pending.length === 0) {
    return;
  }

  const localBefore = await getActiveSession();

  let data: SyncResponse;
  try {
    const response = await api.post<SyncResponse>("/work-sessions/sync", {
      events: pending,
    });
    data = response.data;
  } catch {
    // WKT-09 AC3: a failed sync leaves the outbox untouched so the same
    // events are retried on the next sync attempt.
    return;
  }

  await ackEvents(pending.map((event) => event.eventId));

  if (data.session) {
    await setActiveSession(mapRemoteSession(data.session));
  } else {
    await clearActiveSession();
  }

  if (
    data.discarded &&
    localBefore &&
    data.discarded.sessionId === localBefore.id &&
    onDiscarded
  ) {
    onDiscarded(data.discarded);
  }
}

export function startSyncLoop(onDiscarded?: DiscardedListener): () => void {
  const trigger = () => {
    void syncNow(onDiscarded);
  };

  window.addEventListener("online", trigger);
  const interval = setInterval(trigger, SYNC_INTERVAL_MS);

  return () => {
    window.removeEventListener("online", trigger);
    clearInterval(interval);
  };
}
