"use client";

import { AlertTriangle, Clock, Pause, Play, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { cn } from "@/lib/utils";
import { hydrateFromServer, startSyncLoop } from "../lib/work-timer-sync";
import { useWorkTimerEngine } from "../work-sessions";

import { WorkSessionFinishForm } from "./work-session-finish-form";
import { WorkSessionStartForm } from "./work-session-start-form";

// Mirrors the 12h visual-alert threshold from spec.md P2 "Aviso visual de
// sessão muito longa" (WKT-07) — a display-only nudge, never auto-pauses.
const TWELVE_HOURS_SECONDS = 12 * 60 * 60;

function formatElapsed(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, "0"))
    .join(":");
}

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

// Self-contained global timer widget — no props, reads/acts only through
// useWorkTimerEngine() (local-first engine, never talks to the backend
// directly). Mounted once in the authenticated layout (see T19) so it stays
// visible across every page.
export function WorkTimerWidget() {
  const t = useTranslations("WorkTimerWidget");
  const { session, status, elapsedSeconds, start, confirm, stop } =
    useWorkTimerEngine();
  const isOnline = useOnlineStatus();
  const { permission, subscribe } = usePushSubscription();
  // WKT-10 "preencher detalhes antes de iniciar" — an idle-only UI toggle,
  // not engine state: once start() succeeds the engine moves to RUNNING and
  // this form simply stops being relevant (no need to reset it back).
  const [showStartForm, setShowStartForm] = useState(false);

  // Composition root for cross-device sync (WKT-03): on mount, pick up an
  // authoritative session from the server if this device has none locally
  // yet, then keep the local outbox syncing (online event + periodic) for
  // as long as the widget — mounted once in the authenticated layout — is
  // alive.
  useEffect(() => {
    void hydrateFromServer();
    return startSyncLoop();
  }, []);

  if (status === "STOPPING" && session) {
    return <WorkSessionFinishForm session={session} onSuccess={() => {}} />;
  }

  const isIdle = status === "IDLE";
  const isRunning = status === "RUNNING";
  const isPaused = status === "PAUSED";
  const bannerDue = isRunning && session?.lastPromptAt != null;
  const isLongRunning = isRunning && elapsedSeconds >= TWELVE_HOURS_SECONDS;

  // Ask for notification permission the first time the user ever starts a
  // session — never on plain page load, and never again once the browser
  // has recorded a decision (granted or denied), per WKT-04 AC1 and this
  // task's own "not repeated on subsequent starts" requirement. The browser
  // itself is the source of truth for "already decided" via
  // Notification.permission, so no extra flag needs to be persisted here.
  // Shared by the plain "Iniciar" button and the "start with details" form
  // (WKT-10), so both paths trigger the same one-time push prompt.
  const handleStart = (details?: Parameters<typeof start>[0]) => {
    if (permission === "default") {
      void subscribe();
    }
    void start(details);
  };

  if (isIdle && showStartForm) {
    return (
      <WorkSessionStartForm
        onCancel={() => setShowStartForm(false)}
        onStart={handleStart}
      />
    );
  }

  return (
    <div
      data-testid="work-timer-widget"
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-xl border shadow-lg backdrop-blur",
        "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/30",
        isLongRunning
          ? "border-amber-400 dark:border-amber-600"
          : "border-green-200 dark:border-green-800",
        isIdle && "w-80"
      )}
    >
      <div
        className={cn(
          "flex gap-3 px-4 py-3",
          isIdle ? "items-start" : "items-center"
        )}
      >
        {!isOnline && (
          <span
            data-testid="work-timer-offline-indicator"
            title={t("offlineIndicator")}
            className={cn("text-muted-foreground", isIdle && "mt-0.5")}
          >
            <WifiOff className="h-4 w-4" />
          </span>
        )}

        {isIdle && (
          <div data-testid="work-timer-idle" className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600/10 dark:bg-green-400/10">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </span>
              <div className="space-y-0.5 pt-0.5">
                <p className="text-sm font-semibold leading-none">
                  {t("idleHeading")}
                </p>
                <p className="text-xs leading-snug text-muted-foreground">
                  {t("idleDescription")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex-1" onClick={() => handleStart()}>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {t("start")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid="work-timer-start-with-details"
                onClick={() => setShowStartForm(true)}
              >
                {t("startWithDetails")}
              </Button>
            </div>
          </div>
        )}

        {isRunning && (
          <div data-testid="work-timer-running" className="flex items-center gap-3">
            {isLongRunning && (
              <span
                data-testid="work-timer-12h-alert"
                title={t("longRunningAlert")}
                className="text-amber-600 dark:text-amber-400"
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
            )}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
            </span>
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatElapsed(elapsedSeconds)}
            </span>
            <Button size="sm" variant="outline" onClick={() => stop()}>
              {t("stop")}
            </Button>
          </div>
        )}

        {isPaused && (
          <div data-testid="work-timer-paused" className="flex items-center gap-3">
            <Pause className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">{t("paused")}</span>
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatElapsed(elapsedSeconds)}
            </span>
            <Button size="sm" onClick={() => confirm()}>
              {t("resume")}
            </Button>
          </div>
        )}
      </div>

      {bannerDue && (
        <div
          data-testid="work-timer-banner"
          className="flex items-center gap-2 border-t border-green-200 dark:border-green-800 px-4 py-2"
        >
          <span className="text-sm">{t("stillWorking")}</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => confirm()}>
              {t("confirmContinue")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => stop()}>
              {t("confirmFinish")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
