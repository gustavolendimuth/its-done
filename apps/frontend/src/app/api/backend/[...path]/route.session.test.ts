/**
 * @jest-environment node
 */
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";

import { GET } from "./route";

// Regression: on production (NEXTAUTH_URL without a scheme) NextAuth wrote the
// session as `__Secure-next-auth.session-token` while the proxy looked for the
// plain cookie name. It got no token, sent no Bearer header, every /api/backend
// call answered 401 and the axios interceptor bounced the user to /login right
// after signing in. Unlike route.test.ts this file does NOT mock next-auth or
// next/server: a real session cookie goes through the real getToken().

jest.mock("@/lib/utils", () => ({
  getApiUrl: () => "http://backend.test",
}));

const SECRET = "test-nextauth-secret";

async function sessionCookie(name: string) {
  const jwt = await encode({
    token: { id: "u1", email: "user@test.local", accessToken: "backend-jwt" },
    secret: SECRET,
  });
  return `${name}=${jwt}`;
}

function proxyRequest(cookie?: string) {
  return new NextRequest("https://estafeito.app/api/backend/companies", {
    headers: cookie ? { cookie } : {},
  });
}

function forwardedHeaders(): Record<string, string> {
  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  return init.headers;
}

describe("backend proxy with a real NextAuth session cookie", () => {
  const originalUrl = process.env.NEXTAUTH_URL;
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = SECRET;
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => [],
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    };
    restore("NEXTAUTH_URL", originalUrl);
    restore("NEXTAUTH_SECRET", originalSecret);
  });

  // The cookie name NextAuth itself picks for each NEXTAUTH_URL shape.
  it.each([
    ["https://estafeito.app", "__Secure-next-auth.session-token"],
    ["estafeito.app", "__Secure-next-auth.session-token"],
    ["http://localhost:3100", "next-auth.session-token"],
  ])(
    "forwards the Bearer token when NEXTAUTH_URL=%s",
    async (nextAuthUrl, cookieName) => {
      process.env.NEXTAUTH_URL = nextAuthUrl;

      const response = await GET(
        proxyRequest(await sessionCookie(cookieName)),
        { params: Promise.resolve({ path: ["companies"] }) }
      );

      expect(response.status).toBe(200);
      expect(forwardedHeaders()).toEqual({
        Authorization: "Bearer backend-jwt",
      });
    }
  );

  it("sends no Authorization header when there is no session cookie", async () => {
    process.env.NEXTAUTH_URL = "https://estafeito.app";

    await GET(proxyRequest(), {
      params: Promise.resolve({ path: ["companies"] }),
    });

    expect(forwardedHeaders()).toEqual({});
  });
});
