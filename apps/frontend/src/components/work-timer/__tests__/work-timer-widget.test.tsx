import { screen, fireEvent, render } from "@testing-library/react";

import { WorkTimerWidget } from "../work-timer-widget";

import type { LocalWorkSession } from "@/lib/work-timer-db";

const mockStart = jest.fn();
const mockConfirm = jest.fn();
const mockStop = jest.fn();
const mockDiscard = jest.fn();
const mockPause = jest.fn();
const mockUseWorkTimerEngine = jest.fn();
const mockSubscribe = jest.fn();
const mockUsePushSubscription = jest.fn();
const mockStartSyncLoopCleanup = jest.fn();
const mockStartSyncLoop = jest.fn(() => mockStartSyncLoopCleanup);
const mockHydrateFromServer = jest.fn().mockResolvedValue(undefined);

// Mirrors the project's established next-intl test pattern (see
// project-edit-dialog.test.tsx): the mock returns the raw key, so this
// suite's assertions target the WorkTimerWidget message keys directly
// instead of pt-BR/en copy — that stays in messages/{en,pt-BR}.json (Fix 4).
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/services/work-sessions", () => ({
  useWorkTimerEngine: () => mockUseWorkTimerEngine(),
}));

jest.mock("@/hooks/use-push-subscription", () => ({
  usePushSubscription: () => mockUsePushSubscription(),
}));

jest.mock("@/lib/work-timer-sync", () => ({
  startSyncLoop: (...args: unknown[]) => mockStartSyncLoop(...args),
  hydrateFromServer: (...args: unknown[]) => mockHydrateFromServer(...args),
}));

// The finish form is built out in a later task (T20) — the widget only needs
// to know it delegates to it once STOPPING, so it's mocked here to keep this
// suite scoped to the widget's own rendering/wiring logic.
jest.mock("../work-session-finish-form", () => ({
  WorkSessionFinishForm: ({ session }: { session: LocalWorkSession }) => (
    <div data-testid="work-session-finish-form-stub">{session.id}</div>
  ),
}));

// Same rationale as the finish-form mock above — WorkSessionStartForm has
// its own dedicated test file; here only the widget's toggle/wiring matters.
jest.mock("../work-session-start-form", () => ({
  WorkSessionStartForm: ({
    onCancel,
    onStart,
  }: {
    onCancel: () => void;
    onStart: (details: {
      clientId?: string;
      projectId?: string;
      description?: string;
    }) => void;
  }) => (
    <div data-testid="work-session-start-form-stub">
      <button onClick={onCancel}>stub-cancel</button>
      <button
        onClick={() =>
          onStart({ clientId: "client-1", description: "Planned ahead" })
        }
      >
        stub-start
      </button>
    </div>
  ),
}));

function baseSession(
  overrides: Partial<LocalWorkSession> = {}
): LocalWorkSession {
  return {
    id: "session-1",
    status: "RUNNING",
    startedAt: "2026-01-01T00:00:00.000Z",
    currentSegmentStartedAt: "2026-01-01T00:00:00.000Z",
    accumulatedSeconds: 0,
    lastPromptAt: null,
    lastConfirmedAt: null,
    hours: null,
    ...overrides,
  };
}

function mockEngine(overrides: Record<string, unknown> = {}) {
  mockUseWorkTimerEngine.mockReturnValue({
    session: null,
    status: "IDLE",
    elapsedSeconds: 0,
    start: mockStart,
    confirm: mockConfirm,
    pause: mockPause,
    stop: mockStop,
    discard: mockDiscard,
    ...overrides,
  });
}

describe("WorkTimerWidget", () => {
  const originalOnLine = window.navigator.onLine;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    mockUsePushSubscription.mockReturnValue({
      permission: "default",
      subscribe: mockSubscribe,
    });
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
  });

  it("renders the idle state with a start button that calls start()", () => {
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-idle")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "start" }));
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("shows the start-with-details form when its button is clicked, and hides the plain idle buttons (WKT-10)", () => {
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(
      screen.getByTestId("work-timer-start-with-details")
    );

    expect(screen.getByTestId("work-session-start-form-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("work-timer-idle")).not.toBeInTheDocument();
  });

  it("goes back to the plain idle buttons when the start-with-details form is cancelled", () => {
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(screen.getByTestId("work-timer-start-with-details"));
    fireEvent.click(screen.getByText("stub-cancel"));

    expect(screen.getByTestId("work-timer-idle")).toBeInTheDocument();
    expect(
      screen.queryByTestId("work-session-start-form-stub")
    ).not.toBeInTheDocument();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("calls start() with the details and triggers the same push prompt as the plain start, when the start-with-details form submits", () => {
    mockUsePushSubscription.mockReturnValue({
      permission: "default",
      subscribe: mockSubscribe,
    });
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(screen.getByTestId("work-timer-start-with-details"));
    fireEvent.click(screen.getByText("stub-start"));

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith({
      clientId: "client-1",
      description: "Planned ahead",
    });
  });

  it("renders the running state with the elapsed counter and a stop button that calls stop()", () => {
    mockEngine({
      status: "RUNNING",
      session: baseSession(),
      elapsedSeconds: 65,
    });

    render(<WorkTimerWidget />);

    const running = screen.getByTestId("work-timer-running");
    expect(running).toBeInTheDocument();
    expect(running).toHaveTextContent("00:01:05");
    expect(screen.queryByTestId("work-timer-banner")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stop" }));
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("renders the hourly banner when RUNNING and a prompt is pending, wiring Sim/Não to confirm()/stop()", () => {
    mockEngine({
      status: "RUNNING",
      session: baseSession({ lastPromptAt: "2026-01-01T01:00:00.000Z" }),
      elapsedSeconds: 3600,
    });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "confirmContinue" }));
    expect(mockConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "confirmFinish" }));
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  // WKT-04 AC6 (Fix 5): without notification permission, the session must
  // keep counting normally and the same local 60/15 banner/pause rule must
  // still drive the UI — none of it may depend on Notification.permission.
  it("still renders the hourly banner and the paused-by-auto-pause state when notification permission was denied", () => {
    mockUsePushSubscription.mockReturnValue({
      permission: "denied",
      subscribe: mockSubscribe,
    });
    mockEngine({
      status: "RUNNING",
      session: baseSession({ lastPromptAt: "2026-01-01T01:00:00.000Z" }),
      elapsedSeconds: 3600,
    });

    const { rerender } = render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-banner")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "confirmFinish" }));
    expect(mockStop).toHaveBeenCalledTimes(1);

    // Simulate the local 15min-grace auto-pause having fired (this is the
    // engine's job, already covered by work-timer-engine.test.ts) — the
    // resulting PAUSED UI must render and work regardless of permission.
    mockEngine({
      status: "PAUSED",
      session: baseSession({ status: "PAUSED", currentSegmentStartedAt: null }),
      elapsedSeconds: 3600,
    });
    rerender(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "resume" }));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders the paused state with a resume button that calls confirm()", () => {
    mockEngine({
      status: "PAUSED",
      session: baseSession({ status: "PAUSED", currentSegmentStartedAt: null }),
      elapsedSeconds: 120,
    });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "resume" }));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it("delegates to WorkSessionFinishForm when STOPPING", () => {
    const session = baseSession({ status: "STOPPING", hours: 1 });
    mockEngine({ status: "STOPPING", session, elapsedSeconds: 3600 });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-session-finish-form-stub")).toHaveTextContent(
      session.id
    );
  });

  it("renders an offline indicator when the browser is offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-offline-indicator")).toBeInTheDocument();
  });

  it("renders the 12h-running visual alert without pausing or stopping the session", () => {
    mockEngine({
      status: "RUNNING",
      session: baseSession(),
      elapsedSeconds: 12 * 60 * 60 + 1,
    });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-12h-alert")).toBeInTheDocument();
    expect(mockStop).not.toHaveBeenCalled();
    expect(mockPause).not.toHaveBeenCalled();
  });

  it("prompts for push permission on the first-ever start (permission still 'default')", () => {
    mockUsePushSubscription.mockReturnValue({
      permission: "default",
      subscribe: mockSubscribe,
    });
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(screen.getByRole("button", { name: "start" }));

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("does not re-prompt on a later start once permission was already granted", () => {
    mockUsePushSubscription.mockReturnValue({
      permission: "granted",
      subscribe: mockSubscribe,
    });
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(screen.getByRole("button", { name: "start" }));

    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("does not re-prompt on a later start once permission was already denied", () => {
    mockUsePushSubscription.mockReturnValue({
      permission: "denied",
      subscribe: mockSubscribe,
    });
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);
    fireEvent.click(screen.getByRole("button", { name: "start" }));

    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  // WKT-03 (Fix 1): the widget is the app's composition root for the timer
  // (mounted once in the authenticated layout, T19) — it must start the
  // cross-device sync loop and hydrate from the server on mount, otherwise
  // both are dead code despite being fully implemented and unit-tested in
  // isolation (see validation.md Fix 1).
  it("hydrates from the server and starts the sync loop when it mounts", () => {
    mockEngine({ status: "IDLE", session: null });

    render(<WorkTimerWidget />);

    expect(mockHydrateFromServer).toHaveBeenCalledTimes(1);
    expect(mockStartSyncLoop).toHaveBeenCalledTimes(1);
  });

  it("stops the sync loop when it unmounts", () => {
    mockEngine({ status: "IDLE", session: null });

    const { unmount } = render(<WorkTimerWidget />);
    expect(mockStartSyncLoopCleanup).not.toHaveBeenCalled();

    unmount();

    expect(mockStartSyncLoopCleanup).toHaveBeenCalledTimes(1);
  });
});
