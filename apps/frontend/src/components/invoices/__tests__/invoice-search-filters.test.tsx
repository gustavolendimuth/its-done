import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  InvoiceSearchFilters,
  useInvoiceFilters,
  SortBy,
  FilterStatus,
} from "../invoice-search-filters";

// Mock data for testing
const mockInvoices = [
  {
    id: "1",
    number: "INV-001",
    description: "Web development",
    status: "PAID",
    amount: 1000,
    createdAt: "2024-01-15T00:00:00Z",
    client: { name: "Client A" },
    invoiceWorkHours: [{ workHour: { hours: 10 } }],
  },
  {
    id: "2",
    number: "INV-002",
    description: "App design",
    status: "PENDING",
    amount: 1500,
    createdAt: "2024-01-20T00:00:00Z",
    client: { name: "Client B" },
    invoiceWorkHours: [{ workHour: { hours: 15 } }],
  },
  {
    id: "3",
    number: "INV-003",
    description: "SEO optimization",
    status: "CANCELED",
    amount: 800,
    createdAt: "2024-01-10T00:00:00Z",
    client: { name: "Client C" },
    invoiceWorkHours: [{ workHour: { hours: 8 } }],
  },
];

describe("InvoiceSearchFilters", () => {
  const defaultProps = {
    searchTerm: "",
    sortBy: "date" as SortBy,
    filterStatus: "ALL" as FilterStatus,
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onStatusChange: vi.fn(),
    totalResults: 10,
    totalInvoices: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input with correct placeholder", () => {
    render(<InvoiceSearchFilters {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      "Search invoices by number or description..."
    );

    expect(searchInput).toBeInTheDocument();
  });

  it("should render status and sort selectors", () => {
    render(<InvoiceSearchFilters {...defaultProps} />);

    // Check for select triggers (combobox role)
    const selectElements = screen.getAllByRole("combobox");

    expect(selectElements).toHaveLength(2);
  });

  it("should display results summary correctly", () => {
    render(<InvoiceSearchFilters {...defaultProps} />);

    expect(screen.getByText("Showing 10 of 15 invoices")).toBeInTheDocument();
  });

  it("should display search term when present", () => {
    render(<InvoiceSearchFilters {...defaultProps} searchTerm="test search" />);

    expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
  });

  it("should call onSearchChange when search input changes", () => {
    const onSearchChange = vi.fn();

    render(
      <InvoiceSearchFilters {...defaultProps} onSearchChange={onSearchChange} />
    );

    const searchInput = screen.getByPlaceholderText(
      "Search invoices by number or description..."
    );

    fireEvent.change(searchInput, { target: { value: "new search" } });

    expect(onSearchChange).toHaveBeenCalledWith("new search");
  });

  it("should show current search term in input", () => {
    render(
      <InvoiceSearchFilters {...defaultProps} searchTerm="existing search" />
    );

    const searchInput = screen.getByDisplayValue("existing search");

    expect(searchInput).toBeInTheDocument();
  });
});

describe("useInvoiceFilters", () => {
  // Create a test component to test the hook
  function TestComponent({ invoices }: { invoices: any[] }) {
    const {
      searchTerm,
      sortBy,
      filterStatus,
      filteredInvoices,
      setSearchTerm,
      setSortBy,
      setFilterStatus,
    } = useInvoiceFilters(invoices);

    return (
      <div>
        <span data-testid="search-term">{searchTerm}</span>
        <span data-testid="sort-by">{sortBy}</span>
        <span data-testid="filter-status">{filterStatus}</span>
        <span data-testid="filtered-count">{filteredInvoices.length}</span>
        <button onClick={() => setSearchTerm("test")}>Set Search</button>
        <button onClick={() => setSortBy("amount")}>Set Sort</button>
        <button onClick={() => setFilterStatus("PAID")}>Set Status</button>
        <div data-testid="filtered-invoices">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} data-testid={`invoice-${invoice.id}`}>
              {invoice.number}
            </div>
          ))}
        </div>
      </div>
    );
  }

  it("should initialize with default values", () => {
    render(<TestComponent invoices={mockInvoices} />);

    expect(screen.getByTestId("search-term")).toHaveTextContent("");
    expect(screen.getByTestId("sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("filter-status")).toHaveTextContent("ALL");
    expect(screen.getByTestId("filtered-count")).toHaveTextContent("3");
  });

  it("should update search term", () => {
    render(<TestComponent invoices={mockInvoices} />);

    fireEvent.click(screen.getByText("Set Search"));

    expect(screen.getByTestId("search-term")).toHaveTextContent("test");
  });

  it("should update sort by", () => {
    render(<TestComponent invoices={mockInvoices} />);

    fireEvent.click(screen.getByText("Set Sort"));

    expect(screen.getByTestId("sort-by")).toHaveTextContent("amount");
  });

  it("should update filter status", () => {
    render(<TestComponent invoices={mockInvoices} />);

    fireEvent.click(screen.getByText("Set Status"));

    expect(screen.getByTestId("filter-status")).toHaveTextContent("PAID");
  });

  it("should sort invoices by date (default)", () => {
    render(<TestComponent invoices={mockInvoices} />);

    const invoiceElements = screen.getAllByTestId(/^invoice-/);

    // Should be sorted by date desc - most recent first
    expect(invoiceElements[0]).toHaveTextContent("INV-002"); // 2024-01-20
    expect(invoiceElements[1]).toHaveTextContent("INV-001"); // 2024-01-15
    expect(invoiceElements[2]).toHaveTextContent("INV-003"); // 2024-01-10
  });

  it("should filter by status", () => {
    function TestStatusFilter() {
      const { filteredInvoices, setFilterStatus } =
        useInvoiceFilters(mockInvoices);

      return (
        <div>
          <button onClick={() => setFilterStatus("PAID")}>Filter Paid</button>
          <span data-testid="filtered-count">{filteredInvoices.length}</span>
          <div data-testid="filtered-invoices">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} data-testid={`status-${invoice.status}`}>
                {invoice.status}
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestStatusFilter />);

    fireEvent.click(screen.getByText("Filter Paid"));

    expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
    expect(screen.getByTestId("status-PAID")).toBeInTheDocument();
  });

  it("should filter by search term", () => {
    function TestSearchFilter() {
      const { filteredInvoices, setSearchTerm } =
        useInvoiceFilters(mockInvoices);

      return (
        <div>
          <button onClick={() => setSearchTerm("INV-001")}>
            Search INV-001
          </button>
          <span data-testid="filtered-count">{filteredInvoices.length}</span>
          <div data-testid="filtered-invoices">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} data-testid={`invoice-${invoice.number}`}>
                {invoice.number}
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestSearchFilter />);

    fireEvent.click(screen.getByText("Search INV-001"));

    expect(screen.getByTestId("filtered-count")).toHaveTextContent("1");
    expect(screen.getByTestId("invoice-INV-001")).toBeInTheDocument();
  });

  it("should sort by amount", () => {
    function TestSortFilter() {
      const { filteredInvoices, setSortBy } = useInvoiceFilters(mockInvoices);

      return (
        <div>
          <button onClick={() => setSortBy("amount")}>Sort by Amount</button>
          <div data-testid="filtered-invoices">
            {filteredInvoices.map((invoice, index) => (
              <div key={invoice.id} data-testid={`invoice-${index}`}>
                {invoice.amount}
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<TestSortFilter />);

    fireEvent.click(screen.getByText("Sort by Amount"));

    const invoiceElements = screen.getAllByTestId(/^invoice-\d+$/);

    // Should be sorted by amount desc - highest first
    expect(invoiceElements[0]).toHaveTextContent("1500"); // INV-002
    expect(invoiceElements[1]).toHaveTextContent("1000"); // INV-001
    expect(invoiceElements[2]).toHaveTextContent("800"); // INV-003
  });
});
