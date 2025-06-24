import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkHourCard } from "../work-hour-card";

const mockWorkHour = {
  id: "work-hour-1",
  date: "2024-01-15T10:00:00Z",
  description: "Frontend development work",
  hours: 8.5,
  client: {
    id: "client-1",
    name: "John Doe",
    company: "Acme Corp",
    email: "john@acme.com",
  },
  project: {
    id: "project-1",
    name: "Website Redesign",
  },
  createdAt: "2024-01-15T09:00:00Z",
};

const mockWorkHourWithoutProject = {
  id: "work-hour-2",
  date: "2024-01-16T10:00:00Z",
  description: "General consulting work",
  hours: 4.0,
  client: {
    id: "client-2",
    company: "Tech Solutions",
    email: "contact@techsol.com",
  },
  createdAt: "2024-01-16T09:00:00Z",
};

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

describe("WorkHourCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders work hour information correctly", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check if hours are displayed
    expect(screen.getByText("08:30")).toBeInTheDocument();

    // Check if client company is displayed (highlighted)
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    // Check if description is displayed
    expect(screen.getByText('"Frontend development work"')).toBeInTheDocument();

    // Check if project is displayed
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();

    // Check if worked badge is displayed
    expect(screen.getByText("over 1 year")).toBeInTheDocument();
  });

  test("renders work hour without project correctly", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHourWithoutProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check if hours are displayed
    expect(screen.getByText("04:00")).toBeInTheDocument();

    // Check if client information is displayed (only once in new layout)
    expect(screen.getByText("Tech Solutions")).toBeInTheDocument();

    // Project section should not be rendered when no project exists
    expect(screen.queryByText("Website Redesign")).not.toBeInTheDocument();
  });

  test("has correct visual styling with green theme", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check for green accent bar and icon styling
    const accentBar = document.querySelector(".bg-green-500");

    expect(accentBar).toBeInTheDocument();

    // Check for hover effects
    const cardGroup = document.querySelector(".group");

    expect(cardGroup).toHaveClass("hover:scale-[1.02]");
  });

  test("calls onEdit when edit button is clicked", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });

    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith("work-hour-1");
  });

  test("displays all action buttons", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  test("disables delete button when deleting", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /deleting.../i });

    expect(deleteButton).toBeDisabled();
  });

  test("shows correct information in new integrated layout", () => {
    render(
      <WorkHourCard
        workHour={mockWorkHour}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Check company name is highlighted
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    // Check project name is displayed with icon
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();

    // Check worked time badge is present
    expect(screen.getByText("over 1 year")).toBeInTheDocument();
  });

  test("handles work hour without description", () => {
    const workHourWithoutDescription = {
      ...mockWorkHour,
      description: "",
    };

    render(
      <WorkHourCard
        workHour={workHourWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Description section should not be rendered when empty
    expect(screen.queryByText('""')).not.toBeInTheDocument();
  });
});
