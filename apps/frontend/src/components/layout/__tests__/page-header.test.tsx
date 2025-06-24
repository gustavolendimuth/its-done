import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "../page-header";
import { Settings, Plus } from "lucide-react";
import { Topbar } from "../topbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

describe("Topbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render add hours shortcut button when authenticated", () => {
    // Mock authenticated session
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    render(<Topbar />);

    // Find the add hours button by its title
    const addHoursButton = screen.getByTitle("addHours");

    expect(addHoursButton).toBeInTheDocument();
  });

  it("should navigate to work hours page when clicking the shortcut button", () => {
    // Mock authenticated session
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    const mockRouter = { push: vi.fn() };

    (useRouter as any).mockReturnValue(mockRouter);

    render(<Topbar />);

    // Click the add hours button
    const addHoursButton = screen.getByTitle("addHours");

    fireEvent.click(addHoursButton);

    // Verify navigation
    expect(mockRouter.push).toHaveBeenCalledWith("/work-hours");
  });

  it("should not render add hours button when not authenticated", () => {
    // Mock unauthenticated session
    (useSession as any).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<Topbar />);

    // Button should not be present
    const addHoursButton = screen.queryByTitle("addHours");

    expect(addHoursButton).not.toBeInTheDocument();
  });
});
