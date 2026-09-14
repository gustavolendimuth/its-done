import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider, useSession } from "next-auth/react";

import { Topbar } from "../topbar";

import type { Session } from "next-auth";

// Mock next-auth
jest.mock("next-auth/react", () => {
  const actual = jest.requireActual("next-auth/react");

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
  usePathname: () => "/work-hours",
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock safe hydration hook
jest.mock("../../../hooks/use-safe-hydration", () => ({
  useSafeHydration: () => true,
}));

// Mock clients service (Topbar fetches clients for the work hour form)
jest.mock("@/features/clients", () => ({
  useClients: () => ({ data: [] }),
}));

// Mock notifications (avoids an unmocked network call for the unread count)
jest.mock("@/features/notifications", () => ({
  NotificationBell: () => null,
}));

// Mock the Gravatar health/profile queries (network calls); keep the real
// URL/hash generators so the avatar fallback chain behaves realistically.
jest.mock("@/services/gravatar", () => ({
  ...jest.requireActual("@/services/gravatar"),
  useGravatarHealth: () => ({ data: true, isLoading: false }),
  useGravatarProfile: () => ({ data: null, isLoading: false }),
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

// The default global.Image (from src/test/setup.ts) always reports a
// successful load, so Radix always mounts a real <img>. Tests that need to
// see the text fallback instead (no successful image) swap this in.
class AlwaysFailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, callback: () => void) {
    (this.listeners[type] ??= []).push(callback);
  }

  removeEventListener(type: string, callback: () => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (listener) => listener !== callback
    );
  }

  set src(_value: string) {
    this.onerror?.();
    this.listeners.error?.forEach((callback) => callback());
  }
}

describe("Avatar Integration Tests", () => {
  const DefaultImage = global.Image;

  afterEach(() => {
    global.Image = DefaultImage;
  });

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
      expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
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

    // No Google image, and the generated fallback URLs (DiceBear, etc.) all
    // fail to load, so the text fallback shows.
    global.Image = AlwaysFailingImage as unknown as typeof Image;

    (useSession as any).mockReturnValue({
      data: {
        user: { ...mockSession.user, name: "Jane Smith", image: undefined },
        expires: mockSession.expires,
      },
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

    // Session-gated content (avatar, add hours) should not render when
    // unauthenticated; ModeToggle/LanguageSwitcher still do.
    expect(
      screen.queryByRole("button", { name: /add hours/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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

    // Simulate the primary (Google) image failing to load, advancing to the
    // next fallback in the chain: Gravatar
    fireEvent.error(screen.getByRole("img", { hidden: true }));

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

    const avatarButton = await screen.findByRole("button", {
      name: "@John Doe",
    });

    await userEvent.click(avatarButton);

    // User name should be displayed in dropdown
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should handle names with special characters for initials", async () => {
    const { useSession } = await import("next-auth/react");

    // No image, and the generated fallback URLs all fail to load, so
    // initials render as the visible fallback
    global.Image = AlwaysFailingImage as unknown as typeof Image;

    (useSession as any).mockReturnValue({
      data: {
        user: {
          ...mockSession.user,
          name: "John D'Oe-Smith",
          image: undefined,
        },
        expires: mockSession.expires,
      },
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
