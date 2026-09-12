import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

import "@testing-library/jest-dom";
import WorkHoursPage from "../page";

import type { WorkHour } from "@/features/time-tracking";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

jest.mock("@/components/layout/loading-skeleton", () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

// Mock services
const mockWorkHours: WorkHour[] = [
  {
    id: "1",
    date: "2024-03-01",
    description: "Web development",
    hours: 5,
    client: {
      id: "client1",
      name: "Client 1",
      email: "client1@example.com",
    },
    project: {
      id: "project1",
      name: "Web Project",
    },
  },
  {
    id: "2",
    date: "2024-03-02",
    description: "App design",
    hours: 3,
    client: {
      id: "client2",
      name: "Client 2",
      email: "client2@example.com",
    },
    project: {
      id: "project2",
      name: "App Project",
    },
  },
];

const mockClients = [
  {
    id: "client1",
    name: "John Doe",
    email: "john@example.com",
    company: "Company A",
  },
  {
    id: "client2",
    name: "Jane Smith",
    email: "jane@example.com",
    company: "Company B",
  },
];

// Mock the time-tracking feature (components + service, single barrel import in page.tsx)
jest.mock("@/features/time-tracking", () => ({
  WorkHourForm: () => <div data-testid="work-hour-form">Work Hour Form</div>,
  WorkHoursBigStats: ({
    workHours,
    isRefetching,
  }: {
    workHours: WorkHour[];
    isRefetching: boolean;
  }) => (
    <div data-testid="work-hours-big-stats">
      <span>
        Total Hours: {workHours.reduce((sum, wh) => sum + wh.hours, 0)}
      </span>
      <span>Loading: {isRefetching.toString()}</span>
    </div>
  ),
  WorkHoursTable: ({ workHours, deletingId, onDelete }: any) => (
    <div data-testid="work-hours-table">
      {workHours.map((workHour: any) => (
        <div data-testid="work-hour-row" key={workHour.id}>
          <p>Hours: {workHour.hours}</p>
          <p>Client: {workHour.client?.name}</p>
          <p>Project: {workHour.project?.name}</p>
          <p>Deleting: {(deletingId === workHour.id).toString()}</p>
          <button
            aria-label="delete work hour"
            onClick={() => onDelete(workHour.id)}
          >
            delete
          </button>
        </div>
      ))}
    </div>
  ),
  useTimeEntries: jest.fn(() => ({
    data: mockWorkHours,
    isLoading: false,
    isFetching: false,
    error: null,
  })),
  useDeleteTimeEntry: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
}));

jest.mock("@/features/clients/clients", () => ({
  useClients: jest.fn(() => ({
    data: mockClients,
    isLoading: false,
    error: null,
  })),
}));

describe("WorkHoursPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading skeleton when loading", () => {
    const { useTimeEntries } = require("@/features/time-tracking");
    useTimeEntries.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      error: null,
    });

    render(<WorkHoursPage />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should render work hours list when data is loaded", () => {
    render(<WorkHoursPage />);

    // Check header
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check stats
    expect(screen.getByTestId("work-hours-big-stats")).toBeInTheDocument();
    expect(screen.getByText("Total Hours: 8")).toBeInTheDocument(); // 5 + 3 hours

    // Check work hour rows
    const rows = screen.getAllByTestId("work-hour-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Hours: 5");
    expect(rows[0]).toHaveTextContent("Client: Client 1");
    expect(rows[1]).toHaveTextContent("Hours: 3");
    expect(rows[1]).toHaveTextContent("Client: Client 2");
  });

  it("should filter work hours by client", async () => {
    const { useTimeEntries } = require("@/features/time-tracking");
    render(<WorkHoursPage />);

    // Open client filter
    const clientFilter = screen.getByLabelText(/filter by client/i);
    fireEvent.click(clientFilter);

    // Select a client
    const clientOption = screen.getByText("Company A (John Doe)");
    fireEvent.click(clientOption);

    // Check if useTimeEntries was called with correct filter
    expect(useTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client1",
      })
    );
  });

  it("should handle work hour deletion", async () => {
    const { useDeleteTimeEntry } = require("@/features/time-tracking");
    const mockMutateAsync = jest.fn();
    useDeleteTimeEntry.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    render(<WorkHoursPage />);

    // Find and click delete button
    const deleteButton = screen.getByLabelText(/delete work hour/i);
    fireEvent.click(deleteButton);

    // Check if delete mutation was called
    expect(mockMutateAsync).toHaveBeenCalledWith("1");

    // Check loading state
    expect(screen.getByText("Deleting: true")).toBeInTheDocument();
  });

  it("should open add work hour modal", () => {
    render(<WorkHoursPage />);

    // Click add button
    const addButton = screen.getByText("addHours");
    fireEvent.click(addButton);

    // Check if modal is open
    expect(screen.getByTestId("work-hour-form")).toBeInTheDocument();
  });

  it("should pass an empty list to the table when there are no work hours", () => {
    const { useTimeEntries } = require("@/features/time-tracking");
    useTimeEntries.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<WorkHoursPage />);

    expect(screen.getByTestId("work-hours-table")).toBeInTheDocument();
    expect(screen.queryAllByTestId("work-hour-row")).toHaveLength(0);
  });

  it("should show refetching indicator", () => {
    const { useTimeEntries } = require("@/features/time-tracking");
    useTimeEntries.mockReturnValue({
      data: mockWorkHours,
      isLoading: false,
      isFetching: true,
      error: null,
    });

    render(<WorkHoursPage />);

    expect(screen.getByText("loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading: true")).toBeInTheDocument();
  });
});
