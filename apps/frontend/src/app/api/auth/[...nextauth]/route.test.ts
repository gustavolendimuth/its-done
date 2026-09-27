var capturedAuthOptions: any;

jest.mock("next-auth", () => ({
  __esModule: true,
  default: (options: unknown) => {
    capturedAuthOptions = options;
    return jest.fn();
  },
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: unknown) => ({ type: "credentials", ...options }),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: (options: unknown) => ({ type: "oauth", ...options }),
}));

jest.mock("@/lib/utils", () => ({
  getApiUrl: () => "http://backend.test",
}));

import "./route";

type JsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function response(ok: boolean, body: unknown, status = ok ? 200 : 401) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as JsonResponse;
}

function getAuthOptions() {
  return capturedAuthOptions;
}

function getAuthorize() {
  const credentialsProvider = getAuthOptions().providers.find(
    (provider: { type: string }) => provider.type === "credentials"
  );
  return credentialsProvider.authorize as (
    credentials: { email: string; password: string }
  ) => Promise<any>;
}

describe("unified NextAuth route", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it("returns a User actor without trying CompanyAdmin", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      response(true, {
        access_token: "user-token",
        user: {
          id: "user-1",
          email: "user@test.local",
          name: "Test User",
          role: "USER",
        },
      })
    );

    await expect(
      getAuthorize()({ email: "user@test.local", password: "password123" })
    ).resolves.toMatchObject({
      id: "user-1",
      actorType: "USER",
      accessToken: "user-token",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend.test/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not spend CompanyAdmin throttle for a User password mistake", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(false, { message: "Unauthorized" }))
      .mockResolvedValueOnce(response(true, { exists: true }));

    await expect(
      getAuthorize()({ email: "user@test.local", password: "wrong-password" })
    ).resolves.toBeNull();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://backend.test/users/check?email=user%40test.local"
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      "http://backend.test/company-admin/auth/login",
      expect.anything()
    );
  });

  it("falls back only when the email is not a User", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(false, { message: "Unauthorized" }))
      .mockResolvedValueOnce(response(true, { exists: false }))
      .mockResolvedValueOnce(
        response(true, {
          access_token: "admin-token",
          admin: {
            id: "admin-1",
            email: "admin@acme.com",
            companyId: "company-1",
          },
        })
      );

    await expect(
      getAuthorize()({ email: "admin@acme.com", password: "password123" })
    ).resolves.toMatchObject({
      id: "admin-1",
      actorType: "COMPANY_ADMIN",
      accessToken: "admin-token",
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://backend.test/users/check?email=admin%40acme.com"
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://backend.test/company-admin/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("tags Google sign-in as User", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      response(true, {
        access_token: "google-token",
        user: {
          id: "user-1",
          email: "user@test.local",
          name: "Test User",
          role: "USER",
        },
      })
    );
    const user: Record<string, unknown> = {
      id: "google-profile",
      email: "user@test.local",
      name: "Test User",
    };

    await expect(
      getAuthOptions().callbacks.signIn({
        account: { provider: "google" },
        profile: {
          email: "user@test.local",
          name: "Test User",
          sub: "google-1",
        },
        user,
      })
    ).resolves.toBe(true);

    expect(user).toMatchObject({
      actorType: "USER",
      accessToken: "google-token",
    });
  });

  it("keeps the backend token out of the client session", async () => {
    const token = await getAuthOptions().callbacks.jwt({
      token: {},
      user: {
        id: "admin-1",
        email: "admin@acme.com",
        name: "admin@acme.com",
        actorType: "COMPANY_ADMIN",
        accessToken: "admin-token",
      },
    });

    expect(token).toMatchObject({
      actorType: "COMPANY_ADMIN",
      accessToken: "admin-token",
    });

    const session = await getAuthOptions().callbacks.session({
      session: {
        user: { id: "", email: "", name: "", actorType: "USER" },
        expires: "2099-01-01T00:00:00.000Z",
      },
      token,
    });

    expect(session.user.actorType).toBe("COMPANY_ADMIN");
    expect(session).not.toHaveProperty("accessToken");
  });
});
