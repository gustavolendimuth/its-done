import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

import "@testing-library/jest-dom";
import WorkHoursPage from "../page";

import type { WorkHour } from "@/services/work-hours";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock components
jest.mock("@/components/work-hours/work-hour-form", () => ({
  WorkHourForm: () => <div data-testid="work-hour-form">Work Hour Form</div>,
}));

jest.mock("@/components/work-hours/work-hours-big-stats", () => ({
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
}));

jest.mock("@/components/work-hours/work-hour-card", () => ({
  WorkHourCard: ({ workHour, isDeleting }: any) => (
    <div data-testid="work-hour-card">
      <p>Hours: {workHour.hours}</p>
      <p>Client: {workHour.client?.name}</p>
      <p>Project: {workHour.project?.name}</p>
      <p>Deleting: {isDeleting.toString()}</p>
    </div>
  ),
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

jest.mock("@/services/time-entries", () => ({
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

jest.mock("@/services/clients", () => ({
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
    const { useTimeEntries } = require("@/services/time-entries");
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

    // Check work hour cards
    const cards = screen.getAllByTestId("work-hour-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Hours: 5");
    expect(cards[0]).toHaveTextContent("Client: Client 1");
    expect(cards[1]).toHaveTextContent("Hours: 3");
    expect(cards[1]).toHaveTextContent("Client: Client 2");
  });

  it("should filter work hours by client", async () => {
    const { useTimeEntries } = require("@/services/time-entries");
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
    const { useDeleteTimeEntry } = require("@/services/time-entries");
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

  it("should show empty state when no work hours", () => {
    const { useTimeEntries } = require("@/services/time-entries");
    useTimeEntries.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<WorkHoursPage />);

    expect(screen.getByText("noWorkHours")).toBeInTheDocument();
    expect(screen.getByText("noWorkHoursDescription")).toBeInTheDocument();
  });

  it("should show refetching indicator", () => {
    const { useTimeEntries } = require("@/services/time-entries");
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
