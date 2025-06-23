import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { PageHeader } from "../page-header";
import { Settings, Plus } from "lucide-react";

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(<PageHeader title="Test Title" subtitle="Test description" />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("renders with icon when provided", () => {
    render(
      <PageHeader
        title="Settings"
        subtitle="Manage your settings"
        icon={Settings}
      />
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    // The icon is rendered as an SVG element with original size (h-8 w-8)
    const iconElement = document.querySelector("svg");
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveClass("h-8", "w-8", "text-primary");
  });

  it("renders without icon when not provided", () => {
    render(<PageHeader title="Simple Title" subtitle="Simple description" />);

    expect(screen.getByText("Simple Title")).toBeInTheDocument();
    // No icon should be present
    const iconElement = document.querySelector("svg");
    expect(iconElement).not.toBeInTheDocument();
  });

  it("renders action buttons with icons", () => {
    const mockAction = vi.fn();

    render(
      <PageHeader
        title="Test Title"
        actions={[
          {
            label: "Add Item",
            icon: Plus,
            onClick: mockAction,
          },
        ]}
      />
    );

    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PageHeader title="Test Title" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders children content", () => {
    render(
      <PageHeader title="Test Title">
        <div data-testid="custom-content">Custom Content</div>
      </PageHeader>
    );

    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });

  it("aligns title and description properly with icon", () => {
    render(
      <PageHeader
        title="Test Title"
        subtitle="Test description"
        icon={Settings}
      />
    );

    // Check that title and description are in the same container
    const titleElement = screen.getByText("Test Title");
    const descriptionElement = screen.getByText("Test description");

    // Both should be within the flex container that aligns them to the left
    expect(titleElement.closest("div")).toBe(descriptionElement.closest("div"));
  });
});
