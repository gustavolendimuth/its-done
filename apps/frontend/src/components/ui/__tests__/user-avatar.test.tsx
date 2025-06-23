import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { UserAvatar } from "../user-avatar";

// Mock Image loading behavior
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: "",
};

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => mockImage);

describe("UserAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock image properties
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.src = "";
  });

  it("should render fallback text when no src is provided", () => {
    render(<UserAvatar fallbackText="JD" />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should render image when src is provided and loads successfully", async () => {
    render(
      <UserAvatar
        src="https://example.com/avatar.jpg"
        alt="User avatar"
        fallbackText="JD"
      />
    );

    const image = screen.getByRole("img", { hidden: true });
    expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(image).toHaveAttribute("alt", "User avatar");
  });

  it("should show loading state initially when src is provided", () => {
    render(
      <UserAvatar src="https://example.com/avatar.jpg" fallbackText="JD" />
    );

    // Should show loading spinner initially
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });

  it("should try fallback URLs when primary image fails", async () => {
    const fallbackUrls = [
      "https://example.com/avatar.jpg",
      "https://gravatar.com/avatar/123",
      "https://ui-avatars.com/api/?name=John",
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    ];

    render(
      <UserAvatar
        src="https://example.com/invalid.jpg"
        fallbackUrls={fallbackUrls}
        fallbackText="JD"
      />
    );

    const image = screen.getByRole("img", { hidden: true });

    // Simulate image error on the primary source
    fireEvent.error(image);

    await waitFor(() => {
      // Should try the first fallback URL
      expect(image).toHaveAttribute("src", fallbackUrls[0]);
    });
  });

  it("should show text fallback when all images fail", async () => {
    const fallbackUrls = [
      "https://example.com/invalid1.jpg",
      "https://example.com/invalid2.jpg",
    ];

    render(
      <UserAvatar
        src="https://example.com/invalid.jpg"
        fallbackUrls={fallbackUrls}
        fallbackText="JD"
      />
    );

    const image = screen.getByRole("img", { hidden: true });

    // Simulate multiple image errors
    fireEvent.error(image);
    await waitFor(() => {
      fireEvent.error(image);
    });
    await waitFor(() => {
      fireEvent.error(image);
    });

    // Should eventually show text fallback
    await waitFor(() => {
      expect(screen.getByText("JD")).toBeInTheDocument();
    });
  });

  it("should apply correct size classes", () => {
    const { rerender } = render(<UserAvatar fallbackText="JD" size="sm" />);

    let avatar = screen.getByText("JD").closest('[role="img"]');
    expect(avatar).toHaveClass("h-6", "w-6");

    rerender(<UserAvatar fallbackText="JD" size="md" />);
    avatar = screen.getByText("JD").closest('[role="img"]');
    expect(avatar).toHaveClass("h-8", "w-8");

    rerender(<UserAvatar fallbackText="JD" size="lg" />);
    avatar = screen.getByText("JD").closest('[role="img"]');
    expect(avatar).toHaveClass("h-12", "w-12");
  });

  it("should apply custom className", () => {
    render(<UserAvatar fallbackText="JD" className="custom-avatar-class" />);

    const avatar = screen.getByText("JD").closest('[role="img"]');
    expect(avatar).toHaveClass("custom-avatar-class");
  });

  it("should reset state when src prop changes", async () => {
    const { rerender } = render(
      <UserAvatar src="https://example.com/avatar1.jpg" fallbackText="JD" />
    );

    // Change the src
    rerender(
      <UserAvatar src="https://example.com/avatar2.jpg" fallbackText="JD" />
    );

    const image = screen.getByRole("img", { hidden: true });
    expect(image).toHaveAttribute("src", "https://example.com/avatar2.jpg");
  });

  it("should handle load event correctly", async () => {
    render(
      <UserAvatar src="https://example.com/avatar.jpg" fallbackText="JD" />
    );

    const image = screen.getByRole("img", { hidden: true });

    // Simulate successful load
    fireEvent.load(image);

    // Loading state should be removed
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });
});
