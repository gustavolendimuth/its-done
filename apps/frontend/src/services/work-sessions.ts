import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import api from "@/lib/axios";
import { LocalWorkSession, LocalWorkSessionStatus } from "@/lib/work-timer-db";
import {
  subscribe,
  getElapsedSeconds,
  start,
  confirm,
  pause,
  stop,
  discard,
} from "@/lib/work-timer-engine";

export interface WorkTimerEngineState {
  session: LocalWorkSession | null;
  status: LocalWorkSessionStatus | "IDLE";
  elapsedSeconds: number;
  start: typeof start;
  confirm: typeof confirm;
  pause: typeof pause;
  stop: typeof stop;
  discard: typeof discard;
}

// Thin reactive bridge between the local-first engine (work-timer-engine.ts,
// which is plain JS with no React dependency) and React components. It does
// not talk to the backend directly — see design.md.
export function useWorkTimerEngine(): WorkTimerEngineState {
  const [session, setSession] = useState<LocalWorkSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe((updatedSession) => {
      setSession(updatedSession);
      setElapsedSeconds(getElapsedSeconds());
    });
    return unsubscribe;
  }, []);

  return {
    session,
    status: session?.status ?? "IDLE",
    elapsedSeconds,
    start,
    confirm,
    pause,
    stop,
    discard,
  };
}

export interface FinishWorkSessionDto {
  clientId: string;
  projectId?: string;
  description: string;
}

export const useFinishWorkSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: FinishWorkSessionDto;
    }) => {
      const response = await api.post(
        `/work-sessions/${sessionId}/finish`,
        data
      );

      return response.data;
    },
    onSuccess: () => {
      // Mirrors useCreateTimeEntry (time-entries.ts) — finishing a session
      // creates a WorkHour, so the same views need to refresh.
      queryClient.invalidateQueries({
        queryKey: ["timeEntries"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["workHours"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["clients"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        refetchType: "active",
      });
    },
  });
};
