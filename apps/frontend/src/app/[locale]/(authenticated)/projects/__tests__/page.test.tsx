import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

import "@testing-library/jest-dom";
import ProjectsPage from "../page";

import type { Client } from "@/services/clients";
import type { Project } from "@/services/projects";

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

// Mock components
jest.mock("@/components/projects/project-create-dialog", () => ({
  ProjectCreateDialog: ({
    onOpenChange,
    clientId,
    onSuccess,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    onSuccess: () => void;
  }) => (
    <div data-testid="project-create-dialog">
      <p>Client ID: {clientId}</p>
      <button onClick={() => onSuccess()}>Create</button>
      <button onClick={() => onOpenChange(false)}>Cancel</button>
    </div>
  ),
}));

jest.mock("@/components/projects/project-card", () => ({
  ProjectCard: ({
    project,
    onDelete,
    isDeleting,
  }: {
    project: Project;
    onDelete: (id: string) => void;
    isDeleting: boolean;
  }) => (
    <div data-testid="project-card">
      <p>Name: {project.name}</p>
      <p>Client: {project.client.company}</p>
      <p>Hours: {project._count.workHours}</p>
      <button
        onClick={() => onDelete(project.id)}
        disabled={isDeleting}
        data-testid="delete-button"
      >
        Delete
      </button>
    </div>
  ),
}));

jest.mock("@/components/projects/projects-big-stats", () => ({
  ProjectsBigStats: ({ selectedClientId }: { selectedClientId: string }) => (
    <div data-testid="projects-big-stats">
      <p>Stats for client: {selectedClientId}</p>
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

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Web App",
    description: "Company website",
    clientId: "client1",
    userId: "user1",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    client: mockClients[0],
    _count: {
      workHours: 40,
    },
  },
  {
    id: "2",
    name: "Mobile App",
    description: "iOS application",
    clientId: "client2",
    userId: "user1",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
    client: mockClients[1],
    _count: {
      workHours: 60,
    },
  },
];

// Mock services
jest.mock("@/services/projects", () => ({
  useProjects: jest.fn((clientId?: string) => ({
    data: clientId
      ? mockProjects.filter((p) => p.clientId === clientId)
      : mockProjects,
    isLoading: false,
  })),
  useDeleteProject: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
}));

jest.mock("@/services/clients", () => ({
  useClients: jest.fn(() => ({
    data: mockClients,
    isLoading: false,
  })),
}));

describe("ProjectsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.confirm
    window.confirm = jest.fn(() => true);
  });

  it("should render loading skeleton when loading", () => {
    const { useProjects } = require("@/services/projects");
    useProjects.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ProjectsPage />);
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should render projects list when data is loaded", () => {
    render(<ProjectsPage />);

    // Check header
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check stats
    expect(screen.getByTestId("projects-big-stats")).toBeInTheDocument();

    // Check project cards
    const cards = screen.getAllByTestId("project-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Name: Web App");
    expect(cards[0]).toHaveTextContent("Client: Company A");
    expect(cards[0]).toHaveTextContent("Hours: 40");
    expect(cards[1]).toHaveTextContent("Name: Mobile App");
    expect(cards[1]).toHaveTextContent("Client: Company B");
    expect(cards[1]).toHaveTextContent("Hours: 60");
  });

  it("should filter projects by client", () => {
    render(<ProjectsPage />);

    // Open client filter dropdown
    const filterTrigger = screen.getByRole("combobox");
    fireEvent.click(filterTrigger);

    // Select a specific client
    const clientOption = screen.getByText("Company A");
    fireEvent.click(clientOption);

    // Check if projects are filtered
    const cards = screen.getAllByTestId("project-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Name: Web App");
    expect(cards[0]).toHaveTextContent("Client: Company A");
    expect(cards[0]).toHaveTextContent("Hours: 40");
  });

  it("should show empty state when no projects", () => {
    const { useProjects } = require("@/services/projects");
    useProjects.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ProjectsPage />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("noProjectsFound")).toBeInTheDocument();
    expect(screen.getByText("createFirst")).toBeInTheDocument();
  });

  it("should show empty state with different message when no projects for selected client", () => {
    const { useProjects } = require("@/services/projects");
    useProjects.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ProjectsPage />);

    // Select a specific client
    const filterTrigger = screen.getByRole("combobox");
    fireEvent.click(filterTrigger);
    const clientOption = screen.getByText("Company A");
    fireEvent.click(clientOption);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("noProjectsFound")).toBeInTheDocument();
  });

  it("should open create project dialog", () => {
    render(<ProjectsPage />);

    // Click add button
    const addButton = screen.getByText("addProject");
    fireEvent.click(addButton);

    // Check if dialog is open
    expect(screen.getByTestId("project-create-dialog")).toBeInTheDocument();
    expect(
      screen.getByText(`Client ID: ${mockClients[0].id}`)
    ).toBeInTheDocument();
  });

  it("should close dialog after successful project creation", () => {
    render(<ProjectsPage />);

    // Open dialog
    const addButton = screen.getByText("addProject");
    fireEvent.click(addButton);

    // Submit form
    const createButton = screen.getByText("Create");
    fireEvent.click(createButton);

    // Check if dialog is closed
    expect(
      screen.queryByTestId("project-create-dialog")
    ).not.toBeInTheDocument();
  });

  it("should handle project deletion", async () => {
    const { useDeleteProject } = require("@/services/projects");
    const mockMutateAsync = jest.fn();
    useDeleteProject.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<ProjectsPage />);

    // Click delete button on first project
    const deleteButtons = screen.getAllByTestId("delete-button");
    fireEvent.click(deleteButtons[0]);

    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith("confirmDelete");

    // Check if delete mutation was called
    expect(mockMutateAsync).toHaveBeenCalledWith("1");
  });

  it("should not delete project if confirmation is cancelled", async () => {
    const { useDeleteProject } = require("@/services/projects");
    const mockMutateAsync = jest.fn();
    useDeleteProject.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<ProjectsPage />);

    // Click delete button on first project
    const deleteButtons = screen.getAllByTestId("delete-button");
    fireEvent.click(deleteButtons[0]);

    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith("confirmDelete");

    // Check that delete mutation was not called
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("should display correct project count", () => {
    render(<ProjectsPage />);

    expect(screen.getByText("2 projects")).toBeInTheDocument();

    // Filter by client
    const filterTrigger = screen.getByRole("combobox");
    fireEvent.click(filterTrigger);
    const clientOption = screen.getByText("Company A");
    fireEvent.click(clientOption);

    expect(screen.getByText("1 project")).toBeInTheDocument();
  });
});
