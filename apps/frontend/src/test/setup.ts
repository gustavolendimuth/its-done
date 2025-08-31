import "@testing-library/jest-dom";
import { expect } from "@jest/globals";
import { configure } from "@testing-library/react";

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare global {
  namespace jest {
    interface Matchers<R = void>
      extends TestingLibraryMatchers<typeof expect.stringContaining, R> {}
  }
}

interface MockImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  [key: string]: unknown;
}

// Mock Next.js router
const _useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: "/",
  route: "/",
  query: {},
  asPath: "/",
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Next.js Image
jest.mock("next/image", () => ({
  default: (props: MockImageProps) => props,
}));

// Mock Recharts
jest.mock("recharts", () => ({}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    // Implementation not needed for tests
  }

  observe() {
    // Implementation not needed for tests
  }

  unobserve() {
    // Implementation not needed for tests
  }

  disconnect() {
    // Implementation not needed for tests
  }
}

global.ResizeObserver = MockResizeObserver;

// Configure Testing Library
configure({
  testIdAttribute: "data-testid",
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}
