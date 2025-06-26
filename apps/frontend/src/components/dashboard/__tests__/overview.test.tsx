import { describe, it, expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

import "@testing-library/jest-dom";
import { Overview } from "../overview";

import type { Invoice } from "@/services/invoices";
import type { WorkHour, InvoiceWorkHour } from "@/services/work-hours";

// Mock components
jest.mock("@/components/ui/stats-card", () => ({
  StatsCard: ({ title, value, description }: any) => (
    <div data-testid="stats-card">
      <h3>{title}</h3>
      <p>{value}</p>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock("@/components/layout/loading-skeleton", () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

jest.mock("@/components/invoices/client-invoice-card", () => ({
  ClientInvoiceCard: ({ invoice }: any) => (
    <div data-testid="invoice-card">
      <p>Invoice {invoice.number}</p>
      <p>Amount: ${invoice.amount}</p>
      <p>Status: {invoice.status}</p>
    </div>
  ),
}));

// Mock data
const mockWorkHours: WorkHour[] = [
  {
    id: "wh1",
    date: "2024-03-01",
    description: "Web development work",
    hours: 20,
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
    id: "wh2",
    date: "2024-03-02",
    description: "App design work",
    hours: 30,
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

const mockInvoiceWorkHours: InvoiceWorkHour[] = [
  {
    id: "iwh1",
    workHour: mockWorkHours[0],
  },
  {
    id: "iwh2",
    workHour: mockWorkHours[1],
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-001",
    amount: 1000,
    status: "PAID",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    description: "Web development",
    clientId: "client1",
    invoiceWorkHours: [mockInvoiceWorkHours[0]],
  },
  {
    id: "2",
    number: "INV-002",
    amount: 1500,
    status: "PENDING",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
    description: "App design",
    clientId: "client2",
    invoiceWorkHours: [mockInvoiceWorkHours[1]],
  },
];

const mockData = {
  stats: {
    totalInvoices: 10,
    totalHours: 160,
    totalAmount: 5000,
    paidAmount: 3000,
    pendingAmount: 2000,
    paidInvoices: 6,
    pendingInvoices: 4,
    canceledInvoices: 0,
    averageInvoiceValue: 500,
    monthlyGrowth: 12.5,
  },
  invoices: mockInvoices,
};

describe("Overview", () => {
  it("should render loading skeleton when loading", () => {
    render(<Overview data={mockData} isLoading={true} />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should render error state when there is an error", () => {
    render(
      <Overview
        data={mockData}
        isLoading={false}
        error={new Error("Test error")}
      />
    );
    expect(screen.getByText("Error loading dashboard")).toBeInTheDocument();
  });

  it("should render client info when provided", () => {
    const dataWithClient = {
      ...mockData,
      clientInfo: {
        name: "Test Client",
        email: "client@example.com",
        company: "Test Company",
      },
    };

    render(<Overview data={dataWithClient} isLoading={false} />);
    expect(screen.getByText("Test Client Dashboard")).toBeInTheDocument();
    expect(screen.getByText("client@example.com")).toBeInTheDocument();
  });

  it("should render main stats correctly", () => {
    render(<Overview data={mockData} isLoading={false} />);

    const statsCards = screen.getAllByTestId("stats-card");
    expect(statsCards).toHaveLength(4);

    // Check total invoices
    expect(statsCards[0]).toHaveTextContent("Total Invoices");
    expect(statsCards[0]).toHaveTextContent("10");

    // Check total hours
    expect(statsCards[1]).toHaveTextContent("Total Hours");
    expect(statsCards[1]).toHaveTextContent("160:00");

    // Check total amount
    expect(statsCards[2]).toHaveTextContent("Total Amount");
    expect(statsCards[2]).toHaveTextContent("$5000.00");
    expect(statsCards[2]).toHaveTextContent("Avg: $500.00");

    // Check paid amount
    expect(statsCards[3]).toHaveTextContent("Paid Amount");
    expect(statsCards[3]).toHaveTextContent("$3000.00");
    expect(statsCards[3]).toHaveTextContent("6 invoices paid");
  });

  it("should filter invoices by search term", () => {
    render(<Overview data={mockData} isLoading={false} />);

    // Get the search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "web" } });

    // Should only show the invoice with "Web development"
    const invoiceCards = screen.getAllByTestId("invoice-card");
    expect(invoiceCards).toHaveLength(1);
    expect(invoiceCards[0]).toHaveTextContent("INV-001");
  });

  it("should filter invoices by status", () => {
    render(<Overview data={mockData} isLoading={false} />);

    // Get the status filter
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: "PAID" } });

    // Should only show paid invoices
    const invoiceCards = screen.getAllByTestId("invoice-card");
    expect(invoiceCards).toHaveLength(1);
    expect(invoiceCards[0]).toHaveTextContent("PAID");
  });

  it("should sort invoices by different criteria", () => {
    render(<Overview data={mockData} isLoading={false} />);

    // Get the sort select
    const sortSelect = screen.getByLabelText(/sort by/i);

    // Sort by amount
    fireEvent.change(sortSelect, { target: { value: "amount" } });
    let invoiceCards = screen.getAllByTestId("invoice-card");
    expect(invoiceCards[0]).toHaveTextContent("$1500"); // Higher amount first

    // Sort by hours
    fireEvent.change(sortSelect, { target: { value: "hours" } });
    invoiceCards = screen.getAllByTestId("invoice-card");
    expect(invoiceCards[0]).toHaveTextContent("INV-002"); // More hours first

    // Sort by status
    fireEvent.change(sortSelect, { target: { value: "status" } });
    invoiceCards = screen.getAllByTestId("invoice-card");
    expect(invoiceCards[0]).toHaveTextContent("PAID"); // Alphabetical order
  });
});
