import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: "/",
  route: "/",
  query: {},
  asPath: "/",
}));

vi.mock("next/navigation", () => ({
  useRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: (props: any) => props,
}));

// Mock Recharts
vi.mock("recharts", () => ({}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
