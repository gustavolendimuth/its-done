import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

import { WorkHourCard } from "../work-hour-card";

import type { WorkHourCardProps } from "../work-hour-card";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, format: string) => "01/01/2024"),
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatTimeAgo: jest.fn(() => "2 days ago"),
}));

describe("WorkHourCard", () => {
  const mockWorkHour: WorkHourCardProps["workHour"] = {
    id: "1",
    date: "2024-01-01T00:00:00Z",
    description: "Test description",
    hours: 8.5,
    client: {
      id: "client1",
      name: "John Doe",
      company: "Test Company",
      email: "john@example.com",
    },
    project: {
      id: "project1",
      name: "Test Project",
    },
    createdAt: "2024-01-01T00:00:00Z",
  };

  const defaultProps: WorkHourCardProps = {
    workHour: mockWorkHour,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    isDeleting: false,
  };

  it("should render work hour details correctly", () => {
    render(<WorkHourCard {...defaultProps} />);

    // Check hours and date
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText("on 01/01/2024")).toBeInTheDocument();

    // Check client and project info
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();

    // Check description
    expect(screen.getByText('"Test description"')).toBeInTheDocument();

    // Check created date
    expect(screen.getByText("created 01/01/2024")).toBeInTheDocument();
  });

  it("should render without client information", () => {
    const props: WorkHourCardProps = {
      ...defaultProps,
      workHour: {
        ...mockWorkHour,
        client: undefined,
      },
    };

    render(<WorkHourCard {...props} />);

    expect(screen.getByText("noClient")).toBeInTheDocument();
  });

  it("should render without project information", () => {
    const props: WorkHourCardProps = {
      ...defaultProps,
      workHour: {
        ...mockWorkHour,
        project: undefined,
      },
    };

    render(<WorkHourCard {...props} />);

    expect(screen.queryByText("Test Project")).not.toBeInTheDocument();
  });

  it("should render without description", () => {
    const props: WorkHourCardProps = {
      ...defaultProps,
      workHour: {
        ...mockWorkHour,
        description: undefined,
      },
    };

    render(<WorkHourCard {...props} />);

    expect(screen.queryByText('"Test description"')).not.toBeInTheDocument();
  });

  it("should handle edit button click", () => {
    const onEdit = jest.fn();
    render(<WorkHourCard {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByText("edit");
    userEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith("1");
  });

  it("should handle delete button click", () => {
    const onDelete = jest.fn();
    render(<WorkHourCard {...defaultProps} onDelete={onDelete} />);

    // Open delete dialog
    const deleteButton = screen.getByText("delete");
    userEvent.click(deleteButton);

    // Check dialog content
    expect(screen.getByText("deleteWorkHourTitle")).toBeInTheDocument();
    expect(screen.getByText("deleteWorkHourDescription")).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByText("deleteEntry");
    userEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("should handle delete cancellation", () => {
    const onDelete = jest.fn();
    render(<WorkHourCard {...defaultProps} onDelete={onDelete} />);

    // Open delete dialog
    const deleteButton = screen.getByText("delete");
    userEvent.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByText("cancel");
    userEvent.click(cancelButton);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("should show deleting state", () => {
    render(<WorkHourCard {...defaultProps} isDeleting={true} />);

    expect(screen.getByText("deleting")).toBeInTheDocument();
    expect(screen.getByText("deleting")).toBeDisabled();
  });

  it("should format hours correctly", () => {
    const testCases = [
      { hours: 8, expected: "08:00" },
      { hours: 8.5, expected: "08:30" },
      { hours: 8.25, expected: "08:15" },
      { hours: 8.75, expected: "08:45" },
      { hours: 0.5, expected: "00:30" },
    ];

    testCases.forEach(({ hours, expected }) => {
      const props: WorkHourCardProps = {
        ...defaultProps,
        workHour: {
          ...mockWorkHour,
          hours,
        },
      };

      const { rerender } = render(<WorkHourCard {...props} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<></>);
    });
  });

  it("should display client name with company when both are available", () => {
    render(<WorkHourCard {...defaultProps} />);

    const deleteButton = screen.getByText("delete");
    userEvent.click(deleteButton);

    expect(screen.getByText("deleteWorkHourDescription")).toBeInTheDocument();
    expect(screen.getByText(/Test Company \(John Doe\)/)).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<WorkHourCard {...defaultProps} className="custom-class" />);

    const card = screen.getByRole("article");
    expect(card).toHaveClass("custom-class");
  });
});
