// Vanilla Service Worker (no bundler, no libs) — handles the hourly Web Push
// prompt for a running work session (spec.md WKT-04 AC2-AC4) and resolves
// the "Sim, continuar" / "Não, encerrar" notification actions without
// needing the app open.
//
// The backend (WorkSessionSchedulerService) sends a push payload shaped as
// { title, body, data: { sessionId, actionToken }, actions: [...] } — it has
// no way to know what origin the browser will call back on. The registering
// page (use-push-subscription.ts) tells this worker the API base URL once,
// right after registration, via postMessage({ type: "SET_API_URL", apiUrl }).
// It's persisted in IndexedDB (not a plain module variable) because a push
// can wake this worker up long after the app was closed, with no page left
// to ask again.

const DB_NAME = "work-timer-sw";
const STORE_NAME = "config";
const API_URL_KEY = "apiUrl";

function openConfigDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setApiUrl(apiUrl) {
  const db = await openConfigDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(apiUrl, API_URL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getApiUrl() {
  const db = await openConfigDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(API_URL_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_API_URL" && event.data.apiUrl) {
    event.waitUntil(setApiUrl(event.data.apiUrl));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: payload.data,
      actions: payload.actions,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const { sessionId, actionToken } = event.notification.data || {};
  event.notification.close();

  if (!sessionId || !actionToken) return;

  const action = event.action; // "confirm" | "stop" | "" (notification body click)
  if (action !== "confirm" && action !== "stop") return;

  event.waitUntil(
    (async () => {
      const apiUrl = await getApiUrl();
      if (!apiUrl) return;

      try {
        await fetch(
          `${apiUrl}/work-sessions/${sessionId}/${action}?actionToken=${encodeURIComponent(actionToken)}`,
          { method: "POST" }
        );
      } catch {
        // Best-effort: an invalid/expired/reused actionToken or a network
        // failure here is silently ignored (design.md: the SW "não tenta
        // abrir o app nesse caso, só ignora silenciosamente") — there's no
        // UI here to surface an error to.
      }

      if (action === "stop") {
        const windowClients = await self.clients.matchAll({ type: "window" });
        if (windowClients.length > 0) {
          windowClients[0].focus();
        } else {
          await self.clients.openWindow("/");
        }
      }
    })()
  );
});
