import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { useSession } from "next-auth/react";
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

// Mock clients service
vi.mock("@/services/clients", () => ({
  useClients: vi.fn(() => ({ data: [] })),
}));

describe("Topbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
