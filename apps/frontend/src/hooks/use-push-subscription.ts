"use client";

import { useCallback, useState } from "react";

import api from "@/lib/axios";
import { getApiUrl } from "@/lib/utils";

export interface UsePushSubscriptionResult {
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Registers the Service Worker (public/sw.js) and creates a Web Push
// subscription for this browser (spec.md WKT-04 AC1). A denied permission is
// an expected outcome, not an error: the session keeps counting normally and
// falls back to the in-app banner (WKT-04's documented assumption for that
// case), so this never throws for that path — it only reports the state.
export function usePushSubscription(): UsePushSubscriptionResult {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => Notification.permission
  );

  const subscribe = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") {
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;
    // Tells sw.js (see its own message-listener comment) where the API
    // lives, since a static file under public/ has no access to env vars.
    registration.active?.postMessage({
      type: "SET_API_URL",
      apiUrl: getApiUrl(),
    });

    const pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    const json = pushSubscription.toJSON();

    try {
      await api.post("/push/subscriptions", {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent,
      });
    } catch {
      // Best-effort: the browser-side subscription still exists even if the
      // POST fails — a later call to subscribe() (e.g. the next session
      // start) re-sends it.
    }
  }, []);

  return { permission, subscribe };
}
