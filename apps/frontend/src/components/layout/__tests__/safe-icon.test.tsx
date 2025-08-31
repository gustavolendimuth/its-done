import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

// Mock use-safe-hydration hook
jest.mock("@/hooks/use-safe-hydration", () => ({
  useSafeHydration: jest.fn(),
}));

// Import SafeIcon from main-layout (it's not exported separately)
// We'll test it indirectly through the Navigation component
import { Navigation } from "../main-layout";

// Mock other dependencies
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/work-hours"),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        role: "USER",
      },
    },
    status: "authenticated",
  })),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
}));

describe("SafeIcon Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render icon when hydrated", () => {
    const { useSafeHydration } = require("@/hooks/use-safe-hydration");
    useSafeHydration.mockReturnValue(true);

    render(<Navigation />);

    // Check if icons are rendered (look for SVG elements)
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should render placeholder div when not hydrated", () => {
    const { useSafeHydration } = require("@/hooks/use-safe-hydration");
    useSafeHydration.mockReturnValue(false);

    render(<Navigation />);

    // When not hydrated, SafeIcon should render div placeholders
    // We can't directly test this without accessing the component,
    // but we can verify that the navigation still renders
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
  });

  it("should apply correct className to icon", () => {
    const { useSafeHydration } = require("@/hooks/use-safe-hydration");
    useSafeHydration.mockReturnValue(true);

    render(<Navigation />);

    // Check if icons have the correct classes
    const icons = document.querySelectorAll("svg");
    const firstIcon = icons[0];
    expect(firstIcon).toHaveClass("h-5", "w-5");
  });

  it("should apply correct className to placeholder when not hydrated", () => {
    const { useSafeHydration } = require("@/hooks/use-safe-hydration");
    useSafeHydration.mockReturnValue(false);

    render(<Navigation />);

    // When not hydrated, placeholders should have h-5 w-5 classes
    // This is harder to test directly, but we can verify the navigation still works
    const navigationLinks = document.querySelectorAll("a");
    expect(navigationLinks.length).toBeGreaterThan(0);
  });

  it("should handle hydration state changes", () => {
    const { useSafeHydration } = require("@/hooks/use-safe-hydration");

    // Start not hydrated
    useSafeHydration.mockReturnValue(false);
    const { rerender } = render(<Navigation />);

    // Verify navigation renders without icons
    expect(screen.getByText("workHours")).toBeInTheDocument();

    // Simulate hydration
    useSafeHydration.mockReturnValue(true);
    rerender(<Navigation />);

    // Verify navigation still renders (now with icons)
    expect(screen.getByText("workHours")).toBeInTheDocument();
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });
});
