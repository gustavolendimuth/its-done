import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import InvoicesPage from "../page";

import type { Client } from "@/features/clients";
import type { Invoice } from "@/features/invoices";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
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

jest.mock("@/components/layout/empty-state", () => ({
  EmptyState: ({ title, description, actions }: any) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {actions?.map((action: any, index: number) => (
        <button key={index} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock data
const mockClients: Client[] = [
  {
    id: "client1",
    name: "John Doe",
    email: "john@example.com",
    company: "Company A",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "client2",
    name: "Jane Smith",
    email: "jane@example.com",
    company: "Company B",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
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
    fileUrl: null,
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
    fileUrl: null,
  },
];

// Mock the invoices feature barrel: stub the components + services this test
// controls, keep the real InvoiceSearchFilters/useInvoiceFilters implementation.
jest.mock("@/features/invoices", () => ({
  ...jest.requireActual("@/features/invoices"),
  CreateInvoiceForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="create-invoice-form">
      <button onClick={onSuccess}>Submit</button>
    </div>
  ),
  EditInvoiceForm: ({
    invoice,
    onSuccess,
    onCancel,
  }: {
    invoice: Invoice;
    onSuccess: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="edit-invoice-form">
      <p>Invoice: {invoice.number}</p>
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  InvoiceUploadModal: ({
    invoice,
    onSuccess,
    onClose,
  }: {
    invoice: Invoice;
    onSuccess: () => void;
    onClose: () => void;
  }) => (
    <div data-testid="invoice-upload-modal">
      <p>Upload for: {invoice.number}</p>
      <button onClick={onSuccess}>Upload</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
  InvoiceCard: ({
    id,
    number,
    clientName,
    amount,
    status,
    onEdit,
    onDelete,
    onUpload,
  }: any) => (
    <div data-testid="invoice-card">
      <p>Invoice: {number}</p>
      <p>Client: {clientName}</p>
      <p>Amount: ${amount}</p>
      <p>Status: {status}</p>
      <button onClick={onEdit}>Edit</button>
      <button onClick={() => onDelete(id)}>Delete</button>
      <button onClick={onUpload}>Upload</button>
    </div>
  ),
  InvoicesBigStats: () => <div data-testid="invoices-big-stats">Stats</div>,
  InvoicesPageSkeleton: () => <div data-testid="loading-skeleton" />,
  useInvoices: jest.fn(() => ({
    data: mockInvoices,
    isLoading: false,
    error: null,
  })),
  useDeleteInvoice: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
}));

jest.mock("@/features/clients", () => ({
  useClients: jest.fn(() => ({
    data: mockClients,
    isLoading: false,
  })),
}));

describe("InvoicesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore the default (some tests below override it via mockReturnValue,
    // which clearAllMocks does not undo)
    const { useInvoices } = require("@/features/invoices");

    useInvoices.mockReturnValue({
      data: mockInvoices,
      isLoading: false,
      error: null,
    });
  });

  it("should render loading skeleton when loading", () => {
    const { useInvoices } = require("@/features/invoices");
    useInvoices.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<InvoicesPage />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should render error state when there is an error", () => {
    const { useInvoices } = require("@/features/invoices");
    useInvoices.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Test error"),
    });

    render(<InvoicesPage />);
    expect(screen.getByText("error")).toBeInTheDocument();
    expect(screen.getByText("errorOccurred")).toBeInTheDocument();
  });

  it("should render invoices list when data is loaded", () => {
    render(<InvoicesPage />);

    // Check header
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check stats
    expect(screen.getByTestId("invoices-big-stats")).toBeInTheDocument();

    // Check invoice cards
    const cards = screen.getAllByTestId("invoice-card");
    expect(cards).toHaveLength(2);
    // Default sort is newest first, so INV-002 (2024-03-02) leads INV-001 (2024-03-01)
    expect(cards[0]).toHaveTextContent("Invoice: INV-002");
    expect(cards[0]).toHaveTextContent("Client: Jane Smith");
    expect(cards[0]).toHaveTextContent("Amount: $1500");
    expect(cards[1]).toHaveTextContent("Invoice: INV-001");
    expect(cards[1]).toHaveTextContent("Client: John Doe");
    expect(cards[1]).toHaveTextContent("Amount: $1000");
  });

  it("should handle invoice deletion", async () => {
    const { useDeleteInvoice } = require("@/features/invoices");
    const mockMutateAsync = jest.fn();
    useDeleteInvoice.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    render(<InvoicesPage />);

    // Find and click delete button (default sort is newest first, so the
    // first card is invoice "2")
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    // Check if delete mutation was called
    expect(mockMutateAsync).toHaveBeenCalledWith("2");

    // Check toast (handleDelete awaits the mutation before toasting)
    const { toast } = require("sonner");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("deleteSuccess");
    });
  });

  it("should handle invoice edit", () => {
    render(<InvoicesPage />);

    // Find and click edit button
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    // Check if edit form is open
    expect(screen.getByTestId("edit-invoice-form")).toBeInTheDocument();
    expect(screen.getByText("Invoice: INV-001")).toBeInTheDocument();

    // Close form
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Check if form is closed
    expect(screen.queryByTestId("edit-invoice-form")).not.toBeInTheDocument();
  });

  it("should handle invoice upload", () => {
    render(<InvoicesPage />);

    // Find and click upload button (default sort is newest first, so the
    // first card is invoice "2" / INV-002)
    const uploadButtons = screen.getAllByText("Upload");
    fireEvent.click(uploadButtons[0]);

    // Check if upload modal is open
    expect(screen.getByTestId("invoice-upload-modal")).toBeInTheDocument();
    expect(screen.getByText("Upload for: INV-002")).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Check if modal is closed
    expect(
      screen.queryByTestId("invoice-upload-modal")
    ).not.toBeInTheDocument();
  });

  it("should show empty state when no invoices", () => {
    const { useInvoices } = require("@/features/invoices");
    useInvoices.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<InvoicesPage />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("noInvoicesFound")).toBeInTheDocument();
    expect(screen.getByText("createFirst")).toBeInTheDocument();
  });

  it("should handle invoice creation", () => {
    render(<InvoicesPage />);

    // Click create button
    const createButton = screen.getByText("createInvoice");
    fireEvent.click(createButton);

    // Check if create form is open
    expect(screen.getByTestId("create-invoice-form")).toBeInTheDocument();

    // Submit form
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    // Check if form is closed
    expect(screen.queryByTestId("create-invoice-form")).not.toBeInTheDocument();
  });
});
