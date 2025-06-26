import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";

import { useAvatar } from "../use-avatar";

import type { Session } from "next-auth";

// Mock next-auth
jest.mock("next-auth/react");
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUpdate = jest.fn(() => Promise.resolve({} as Session | null));

// Mock the Gravatar services
jest.mock("@/services/gravatar", () => ({
  useGravatarHealth: jest.fn(() => ({ data: true, isLoading: false })),
  useGravatarProfile: jest.fn(() => ({ data: null, isLoading: false })),
  generateGravatarAvatarUrl: jest.fn(
    (_email: string) => `https://0.gravatar.com/avatar/mockhash?s=40&d=404&r=pg`
  ),
  extractGravatarDisplayInfo: jest.fn(() => null),
  isLikelyToHaveGravatar: jest.fn(() => false),
  generateGravatarProfileUrl: jest.fn(
    (_email: string) => `https://gravatar.com/mockhash`
  ),
}));

// Mock other services
jest.mock("@/services/avatar", () => ({
  shouldDisableGravatar: jest.fn(() => false),
}));

jest.mock("@/services/network-status", () => ({
  useShouldSkipExternalServices: jest.fn(() => ({
    skipGravatar: false,
    isOffline: false,
  })),
}));

// Mock normalizeUrl function
jest.mock("@/lib/utils", () => ({
  normalizeUrl: jest.fn((url: string) => url),
}));

// Create wrapper component with display name
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
Wrapper.displayName = "TestWrapper";

describe("useAvatar", () => {
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

  it("should return initials when no session data is available", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    expect(result.current.initials).toBe("U");
    expect(result.current.displayName).toBe("User");
    expect(result.current.fallbackUrls.length).toBeGreaterThan(0);
  });

  it("should prioritize Google image when available", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

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
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    expect(result.current.initials).toBe("JD");
  });

  it("should include Gravatar URL when email is available", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    expect(result.current.fallbackUrls).toEqual(
      expect.arrayContaining([
        expect.stringContaining("https://0.gravatar.com/avatar/"),
      ])
    );
  });

  it("should include local SVG fallback as last option", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    const lastFallback =
      result.current.fallbackUrls[result.current.fallbackUrls.length - 1];

    expect(lastFallback).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should handle empty or single character names", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    expect(result.current.initials).toBe("JD");
  });

  it("should handle names with extra spaces", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    expect(result.current.initials).toBe("JD");
    expect(result.current.displayName).toBe("John Doe");
  });

  it("should have enhanced properties with Gravatar profile support", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });

    // Check if new properties exist
    expect(result.current).toHaveProperty("gravatarProfile");
    expect(result.current).toHaveProperty("isLoadingProfile");
    expect(typeof result.current.isLoadingProfile).toBe("boolean");
  });

  it("should memoize results correctly", () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: mockUpdate,
    });

    const { result, rerender } = renderHook(() => useAvatar(), {
      wrapper: Wrapper,
    });
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
