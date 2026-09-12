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

jest.mock("@/services/work-sessions", () => ({
  useWorkTimerEngine: () => mockUseWorkTimerEngine(),
}));

jest.mock("@/hooks/use-push-subscription", () => ({
  usePushSubscription: () => mockUsePushSubscription(),
}));

// The finish form is built out in a later task (T20) — the widget only needs
// to know it delegates to it once STOPPING, so it's mocked here to keep this
// suite scoped to the widget's own rendering/wiring logic.
jest.mock("../work-session-finish-form", () => ({
  WorkSessionFinishForm: ({ session }: { session: LocalWorkSession }) => (
    <div data-testid="work-session-finish-form-stub">{session.id}</div>
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
    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));
    expect(mockStart).toHaveBeenCalledTimes(1);
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

    fireEvent.click(screen.getByRole("button", { name: /parar/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /sim, continuar/i }));
    expect(mockConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /não, encerrar/i }));
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("renders the paused state with a resume button that calls confirm()", () => {
    mockEngine({
      status: "PAUSED",
      session: baseSession({ status: "PAUSED", currentSegmentStartedAt: null }),
      elapsedSeconds: 120,
    });

    render(<WorkTimerWidget />);

    expect(screen.getByTestId("work-timer-paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

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
    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

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
    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
