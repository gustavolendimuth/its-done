import { openDB, IDBPDatabase } from "idb";

// Local mirror of the authoritative WorkSession shape (see
// apps/backend/prisma/schema.prisma `WorkSession` model). Dates are kept as
// ISO strings for JSON-friendliness across the IndexedDB <-> HTTP boundary.
export type LocalWorkSessionStatus =
  | "RUNNING"
  | "PAUSED"
  | "STOPPING"
  | "ENDED"
  | "DISCARDED";

export interface LocalWorkSession {
  id: string;
  status: LocalWorkSessionStatus;
  startedAt: string;
  currentSegmentStartedAt: string | null;
  accumulatedSeconds: number;
  lastPromptAt: string | null;
  lastConfirmedAt: string | null;
  hours?: number | null;
}

// Mirrors backend SyncEventDto (apps/backend/src/work-sessions/dto/sync-event.dto.ts).
export type SyncEventType = "start" | "confirm" | "pause" | "stop" | "discard";

export interface SyncEvent {
  eventId: string;
  sessionId: string;
  type: SyncEventType;
  clientTimestamp: string;
}

interface StoredEvent extends SyncEvent {
  seq: number;
}

const DB_NAME = "work-timer";
const DB_VERSION = 1;
const ACTIVE_SESSION_STORE = "activeSession";
const OUTBOX_STORE = "outbox";
const ACTIVE_SESSION_KEY = "current";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ACTIVE_SESSION_STORE)) {
          db.createObjectStore(ACTIVE_SESSION_STORE);
        }
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, {
            keyPath: "seq",
            autoIncrement: true,
          });
        }
      },
      // Another connection (e.g. a newer app version/tab wanting to upgrade
      // the schema) is waiting for this one to close — close it so that
      // request isn't blocked indefinitely.
      blocking() {
        void dbPromise?.then((db) => db.close());
      },
    });
  }
  return dbPromise;
}

export async function getActiveSession(): Promise<LocalWorkSession | null> {
  const db = await getDb();
  const session = await db.get(ACTIVE_SESSION_STORE, ACTIVE_SESSION_KEY);
  return session ?? null;
}

export async function setActiveSession(
  session: LocalWorkSession
): Promise<void> {
  const db = await getDb();
  await db.put(ACTIVE_SESSION_STORE, session, ACTIVE_SESSION_KEY);
}

export async function clearActiveSession(): Promise<void> {
  const db = await getDb();
  await db.delete(ACTIVE_SESSION_STORE, ACTIVE_SESSION_KEY);
}

export async function enqueueEvent(event: SyncEvent): Promise<void> {
  const db = await getDb();
  // `seq` is assigned by the store's auto-increment key, which preserves
  // enqueue order regardless of the (UUID, unordered) eventId value.
  await db.add(OUTBOX_STORE, event as StoredEvent);
}

export async function getPendingEvents(): Promise<SyncEvent[]> {
  const db = await getDb();
  const stored = (await db.getAll(OUTBOX_STORE)) as StoredEvent[];
  return stored.map(({ seq: _seq, ...event }) => event);
}

export async function ackEvents(eventIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  const stored = (await tx.store.getAll()) as StoredEvent[];
  const acked = new Set(eventIds);
  await Promise.all(
    stored
      .filter((event) => acked.has(event.eventId))
      .map((event) => tx.store.delete(event.seq))
  );
  await tx.done;
}
