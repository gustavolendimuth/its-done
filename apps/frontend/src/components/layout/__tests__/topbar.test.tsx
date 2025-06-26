import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";

import { Topbar } from "../topbar";

import type { Session } from "next-auth";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock clients service
jest.mock("@/services/clients", () => ({
  useClients: jest.fn(() => ({ data: [] })),
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

  it("should render user name when session is authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(<Topbar />);

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
    const addHoursButton = screen.getByText("workHours.addHours");

    expect(addHoursButton).toBeInTheDocument();
  });

  it("should not render add hours button when not authenticated", () => {
    // Mock unauthenticated session
    (useSession as any).mockReturnValue({
      data: null,
    });

    render(<Topbar />);

    // Check if add hours button is not rendered
    const addHoursButton = screen.queryByText("workHours.addHours");

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
    const addHoursButton = screen.getByText("workHours.addHours");

    fireEvent.click(addHoursButton);

    // Check if modal is opened
    expect(
      screen.getByText("workHours.addHoursFormSubtitle")
    ).toBeInTheDocument();
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
    const addHoursButton = screen.getByText("workHours.addHours");

    fireEvent.click(addHoursButton);

    // Check if modal is opened
    expect(
      screen.getByText("workHours.addHoursFormSubtitle")
    ).toBeInTheDocument();

    // Click outside modal (dialog overlay)
    const dialogOverlay = document.querySelector(
      "[data-testid=dialog-overlay]"
    );

    if (dialogOverlay) {
      fireEvent.click(dialogOverlay);
    }

    // Check if modal is closed
    expect(
      screen.queryByText("workHours.addHoursFormSubtitle")
    ).not.toBeInTheDocument();
  });

  it("should display user information in dropdown menu", () => {
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

    fireEvent.click(avatar);

    // Check if user information is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should display only email if name is not available", () => {
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

    fireEvent.click(avatar);

    // Check if only email is displayed
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });
});
