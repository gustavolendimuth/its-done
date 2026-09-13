import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Keep default Jest matchers; jest-dom augments them automatically.

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

// Mock next-intl. Most tests never render a NextIntlClientProvider, so
// useTranslations falls back to returning the raw key (the long-standing
// behavior). A few E2E-style tests do wrap components in a real
// NextIntlClientProvider with real messages to assert actual translated
// text; those are served from context instead.
jest.mock("next-intl", () => {
  const react = require("react");
  const MessagesContext = react.createContext(null);

  return {
    NextIntlClientProvider: ({
      messages,
      children,
    }: {
      messages: Record<string, unknown>;
      children: React.ReactNode;
    }) =>
      react.createElement(
        MessagesContext.Provider,
        { value: messages },
        children
      ),
    useTranslations: (namespace: string) => {
      const messages = react.useContext(MessagesContext);

      if (!messages) return (key: string) => key;

      const scoped = (messages[namespace] ?? {}) as Record<string, string>;

      return (key: string) => scoped[key] ?? key;
    },
    useLocale: () => "en",
  };
});

// Mock window.Image. jsdom has no real network stack, so Radix's Avatar
// (which preloads via `new window.Image()` + addEventListener("load"/"error"))
// would otherwise stay in "loading" status forever and never mount the
// underlying <img> element. Report success synchronously so `complete` /
// `naturalWidth` are already truthy by the time Radix checks them.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  complete = false;
  naturalWidth = 0;
  private _src = "";
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, callback: () => void) {
    (this.listeners[type] ??= []).push(callback);
  }

  removeEventListener(type: string, callback: () => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (listener) => listener !== callback
    );
  }

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    this.complete = true;
    this.naturalWidth = 1;
    this.onload?.();
    this.listeners.load?.forEach((callback) => callback());
  }
}

global.Image = MockImage as unknown as typeof Image;

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

// jsdom doesn't implement the Pointer Events capture API or scrollIntoView,
// which Radix UI components (Select, etc.) call when interacted with via
// pointer events (e.g. through @testing-library/user-event).
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

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

// No additional global type overrides
