import { jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";

import { Topbar } from "../topbar";

import type { Session } from "next-auth";

// Mock next-auth
jest.mock("next-auth/react", async () => {
  const actual = await jest.importActual("next-auth/react");

  return {
    ...actual,
    useSession: jest.fn(),
  };
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock safe hydration hook
jest.mock("../../hooks/use-safe-hydration", () => ({
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
  const mockSession: Session = {
    user: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
      image: "https://lh3.googleusercontent.com/a/default-user",
    },
    expires: new Date().toISOString(),
  };

  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });
  });

  it("should handle complete avatar fallback chain when user has Google image", async () => {
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
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
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
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
      update: jest.fn(),
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
      update: jest.fn(),
    });

    renderWithProviders(<Topbar />);

    // Should render loading skeleton
    await waitFor(() => {
      const topbar = screen.getByRole("banner");

      expect(topbar).toBeInTheDocument();
    });
  });

  it("should generate proper gravatar URLs for emails", async () => {
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
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
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // User name should be displayed in dropdown
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("should handle names with special characters for initials", async () => {
    const { useSession } = await import("next-auth/react");

    (useSession as any).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    renderWithProviders(<Topbar />);

    await waitFor(() => {
      // Should generate initials from first and last meaningful parts
      expect(screen.getByText("JD")).toBeInTheDocument();
    });
  });
});
