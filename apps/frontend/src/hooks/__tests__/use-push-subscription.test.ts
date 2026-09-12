import { act, renderHook } from "@testing-library/react";

import api from "@/lib/axios";

import { usePushSubscription } from "../use-push-subscription";

jest.mock("@/lib/axios");
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("@/lib/utils", () => ({
  getApiUrl: () => "https://api.example.com/api",
}));

const mockRequestPermission = jest.fn();
const mockPostMessage = jest.fn();
const mockPushSubscribe = jest.fn();
const mockServiceWorkerRegister = jest.fn();

function mockSubscription(overrides: Record<string, unknown> = {}) {
  return {
    toJSON: () => ({
      endpoint: "https://push.example.com/endpoint",
      keys: { p256dh: "p256dh-value", auth: "auth-value" },
      ...overrides,
    }),
  };
}

describe("usePushSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Real VAPID public keys are base64url-encoded 65-byte EC points (~87
    // chars, needing exactly one '=' of padding) — mirror that shape here
    // rather than an arbitrary string, since urlBase64ToUint8Array() is
    // strict about valid base64url input.
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "A".repeat(87);

    (global as unknown as { Notification: unknown }).Notification = {
      permission: "default",
      requestPermission: mockRequestPermission,
    };

    mockServiceWorkerRegister.mockResolvedValue(undefined);
    mockPushSubscribe.mockResolvedValue(mockSubscription());

    Object.defineProperty(global.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: mockServiceWorkerRegister,
        ready: Promise.resolve({
          active: { postMessage: mockPostMessage },
          pushManager: { subscribe: mockPushSubscribe },
        }),
      },
    });
  });

  it("requests permission, registers the SW, subscribes and POSTs the subscription when granted", async () => {
    mockRequestPermission.mockResolvedValue("granted");
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockServiceWorkerRegister).toHaveBeenCalledWith("/sw.js");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_API_URL",
      apiUrl: "https://api.example.com/api",
    });
    expect(mockPushSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    expect(mockedApi.post).toHaveBeenCalledWith("/push/subscriptions", {
      endpoint: "https://push.example.com/endpoint",
      p256dh: "p256dh-value",
      auth: "auth-value",
      userAgent: navigator.userAgent,
    });
    expect(result.current.permission).toBe("granted");
  });

  it("reports the denied state without registering a SW or POSTing anything", async () => {
    mockRequestPermission.mockResolvedValue("denied");

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.permission).toBe("denied");
    expect(mockServiceWorkerRegister).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("initializes to 'default' without throwing when Notification is unavailable (e.g. SSR)", () => {
    delete (global as unknown as { Notification?: unknown }).Notification;

    const { result } = renderHook(() => usePushSubscription());

    expect(result.current.permission).toBe("default");
  });

  it("does not throw when the POST to /push/subscriptions fails", async () => {
    mockRequestPermission.mockResolvedValue("granted");
    mockedApi.post.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await expect(result.current.subscribe()).resolves.toBeUndefined();
    });

    expect(result.current.permission).toBe("granted");
  });
});
