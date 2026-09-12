import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { ReactNode } from "react";

import api from "@/lib/axios";
import type { LocalWorkSession } from "@/lib/work-timer-db";

jest.mock("@/lib/axios");
const mockedApi = api as jest.Mocked<typeof api>;

let subscribedListener: ((session: LocalWorkSession | null) => void) | null =
  null;
const unsubscribeMock = jest.fn();

jest.mock("@/lib/work-timer-engine", () => ({
  subscribe: jest.fn((listener) => {
    subscribedListener = listener;
    return unsubscribeMock;
  }),
  getElapsedSeconds: jest.fn(() => 0),
  start: jest.fn(),
  confirm: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  discard: jest.fn(),
}));

import * as engine from "@/lib/work-timer-engine";
import { useWorkTimerEngine, useFinishWorkSession } from "../work-sessions";

const mockedEngine = engine as unknown as {
  subscribe: jest.Mock;
  getElapsedSeconds: jest.Mock;
  start: jest.Mock;
  confirm: jest.Mock;
  pause: jest.Mock;
  stop: jest.Mock;
  discard: jest.Mock;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockSession: LocalWorkSession = {
  id: "session-1",
  status: "RUNNING",
  startedAt: "2026-01-01T00:00:00.000Z",
  currentSegmentStartedAt: "2026-01-01T00:00:00.000Z",
  accumulatedSeconds: 0,
  lastPromptAt: null,
  lastConfirmedAt: null,
  hours: null,
};

describe("useWorkTimerEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribedListener = null;
  });

  it("starts with IDLE status and no session before the engine reports state", () => {
    const { result } = renderHook(() => useWorkTimerEngine());

    expect(result.current.status).toBe("IDLE");
    expect(result.current.session).toBeNull();
  });

  it("reflects the engine's session and elapsed seconds once it notifies", () => {
    mockedEngine.getElapsedSeconds.mockReturnValue(42);
    const { result } = renderHook(() => useWorkTimerEngine());

    act(() => {
      subscribedListener?.(mockSession);
    });

    expect(result.current.status).toBe("RUNNING");
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.elapsedSeconds).toBe(42);
  });

  it("re-renders reactively on a subsequent engine notification (tick/status change)", () => {
    const { result } = renderHook(() => useWorkTimerEngine());

    act(() => {
      subscribedListener?.(mockSession);
    });
    expect(result.current.status).toBe("RUNNING");

    act(() => {
      subscribedListener?.({ ...mockSession, status: "PAUSED" });
    });
    expect(result.current.status).toBe("PAUSED");
  });

  it("unsubscribes from the engine on unmount", () => {
    const { unmount } = renderHook(() => useWorkTimerEngine());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it("exposes the engine's action functions directly", () => {
    const { result } = renderHook(() => useWorkTimerEngine());

    expect(result.current.start).toBe(mockedEngine.start);
    expect(result.current.confirm).toBe(mockedEngine.confirm);
    expect(result.current.pause).toBe(mockedEngine.pause);
    expect(result.current.stop).toBe(mockedEngine.stop);
    expect(result.current.discard).toBe(mockedEngine.discard);
  });
});

describe("useFinishWorkSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls POST /work-sessions/:id/finish with the form payload and invalidates related queries", async () => {
    const workHour = { id: "wh-1", hours: 1.5 };
    mockedApi.post.mockResolvedValue({ data: { workHour } });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useFinishWorkSession(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    const payload = {
      sessionId: "session-1",
      data: {
        clientId: "client-1",
        description: "Worked on feature X",
      },
    };
    const response = await result.current.mutateAsync(payload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/work-sessions/session-1/finish",
      payload.data
    );
    expect(response).toEqual({ workHour });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["timeEntries"] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["workHours"] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["clients"] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["dashboard"] })
    );
  });

  it("surfaces the error state when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("Session not ready"));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFinishWorkSession(), { wrapper });

    await expect(
      result.current.mutateAsync({
        sessionId: "session-1",
        data: { clientId: "client-1", description: "desc" },
      })
    ).rejects.toThrow("Session not ready");

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
