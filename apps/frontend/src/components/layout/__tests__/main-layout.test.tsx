import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

import { MainLayout } from "../main-layout";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/work-hours"),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock use-safe-hydration hook
jest.mock("@/hooks/use-safe-hydration", () => ({
  useSafeHydration: jest.fn(() => true),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock MobileNav component
jest.mock("../mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile Navigation</div>,
}));

// Mock Topbar component
jest.mock("../topbar", () => ({
  Topbar: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="topbar">
      Topbar
      {children}
    </div>
  ),
}));

describe("MainLayout", () => {
  const mockSession: Session = {
    user: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
  });

  it("should render main layout structure", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if main structure elements are rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();
  });

  it("should render desktop sidebar with navigation", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if desktop sidebar is rendered
    const sidebar = document.querySelector("aside");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass("hidden", "md:flex");
    expect(sidebar).toHaveClass("w-64");

    // Check if navigation items are rendered in sidebar
    expect(screen.getByText("workHours")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.getByText("projects")).toBeInTheDocument();
  });

  it("should render logo in desktop sidebar", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if logo is rendered in sidebar
    const logoImage = screen.getByAltText("title");
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute("src", "/logo.svg");
  });

  it("should apply correct layout classes", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check main container classes
    const mainContainer = document.querySelector(".min-h-screen.flex");
    expect(mainContainer).toHaveClass("bg-background", "text-foreground");

    // Check sidebar positioning classes
    const sidebar = document.querySelector("aside");
    expect(sidebar).toHaveClass("fixed", "left-0", "top-0", "z-40");

    // Check main content area classes
    const mainContentArea = document.querySelector(".flex-1.flex.flex-col");
    expect(mainContentArea).toHaveClass("md:ml-64");
  });

  it("should render main content with correct padding", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check main content padding classes
    const mainContent = document.querySelector("main");
    expect(mainContent).toHaveClass(
      "bg-background",
      "px-4",
      "py-8",
      "md:px-10",
      "md:py-10"
    );

    // Check max-width container
    const container = document.querySelector(".max-w-7xl.mx-auto");
    expect(container).toBeInTheDocument();
    expect(container).toContainElement(screen.getByText("Test Content"));
  });

  it("should integrate mobile navigation in topbar", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if mobile navigation is passed as children to topbar
    const topbar = screen.getByTestId("topbar");
    expect(topbar).toContainElement(screen.getByTestId("mobile-nav"));
  });

  it("should render dashboard section header in sidebar", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if dashboard section header is rendered
    expect(screen.getByText("DASHBOARDS")).toBeInTheDocument();
  });

  it("should render navigation items with correct href attributes", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if navigation items have correct href attributes
    expect(screen.getByRole("link", { name: /workHours/i })).toHaveAttribute(
      "href",
      "/work-hours"
    );
    expect(screen.getByRole("link", { name: /clients/i })).toHaveAttribute(
      "href",
      "/clients"
    );
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("should apply correct responsive behavior", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Desktop sidebar should be hidden on mobile
    const sidebar = document.querySelector("aside");
    expect(sidebar).toHaveClass("hidden", "md:flex");

    // Main content should have responsive margin
    const mainContentArea = document.querySelector(".flex-1.flex.flex-col");
    expect(mainContentArea).toHaveClass("md:ml-64");
  });

  it("should render with admin navigation for admin users", () => {
    const mockAdminSession: Session = {
      user: {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
      },
      expires: new Date().toISOString(),
    };

    (useSession as jest.Mock).mockReturnValue({
      data: mockAdminSession,
      status: "authenticated",
    });

    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if admin navigation item is rendered
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("should not render admin navigation for regular users", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if admin navigation item is not rendered for regular users
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  it("should render logo with correct link to home", () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if logo link points to home
    const logoLink = screen.getByRole("link", { name: "title" });
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
