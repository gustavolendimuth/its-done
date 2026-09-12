import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { WorkSessionFinishForm } from "./work-session-finish-form";

import type { LocalWorkSession } from "../lib/work-timer-db";
import type { Client } from "@/services/clients";

const mockMutateAsync = jest.fn();
const mockDiscard = jest.fn();
const mockReset = jest.fn();

// Mirrors the project's established next-intl test pattern (see
// project-edit-dialog.test.tsx): the mock returns the raw key, so this
// suite's assertions target the WorkSessionFinishForm message keys directly
// instead of pt-BR/en copy — that stays in messages/{en,pt-BR}.json (Fix 4).
jest.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

jest.mock("../lib/work-timer-engine", () => ({
  reset: (...args: unknown[]) => mockReset(...args),
}));

jest.mock("@/services/work-sessions", () => ({
  useFinishWorkSession: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useWorkTimerEngine: () => ({
    discard: mockDiscard,
  }),
}));

const mockClients: Client[] = [
  {
    id: "client-1",
    company: "Acme",
    email: "acme@example.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

jest.mock("@/services/clients", () => ({
  useClients: () => ({ data: mockClients }),
}));

jest.mock("@/components/ui/client-combobox", () => ({
  ClientCombobox: ({
    value,
    onSelect,
  }: {
    value: string;
    onSelect: (value: string) => void;
  }) => (
    <select
      data-testid="client-combobox"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">select client</option>
      <option value="client-1">Acme</option>
    </select>
  ),
}));

jest.mock("@/components/ui/project-combobox", () => ({
  ProjectCombobox: ({
    value,
    onSelect,
  }: {
    value?: string;
    onSelect: (value: string | null) => void;
  }) => (
    <select
      data-testid="project-combobox"
      value={value ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">no project</option>
      <option value="project-1">Website</option>
    </select>
  ),
}));

jest.mock("@/components/ui/date-picker", () => ({
  DatePickerComponent: ({
    value,
    onChange,
  }: {
    value: Date | null;
    onChange: (date: Date | null) => void;
  }) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value ? value.toISOString().slice(0, 10) : ""}
      onChange={(e) =>
        onChange(e.target.value ? new Date(`${e.target.value}T00:00:00.000Z`) : null)
      }
    />
  ),
}));

function baseSession(overrides: Partial<LocalWorkSession> = {}): LocalWorkSession {
  return {
    id: "session-1",
    status: "STOPPING",
    startedAt: "2026-01-01T00:00:00.000Z",
    currentSegmentStartedAt: null,
    accumulatedSeconds: 3600,
    lastPromptAt: null,
    lastConfirmedAt: null,
    hours: 1,
    ...overrides,
  };
}

describe("WorkSessionFinishForm", () => {
  const originalOnLine = window.navigator.onLine;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
  });

  it("blocks submit and shows the missing-client message when description is filled but client is empty", async () => {
    render(<WorkSessionFinishForm session={baseSession()} onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("descriptionPlaceholder"), {
      target: { value: "Worked on the landing page" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(screen.getByText("clientRequired")).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the missing-description message when client is filled but description is empty", async () => {
    render(<WorkSessionFinishForm session={baseSession()} onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(screen.getByText("descriptionRequired")).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("calls useFinishWorkSession with the right payload on a valid submit, then resets the local session", async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    const onSuccess = jest.fn();

    render(
      <WorkSessionFinishForm session={baseSession()} onSuccess={onSuccess} />
    );

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("descriptionPlaceholder"), {
      target: { value: "Worked on the landing page" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        sessionId: "session-1",
        data: {
          clientId: "client-1",
          projectId: undefined,
          description: "Worked on the landing page",
          date: "2026-01-01T00:00:00.000Z",
        },
      });
    });
    await waitFor(() => expect(mockReset).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("defaults the date field to the session's startedAt day, not today (WKT-11)", () => {
    render(
      <WorkSessionFinishForm
        session={baseSession({ startedAt: "2025-06-15T00:00:00.000Z" })}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByTestId("date-picker")).toHaveValue("2025-06-15");
  });

  it("sends the edited date instead of the session's startedAt when the user changes it (WKT-11)", async () => {
    mockMutateAsync.mockResolvedValueOnce({});

    render(
      <WorkSessionFinishForm
        session={baseSession({ startedAt: "2025-06-15T00:00:00.000Z" })}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("descriptionPlaceholder"), {
      target: { value: "Esqueci de registrar ontem" },
    });
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2025-06-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date: "2025-06-10T00:00:00.000Z" }),
        })
      );
    });
  });

  it("pre-fills client/project/description from the session when it was started with upfront details (WKT-10)", () => {
    render(
      <WorkSessionFinishForm
        session={baseSession({
          clientId: "client-1",
          projectId: "project-1",
          description: "Planejado com antecedência",
        })}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByTestId("client-combobox")).toHaveValue("client-1");
    expect(screen.getByTestId("project-combobox")).toHaveValue("project-1");
    expect(screen.getByPlaceholderText("descriptionPlaceholder")).toHaveValue(
      "Planejado com antecedência"
    );
  });

  it("does not discard when only the discard trigger is clicked, without confirming", () => {
    render(<WorkSessionFinishForm session={baseSession()} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByTestId("discard-trigger"));

    expect(mockDiscard).not.toHaveBeenCalled();
  });

  it("discards the session once the confirmation action is clicked", async () => {
    render(<WorkSessionFinishForm session={baseSession()} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByTestId("discard-trigger"));
    fireEvent.click(await screen.findByTestId("discard-confirm"));

    await waitFor(() => expect(mockDiscard).toHaveBeenCalledTimes(1));
  });

  it("shows a waiting-for-connection placeholder instead of the form when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    render(<WorkSessionFinishForm session={baseSession()} onSuccess={jest.fn()} />);

    expect(
      screen.getByTestId("work-session-finish-form-offline")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("client-combobox")).not.toBeInTheDocument();
  });
});
