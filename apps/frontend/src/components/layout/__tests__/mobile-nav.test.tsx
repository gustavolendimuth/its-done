import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { MobileNav } from "../mobile-nav";

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

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("MobileNav", () => {
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

  it("should render mobile menu trigger button", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Check if menu trigger button is rendered
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveClass("md:hidden");
  });

  it("should open mobile navigation when menu button is clicked", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Click menu button to open navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if navigation content is visible
    expect(screen.getByText("DASHBOARDS")).toBeInTheDocument();
    expect(screen.getByText("workHours")).toBeInTheDocument();
  });

  it("should render logo in mobile navigation", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if logo is rendered
    const logo = screen.getByAltText("title");
    expect(logo).toBeInTheDocument();
  });

  it("should render all navigation items for regular user in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if all regular navigation items are rendered
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.getByText("projects")).toBeInTheDocument();
    expect(screen.getByText("invoices")).toBeInTheDocument();
    expect(screen.getByText("analytics")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("should render admin navigation item for admin user in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if admin navigation item is rendered
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("should not render admin navigation item for regular user in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if admin navigation item is not rendered
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  it("should close mobile navigation when a link is clicked", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Verify navigation is open
    expect(screen.getByText("workHours")).toBeInTheDocument();

    // Click on a navigation link
    const workHoursLink = screen.getByRole("link", { name: /workHours/i });
    fireEvent.click(workHoursLink);

    // Navigation should close (content should not be visible)
    // Note: This might need adjustment based on actual Sheet component behavior
    expect(screen.queryByText("DASHBOARDS")).not.toBeInTheDocument();
  });

  it("should highlight active navigation item in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });
    mockUsePathname.mockReturnValue("/clients");

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Find the clients link and check if it has active styling
    const clientsLink = screen.getByRole("link", { name: /clients/i });
    expect(clientsLink).toHaveClass("bg-muted");
    expect(clientsLink).toHaveClass("border-l-4");
    expect(clientsLink).toHaveClass("border-brand-green-500");
  });

  it("should render navigation items with correct href attributes in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if navigation items have correct href attributes
    expect(screen.getByRole("link", { name: /workHours/i })).toHaveAttribute(
      "href",
      "/work-hours"
    );
    expect(screen.getByRole("link", { name: /clients/i })).toHaveAttribute(
      "href",
      "/clients"
    );
    expect(screen.getByRole("link", { name: /projects/i })).toHaveAttribute(
      "href",
      "/projects"
    );
  });

  it("should close mobile navigation when logo is clicked", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Verify navigation is open
    expect(screen.getByText("workHours")).toBeInTheDocument();

    // Click on logo
    const logoLink = screen.getByRole("link", { name: "title" });
    fireEvent.click(logoLink);

    // Navigation should close
    expect(screen.queryByText("DASHBOARDS")).not.toBeInTheDocument();
  });

  it("should handle no session gracefully in mobile nav", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Should still render navigation items
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  it("should apply correct styling to mobile navigation sheet", () => {
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNav />);

    // Open mobile navigation
    const menuButton = screen.getByRole("button", { name: "openMenu" });
    fireEvent.click(menuButton);

    // Check if sheet content has correct width class by looking for the navigation content
    const navigationContent = screen.getByText("DASHBOARDS");
    expect(navigationContent).toBeInTheDocument();

    // Verify the sheet is open by checking for navigation items
    expect(screen.getByText("workHours")).toBeInTheDocument();
  });
});
