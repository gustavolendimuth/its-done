import { GET, PATCH, POST } from "./route";

const mockGetToken = jest.fn();

jest.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

jest.mock("next/server", () => {
  class MockNextResponse {
    private readonly body: any;
    status: number;
    headers: { get: (name: string) => string | null };

    constructor(
      body: any,
      init: { status?: number; headers?: Record<string, string> } = {}
    ) {
      this.body = body;
      this.status = init.status ?? 200;
      const headers = init.headers ?? {};
      this.headers = {
        get: (name: string) =>
          Object.entries(headers).find(
            ([key]) => key.toLowerCase() === name.toLowerCase()
          )?.[1] ?? null,
      };
    }

    static json(data: unknown, init: { status?: number } = {}) {
      return new MockNextResponse(data, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
    }

    async json() {
      return this.body;
    }

    async arrayBuffer() {
      return this.body.arrayBuffer();
    }
  }

  return { NextResponse: MockNextResponse };
});

jest.mock("@/lib/utils", () => ({
  getApiUrl: () => "http://backend.test",
}));

function request(
  url: string,
  options: {
    method?: string;
    body?: string;
    contentType?: string;
  } = {}
) {
  return {
    method: options.method ?? "GET",
    nextUrl: new URL(url),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type"
          ? (options.contentType ?? null)
          : null,
    },
    text: jest.fn().mockResolvedValue(options.body ?? ""),
  } as any;
}

function jsonUpstream(data: unknown, status: number) {
  return {
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type"
          ? "application/json; charset=utf-8"
          : null,
    },
    json: jest.fn().mockResolvedValue(data),
  };
}

function binaryUpstream(bytes: Uint8Array, status: number) {
  const buffer = bytes.buffer;
  return {
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type"
          ? "application/octet-stream"
          : null,
    },
    blob: jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(buffer),
    }),
  };
}

describe("backend proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it("injects the internal backend token", async () => {
    mockGetToken.mockResolvedValueOnce({ accessToken: "internal-token" });
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonUpstream({ ok: true }, 200)
    );
    const req = request(
      "http://frontend.test/api/backend/company-admin/dashboard/summary"
    );

    await GET(req, {
      params: Promise.resolve({
        path: ["company-admin", "dashboard", "summary"],
      }),
    });

    expect(mockGetToken).toHaveBeenCalledWith({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend.test/company-admin/dashboard/summary",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer internal-token" },
      })
    );
  });

  it("removes access_token while preserving the JSON response status and fields", async () => {
    mockGetToken.mockResolvedValueOnce({ accessToken: "internal-token" });
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonUpstream(
        {
          access_token: "backend-jwt-that-must-not-reach-the-browser",
          admin: { id: "admin-1", email: "admin@acme.com" },
          nested: {
            access_token: "nested-token-that-must-not-reach-the-browser",
            preserved: true,
          },
          message: "CompanyAdmin registered",
        },
        201
      )
    );
    const req = request(
      "http://frontend.test/api/backend/company-admin/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          company: "Acme Inc",
          email: "admin@acme.com",
          password: "supersecret",
        }),
        contentType: "application/json",
      }
    );

    const response = await POST(req, {
      params: Promise.resolve({ path: ["company-admin", "auth", "register"] }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      admin: { id: "admin-1", email: "admin@acme.com" },
      nested: { preserved: true },
      message: "CompanyAdmin registered",
    });
  });

  it("preserves the upstream HTTP contract", async () => {
    mockGetToken.mockResolvedValue({ accessToken: "internal-token" });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonUpstream({ updated: true }, 202))
      .mockResolvedValueOnce(
        binaryUpstream(new Uint8Array([0, 1, 2, 255]), 206)
      );

    const patchReq = request(
      "http://frontend.test/api/backend/projects/project-1?include=tasks",
      {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        contentType: "application/json",
      }
    );
    const jsonResponse = await PATCH(patchReq, {
      params: Promise.resolve({ path: ["projects", "project-1"] }),
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://backend.test/projects/project-1?include=tasks",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer internal-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated" }),
        cache: "no-store",
      }
    );
    expect(jsonResponse.status).toBe(202);
    const jsonBody = await jsonResponse.json();
    expect(jsonBody).toEqual({ updated: true });
    expect(JSON.stringify(jsonBody)).not.toContain("accessToken");

    const getReq = request(
      "http://frontend.test/api/backend/reports/export?format=csv"
    );
    const binaryResponse = await GET(getReq, {
      params: Promise.resolve({ path: ["reports", "export"] }),
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://backend.test/reports/export?format=csv",
      {
        method: "GET",
        headers: { Authorization: "Bearer internal-token" },
        body: undefined,
        cache: "no-store",
      }
    );
    expect(binaryResponse.status).toBe(206);
    expect(binaryResponse.headers.get("content-type")).toBe(
      "application/octet-stream"
    );
    await expect(binaryResponse.arrayBuffer()).resolves.toEqual(
      new Uint8Array([0, 1, 2, 255]).buffer
    );
  });

  it.each([[".."], ["."], [""], ["a/b"], ["a\\b"]])(
    "rejects the path segment %j without calling the backend",
    async (segment) => {
      const response = await GET(
        request("http://frontend.test/api/backend/x"),
        { params: Promise.resolve({ path: ["company-admin", segment] }) }
      );

      expect(response.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockGetToken).not.toHaveBeenCalled();
    }
  );
});
