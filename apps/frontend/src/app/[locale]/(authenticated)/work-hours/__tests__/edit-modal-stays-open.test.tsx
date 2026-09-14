import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import "@testing-library/jest-dom";

import WorkHoursPage from "../page";

// Unlike page.test.tsx (which mocks WorkHourForm away entirely), this file
// renders the real WorkHoursTable + FormModal + WorkHourForm to prove C12's
// "the modal stays open after a successful save" - a claim the mocked
// WorkHourForm in page.test.tsx has no seam to reach.

jest.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, subtitle, actions }: any) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {actions?.map((action: any, index: number) => (
        <button key={index} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </header>
  ),
}));

jest.mock("@/features/time-tracking", () => {
  const actual = jest.requireActual("@/features/time-tracking");
  return {
    ...actual,
    WorkHoursBigStats: () => <div data-testid="work-hours-big-stats" />,
  };
});

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
        onChange(
          e.target.value ? new Date(`${e.target.value}T00:00:00.000Z`) : null
        )
      }
    />
  ),
}));

const mockClients = [
  {
    id: "client1",
    name: "John Doe",
    email: "john@example.com",
    company: "Company A",
  },
];

jest.mock("@/features/clients", () => ({
  useClients: () => ({ data: mockClients, isLoading: false, error: null }),
}));

const mockWorkHour = {
  id: "wh-1",
  date: "2026-01-05T00:00:00.000Z",
  description: "Existing work",
  hours: 1.5,
  client: { id: "client1", name: "John Doe", email: "john@example.com" },
};

const mockUpdateMutateAsync = jest.fn();

jest.mock("@/features/time-tracking/time-entries", () => ({
  useTimeEntries: () => ({
    data: [mockWorkHour],
    isLoading: false,
    isFetching: false,
    error: null,
  }),
  useDeleteTimeEntry: () => ({ mutateAsync: jest.fn() }),
  useCreateTimeEntry: () => ({
    mutateAsync: jest.fn(),
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

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("WorkHoursPage edit modal - stays open after save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the edit modal open after a successful save", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "wh-1" });

    renderWithQueryClient(<WorkHoursPage />);

    fireEvent.click(screen.getByTestId("work-hour-row"));
    expect(screen.getByPlaceholderText("HH:mm")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("HH:mm"), {
      target: { value: "0200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());

    // The dialog - and the input inside it - is still in the document; a
    // closed modal would have unmounted it.
    expect(screen.getByPlaceholderText("HH:mm")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00");
  });
});
