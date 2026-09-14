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
      target: { value: "9" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() =>
      expect(
        screen.getByText("Invalid time format (HH:mm)")
      ).toBeInTheDocument()
    );
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
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
