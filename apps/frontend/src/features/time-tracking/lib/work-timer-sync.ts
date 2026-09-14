import api from "@/lib/axios";

import {
  getPendingEvents,
  ackEvents,
  getActiveSession,
  setActiveSession,
  clearActiveSession,
  LocalWorkSession,
  LocalWorkSessionStatus,
} from "./work-timer-db";
import { applyAuthoritativeSession } from "./work-timer-engine";

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
  clientId: string | null;
  projectId: string | null;
  description: string | null;
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
    // WKT-10: without these, every sync (including the periodic 30s one)
    // would silently wipe out details entered upfront on another device or
    // via the start-with-details form, since the authoritative response
    // always overwrites the local mirror.
    clientId: remote.clientId,
    projectId: remote.projectId,
    description: remote.description,
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
    const mapped = mapRemoteSession(data.session);
    await setActiveSession(mapped);
    // Keep the live engine state (not just IndexedDB) in sync with the
    // authoritative server response, so a state change — including this
    // device's session being displaced by a conflict winner — is reflected
    // in the UI immediately, without a page reload (WKT-03 AC2).
    applyAuthoritativeSession(mapped);
  } else {
    await clearActiveSession();
    applyAuthoritativeSession(null);
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

// WKT-03 AC1: a device that opens with no local session known (e.g. a fresh
// login on a different device from the one that started the session) has
// nothing in its outbox to sync, so syncNow() alone would never contact the
// server. This reads the authoritative state directly and hydrates both
// IndexedDB and the live engine state with it, when one exists.
export async function hydrateFromServer(): Promise<void> {
  const local = await getActiveSession();
  if (local) {
    return;
  }

  let remote: RemoteWorkSession | null;
  try {
    const response = await api.get<{ session: RemoteWorkSession | null }>(
      "/work-sessions/active"
    );
    remote = response.data.session;
  } catch {
    // Best-effort: a fresh device with no connection simply stays IDLE until
    // the next successful hydration attempt or the periodic sync loop.
    return;
  }

  if (remote) {
    const mapped = mapRemoteSession(remote);
    await setActiveSession(mapped);
    applyAuthoritativeSession(mapped);
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
