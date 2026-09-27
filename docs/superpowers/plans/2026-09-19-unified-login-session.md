# Unified login session (User + CompanyAdmin) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `/login` authenticate both `User` and `CompanyAdmin`, redirecting each to the right area, without ever exposing the backend JWT to client-side JS.

**Architecture:** NextAuth stays the single session mechanism. `authorize()` tries `POST /auth/login`, falls back to `POST /company-admin/auth/login`, and tags the session with `actorType`. The `accessToken` is dropped from the client-facing `Session` object and lives only in the NextAuth JWT cookie; a single server-side proxy route (`/api/backend/[...path]`) reads it via `getToken()` and injects the `Authorization: Bearer` header on every authenticated backend call. The `CompanyAdmin`-only session infrastructure (its own httpOnly cookie, its own proxy, its own React context) is removed.

**Tech Stack:** NestJS (backend), Next.js App Router + NextAuth (`next-auth@4`, credentials + Google providers) + React Query (frontend), Jest for both.

**Spec:** `docs/superpowers/specs/2026-09-19-unified-login-session-design.md`

## Global Constraints

- `User` and `CompanyAdmin` stay separate identities (ADR-0002) — this plan changes session transport, not the domain model.
- No HTTP contract change on `/auth/*` or `/company-admin/auth/*` — same request/response shapes throughout.
- `accessToken` must never appear in any JSON response the browser can read, nor in `next-auth`'s client-facing `Session` type.
- Google sign-in stays `User`-only; `CompanyAdmin` gets no Google login in this plan.
- A wrong password for `User` must not spend the 10/min-per-IP throttle budget on `/company-admin/auth/login` — the fallback only fires when the email genuinely isn't a `User`.
- `.tasks/unificar-autenticacao-colaborador-empresa.md`, found during brainstorming, describes an incompatible design (keeps the two session mechanisms separate). Do not use it as a reference for this plan.

---

## Task 1: Backend — reject a `User` signup for an email already used by a `CompanyAdmin`

**Files:**
- Modify: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `CompanyAdminsService.findByEmail(email: string): Promise<CompanyAdmin | null>` (`apps/backend/src/company-admin/company-admins.service.ts`, already exported by `CompanyAdminModule`, already imported by `AuthModule` — no module wiring change needed).
- Produces: no new public method; `AuthService.register()` and `AuthService.googleAuth()` now throw `ConflictException` for an email that belongs to an existing `CompanyAdmin`.

- [ ] **Step 1: Write the failing tests**

Create `apps/backend/src/auth/auth.service.spec.ts`:

```typescript
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

const usersServiceMock = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendWelcomeEmail: jest.fn(),
} as any;

const companyLinkingServiceMock = {
  syncAutoLinks: jest.fn(),
} as any;

const companyAdminsServiceMock = {
  findByEmail: jest.fn(),
} as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(
      usersServiceMock,
      jwtServiceMock,
      notificationsServiceMock,
      companyLinkingServiceMock,
      companyAdminsServiceMock,
    );
  });

  describe('register()', () => {
    it('rejects an email that already belongs to a CompanyAdmin', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'shared@test.local',
      });

      await expect(
        service.register({
          name: 'Test User',
          email: 'shared@test.local',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('googleAuth()', () => {
    it('rejects creating a User for an email that already belongs to a CompanyAdmin', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'shared@test.local',
      });

      await expect(
        service.googleAuth({
          email: 'shared@test.local',
          name: 'Test User',
          googleId: 'google-1',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/backend && npx jest src/auth/auth.service.spec.ts`
Expected: FAIL — `AuthService` constructor only takes 4 arguments today, and neither check exists yet.

- [ ] **Step 3: Add the `CompanyAdminsService` check to `AuthService`**

Edit `apps/backend/src/auth/auth.service.ts`. Add the import and constructor param:

```typescript
import { CompanyAdminsService } from '../company-admin/company-admins.service';
```

```typescript
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private companyLinkingService: CompanyLinkingService,
    private companyAdminsService: CompanyAdminsService,
  ) {}
```

In `register()`, add the check right after the existing `User` check:

```typescript
  async register(registerDto: RegisterDto) {
    console.log('Starting registration for:', { email: registerDto.email });
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      console.log('User already exists:', { email: registerDto.email });
      throw new ConflictException('User already exists with this email');
    }

    const existingCompanyAdmin = await this.companyAdminsService.findByEmail(
      registerDto.email,
    );
    if (existingCompanyAdmin) {
      throw new ConflictException(
        'A CompanyAdmin already exists with this email',
      );
    }

    console.log('Hashing password for new user');
```

In `googleAuth()`, add the check inside the `if (!existingUser)` branch, before creating the `User`:

```typescript
    if (!existingUser) {
      const existingCompanyAdmin = await this.companyAdminsService.findByEmail(
        googleAuthDto.email,
      );
      if (existingCompanyAdmin) {
        throw new ConflictException(
          'A CompanyAdmin already exists with this email',
        );
      }

      // Criar usuário se não existir
      console.log('Creating new user from Google auth');
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/backend && npx jest src/auth/auth.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/auth/auth.service.ts apps/backend/src/auth/auth.service.spec.ts
git commit -m "feat(auth): reject User signup for an email already used by a CompanyAdmin"
```

---

## Task 2: Backend — reject a `CompanyAdmin` creation for an email already used by a `User`

**Files:**
- Modify: `apps/backend/src/company-admin/company-admin.module.ts`
- Modify: `apps/backend/src/company-admin/company-admin-auth.service.ts`
- Modify: `apps/backend/src/company-admin/company-admin-auth.service.spec.ts`

**Interfaces:**
- Consumes: `UsersService.findByEmail(email: string): Promise<User | null>` (`apps/backend/src/users/users.service.ts`).
- Produces: `CompanyAdminAuthService.register()`, and every caller of the private `assertEmailNotTaken()` (`confirmCompanyActivation`, `inviteCompanyAdmin`, `confirmCompanyAdminInvite`), now throw `ConflictException` for an email that belongs to an existing `User`.

- [ ] **Step 1: Wire `UsersModule` into `CompanyAdminModule`**

Edit `apps/backend/src/company-admin/company-admin.module.ts`:

```typescript
import { UsersModule } from '../users/users.module';
```

```typescript
@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    InAppNotificationsModule,
    PassportModule,
```

- [ ] **Step 2: Write the failing tests**

Edit `apps/backend/src/company-admin/company-admin-auth.service.spec.ts`. Add a `usersServiceMock` and pass it into the constructor call, and add the two new test blocks:

```typescript
import { ConflictException } from '@nestjs/common';
import { CompanyAdminAuthService } from './company-admin-auth.service';

const prismaMock = {} as any;

const companyAdminsServiceMock = {
  findByEmail: jest.fn(),
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
  verify: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendCompanyAdminPasswordResetEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
} as any;

const inAppNotificationsServiceMock = {} as any;

const usersServiceMock = {
  findByEmail: jest.fn(),
} as any;

describe('CompanyAdminAuthService', () => {
  let service: CompanyAdminAuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyAdminAuthService(
      prismaMock,
      companyAdminsServiceMock,
      jwtServiceMock,
      notificationsServiceMock,
      inAppNotificationsServiceMock,
      usersServiceMock,
    );
  });

  describe('forgotPassword()', () => {
    it('calls sendCompanyAdminPasswordResetEmail, not the shared sendPasswordResetEmail', async () => {
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@test.local',
        companyId: 'company-1',
      });
      jwtServiceMock.sign.mockReturnValueOnce('reset-token');

      await service.forgotPassword({ email: 'admin@test.local' });

      expect(
        notificationsServiceMock.sendCompanyAdminPasswordResetEmail,
      ).toHaveBeenCalledWith(
        'admin@test.local',
        'admin@test.local',
        'reset-token',
      );
      expect(
        notificationsServiceMock.sendPasswordResetEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('register()', () => {
    it('rejects an email that already belongs to a User', async () => {
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.register({
          company: 'Acme',
          email: 'shared@test.local',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmCompanyAdminInvite()', () => {
    it('rejects an invite confirmation for an email that already belongs to a User', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        companyId: 'company-1',
        email: 'shared@test.local',
        invitedById: 'admin-1',
        type: 'company-admin-invite',
      });
      prismaMock.company = {
        findUnique: jest.fn().mockResolvedValueOnce({
          id: 'company-1',
          company: 'Acme',
        }),
      };
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.confirmCompanyAdminInvite({
          token: 'invite-token',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
```

- [ ] **Step 3: Run the tests to verify the two new ones fail**

Run: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts`
Expected: FAIL on `register()` and `confirmCompanyAdminInvite()` — `CompanyAdminAuthService` doesn't accept a 6th constructor argument yet and never checks the `User` table.

- [ ] **Step 4: Add the `UsersService` check to `CompanyAdminAuthService`**

Edit `apps/backend/src/company-admin/company-admin-auth.service.ts`. Add the import:

```typescript
import { UsersService } from '../users/users.service';
```

Add the constructor param:

```typescript
  constructor(
    private prisma: PrismaService,
    private companyAdminsService: CompanyAdminsService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
    private usersService: UsersService,
  ) {}
```

In `register()`, add the check right after the existing `CompanyAdmin` check:

```typescript
  async register(dto: RegisterCompanyAdminDto) {
    const existing = await this.companyAdminsService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An CompanyAdmin already exists with this email',
      );
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
```

Extend the shared `assertEmailNotTaken()` — this single change covers `confirmCompanyActivation`, `inviteCompanyAdmin` and `confirmCompanyAdminInvite`, all three of which already call it:

```typescript
  private async assertEmailNotTaken(email: string) {
    const existing = await this.companyAdminsService.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        'An CompanyAdmin already exists with this email',
      );
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('A User already exists with this email');
    }
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts`
Expected: PASS (all tests, including the pre-existing `forgotPassword()` one)

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/company-admin/company-admin.module.ts apps/backend/src/company-admin/company-admin-auth.service.ts apps/backend/src/company-admin/company-admin-auth.service.spec.ts
git commit -m "feat(company-admin): reject CompanyAdmin creation for an email already used by a User"
```

---

## Task 3: Frontend — NextAuth falls back to CompanyAdmin login and stops exposing the backend token

**Files:**
- Modify: `apps/frontend/src/app/api/auth/[...nextauth]/route.ts`
- Modify: `apps/frontend/src/types/next-auth.d.ts`

**Interfaces:**
- Produces: `Session.user.actorType: "USER" | "COMPANY_ADMIN"` (readable client-side via `useSession()`/`getSession()`); `Session` no longer has an `accessToken` field. `JWT.accessToken` (internal, server-only) carries the backend token forward for Task 4's proxy to read via `getToken()`.

There is no existing test harness for this route (no other NextAuth callback in this file is unit-tested today). This task is implementation-only; it's verified end-to-end by Task 6's `LoginForm` tests (which mock `next-auth/react`, not this route) and by the manual pass in Task 11.

- [ ] **Step 1: Rewrite `authorize()` to try `User` then `CompanyAdmin`, and stop logging credentials**

Edit `apps/frontend/src/app/api/auth/[...nextauth]/route.ts`. Replace the whole `authorize` function:

```typescript
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const apiUrl = getApiUrl();
        const body = JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        });

        try {
          const userResponse = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          const userData = await userResponse.json();

          if (userResponse.ok && userData.access_token) {
            return {
              id: userData.user.id,
              email: userData.user.email,
              name: userData.user.name,
              role: userData.user.role,
              actorType: "USER",
              accessToken: userData.access_token,
            };
          }
        } catch (error) {
          console.error("Error during User login:", error);
        }

        try {
          const adminResponse = await fetch(
            `${apiUrl}/company-admin/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            }
          );
          const adminData = await adminResponse.json();

          if (adminResponse.ok && adminData.access_token) {
            return {
              id: adminData.admin.id,
              email: adminData.admin.email,
              name: adminData.admin.email,
              actorType: "COMPANY_ADMIN",
              accessToken: adminData.access_token,
            };
          }
        } catch (error) {
          console.error("Error during CompanyAdmin login:", error);
        }

        return null;
      },
```

- [ ] **Step 2: Carry `actorType` through the Google sign-in branch, `jwt()` and `session()`; stop exposing `accessToken` to the client**

In the same file, in the `signIn` callback's Google branch, add `user.actorType = "USER";` next to the existing field assignments:

```typescript
          if (data.access_token && data.user) {
            // Armazenar os dados do usuário no objeto user para usar nos outros callbacks
            if (user) {
              user.id = data.user.id;
              user.email = data.user.email;
              user.name = data.user.name;
              user.role = data.user.role;
              user.actorType = "USER";
              user.accessToken = data.access_token;
            }

            return true;
          }
```

Replace the `jwt` callback:

```typescript
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.actorType = user.actorType;
        token.accessToken = user.accessToken;
      }

      return token;
    },
```

Replace the `session` callback — this is the line that stops the token leak (`session.accessToken = token.accessToken;` is gone):

```typescript
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.actorType = token.actorType;
      }

      return session;
    },
```

Leave the `redirect` callback untouched — `LoginForm` (Task 6) calls `signIn` with `redirect: false` and navigates manually, so this callback no longer runs for the credentials flow; Google sign-in still passes its own `callbackUrl: "/work-hours"` and stays `User`-only.

Also remove the two `console.log` calls at the top of `authorize` that printed the raw credentials — already dropped by the Step 1 rewrite above (the new version never logs `credentials`).

- [ ] **Step 3: Update the session/JWT/User type augmentation**

Replace the full contents of `apps/frontend/src/types/next-auth.d.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role?: "USER" | "ADMIN";
      actorType: "USER" | "COMPANY_ADMIN";
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: "USER" | "ADMIN";
    actorType: "USER" | "COMPANY_ADMIN";
    image?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role?: "USER" | "ADMIN";
    actorType: "USER" | "COMPANY_ADMIN";
    accessToken?: string;
  }
}
```

Note `role` is now optional — a `COMPANY_ADMIN` session has no platform role. `apps/frontend/src/app/[locale]/(authenticated)/admin/page.tsx:55` already checks `session?.user?.role !== "ADMIN"`, which is `true` (access denied) when `role` is `undefined`, so it needs no change.

- [ ] **Step 4: Type-check**

Run: `cd apps/frontend && npx tsc --noEmit`
Expected: no new errors from `[...nextauth]/route.ts` or `next-auth.d.ts`. (Errors from files this plan hasn't touched yet — e.g. anything still importing `useCompanyAdminAuth` — are expected until Task 9; ignore those for this step.)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/api/auth/\[...nextauth\]/route.ts apps/frontend/src/types/next-auth.d.ts
git commit -m "feat(auth): NextAuth falls back to CompanyAdmin login, stops exposing accessToken to the client"
```

---

## Task 4: Frontend — generalized backend proxy

**Files:**
- Create: `apps/frontend/src/app/api/backend/[...path]/route.ts`

**Interfaces:**
- Consumes: `getToken({ req, secret }): Promise<{ accessToken?: string } | null>` from `next-auth/jwt`; `getApiUrl()` from `@/lib/utils`.
- Produces: an HTTP endpoint at `/api/backend/*` that forwards to the NestJS backend with `Authorization: Bearer <accessToken>` injected server-side, and that removes the exact `access_token` key (recursively) from every JSON response. Task 5's `lib/axios.ts` is the first consumer; Task 8's register page is the reason the sanitizer exists.

No existing proxy route in this codebase has a test (the `company-admin/[...path]/route.ts` this generalizes has none either) — implementation-only, verified manually in Task 11.

- [ ] **Step 1: Create the proxy route**

Create `apps/frontend/src/app/api/backend/[...path]/route.ts`:

```typescript
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { getApiUrl } from "@/lib/utils";

/**
 * Recursively drops the exact `access_token` key from a JSON payload.
 * `POST /company-admin/auth/register` returns the backend JWT in its body;
 * the proxy must not hand it to the browser.
 */
function removeAccessTokens(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(removeAccessTokens);
  }

  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => key !== "access_token")
        .map(([key, value]) => [key, removeAccessTokens(value)])
    );
  }

  return data;
}

/**
 * Server-side proxy to the NestJS backend for every authenticated frontend
 * call, for both User and CompanyAdmin sessions. The browser never sees the
 * backend JWT: this route reads it from the NextAuth session token (itself
 * in an httpOnly cookie no client-side JS can read), injects it as
 * `Authorization: Bearer` on the real call, and strips any `access_token`
 * key from JSON responses before they reach the browser.
 */
async function proxy(req: NextRequest, path: string[]) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const targetUrl = `${getApiUrl()}/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      body = text;
      headers["Content-Type"] =
        req.headers.get("content-type") ?? "application/json";
    }
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json();
    return NextResponse.json(removeAccessTokens(data), {
      status: upstream.status,
    });
  }

  // Pass binaries (e.g. CSV export) straight through, without trying to
  // parse them as JSON.
  const blob = await upstream.blob();
  return new NextResponse(blob, {
    status: upstream.status,
    headers: { "Content-Type": contentType || "application/octet-stream" },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxy(req, path);
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/frontend && npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/api/backend/
git commit -m "feat(api): add generalized server-side proxy for authenticated backend calls"
```

---

## Task 5: Frontend — `lib/axios.ts` uses the generalized proxy

**Files:**
- Modify: `apps/frontend/src/lib/axios.ts`

**Interfaces:**
- Consumes: `/api/backend/[...path]` from Task 4.
- Produces: no change to `api`'s exported shape (still the default-exported axios instance every feature service already imports) — only its `baseURL` and internals change.

No dedicated test file exists for `lib/axios.ts`; every feature service that uses `api` already mocks it at a higher level in its own tests, so this task is implementation-only, confirmed by the existing suite staying green.

- [ ] **Step 1: Replace the file**

Replace the full contents of `apps/frontend/src/lib/axios.ts`:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api/backend",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthEndpoint) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Run the existing frontend suite**

Run: `cd apps/frontend && npx jest`
Expected: PASS — every test that touches `api` already mocks it (via `jest.mock("@/lib/axios", ...)` or by mocking the feature service directly), so no test should depend on the removed `getSession()`/Bearer-header logic. If any test fails here, it was relying on that removed interceptor behavior directly — fix that test to mock `api` instead of asserting on the header.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/lib/axios.ts
git commit -m "refactor(api): route lib/axios.ts through the server-side proxy, drop client-side token handling"
```

---

## Task 6: Frontend — `LoginForm` falls back to CompanyAdmin and routes by `actorType`

**Files:**
- Modify: `apps/frontend/src/features/auth/login-form.tsx`
- Modify: `apps/frontend/src/features/auth/login-form.test.tsx`
- Modify: `apps/frontend/src/messages/en.json`
- Modify: `apps/frontend/src/messages/pt-BR.json`

**Interfaces:**
- Consumes: `signIn("credentials", { email, password, redirect: false }): Promise<{ ok: boolean; error?: string } | undefined>` and `getSession(): Promise<Session | null>` from `next-auth/react` (Task 3 makes `Session.user.actorType` available).
- Produces: on success, navigates to `/work-hours` (`actorType: "USER"`) or `/company-admin/dashboard` (`actorType: "COMPANY_ADMIN"`); the dedicated CompanyAdmin login link is gone from this form.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `apps/frontend/src/features/auth/login-form.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import { LoginForm } from "./login-form";

const signInMock = jest.fn();
const getSessionMock = jest.fn();
const pushMock = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "signIn" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends a User to /work-hours after a successful login", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });
    getSessionMock.mockResolvedValueOnce({
      user: { email: "user@test.local", actorType: "USER" },
    });

    render(<LoginForm />);
    await fillAndSubmit("user@test.local", "password123");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/work-hours"));
  });

  it("sends a CompanyAdmin to /company-admin/dashboard after a successful login", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });
    getSessionMock.mockResolvedValueOnce({
      user: { email: "admin@acme.com", actorType: "COMPANY_ADMIN" },
    });

    render(<LoginForm />);
    await fillAndSubmit("admin@acme.com", "password123");

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard")
    );
  });

  it("shows an inline error and does not navigate when credentials are invalid", async () => {
    signInMock.mockResolvedValueOnce({
      ok: false,
      error: "CredentialsSignin",
    });

    render(<LoginForm />);
    await fillAndSubmit("nobody@test.local", "wrong-password");

    expect(
      await screen.findByText("Invalid email or password.")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not render a separate company-admin login link", () => {
    render(<LoginForm />);

    expect(
      screen.queryByRole("link", { name: "companyAdminLink" })
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx`
Expected: FAIL — `LoginForm` still always redirects to `/work-hours` via `signIn`'s own `redirect: true`, and still renders the company-admin link.

- [ ] **Step 3: Rewrite `LoginForm`**

Replace the full contents of `apps/frontend/src/features/auth/login-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.ok) {
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();
      const destination =
        session?.user?.actorType === "COMPANY_ADMIN"
          ? "/company-admin/dashboard"
          : "/work-hours";
      router.push(destination);
    } catch (error) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/work-hours" });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.svg"
            alt="Está feito!"
            width={300}
            height={75}
            priority
            className="w-auto h-auto"
          />
        </div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t("description")}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("signIn")}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        type="button"
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {t("signInWithGoogle")}
      </Button>
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          <a href="/forgot-password" className="text-primary hover:underline">
            {t("forgotPassword")}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <a href="/register" className="text-primary hover:underline">
            {t("signUp")}
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Remove the now-unused `companyAdminLink` translation key**

Edit `apps/frontend/src/messages/en.json`, remove the line:

```json
      "companyAdminLink": "Are you a company administrator? Sign in here"
```

Edit `apps/frontend/src/messages/pt-BR.json`, remove the line:

```json
      "companyAdminLink": "É administrador de uma empresa? Entre aqui"
```

(Remove the trailing comma from the preceding line — `"signUp": "..."` — in both files, since `companyAdminLink` was the last key in that block.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/auth/login-form.tsx apps/frontend/src/features/auth/login-form.test.tsx apps/frontend/src/messages/en.json apps/frontend/src/messages/pt-BR.json
git commit -m "feat(auth): LoginForm falls back to CompanyAdmin login and routes by actorType"
```

---

## Task 7: Frontend — CompanyAdmin dashboard uses the NextAuth session

**Files:**
- Modify: `apps/frontend/src/app/[locale]/company-admin/dashboard/layout.tsx`
- Create: `apps/frontend/src/app/[locale]/company-admin/dashboard/layout.test.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/dashboard/page.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/dashboard/page.test.tsx`

**Interfaces:**
- Consumes: `useSession()` / `signOut()` from `next-auth/react` (Task 3's `actorType`).
- Produces: no change to `CompanyAdminDashboardPage`'s or `CompanyAdminDashboardLayout`'s default exports — same components, same rendered output for an authenticated `COMPANY_ADMIN`.

- [ ] **Step 1: Write the failing layout tests**

Create `apps/frontend/src/app/[locale]/company-admin/dashboard/layout.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import CompanyAdminDashboardLayout from "./layout";

const useSessionMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

describe("CompanyAdminDashboardLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when the session actor type is COMPANY_ADMIN", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "admin@acme.com", actorType: "COMPANY_ADMIN" } },
      status: "authenticated",
    });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    expect(screen.getByText("dashboard content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });

  it("redirects to /login when the session belongs to a plain User", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "user@test.local", actorType: "USER" } },
      status: "authenticated",
    });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  it("shows a loading state while the session is resolving", () => {
    useSessionMock.mockReturnValue({ data: undefined, status: "loading" });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard/layout.test.tsx`
Expected: FAIL — the current layout imports `useCompanyAdminAuth`, which this test doesn't mock.

- [ ] **Step 3: Rewrite the dashboard layout**

Replace the full contents of `apps/frontend/src/app/[locale]/company-admin/dashboard/layout.tsx`:

```tsx
"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * MW-24 — Minimal Company Dashboard layout: no Collaborator MainLayout/menu
 * (explicit ticket requirement), just a header with the admin session +
 * logout, and the guard that redirects to /login when there is no
 * CompanyAdmin session.
 */
export default function CompanyAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isCompanyAdmin = session?.user?.actorType === "COMPANY_ADMIN";

  useEffect(() => {
    if (status !== "loading" && !isCompanyAdmin) {
      router.replace("/login");
    }
  }, [status, isCompanyAdmin, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!isCompanyAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Dashboard da Empresa</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Run the layout tests to verify they pass**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard/layout.test.tsx`
Expected: PASS

- [ ] **Step 5: Update the dashboard page's logout call**

Edit `apps/frontend/src/app/[locale]/company-admin/dashboard/page.tsx`. Add the import next to the existing `next/navigation` one:

```typescript
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
```

Remove `useCompanyAdminAuth` from the `@/features/company-admin` import list:

```typescript
import {
  CollaboratorOrigin,
  downloadCompanyDashboardExport,
  useCreateCompanyDomain,
  useCreateCompanyInvite,
  useDeactivateCompany,
  useCompanyDashboardCollaborators,
  useCompanyDashboardOverview,
  useCompanyDomains,
  useCompanyInvites,
  useRequestCompanyDomainConfirmation,
  useRevokeCompanyDomain,
  useRevokeCompanyInvite,
} from "@/features/company-admin";
```

Remove the line `const { logout } = useCompanyAdminAuth();`.

Replace `handleDeactivate`:

```typescript
  const handleDeactivate = async () => {
    await deactivateCompany.mutateAsync();
    setIsDeactivateOpen(false);
    await signOut({ redirect: false });
    router.push("/login?deactivated=1");
  };
```

- [ ] **Step 6: Update the dashboard page test's mocks**

Edit `apps/frontend/src/app/[locale]/company-admin/dashboard/page.test.tsx`. Replace the mock setup at the top of the file:

```tsx
const mutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const mutateMock = jest.fn();
const deactivateMutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const signOutMock = jest.fn();

jest.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

jest.mock("@/features/company-admin", () => ({
  useCompanyDashboardOverview: jest.fn(),
  useCompanyDashboardCollaborators: jest.fn(),
  useCompanyInvites: jest.fn(),
  useCompanyDomains: jest.fn(),
  useCreateCompanyInvite: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeCompanyInvite: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useCreateCompanyDomain: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeCompanyDomain: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useRequestCompanyDomainConfirmation: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useDeactivateCompany: jest.fn(() => ({
    mutateAsync: deactivateMutateAsyncMock,
    isPending: false,
  })),
  downloadCompanyDashboardExport: jest.fn(),
}));
```

Update the deactivation test to assert on `signOutMock` instead of `logoutMock`:

```tsx
    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false })
    );
    expect(deactivateMutateAsyncMock).toHaveBeenCalled();
```

- [ ] **Step 7: Run the dashboard page tests to verify they pass**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard`
Expected: PASS (both `layout.test.tsx` and `page.test.tsx`)

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/app/\[locale\]/company-admin/dashboard/
git commit -m "feat(company-admin): dashboard layout and logout use the NextAuth session"
```

---

## Task 8: Frontend — CompanyAdmin registration authenticates through NextAuth

**Files:**
- Modify: `apps/frontend/src/app/[locale]/company-admin/register/page.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/register/page.test.tsx`

**Interfaces:**
- Consumes: `signIn("credentials", { email, password, redirect: false })` from `next-auth/react`; the `/api/backend/[...path]` proxy from Task 4.
- Produces: registering a Company now establishes a NextAuth session with `actorType: "COMPANY_ADMIN"` (same mechanism `LoginForm` uses), instead of the removed httpOnly-cookie flow.

The page calls `fetch("/api/backend/company-admin/auth/register")`, not the backend URL directly: the register response carries the backend JWT, and going through the proxy keeps it out of the browser's Network panel (Global Constraints). Then `signIn("credentials", ...)` establishes the session.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `apps/frontend/src/app/[locale]/company-admin/register/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminRegisterPage from "./page";

const pushMock = jest.fn();
const signInMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

global.fetch = fetchMock as unknown as typeof fetch;

describe("CompanyAdminRegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers, authenticates through the same session mechanism as login, and redirects straight to the dashboard", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
      }),
    });
    signInMock.mockResolvedValueOnce({ ok: true });

    render(<CompanyAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@acme.com",
      password: "supersecret",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard");
  });

  it("shows the backend's 409 error message and keeps the entered fields", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "An CompanyAdmin already exists with this email",
      }),
    });

    render(<CompanyAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(
      await screen.findByText(
        "An CompanyAdmin already exists with this email"
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();

    expect(screen.getByLabelText("Empresa")).toHaveValue("Acme Inc");
    expect(screen.getByLabelText("Email")).toHaveValue("admin@acme.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("supersecret");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/register/page.test.tsx`
Expected: FAIL — the page still mocks/calls `useCompanyAdminAuth`, not `fetch`/`signIn`.

- [ ] **Step 3: Rewrite the register page's submit handler**

Edit `apps/frontend/src/app/[locale]/company-admin/register/page.tsx`. Replace the imports:

```tsx
"use client";

import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

Remove the `getErrorMessage` helper function entirely (lines 20-29 of the original file) — it decoded axios-shaped errors, which no longer occur here.

Replace the component body from `export default function CompanyAdminRegisterPage()` through the end of `onSubmit`:

```tsx
export default function CompanyAdminRegisterPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(
        "/api/backend/company-admin/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company, email, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Não foi possível criar a conta. Tente novamente."
        );
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error("Não foi possível entrar com a conta criada.");
      }

      router.push("/company-admin/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível criar a conta. Tente novamente.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
```

Leave the rest of the file (the JSX return, including the "Já tem conta?" link) untouched for now — the link target is fixed in Task 9.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/register/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/\[locale\]/company-admin/register/page.tsx apps/frontend/src/app/\[locale\]/company-admin/register/page.test.tsx
git commit -m "feat(company-admin): register page authenticates through NextAuth after signup"
```

---

## Task 9: Frontend — remove the CompanyAdmin-only session infrastructure

**Files:**
- Delete: `apps/frontend/src/features/company-admin/use-company-admin-auth.tsx`
- Modify: `apps/frontend/src/features/company-admin/index.ts`
- Delete: `apps/frontend/src/lib/company-admin-axios.ts`
- Delete: `apps/frontend/src/lib/company-admin-session.ts`
- Delete: `apps/frontend/src/app/api/company-admin/[...path]/route.ts`
- Delete: `apps/frontend/src/app/api/company-admin/logout/route.ts`
- Delete: `apps/frontend/src/app/[locale]/company-admin/login/page.tsx`
- Delete: `apps/frontend/src/app/[locale]/company-admin/login/page.test.tsx`
- Delete: `apps/frontend/src/app/[locale]/company-admin/layout.tsx`
- Modify: `apps/frontend/src/features/company-admin/company-admin-dashboard.service.ts`
- Modify: `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`

**Interfaces:**
- Produces: `apps/frontend/src/features/company-admin/index.ts` no longer exports `CompanyAdminAuthProvider`/`useCompanyAdminAuth`/`CompanyAdminProfile`. Every remaining consumer of the removed files was already migrated in Tasks 6-8.

By this point, nothing outside this task's own delete list references `useCompanyAdminAuth`, `CompanyAdminAuthProvider`, `company-admin-axios`, or `company-admin-session` — confirmed by re-running the grep below after Step 1.

- [ ] **Step 1: Confirm nothing else references the files about to be deleted**

Run: `cd apps/frontend && grep -rln "useCompanyAdminAuth\|CompanyAdminAuthProvider\|company-admin-axios\|company-admin-session\|CompanyAdminProfile" src`

Expected output: only the files listed above (the ones this task deletes or edits). If anything else shows up, stop — a page from an earlier task wasn't fully migrated; go fix it before continuing.

- [ ] **Step 2: Delete the CompanyAdmin-only session files**

```bash
git rm apps/frontend/src/features/company-admin/use-company-admin-auth.tsx
git rm apps/frontend/src/lib/company-admin-axios.ts
git rm apps/frontend/src/lib/company-admin-session.ts
git rm apps/frontend/src/app/api/company-admin/\[...path\]/route.ts
git rm apps/frontend/src/app/api/company-admin/logout/route.ts
git rm apps/frontend/src/app/\[locale\]/company-admin/login/page.tsx
git rm apps/frontend/src/app/\[locale\]/company-admin/login/page.test.tsx
git rm apps/frontend/src/app/\[locale\]/company-admin/layout.tsx
```

- [ ] **Step 3: Drop the removed export from the feature barrel**

Edit `apps/frontend/src/features/company-admin/index.ts`, remove the line:

```typescript
export * from "./use-company-admin-auth";
```

Leaving:

```typescript
export * from "./company-admin-dashboard.service";
export * from "./company-admin-auth.service";
```

- [ ] **Step 4: Point the two remaining services at the generalized proxy**

Edit `apps/frontend/src/features/company-admin/company-admin-dashboard.service.ts`, replace the import line:

```typescript
import { default as companyAdminApi } from "@/lib/axios";
```

Edit `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`, same change:

```typescript
import { default as companyAdminApi } from "@/lib/axios";
```

Every call site in both files keeps using the local name `companyAdminApi` unchanged — only the import source moves.

- [ ] **Step 5: Type-check and run the full frontend suite**

Run: `cd apps/frontend && npx tsc --noEmit && npx jest`
Expected: no type errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A apps/frontend/src/features/company-admin apps/frontend/src/lib apps/frontend/src/app/api/company-admin apps/frontend/src/app/\[locale\]/company-admin/login apps/frontend/src/app/\[locale\]/company-admin/layout.tsx
git commit -m "refactor(company-admin): remove the CompanyAdmin-only session infrastructure"
```

---

## Task 10: Frontend — point the remaining CompanyAdmin links at `/login`

**Files:**
- Modify: `apps/frontend/src/app/[locale]/company-admin/register/page.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/forgot-password/page.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/reset-password/page.tsx`
- Modify: `apps/frontend/src/app/[locale]/company-admin/reset-password/page.test.tsx`

**Interfaces:**
- No new interfaces — these are the last three `href="/company-admin/login"` / `router.push("/company-admin/login")` references in the app (confirmed by the grep in Step 1).

- [ ] **Step 1: Confirm these are the only three remaining references**

Run: `cd apps/frontend && grep -rn "company-admin/login" src`

Expected: exactly the three lines this task fixes (`register/page.tsx:113`, `forgot-password/page.tsx:84`, `reset-password/page.tsx:89`), plus the matching assertion in `reset-password/page.test.tsx:57`.

- [ ] **Step 2: Fix the register page's "already have an account" link**

Edit `apps/frontend/src/app/[locale]/company-admin/register/page.tsx`:

```tsx
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline"
              >
                Entrar
              </Link>
            </p>
```

- [ ] **Step 3: Fix the forgot-password page's "back to login" link**

Edit `apps/frontend/src/app/[locale]/company-admin/forgot-password/page.tsx`:

```tsx
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar pro login
            </Link>
          </div>
```

- [ ] **Step 4: Fix the reset-password page's post-success redirect**

Edit `apps/frontend/src/app/[locale]/company-admin/reset-password/page.tsx`:

```typescript
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
```

Edit `apps/frontend/src/app/[locale]/company-admin/reset-password/page.test.tsx`:

```typescript
    expect(pushMock).toHaveBeenCalledWith("/login");
```

- [ ] **Step 5: Run the affected tests**

Run: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/reset-password`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/\[locale\]/company-admin/register/page.tsx apps/frontend/src/app/\[locale\]/company-admin/forgot-password/page.tsx apps/frontend/src/app/\[locale\]/company-admin/reset-password/page.tsx apps/frontend/src/app/\[locale\]/company-admin/reset-password/page.test.tsx
git commit -m "fix(company-admin): point remaining login links at /login"
```

---

## Task 11: Full suite and manual verification

**Files:** none — this task runs the app and checks it by hand, per the spec's explicit verification gate.

- [ ] **Step 1: Run the full backend and frontend suites**

Run: `cd apps/backend && npx jest`
Expected: PASS

Run: `cd apps/frontend && npx jest && npx tsc --noEmit`
Expected: PASS, no type errors

- [ ] **Step 2: Start the preview stack**

Run: `pnpm preview:start`

Note the printed URLs. Make sure `docker compose -f docker-compose.dev.yml` (postgres/redis) is already running first, per `CLAUDE.md`.

- [ ] **Step 3: Manual check — User login (password)**

In the browser, open the preview frontend URL, go to `/login`, sign in with an existing `User`'s email/password. Confirm redirect to `/work-hours`.

- [ ] **Step 4: Manual check — User login (Google)**

From `/login`, click "Continue with Google" and complete the flow. Confirm redirect to `/work-hours`.

- [ ] **Step 5: Manual check — CompanyAdmin login**

Register a new Company via `/company-admin/register` (or reuse an existing `CompanyAdmin`). Confirm the register flow lands on `/company-admin/dashboard` directly. Then log out, go to `/login`, and sign in with that same `CompanyAdmin`'s email/password. Confirm redirect to `/company-admin/dashboard`.

- [ ] **Step 6: Manual check — wrong credentials**

From `/login`, try a wrong password for an existing `User` email, and a nonexistent email entirely. Confirm both show the same generic "Invalid email or password." message, with no indication of which table the email exists in (if any).

- [ ] **Step 7: Manual check — no token exposure**

With the browser's Network tab open, repeat Steps 3 and 5. Inspect every response body, especially `GET /api/auth/session` and any `/api/backend/*` call. Confirm `accessToken` never appears in any response the browser receives. Also check `document.cookie` in the console — the NextAuth session cookie should be present but marked `HttpOnly` (not readable from `document.cookie`).

- [ ] **Step 8: Manual check — CompanyAdmin logout and deactivation**

From `/company-admin/dashboard`, click "Sair" — confirm redirect to `/login` and that the dashboard is no longer reachable without signing in again. Separately, test "Desativar Empresa" on a disposable test Company and confirm it also ends on `/login`.

- [ ] **Step 9: Stop the preview stack**

Run: `pnpm preview:stop`

- [ ] **Step 10: Final commit (if Steps 1-8 required any fixes)**

If any manual check above required a code fix, commit it now with a message describing what the verification pass caught. If nothing needed fixing, there's nothing to commit for this task.
