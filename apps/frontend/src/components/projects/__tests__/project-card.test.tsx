import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ProjectCard } from "../project-card";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
};

const mockProject = {
  id: "1",
  name: "Test Project",
  description: "This is a test project description",
  createdAt: "2023-12-01T00:00:00.000Z",
  clientId: "client-1",
  client: {
    company: "Test Company",
  },
  _count: {
    workHours: 5,
  },
};

const mockOnDelete = vi.fn();

describe("ProjectCard Component", () => {
  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    vi.clearAllMocks();
  });

  test("renders project information correctly", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test project description")
    ).toBeInTheDocument();
    expect(screen.getByText("5 entries")).toBeInTheDocument();
  });

  test("renders project without description", () => {
    const projectWithoutDescription = {
      ...mockProject,
      description: undefined,
    };

    render(
      <ProjectCard
        project={projectWithoutDescription}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a test project description")
    ).not.toBeInTheDocument();
  });

  test("has correct visual styling", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check for indigo accent bar and icon styling
    const accentBar = document.querySelector(".bg-indigo-500");

    expect(accentBar).toBeInTheDocument();

    // Check for hover effects
    const cardGroup = document.querySelector(".group");

    expect(cardGroup).toHaveClass("hover:scale-[1.02]");
  });

  test("handles client navigation correctly", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    const clientButton = screen.getByRole("button", { name: /client/i });

    fireEvent.click(clientButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/clients/client-1");
  });

  test("displays all action buttons", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    expect(screen.getByRole("button", { name: /client/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  test("disables delete button when deleting", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });

    expect(deleteButton).toBeDisabled();
  });

  test("shows correct stats information", () => {
    render(
      <ProjectCard
        project={mockProject}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check stats labels
    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
