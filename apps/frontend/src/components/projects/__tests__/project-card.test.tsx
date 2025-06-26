import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";

import { ProjectCard } from "../project-card";

import type { NextRouter } from "next/router";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockRouter: Pick<NextRouter, "push"> = {
  push: jest.fn(),
};

const mockProject = {
  id: "1",
  name: "Test Project",
  description: "Test Description",
  client: {
    id: "1",
    name: "Test Client",
    company: "Test Company",
    email: "test@example.com",
  },
  createdAt: new Date().toISOString(),
};

const mockOnDelete = jest.fn();

describe("ProjectCard Component", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
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
    expect(screen.getByText("Test Description")).toBeInTheDocument();
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
    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
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
