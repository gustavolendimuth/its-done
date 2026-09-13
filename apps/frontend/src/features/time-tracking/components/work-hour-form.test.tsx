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

jest.mock("../time-entries", () => ({
  useCreateTimeEntry: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useUpdateTimeEntry: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

describe("WorkHourForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      <WorkHourForm
        clients={mockClients}
        workHour={{
          id: "wh-1",
          date: "2026-01-05T00:00:00.000Z",
          hours: 1.5,
          description: "Existing work",
        }}
      />
    );

    expect(screen.queryByTestId("client-combobox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-combobox")).not.toBeInTheDocument();
  });

  it("edit mode: prefills date, hours and description from workHour", () => {
    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={{
          id: "wh-1",
          date: "2026-01-05T00:00:00.000Z",
          hours: 1.5,
          description: "Existing work",
        }}
      />
    );

    expect(screen.getByTestId("date-picker")).toHaveValue("2026-01-05");
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("01:30");
    expect(screen.getByDisplayValue("Existing work")).toBeInTheDocument();
  });

  it("edit mode: submits via update with only date/hours/description", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-1" });

    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={{
          id: "wh-1",
          date: "2026-01-05T00:00:00.000Z",
          hours: 1.5,
          description: "Existing work",
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });

    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() =>
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: "wh-1",
        data: {
          date: "2026-01-05T00:00:00.000Z",
          hours: 2,
          description: "Existing work",
        },
      })
    );
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("edit mode: blocks submit on invalid hours format", async () => {
    renderWithQueryClient(
      <WorkHourForm
        clients={mockClients}
        workHour={{
          id: "wh-1",
          date: "2026-01-05T00:00:00.000Z",
          hours: 1.5,
          description: "Existing work",
        }}
      />
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
});
