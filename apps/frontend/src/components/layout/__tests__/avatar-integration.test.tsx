import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { vi } from "vitest";
import { Topbar } from "../topbar";

// Mock next-auth
vi.mock("next-auth/react", async () => {
  const actual = await vi.importActual("next-auth/react");

  return {
    ...actual,
    useSession: vi.fn(),
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock safe hydration hook
vi.mock("../../hooks/use-safe-hydration", () => ({
  useSafeHydration: () => true,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={null}>{component}</SessionProvider>
    </QueryClientProvider>
  );
};

describe("Avatar Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle complete avatar fallback chain when user has Google image", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        image: "https://lh3.googleusercontent.com/a/default-user",
      },
      expires: "2024-01-01",
      accessToken: "mock-token",
    };

    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // Should render topbar with avatar
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    // Check if avatar image is present
    const avatarImage = screen.getByRole("img", { hidden: true });

    expect(avatarImage).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/a/default-user"
    );
  });

  it("should fallback to initials when user has no image", async () => {
    const mockSession = {
      user: {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
      expires: "2024-01-01",
      accessToken: "mock-token",
    };

    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // Should show initials as fallback
      expect(screen.getByText("JS")).toBeInTheDocument();
    });
  });

  it("should handle unauthenticated state gracefully", async () => {
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    // Should not render topbar when unauthenticated
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should handle loading state appropriately", async () => {
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    // Should render loading skeleton
    await waitFor(() => {
      const topbar = screen.getByRole("banner");

      expect(topbar).toBeInTheDocument();
    });
  });

  it("should generate proper gravatar URLs for emails", async () => {
    const mockSession = {
      user: {
        id: "3",
        name: "Test User",
        email: "test@example.com",
      },
      expires: "2024-01-01",
      accessToken: "mock-token",
    };

    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // Avatar should be rendered
      expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    });

    // Check that avatar has a Gravatar-like URL structure
    const avatarImage = screen.getByRole("img", { hidden: true });
    const src = avatarImage.getAttribute("src");

    expect(src).toMatch(/gravatar\.com\/avatar\/[a-f0-9]+/);
  });

  it("should display user information in dropdown menu", async () => {
    const mockSession = {
      user: {
        id: "4",
        name: "Full Name User",
        email: "fullname@example.com",
      },
      expires: "2024-01-01",
      accessToken: "mock-token",
    };

    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // User name should be displayed in dropdown
      expect(screen.getByText("Full Name User")).toBeInTheDocument();
      expect(screen.getByText("fullname@example.com")).toBeInTheDocument();
    });
  });

  it("should handle names with special characters for initials", async () => {
    const mockSession = {
      user: {
        id: "5",
        name: "José da Silva-Santos",
        email: "jose@example.com",
      },
      expires: "2024-01-01",
      accessToken: "mock-token",
    };

    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // Should generate initials from first and last meaningful parts
      expect(screen.getByText("JD")).toBeInTheDocument();
    });
  });
});
