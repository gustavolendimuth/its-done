import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { WorkHourForm } from "./work-hour-form";

import type { Client } from "@/features/clients";

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockToastSuccess = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: jest.fn(),
  },
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
      <option value="">select</option>
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
      <option value="">select</option>
      <option value="project-1">Website</option>
    </select>
  ),
}));

jest.mock("@/components/ui/task-combobox", () => ({
  TaskCombobox: ({
    value,
    onSelect,
  }: {
    value?: string;
    onSelect: (value: string | null) => void;
  }) => (
    <select
      data-testid="task-combobox"
      value={value ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">select</option>
      <option value="task-1">Fix login bug</option>
    </select>
  ),
}));

const mockCreateMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockUseUpdateTimeEntry = jest.fn();

jest.mock("../time-entries", () => ({
  useCreateTimeEntry: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useUpdateTimeEntry: () => mockUseUpdateTimeEntry(),
}));

const editableWorkHour = {
  id: "wh-1",
  date: "2026-01-05T00:00:00.000Z",
  hours: 1.5,
  description: "Existing work",
};

const intervalWorkHour = {
  id: "wh-2",
  date: "2026-01-05T00:00:00.000Z",
  hours: 3.5,
  startTime: "09:00",
  endTime: "12:30",
  description: "Existing work",
};

describe("WorkHourForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateTimeEntry.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
    });
  });

  it("create mode: renders client/project fields and submits via create", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    expect(screen.getByTestId("client-combobox")).toBeInTheDocument();
    expect(screen.getByTestId("project-combobox")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0130" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("create mode: renders the task field and submits with the selected taskId", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    expect(screen.getByTestId("task-combobox")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.change(screen.getByTestId("task-combobox"), {
      target: { value: "task-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0130" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload.taskId).toBe("task-1");
  });

  it("create mode: submits without a taskId when none is selected", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0130" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload.taskId).toBeUndefined();
  });

  it("create mode: submits without a projectId when none is selected (Story 8)", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0130" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload.projectId).toBeUndefined();
    expect(payload.clientId).toBe("client-1");
  });

  it("create mode: renders the entry-mode selector defaulted to Duração", () => {
    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    const durationButton = screen.getByRole("button", { name: "durationMode" });
    const intervalButton = screen.getByRole("button", { name: "intervalMode" });

    expect(durationButton).toBeInTheDocument();
    expect(intervalButton).toBeInTheDocument();
    expect(durationButton).toHaveAttribute("aria-pressed", "true");
    expect(intervalButton).toHaveAttribute("aria-pressed", "false");
  });

  it("entry mode: Duração shows only the duration input", () => {
    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    expect(screen.getByPlaceholderText("HH:mm")).toBeInTheDocument();
    expect(screen.queryByTestId("start-time-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("end-time-input")).not.toBeInTheDocument();
  });

  it("entry mode: Hora inicial e hora final shows startTime/endTime inputs", () => {
    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.click(screen.getByRole("button", { name: "intervalMode" }));

    expect(screen.getByTestId("start-time-input")).toBeInTheDocument();
    expect(screen.getByTestId("end-time-input")).toBeInTheDocument();
    expect(screen.queryAllByPlaceholderText("HH:mm")).toHaveLength(2);
  });

  it("create mode: Duração mode submits without startTime/endTime", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0130" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload).not.toHaveProperty("startTime");
    expect(payload).not.toHaveProperty("endTime");
  });

  it("create mode: interval entry computes hours and sends startTime/endTime", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "intervalMode" }));
    fireEvent.change(screen.getByTestId("start-time-input"), {
      target: { value: "0900" },
    });
    fireEvent.change(screen.getByTestId("end-time-input"), {
      target: { value: "1230" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload.hours).toBe(3.5);
    expect(payload.startTime).toBe("09:00");
    expect(payload.endTime).toBe("12:30");
  });

  it("create mode: endTime not after startTime blocks submit", async () => {
    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "intervalMode" }));
    fireEvent.change(screen.getByTestId("start-time-input"), {
      target: { value: "1200" },
    });
    fireEvent.change(screen.getByTestId("end-time-input"), {
      target: { value: "1200" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() =>
      expect(screen.getByText("endTimeBeforeStart")).toBeInTheDocument()
    );
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("edit mode: does not render client/project fields", () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    expect(screen.queryByTestId("client-combobox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-combobox")).not.toBeInTheDocument();
  });

  it("edit mode: renders always-editable inputs prefilled from workHour, with Save and Cancel always visible", () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    expect(screen.getByTestId("date-picker")).toHaveValue("2026-01-05");
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("01:30");
    expect(screen.getByDisplayValue("Existing work")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "saveChanges" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "cancel" })
    ).toBeInTheDocument();
  });

  it("edit mode: clicking Cancel discards the typed changes and calls onCancel", () => {
    const onCancel = jest.fn();
    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={editableWorkHour}
        onCancel={onCancel}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0900" },
    });
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("09:00");

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("01:30");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("edit mode: after a save, Cancel reverts to the last saved value rather than the original one", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-1" });
    const onCancel = jest.fn();

    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={editableWorkHour}
        onCancel={onCancel}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));
    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00");

    // Edits again after the save, then cancels - should fall back to the
    // last *saved* value (02:00), not the original workHour value (01:30).
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("edit mode: interval workHour pre-selects Hora inicial e hora final", () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={intervalWorkHour} />
    );

    expect(
      screen.getByRole("button", { name: "intervalMode" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("start-time-input")).toHaveValue("09:00");
    expect(screen.getByTestId("end-time-input")).toHaveValue("12:30");
  });

  it("edit mode: duration workHour pre-selects Duração", () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    expect(
      screen.getByRole("button", { name: "durationMode" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByPlaceholderText("HH:mm")).toBeInTheDocument();
  });

  it("edit mode: Cancel resets the entry-mode selector to the original mode", () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.click(screen.getByRole("button", { name: "intervalMode" }));
    expect(
      screen.getByRole("button", { name: "intervalMode" })
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(
      screen.getByRole("button", { name: "durationMode" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("edit mode: invoiced work hour disables every field and the save button, and shows the cannotEditInvoiced notice", () => {
    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={{ ...editableWorkHour, isInvoiced: true }}
      />
    );

    expect(screen.getByText("cannotEditInvoiced")).toBeInTheDocument();
    expect(screen.getByTestId("date-field-wrapper")).toHaveClass(
      "pointer-events-none"
    );
    expect(screen.getByPlaceholderText("HH:mm")).toBeDisabled();
    expect(screen.getByDisplayValue("Existing work")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "saveChanges" })
    ).toBeDisabled();
  });

  it("edit mode: invoiced work hour disables the entry-mode selector and interval inputs", () => {
    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={{ ...intervalWorkHour, isInvoiced: true }}
      />
    );

    expect(
      screen.getByRole("button", { name: "durationMode" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "intervalMode" })
    ).toBeDisabled();
    expect(screen.getByTestId("start-time-input")).toBeDisabled();
    expect(screen.getByTestId("end-time-input")).toBeDisabled();
  });

  it("edit mode: save sends only the field that was changed", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-1" });

    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() =>
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: "wh-1",
        data: { hours: 2 },
      })
    );
    expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("edit mode: changing only startTime resends recomputed hours", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-2" });

    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={intervalWorkHour} />
    );

    fireEvent.change(screen.getByTestId("start-time-input"), {
      target: { value: "1000" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() =>
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: "wh-2",
        data: { startTime: "10:00", hours: 2.5 },
      })
    );
    expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
  });

  it("edit mode: save button is disabled and shows the spinner while pending", () => {
    mockUseUpdateTimeEntry.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: true,
      isError: false,
      isSuccess: false,
    });

    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    expect(screen.getByRole("button", { name: /saving/ })).toBeDisabled();
    expect(screen.getByTestId("save-spinner")).toBeInTheDocument();
  });

  it("edit mode: a successful save keeps the new value in the input and shows the success alert", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-1" });
    mockUseUpdateTimeEntry.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: true,
    });

    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00");
    expect(screen.getByText("savedSuccessfully")).toBeInTheDocument();
  });

  it("edit mode: a failed save keeps the typed value and shows the error alert", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("network error"));
    mockUseUpdateTimeEntry.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      isError: true,
      isSuccess: false,
    });

    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00");
    expect(screen.getByText("errorSaving")).toBeInTheDocument();
  });

  it("edit mode: blocks submit on invalid hours format", async () => {
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "99" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() =>
      expect(screen.getByText("invalidTimeFormat")).toBeInTheDocument()
    );
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("hour-only entry auto-fills minutes with 00", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "wh-new" });

    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "8" },
    });
    fireEvent.blur(screen.getByPlaceholderText("HH:mm"));
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("08:00");

    fireEvent.click(screen.getByRole("button", { name: "intervalMode" }));
    fireEvent.change(screen.getByTestId("start-time-input"), {
      target: { value: "9" },
    });
    fireEvent.blur(screen.getByTestId("start-time-input"));
    expect(screen.getByTestId("start-time-input")).toHaveValue("09:00");

    fireEvent.change(screen.getByTestId("end-time-input"), {
      target: { value: "17" },
    });
    fireEvent.blur(screen.getByTestId("end-time-input"));
    expect(screen.getByTestId("end-time-input")).toHaveValue("17:00");

    fireEvent.click(screen.getByRole("button", { name: "saveWorkHour" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    const payload = mockCreateMutateAsync.mock.calls[0][0];
    expect(payload.startTime).toBe("09:00");
    expect(payload.endTime).toBe("17:00");
    expect(payload.hours).toBe(8);
  });

  it("partial HH:mm entry with a colon is not auto-filled", () => {
    renderWithQueryClient(<WorkHourForm clients={mockClients} />);

    // Typing digits "0", "8", "3" runs through the existing HH:mm mask, which
    // inserts the colon once a 3rd digit arrives: "08:3".
    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "083" },
    });
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("08:3");

    fireEvent.blur(screen.getByPlaceholderText("HH:mm"));

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("08:3");
  });

  it("edit mode: unsaved changes are discarded when the form is remounted with the original workHour", () => {
    const { unmount } = renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0900" },
    });
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("09:00");

    // Closing the modal unmounts the form; reopening it mounts a fresh one
    // from the original (unedited) workHour, the same way the page does.
    unmount();
    renderWithQueryClient(
      <WorkHourForm clients={mockClients} workHour={editableWorkHour} />
    );

    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("01:30");
  });
});
