import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

import "@testing-library/jest-dom";
import ClientsPage from "../page";

import type { Client } from "@/services/clients";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock components
jest.mock("@/components/clients/client-form", () => ({
  ClientForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="client-form">
      <button onClick={onSuccess}>Submit</button>
    </div>
  ),
}));

jest.mock("@/components/clients/client-card", () => ({
  ClientCard: ({ client }: { client: Client }) => (
    <div data-testid="client-card">
      <p>Company: {client.company}</p>
      <p>Name: {client.name}</p>
      <p>Email: {client.email}</p>
    </div>
  ),
}));

jest.mock("@/components/clients/clients-big-stats", () => ({
  ClientsBigStats: () => <div data-testid="clients-big-stats">Stats</div>,
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
    id: "1",
    company: "Company A",
    name: "John Doe",
    email: "john@example.com",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "2",
    company: "Company B",
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
  },
];

// Mock services
jest.mock("@/services/clients", () => ({
  useClients: jest.fn(() => ({
    data: mockClients,
    isLoading: false,
  })),
}));

describe("ClientsPage", () => {
  it("should render loading skeleton when loading", () => {
    const { useClients } = require("@/services/clients");
    useClients.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ClientsPage />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should render clients list when data is loaded", () => {
    render(<ClientsPage />);

    // Check header
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check stats
    expect(screen.getByTestId("clients-big-stats")).toBeInTheDocument();

    // Check client cards
    const cards = screen.getAllByTestId("client-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Company: Company A");
    expect(cards[0]).toHaveTextContent("Name: John Doe");
    expect(cards[1]).toHaveTextContent("Company: Company B");
    expect(cards[1]).toHaveTextContent("Name: Jane Smith");
  });

  it("should filter clients by search term", () => {
    render(<ClientsPage />);

    // Search for a client
    const searchInput = screen.getByPlaceholderText("searchClients");
    fireEvent.change(searchInput, { target: { value: "Company A" } });

    // Check filtered results
    const cards = screen.getAllByTestId("client-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Company: Company A");
    expect(cards[0]).toHaveTextContent("Name: John Doe");
  });

  it("should show empty state when no clients", () => {
    const { useClients } = require("@/services/clients");
    useClients.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ClientsPage />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("noClientsFound")).toBeInTheDocument();
    expect(screen.getByText("createFirst")).toBeInTheDocument();
  });

  it("should show empty state with different message when no search results", () => {
    render(<ClientsPage />);

    // Search for non-existent client
    const searchInput = screen.getByPlaceholderText("searchClients");
    fireEvent.change(searchInput, { target: { value: "Non-existent" } });

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("noClientsFound")).toBeInTheDocument();
    expect(screen.getByText("tryAgain")).toBeInTheDocument();
  });

  it("should open add client modal", () => {
    render(<ClientsPage />);

    // Click add button
    const addButton = screen.getByText("addClient");
    fireEvent.click(addButton);

    // Check if modal is open
    expect(screen.getByTestId("client-form")).toBeInTheDocument();
  });

  it("should close modal after successful client addition", () => {
    render(<ClientsPage />);

    // Open modal
    const addButton = screen.getByText("addClient");
    fireEvent.click(addButton);

    // Submit form
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    // Check if modal is closed (form is not in the document)
    expect(screen.queryByTestId("client-form")).not.toBeInTheDocument();
  });
});
