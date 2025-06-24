import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { vi, type MockedFunction } from "vitest";
import { useAvatar } from "../use-avatar";

// Mock next-auth
vi.mock("next-auth/react");
const mockUseSession = useSession as MockedFunction<typeof useSession>;

describe("useAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initials when no session data is available", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.initials).toBe("U");
    expect(result.current.displayName).toBe("User");
    expect(result.current.fallbackUrls).toHaveLength(3); // UI Avatars, DiceBear, Local SVG
  });

  it("should prioritize Google image when available", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        image: "https://lh3.googleusercontent.com/a/default-user",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.avatarUrl).toBe(
      "https://lh3.googleusercontent.com/a/default-user"
    );
    expect(result.current.fallbackUrls[0]).toBe(
      "https://lh3.googleusercontent.com/a/default-user"
    );
    expect(result.current.initials).toBe("JD");
    expect(result.current.displayName).toBe("John Doe");
    expect(result.current.email).toBe("john@example.com");
  });

  it("should generate correct initials from name", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Maria Silva Santos",
        email: "maria@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.initials).toBe("MS");
  });

  it("should include Gravatar URL when email is available", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Jane Doe",
        email: "jane@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.fallbackUrls).toEqual(
      expect.arrayContaining([
        expect.stringContaining("https://www.gravatar.com/avatar/"),
      ])
    );
  });

  it("should include local SVG fallback as last option", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    const lastFallback =
      result.current.fallbackUrls[result.current.fallbackUrls.length - 1];

    expect(lastFallback).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should handle empty or single character names", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "A",
        email: "a@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.initials).toBe("A");
  });

  it("should handle names with extra spaces", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "  John   Doe  ",
        email: "john@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAvatar());

    expect(result.current.initials).toBe("JD");
    expect(result.current.displayName).toBe("  John   Doe  ");
  });

  it("should memoize results correctly", () => {
    const mockSession = {
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      },
      expires: "2024-01-01",
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useAvatar());
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
