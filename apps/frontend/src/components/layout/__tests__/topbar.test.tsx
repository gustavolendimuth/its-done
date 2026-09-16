import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";

import { Topbar } from "../topbar";

import type { Session } from "next-auth";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/work-hours"),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock clients service
jest.mock("@/features/clients", () => ({
  useClients: jest.fn(() => ({ data: [] })),
}));

// Mock notifications
jest.mock("@/features/notifications", () => ({
  NotificationBell: () => null,
}));

// Mock the Gravatar health/profile queries (useAvatar depends on them, and
// this file doesn't wrap Topbar in a QueryClientProvider)
jest.mock("@/services/gravatar", () => ({
  ...jest.requireActual("@/services/gravatar"),
  useGravatarHealth: () => ({ data: true, isLoading: false }),
  useGravatarProfile: () => ({ data: null, isLoading: false }),
}));

jest.mock("@/services/network-status", () => ({
  useShouldSkipExternalServices: () => ({
    skipGravatar: false,
    isOffline: false,
  }),
}));

describe("Topbar", () => {
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
  });

  it("should render user name when session is authenticated", async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Topbar />);

    // The user's name is shown in the dropdown menu, not the collapsed bar.
    // mockSession has no image, so useAvatar falls back to a generated
    // DiceBear avatar.
    const avatarButton = screen.getByRole("button", { name: "@John Doe" });

    await userEvent.click(avatarButton);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render add hours button when authenticated", () => {
    // Mock authenticated session
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/avatar.jpg",
        },
      },
    });

    render(<Topbar />);

    // Check if add hours button is rendered
    const addHoursButton = screen.getByText("addHours");

    expect(addHoursButton).toBeInTheDocument();
  });

  it("should not render add hours button when not authenticated", () => {
    // Mock unauthenticated session
    (useSession as any).mockReturnValue({
      data: null,
    });

    render(<Topbar />);

    // Check if add hours button is not rendered
    const addHoursButton = screen.queryByText("addHours");

    expect(addHoursButton).not.toBeInTheDocument();
  });

  it("should open add hours modal when clicking the button", () => {
    // Mock authenticated session
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/avatar.jpg",
        },
      },
    });

    render(<Topbar />);

    // Click add hours button
    const addHoursButton = screen.getByText("addHours");

    fireEvent.click(addHoursButton);

    // Check if modal is opened
    expect(screen.getByText("addHoursFormSubtitle")).toBeInTheDocument();
  });

  it("should close add hours modal when clicking outside", () => {
    // Mock authenticated session
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/avatar.jpg",
        },
      },
    });

    render(<Topbar />);

    // Open modal
    const addHoursButton = screen.getByText("addHours");

    fireEvent.click(addHoursButton);

    // Check if modal is opened
    expect(screen.getByText("addHoursFormSubtitle")).toBeInTheDocument();

    // Close the modal (Radix Dialog closes on Escape)
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    // Check if modal is closed
    expect(screen.queryByText("addHoursFormSubtitle")).not.toBeInTheDocument();
  });

  it("should display user information in dropdown menu", async () => {
    // Mock authenticated session
    const mockUser = {
      name: "John Doe",
      email: "john@example.com",
      image: "https://example.com/avatar.jpg",
    };

    (useSession as any).mockReturnValue({
      data: { user: mockUser },
    });

    render(<Topbar />);

    // Click on avatar to open dropdown
    const avatar = screen.getByRole("button", { name: "@John Doe" });

    await userEvent.click(avatar);

    // Check if user information is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should display only email if name is not available", async () => {
    // Mock authenticated session without name
    const mockUser = {
      email: "john@example.com",
      image: "https://example.com/avatar.jpg",
    };

    (useSession as any).mockReturnValue({
      data: { user: mockUser },
    });

    render(<Topbar />);

    // Click on avatar to open dropdown
    const avatar = screen.getByRole("button", { name: "@john@example.com" });

    await userEvent.click(avatar);

    // Check if only email is displayed
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });
});
