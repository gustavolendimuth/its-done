import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import DashboardPage from "../page";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock services
jest.mock("@/services/time-entries", () => ({
  useTimeEntries: jest.fn(() => ({
    data: [
      { id: "1", hours: 5, clientId: "client1" },
      { id: "2", hours: 3, clientId: "client2" },
    ],
    isLoading: false,
  })),
}));

jest.mock("@/services/invoices", () => ({
  useInvoices: jest.fn(() => ({
    data: [
      {
        id: "1",
        amount: 1000,
        status: "PAID",
        clientId: "client1",
        createdAt: "2024-03-01T00:00:00Z",
      },
      {
        id: "2",
        amount: 500,
        status: "PENDING",
        clientId: "client2",
        createdAt: "2024-03-02T00:00:00Z",
      },
      {
        id: "3",
        amount: 200,
        status: "CANCELED",
        clientId: "client1",
        createdAt: "2024-03-03T00:00:00Z",
      },
    ],
    isLoading: false,
  })),
}));

jest.mock("@/services/clients", () => ({
  useClients: jest.fn(() => ({
    data: [
      { id: "client1", name: "Client 1", company: "Company 1" },
      { id: "client2", name: "Client 2", company: "Company 2" },
    ],
    isLoading: false,
  })),
}));

jest.mock("@/services/work-hours-stats", () => ({
  useWorkHoursStats: jest.fn(() => ({
    isLoading: false,
  })),
}));

// Mock components
jest.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

jest.mock("@/components/ui/info-card", () => ({
  InfoCard: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div data-testid="info-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock("@/components/dashboard/overview", () => ({
  Overview: ({ data, isLoading }: { data: any; isLoading: boolean }) => (
    <div data-testid="overview">
      <span>Loading: {isLoading.toString()}</span>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  ),
}));

describe("DashboardPage", () => {
  it("should render the page with header and info card", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("page-container")).toBeInTheDocument();
    expect(screen.getByTestId("page-header")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("info-card")).toBeInTheDocument();
    expect(screen.getByText("infoTitle")).toBeInTheDocument();
  });

  it("should calculate and display correct stats", () => {
    render(<DashboardPage />);

    const data = JSON.parse(
      screen.getByText(/\{[\s\S]*\}/).textContent || "{}"
    );

    // Check stats calculations
    expect(data.stats).toEqual({
      totalHours: 8, // 5 + 3
      totalInvoices: 3,
      totalAmount: 1700, // 1000 + 500 + 200
      paidAmount: 1000,
      pendingAmount: 500,
      paidInvoices: 1,
      pendingInvoices: 1,
      canceledInvoices: 1,
      averageInvoiceValue: 1700 / 3,
      monthlyGrowth: 12.5,
    });

    // Check invoices are sorted by date (most recent first)
    expect(data.invoices).toHaveLength(3);
    expect(data.invoices[0].id).toBe("3"); // Most recent
    expect(data.invoices[2].id).toBe("1"); // Oldest
  });

  it("should show loading state when data is being fetched", () => {
    // Mock loading state
    jest
      .spyOn(require("@/services/time-entries"), "useTimeEntries")
      .mockReturnValue({
        data: [],
        isLoading: true,
      });

    render(<DashboardPage />);

    const overview = screen.getByTestId("overview");
    expect(overview).toHaveTextContent("Loading: true");

    const data = JSON.parse(
      screen.getByText(/\{[\s\S]*\}/).textContent || "{}"
    );
    expect(data.stats).toEqual({
      totalHours: 0,
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      canceledInvoices: 0,
      averageInvoiceValue: 0,
      monthlyGrowth: 0,
    });
  });
});
