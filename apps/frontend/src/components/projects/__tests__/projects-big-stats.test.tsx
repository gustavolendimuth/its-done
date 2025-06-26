import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import { ProjectsBigStats } from "../projects-big-stats";

import type { Client } from "@/services/clients";
import type { Project } from "@/services/projects";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock data
const mockClient1: Client = {
  id: "client1",
  name: "John Doe",
  company: "Company A",
  email: "john@example.com",
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
};

const mockClient2: Client = {
  id: "client2",
  name: "Jane Smith",
  company: "Company B",
  email: "jane@example.com",
  createdAt: "2024-03-02T00:00:00Z",
  updatedAt: "2024-03-02T00:00:00Z",
};

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Project A",
    description: "Description A",
    clientId: "client1",
    userId: "user1",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    client: {
      id: mockClient1.id,
      name: mockClient1.name,
      company: mockClient1.company,
      email: mockClient1.email,
    },
    _count: {
      workHours: 40,
    },
  },
  {
    id: "2",
    name: "Project B",
    description: "Description B",
    clientId: "client2",
    userId: "user1",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
    client: {
      id: mockClient2.id,
      name: mockClient2.name,
      company: mockClient2.company,
      email: mockClient2.email,
    },
    _count: {
      workHours: 60,
    },
  },
  {
    id: "3",
    name: "Project C",
    description: "Description C",
    clientId: "client1",
    userId: "user1",
    createdAt: "2024-03-03T00:00:00Z",
    updatedAt: "2024-03-03T00:00:00Z",
    client: {
      id: mockClient1.id,
      name: mockClient1.name,
      company: mockClient1.company,
      email: mockClient1.email,
    },
    _count: {
      workHours: 0,
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
}));

describe("ProjectsBigStats", () => {
  it("renders correctly with all projects", () => {
    render(<ProjectsBigStats />);

    // Check main stats
    expect(screen.getByText("3")).toBeInTheDocument(); // Total projects
    expect(screen.getByText(/100 totalWorkHours/)).toBeInTheDocument(); // Total work hours
    expect(screen.getByText(/2 clientsInvolved/)).toBeInTheDocument(); // Unique clients

    // Check average hours per project
    expect(screen.getByText("33.3")).toBeInTheDocument(); // 100 hours / 3 projects

    // Check utilization rate
    expect(screen.getByText("67%")).toBeInTheDocument(); // 2 projects with work / 3 total projects

    // Check project focus
    expect(screen.getByText("focusDeepClientWork")).toBeInTheDocument(); // 2 projects for client1, 1 for client2
  });

  it("renders correctly with filtered projects by client", () => {
    render(<ProjectsBigStats selectedClientId="client1" />);

    // Check main stats for client1's projects
    expect(screen.getByText("2")).toBeInTheDocument(); // Total projects for client1
    expect(screen.getByText(/40 totalWorkHours/)).toBeInTheDocument(); // Total work hours for client1
    expect(screen.getByText(/1 clientsInvolved/)).toBeInTheDocument(); // Single client

    // Check average hours per project
    expect(screen.getByText("20.0")).toBeInTheDocument(); // 40 hours / 2 projects

    // Check utilization rate
    expect(screen.getByText("50%")).toBeInTheDocument(); // 1 project with work / 2 total projects

    // Check project focus
    expect(screen.getByText("focusDeepClientWork")).toBeInTheDocument();
  });

  it("shows correct portfolio health status", () => {
    const { rerender } = render(<ProjectsBigStats />);

    // Initial state (3 projects, 67% utilization)
    expect(screen.getByText("portfolioHealthGrowing")).toBeInTheDocument();

    // Mock more projects for excellent status
    const manyProjects = Array.from({ length: 15 }, (_, i) => ({
      ...mockProjects[0],
      id: `project${i}`,
      _count: { workHours: 40 },
    }));

    jest.mock("@/services/projects", () => ({
      useProjects: () => ({
        data: manyProjects,
        isLoading: false,
      }),
    }));

    rerender(<ProjectsBigStats />);
    expect(screen.getByText("portfolioHealthExcellent")).toBeInTheDocument();
  });

  it("handles empty projects list", () => {
    jest.mock("@/services/projects", () => ({
      useProjects: () => ({
        data: [],
        isLoading: false,
      }),
    }));

    render(<ProjectsBigStats />);

    expect(screen.getByText("0")).toBeInTheDocument(); // Total projects
    expect(screen.getByText(/0 totalWorkHours/)).toBeInTheDocument();
    expect(screen.getByText(/0 clientsInvolved/)).toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument(); // Average hours
    expect(screen.getByText("0%")).toBeInTheDocument(); // Utilization rate
    expect(screen.getByText("focusNoFocus")).toBeInTheDocument();
    expect(screen.getByText("portfolioHealthStarting")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<ProjectsBigStats isRefetching={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays correct project portfolio goal message", () => {
    const { rerender } = render(<ProjectsBigStats />);

    // With 3 projects
    expect(screen.getByText("createMoreProjects")).toBeInTheDocument();

    // Mock more projects
    const moreProjects = Array.from({ length: 8 }, (_, i) => ({
      ...mockProjects[0],
      id: `project${i}`,
    }));

    jest.mock("@/services/projects", () => ({
      useProjects: () => ({
        data: moreProjects,
        isLoading: false,
      }),
    }));

    rerender(<ProjectsBigStats />);
    expect(screen.getByText("goodProjectPortfolio")).toBeInTheDocument();

    // Mock even more projects
    const manyProjects = Array.from({ length: 15 }, (_, i) => ({
      ...mockProjects[0],
      id: `project${i}`,
    }));

    jest.mock("@/services/projects", () => ({
      useProjects: () => ({
        data: manyProjects,
        isLoading: false,
      }),
    }));

    rerender(<ProjectsBigStats />);
    expect(screen.getByText("excellentPortfolio")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ProjectsBigStats className="custom-class" />);

    expect(screen.getByTestId("big-stats-display")).toHaveClass("custom-class");
  });
});
