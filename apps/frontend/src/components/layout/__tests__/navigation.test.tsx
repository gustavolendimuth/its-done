import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { Navigation } from "../main-layout";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
}));

// Mock use-safe-hydration hook
jest.mock("@/hooks/use-safe-hydration", () => ({
  useSafeHydration: jest.fn(() => true),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Navigation", () => {
  const mockUserSession = {
    user: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
    },
    expires: new Date().toISOString(),
  };

  const mockAdminSession = {
    user: {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/work-hours");
  });

  it("should render all navigation items for regular user", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Check if all regular navigation items are rendered
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.getByText("projects")).toBeInTheDocument();
    expect(screen.getByText("invoices")).toBeInTheDocument();
    expect(screen.getByText("analytics")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("should render admin navigation item for admin user", () => {
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Check if admin navigation item is rendered
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("should not render admin navigation item for regular user", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Check if admin navigation item is not rendered
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  it("should render dashboard section header", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Check if dashboard section header is rendered
    expect(screen.getByText("DASHBOARDS")).toBeInTheDocument();
  });

  it("should render navigation items with correct href attributes", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Check if navigation items have correct href attributes
    const workHoursLink = screen.getByRole("link", { name: /workHours/i });
    const clientsLink = screen.getByRole("link", { name: /clients/i });
    const settingsLink = screen.getByRole("link", { name: /settings/i });

    expect(workHoursLink).toHaveAttribute("href", "/work-hours");
    expect(clientsLink).toHaveAttribute("href", "/clients");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("should handle no session gracefully", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    render(<Navigation />);

    // Should still render navigation items
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });
});
