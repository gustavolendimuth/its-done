# MW-28 company activation frontend implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The link in the activation email opens a working page, and a company representative can reach the whole activation flow from inside the app.

**Architecture:** Two new Next.js pages under `company-admin/activate` consume the existing backend endpoints (`POST /company-admin/auth/activate/:companyId/request` and `.../activate/confirm`). After confirmation the page signs the new admin in through NextAuth, the same way the register page does. Two entry points lead to the request page: the Collaborator's share menu on a company card, and a banner on the public portal. The banner needs one new public backend endpoint that says whether a company already has an admin.

**Tech stack:** Next.js 14 App Router, next-intl, TanStack Query, axios (`/api/backend` proxy), NextAuth credentials, NestJS, Prisma, Jest, Playwright.

**Spec:** `.tasks/empresa-admin-ativacao-frontend.md` (Task 7 brings it up to date with the decisions below).

Decisions taken on 2026-09-19:
- Scope is the full flow: confirmation page, request page and both entry points.
- Entry points are the share menu on `CompanyCard` (companies with no admin) and a banner on `/client-dashboard/[clientId]`.

## Global constraints

- Identifiers, routes, file names and commit messages in English. UI copy on `company-admin` pages is hardcoded Portuguese, like the sibling pages. Copy in the share menu and the portal banner goes through next-intl in both `en.json` and `pt-BR.json`.
- Routes and query params use `companyId`, never `empresaId`.
- Backend activation endpoints stay as they are. The only backend addition is `GET /public/company/:companyId/activation-status`.
- The backend `access_token` never reaches client code: the Next proxy strips it. The session comes from `signIn("credentials", ...)`.
- Backend answers to remember: request returns 404 (unknown company), 400 (email or domain doesn't prove ownership), 409 (already activated). Confirm returns 400 (bad or expired token) and 409 (already activated, or email already used).
- Frontend tests: `pnpm --filter frontend exec jest <path> --ci`. Backend tests: `pnpm --filter backend exec jest <path>`.
- No attribution lines in commit messages.
- `/company-admin/invite` stays in `KNOWN_MISSING_PAGES`. It belongs to MW-29, not this plan.

## File structure

| File | Change | Responsibility |
|---|---|---|
| `apps/frontend/src/features/company-admin/company-admin-auth.service.ts` | modify | React Query hooks for activation confirm, request and public status |
| `apps/frontend/src/features/company-admin/components/activate-company-banner.tsx` | create | Portal banner, renders only when the company has no admin |
| `apps/frontend/src/features/company-admin/index.ts` | modify | Export the banner |
| `apps/frontend/src/app/[locale]/company-admin/activate/page.tsx` | create | Confirmation page (the emailed link) |
| `apps/frontend/src/app/[locale]/company-admin/activate/request/page.tsx` | create | Request page (`?companyId=`) |
| `apps/frontend/src/features/companies/components/company-share-menu.tsx` | modify | Activation link items for companies with no admin |
| `apps/frontend/src/app/[locale]/client-dashboard/[clientId]/page.tsx` | modify | Render the banner above the overview |
| `apps/frontend/src/messages/en.json`, `pt-BR.json` | modify | New copy |
| `apps/backend/src/companies/companies.service.ts` | modify | `getActivationStatus` |
| `apps/backend/src/companies/public-companies.controller.ts` | create | Public status route |
| `apps/backend/src/companies/companies.module.ts` | modify | Register the controller |
| `apps/backend/src/notifications/frontend-routes.ts` | modify | Drop `/company-admin/activate` from `KNOWN_MISSING_PAGES` |
| `packages/e2e/playwright.config.ts`, `tests/email-links.spec.ts` | modify | Fixed locale and a full-flow browser test |
| `.tasks/empresa-admin-ativacao-frontend.md` | modify | Bring the spec up to date |

---

### Task 1: Confirmation page (fixes the 404)

**Files:**
- Modify: `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`
- Create: `apps/frontend/src/app/[locale]/company-admin/activate/page.tsx`
- Create: `apps/frontend/src/app/[locale]/company-admin/activate/page.test.tsx`
- Modify: `apps/backend/src/notifications/frontend-routes.ts`

**Interfaces:**
- Consumes: `POST /company-admin/auth/activate/confirm` with `{ token, password }`, answering `{ admin: { id, email, companyId } }` (the proxy removes `access_token`).
- Produces: `useConfirmCompanyActivation()` exported from `@/features/company-admin`, a mutation taking `ConfirmCompanyActivationDto` and returning `CompanyAdminAuthResponse`.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/app/[locale]/company-admin/activate/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminActivatePage from "./page";

const pushMock = jest.fn();
const signInMock = jest.fn();
const mutateAsyncMock = jest.fn();
let tokenParam: string | null = "activation-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenParam : null),
  }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

jest.mock("@/features/company-admin", () => ({
  useConfirmCompanyActivation: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

async function fillAndSubmit(password: string, confirmation = password) {
  await userEvent.type(screen.getByLabelText("Senha"), password);
  await userEvent.type(screen.getByLabelText("Confirmar senha"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Ativar conta" }));
}

describe("CompanyAdminActivatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenParam = "activation-token";
  });

  it("confirms with the token, signs in with the returned email and goes to the dashboard", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: true });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      token: "activation-token",
      password: "supersecret",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@acme.com",
      password: "supersecret",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard");
  });

  it("shows an error and no form when the token is missing", () => {
    tokenParam = null;

    render(<CompanyAdminActivatePage />);

    expect(
      screen.getByText("Link de ativação inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("blocks the submit when the passwords differ", async () => {
    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret", "different1");

    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows the backend message and a login link when the company was already activated", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message: "Company is already activated; use the Admin invite flow instead",
        },
      },
    });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Company is already activated; use the Admin invite flow instead"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para o login" })
    ).toHaveAttribute("href", "/login");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("explains that the account exists when the automatic sign-in fails", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: false });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login."
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/page.test.tsx" --ci`
Expected: FAIL with `Cannot find module './page'`.

- [ ] **Step 3: Add the hook**

In `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`, add after `ResetPasswordCompanyAdminDto`:

```ts
export interface ConfirmCompanyActivationDto {
  token: string;
  password: string;
}

export interface CompanyAdminAuthResponse {
  admin: { id: string; email: string; companyId: string };
}
```

and at the end of the file:

```ts
export function useConfirmCompanyActivation() {
  return useMutation({
    mutationFn: async (data: ConfirmCompanyActivationDto) => {
      const res = await companyAdminApi.post<CompanyAdminAuthResponse>(
        "/company-admin/auth/activate/confirm",
        data
      );
      return res.data;
    },
  });
}
```

- [ ] **Step 4: Create the page**

Create `apps/frontend/src/app/[locale]/company-admin/activate/page.tsx`:

```tsx
"use client";

import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

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
import { useConfirmCompanyActivation } from "@/features/company-admin";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Não foi possível ativar a conta. Tente novamente.";
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-destructive" />
        <CardTitle>Não foi possível ativar a conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir para o login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyAdminActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirmActivation = useConfirmCompanyActivation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(
    token ? null : "Link de ativação inválido ou incompleto."
  );

  if (blockingError) {
    return <ErrorCard message={blockingError} />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    let email: string;
    try {
      const result = await confirmActivation.mutateAsync({
        token: token as string,
        password,
      });
      email = result.admin.email;
    } catch (err) {
      setBlockingError(getErrorMessage(err));
      return;
    }

    const session = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!session?.ok) {
      setBlockingError(
        "Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login."
      );
      return;
    }

    router.push("/company-admin/dashboard");
  };

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Ativar conta da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina a senha do primeiro Administrador
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={confirmActivation.isPending}
          >
            {confirmActivation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Ativar conta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminActivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminActivateContent />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/page.test.tsx" --ci`
Expected: PASS, 5 tests.

- [ ] **Step 6: Remove the allowlist entry**

In `apps/backend/src/notifications/frontend-routes.ts` delete the line `'/company-admin/activate': 'MW-28',` so only `'/company-admin/invite': 'MW-29',` remains.

Run: `pnpm --filter backend exec jest src/notifications --ci`
Expected: PASS. (The contract test now requires the page to exist, and it does.)

- [ ] **Step 7: Prove the emailed link opens in a real browser**

Run: `pnpm e2e:email-links` (postgres and redis must be up, no preview running).
Expected: 5 passed. `companyAdminActivate` shows a check mark. Only `companyAdminInvite` still shows the expected-failure mark.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/features/company-admin/company-admin-auth.service.ts \
  "apps/frontend/src/app/[locale]/company-admin/activate" \
  apps/backend/src/notifications/frontend-routes.ts
git commit -m "fix(company-admin): add activation confirmation page (MW-28)"
```

---

### Task 2: Request page

**Files:**
- Modify: `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`
- Create: `apps/frontend/src/app/[locale]/company-admin/activate/request/page.tsx`
- Create: `apps/frontend/src/app/[locale]/company-admin/activate/request/page.test.tsx`

**Interfaces:**
- Consumes: `POST /company-admin/auth/activate/:companyId/request` with `{ email, domain? }`, answering `{ message }`.
- Produces: `useRequestCompanyActivation()`, a mutation taking `RequestCompanyActivationDto { companyId: string; email: string; domain?: string }`. Task 3 and Task 5 link to `/company-admin/activate/request?companyId=<id>`.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/app/[locale]/company-admin/activate/request/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminActivationRequestPage from "./page";

const mutateAsyncMock = jest.fn();
let companyIdParam: string | null = "company-1";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "companyId" ? companyIdParam : null),
  }),
}));

jest.mock("@/features/company-admin", () => ({
  useRequestCompanyActivation: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

const SUBMIT = "Enviar link de ativação";

describe("CompanyAdminActivationRequestPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    companyIdParam = "company-1";
  });

  it("requests activation with the companyId and email, omitting a blank domain", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      message: "If eligible, a confirmation link has been sent.",
    });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "contato@acme.com");
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      companyId: "company-1",
      email: "contato@acme.com",
      domain: undefined,
    });
    expect(
      await screen.findByText(/enviamos um link de confirmação/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("sends the domain when it is filled in", async () => {
    mutateAsyncMock.mockResolvedValueOnce({ message: "ok" });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@acme.com");
    await userEvent.type(
      screen.getByLabelText("Domínio da Empresa (opcional)"),
      "acme.com"
    );
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      companyId: "company-1",
      email: "ana@acme.com",
      domain: "acme.com",
    });
  });

  it("shows an error and no form when the companyId is missing", () => {
    companyIdParam = null;

    render(<CompanyAdminActivationRequestPage />);

    expect(
      screen.getByText("Link inválido: a Empresa não foi identificada.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("keeps the form and shows the backend message on 400", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message:
            "The email must match the Company's registered contact email, or a domain must be declared",
        },
      },
    });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "outro@acme.com");
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(
      await screen.findByText(/must match the Company's registered contact email/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("outro@acme.com");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/request" --ci`
Expected: FAIL with `Cannot find module './page'`.

- [ ] **Step 3: Add the hook**

In `company-admin-auth.service.ts`, add the type next to the other DTOs:

```ts
export interface RequestCompanyActivationDto {
  companyId: string;
  email: string;
  domain?: string;
}
```

and the hook at the end of the file:

```ts
export function useRequestCompanyActivation() {
  return useMutation({
    mutationFn: async ({ companyId, ...body }: RequestCompanyActivationDto) => {
      const res = await companyAdminApi.post<{ message: string }>(
        `/company-admin/auth/activate/${encodeURIComponent(companyId)}/request`,
        body
      );
      return res.data;
    },
  });
}
```

- [ ] **Step 4: Create the page**

Create `apps/frontend/src/app/[locale]/company-admin/activate/request/page.tsx`:

```tsx
"use client";

import { Building2, CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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
import { useRequestCompanyActivation } from "@/features/company-admin";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Não foi possível pedir a ativação. Tente novamente.";
}

function CompanyAdminActivationRequestContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const requestActivation = useRequestCompanyActivation();

  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId) {
      return;
    }
    setError(null);
    try {
      await requestActivation.mutateAsync({
        companyId,
        email,
        domain: domain.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  let body: React.ReactNode;
  if (!companyId) {
    body = (
      <Alert variant="destructive">
        <AlertDescription>
          Link inválido: a Empresa não foi identificada.
        </AlertDescription>
      </Alert>
    );
  } else if (sent) {
    body = (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Se os dados conferirem, enviamos um link de confirmação para o email
          informado. O link expira em 1 hora.
        </AlertDescription>
      </Alert>
    );
  } else {
    body = (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domínio da Empresa (opcional)</Label>
          <Input
            id="domain"
            type="text"
            placeholder="empresa.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Preencha se o seu email não for o contato cadastrado da Empresa. O
            email precisa pertencer a esse domínio.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={requestActivation.isPending}
        >
          {requestActivation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Enviar link de ativação
        </Button>
      </form>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Ativar conta da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Peça o link de ativação para o Administrador
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default function CompanyAdminActivationRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminActivationRequestContent />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate" --ci`
Expected: PASS, 9 tests across both pages.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/company-admin/company-admin-auth.service.ts \
  "apps/frontend/src/app/[locale]/company-admin/activate/request"
git commit -m "feat(company-admin): add company activation request page (MW-28)"
```

---

### Task 3: Entry point in the Collaborator's share menu

**Files:**
- Modify: `apps/frontend/src/features/companies/components/company-share-menu.tsx`
- Create: `apps/frontend/src/features/companies/components/company-share-menu.test.tsx`
- Modify: `apps/frontend/src/messages/en.json`, `apps/frontend/src/messages/pt-BR.json` (namespace `clients`)

**Interfaces:**
- Consumes: `Company.hasActiveAdmin?: boolean` (already returned by the API), and the request page route from Task 2.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/features/companies/components/company-share-menu.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import { CompanyShareMenu } from "./company-share-menu";

import { Company } from "@/features/companies/types";

const toastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: jest.fn(),
  },
}));

const messages = {
  clients: {
    share: "Share",
    shareClientDashboard: "Share dashboard",
    copyLink: "Copy link",
    shareViaWhatsApp: "Share via WhatsApp",
    sendViaEmail: "Send via email",
    linkCopiedToClipboard: "Link copied",
    failedToCopyLink: "Copy failed",
    whatsappShareMessage: "Dashboard link",
    emailShareSubject: "Dashboard",
    emailShareBody: "Dashboard body",
    shareActivationLink: "Invite company to activate",
    copyActivationLink: "Copy activation link",
    shareActivationViaWhatsApp: "Activation via WhatsApp",
    sendActivationViaEmail: "Activation via email",
    activationWhatsappMessage: "Activation link",
    activationEmailSubject: "Activation",
    activationEmailBody: "Activation body",
  },
};

const baseCompany: Company = {
  id: "c1",
  email: "contact@acme.test",
  company: "Acme",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function setup(company: Company) {
  const user = userEvent.setup();
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CompanyShareMenu company={company} />
    </NextIntlClientProvider>
  );

  return { user, writeText, openSpy };
}

describe("CompanyShareMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("still copies the dashboard link", async () => {
    const { user, writeText } = setup({ ...baseCompany, hasActiveAdmin: true });

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/client-dashboard/c1`
    );
  });

  it("hides the activation items when the company already has an admin", async () => {
    const { user } = setup({ ...baseCompany, hasActiveAdmin: true });

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(
      screen.queryByText("Invite company to activate")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Copy activation link" })
    ).not.toBeInTheDocument();
  });

  it("copies the activation request link when the company has no admin", async () => {
    const { user, writeText } = setup({ ...baseCompany, hasActiveAdmin: false });

    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByText("Invite company to activate")).toBeInTheDocument();
    await user.click(
      screen.getByRole("menuitem", { name: "Copy activation link" })
    );

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/company-admin/activate/request?companyId=c1`
    );
    expect(toastSuccess).toHaveBeenCalledWith("Link copied");
  });

  it("opens WhatsApp and the mail client for the activation link", async () => {
    const { user, openSpy } = setup({ ...baseCompany, hasActiveAdmin: false });

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Activation via WhatsApp" })
    );
    expect(openSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/\?text=/),
      "_blank"
    );

    await user.click(screen.getByRole("button", { name: "Share" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Activation via email" })
    );
    expect(openSpy).toHaveBeenLastCalledWith(
      expect.stringMatching(/^mailto:contact@acme\.test\?subject=/)
    );
  });
});
```

The next-intl mock in `src/test/setup.ts` does not interpolate `{url}`, so the tests assert the copied URL exactly and only the prefix of the WhatsApp and mail links. All three use the same `activationUrl()` helper, so the copy test covers the URL.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter frontend exec jest src/features/companies/components/company-share-menu.test.tsx --ci`
Expected: the first test passes, the other three FAIL (`Unable to find ... "Copy activation link"`).

- [ ] **Step 3: Add the copy to both message files**

In `apps/frontend/src/messages/en.json`, replace

```json
    "linkedBadgeNote": "This company has an active account and sees your aggregated hours."
  },
```

with

```json
    "linkedBadgeNote": "This company has an active account and sees your aggregated hours.",
    "shareActivationLink": "Invite company to activate its account",
    "copyActivationLink": "Copy activation link",
    "shareActivationViaWhatsApp": "Activation link via WhatsApp",
    "sendActivationViaEmail": "Activation link via email",
    "activationWhatsappMessage": "Hi! Activate your company's account on Its Done to see the aggregated hours of everyone who works with you: {url}",
    "activationEmailSubject": "Activate your company's account - {company}",
    "activationEmailBody": "Hi,\n\nYou can activate your company's account at the following link:\n\n{url}\n\nBest regards"
  },
```

In `apps/frontend/src/messages/pt-BR.json`, replace

```json
    "linkedBadgeNote": "Essa empresa tem conta ativa e vê o agregado das suas horas."
  },
```

with

```json
    "linkedBadgeNote": "Essa empresa tem conta ativa e vê o agregado das suas horas.",
    "shareActivationLink": "Convidar a empresa a ativar a conta",
    "copyActivationLink": "Copiar link de ativação",
    "shareActivationViaWhatsApp": "Link de ativação por WhatsApp",
    "sendActivationViaEmail": "Link de ativação por Email",
    "activationWhatsappMessage": "Olá! Ative a conta da sua empresa no Its Done pra ver o agregado das horas de todos que trabalham com você: {url}",
    "activationEmailSubject": "Ative a conta da sua empresa - {company}",
    "activationEmailBody": "Olá,\n\nVocê pode ativar a conta da sua empresa no seguinte link:\n\n{url}\n\nAtenciosamente"
  },
```

- [ ] **Step 4: Rewrite the menu component**

Replace the body of `apps/frontend/src/features/companies/components/company-share-menu.tsx` with:

```tsx
"use client";

import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Company } from "@/features/companies/types";

interface CompanyShareMenuProps {
  company: Company;
}

export function CompanyShareMenu({ company }: CompanyShareMenuProps) {
  const t = useTranslations("clients");

  const buildUrl = (path: string) => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";

    return `${baseUrl}${path}`;
  };

  const dashboardUrl = () => buildUrl(`/client-dashboard/${company.id}`);
  const activationUrl = () =>
    buildUrl(
      `/company-admin/activate/request?companyId=${encodeURIComponent(company.id)}`
    );

  // Only offered when the API says the company has no admin. `undefined`
  // (older payloads) hides it rather than showing it to already-active companies.
  const canInviteToActivate = company.hasActiveAdmin === false;

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopiedToClipboard"));
    } catch (_error) {
      toast.error(t("failedToCopyLink"));
    }
  };

  const openWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const openMailClient = (subject: string, body: string) => {
    window.open(
      `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleShareClick}
        >
          <Share2 className="h-4 w-4 mr-1" />
          {t("share")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("shareClientDashboard")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copy(dashboardUrl())}>
          <Copy className="mr-2 h-4 w-4" />
          <span>{t("copyLink")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openWhatsApp(t("whatsappShareMessage", { url: dashboardUrl() }))
          }
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>{t("shareViaWhatsApp")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openMailClient(
              t("emailShareSubject", { company: company.company }),
              t("emailShareBody", { url: dashboardUrl() })
            )
          }
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>{t("sendViaEmail")}</span>
        </DropdownMenuItem>

        {canInviteToActivate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("shareActivationLink")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => copy(activationUrl())}>
              <Copy className="mr-2 h-4 w-4" />
              <span>{t("copyActivationLink")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openWhatsApp(
                  t("activationWhatsappMessage", { url: activationUrl() })
                )
              }
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>{t("shareActivationViaWhatsApp")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openMailClient(
                  t("activationEmailSubject", { company: company.company }),
                  t("activationEmailBody", { url: activationUrl() })
                )
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>{t("sendActivationViaEmail")}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter frontend exec jest src/features/companies --ci`
Expected: PASS, including the existing `edit-company-modal` tests.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/companies/components/company-share-menu.tsx \
  apps/frontend/src/features/companies/components/company-share-menu.test.tsx \
  apps/frontend/src/messages/en.json apps/frontend/src/messages/pt-BR.json
git commit -m "feat(companies): share the activation link for companies without an admin (MW-28)"
```

---

### Task 4: Public activation status endpoint

**Files:**
- Modify: `apps/backend/src/companies/companies.service.ts`
- Modify: `apps/backend/src/companies/companies.service.spec.ts`
- Create: `apps/backend/src/companies/public-companies.controller.ts`
- Modify: `apps/backend/src/companies/companies.module.ts`

**Interfaces:**
- Produces: `GET /public/company/:companyId/activation-status` answering `{ hasActiveAdmin: boolean }`, no auth, 404 for an unknown company. Task 5 consumes it. It sits next to `PublicInvoicesController`, which already exposes a company's invoices to anyone holding the id. The id is a UUID, so this adds one boolean to what the portal already shows.

- [ ] **Step 1: Write the failing tests**

In `apps/backend/src/companies/companies.service.spec.ts`, add the import at the top:

```ts
import { NotFoundException } from '@nestjs/common';
```

add `findUnique: jest.fn(),` to `prismaMock.company` (next to `findMany` and `findFirst`), and add this block before the final closing `});`:

```ts
  describe('getActivationStatus()', () => {
    it('returns hasActiveAdmin: true when the company has an admin', async () => {
      prismaMock.company.findUnique.mockResolvedValueOnce({
        _count: { companyAdmins: 1 },
      });

      await expect(service.getActivationStatus('company-1')).resolves.toEqual({
        hasActiveAdmin: true,
      });
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        select: { _count: { select: { companyAdmins: true } } },
      });
    });

    it('returns hasActiveAdmin: false when the company has no admin', async () => {
      prismaMock.company.findUnique.mockResolvedValueOnce({
        _count: { companyAdmins: 0 },
      });

      await expect(service.getActivationStatus('company-2')).resolves.toEqual({
        hasActiveAdmin: false,
      });
    });

    it('throws NotFoundException for an unknown company', async () => {
      prismaMock.company.findUnique.mockResolvedValueOnce(null);

      await expect(service.getActivationStatus('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter backend exec jest src/companies/companies.service.spec.ts`
Expected: FAIL, `Property 'getActivationStatus' does not exist on type 'CompaniesService'`.

- [ ] **Step 3: Add the service method**

In `apps/backend/src/companies/companies.service.ts`, add after `findOne`:

```ts
  // Public (no user scope): the portal uses it to decide whether to offer
  // "activate this company". Exposes only a boolean.
  async getActivationStatus(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { _count: { select: { companyAdmins: true } } },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return { hasActiveAdmin: company._count.companyAdmins > 0 };
  }
```

- [ ] **Step 4: Add the controller and register it**

Create `apps/backend/src/companies/public-companies.controller.ts`:

```ts
import { Controller, Get, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';

// No auth guard, same as PublicInvoicesController.
@Controller('public/company/:companyId')
export class PublicCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('activation-status')
  getActivationStatus(@Param('companyId') companyId: string) {
    return this.companiesService.getActivationStatus(companyId);
  }
}
```

In `apps/backend/src/companies/companies.module.ts`, import it and change the controllers list:

```ts
import { PublicCompaniesController } from './public-companies.controller';
// ...
  controllers: [CompaniesController, PublicCompaniesController],
```

- [ ] **Step 5: Run the tests and the typecheck**

Run: `pnpm --filter backend exec jest src/companies --ci && pnpm --filter backend exec tsc --noEmit -p tsconfig.json`
Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/companies
git commit -m "feat(companies): add public activation status endpoint (MW-28)"
```

---

### Task 5: Entry point on the public portal

**Files:**
- Modify: `apps/frontend/src/features/company-admin/company-admin-auth.service.ts`
- Create: `apps/frontend/src/features/company-admin/components/activate-company-banner.tsx`
- Create: `apps/frontend/src/features/company-admin/components/activate-company-banner.test.tsx`
- Modify: `apps/frontend/src/features/company-admin/index.ts`
- Modify: `apps/frontend/src/app/[locale]/client-dashboard/[clientId]/page.tsx`
- Modify: `apps/frontend/src/messages/en.json`, `apps/frontend/src/messages/pt-BR.json` (new namespace `companyActivation`)

**Interfaces:**
- Consumes: the status endpoint from Task 4 and the request route from Task 2.
- Produces: `usePublicActivationStatus(companyId?: string)` returning `{ hasActiveAdmin: boolean }`, and `<ActivateCompanyBanner companyId={string} />`.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/features/company-admin/components/activate-company-banner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { ActivateCompanyBanner } from "./activate-company-banner";

import "@testing-library/jest-dom";

const useStatusMock = jest.fn();

jest.mock("../company-admin-auth.service", () => ({
  usePublicActivationStatus: (...args: unknown[]) => useStatusMock(...args),
}));

const messages = {
  companyActivation: {
    bannerTitle: "Do you represent this company?",
    bannerDescription: "Activate the company account.",
    bannerCta: "Activate my company",
  },
};

function renderBanner() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ActivateCompanyBanner companyId="c1" />
    </NextIntlClientProvider>
  );
}

describe("ActivateCompanyBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("links to the request page when the company has no admin", () => {
    useStatusMock.mockReturnValue({ data: { hasActiveAdmin: false } });

    renderBanner();

    expect(useStatusMock).toHaveBeenCalledWith("c1");
    expect(screen.getByText("Do you represent this company?")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Activate my company" })
    ).toHaveAttribute("href", "/company-admin/activate/request?companyId=c1");
  });

  it("renders nothing when the company already has an admin", () => {
    useStatusMock.mockReturnValue({ data: { hasActiveAdmin: true } });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while loading or when the status request fails", () => {
    useStatusMock.mockReturnValue({ data: undefined });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter frontend exec jest src/features/company-admin/components --ci`
Expected: FAIL with `Cannot find module './activate-company-banner'`.

- [ ] **Step 3: Add the hook**

In `company-admin-auth.service.ts`, change the first import to `import { useMutation, useQuery } from "@tanstack/react-query";` and add at the end of the file:

```ts
export function usePublicActivationStatus(companyId: string | undefined) {
  return useQuery({
    queryKey: ["publicActivationStatus", companyId],
    queryFn: async () => {
      const res = await companyAdminApi.get<{ hasActiveAdmin: boolean }>(
        `/public/company/${encodeURIComponent(companyId as string)}/activation-status`
      );
      return res.data;
    },
    enabled: !!companyId,
    retry: false,
  });
}
```

- [ ] **Step 4: Add the copy**

In `en.json`, replace

```json
  },
  "projects": {
    "title": "Projects",
```

with

```json
  },
  "companyActivation": {
    "bannerTitle": "Do you represent this company?",
    "bannerDescription": "Activate the company account to see the aggregated hours of everyone who works with you.",
    "bannerCta": "Activate my company"
  },
  "projects": {
    "title": "Projects",
```

In `pt-BR.json`, replace

```json
  },
  "projects": {
    "title": "Projetos",
```

with

```json
  },
  "companyActivation": {
    "bannerTitle": "Você representa esta Empresa?",
    "bannerDescription": "Ative a conta da Empresa pra ver o agregado das horas de todos que trabalham com você.",
    "bannerCta": "Ativar minha Empresa"
  },
  "projects": {
    "title": "Projetos",
```

- [ ] **Step 5: Create the banner and export it**

Create `apps/frontend/src/features/company-admin/components/activate-company-banner.tsx`:

```tsx
"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { usePublicActivationStatus } from "../company-admin-auth.service";

import { Button } from "@/components/ui/button";

interface ActivateCompanyBannerProps {
  companyId: string;
}

export function ActivateCompanyBanner({
  companyId,
}: ActivateCompanyBannerProps) {
  const t = useTranslations("companyActivation");
  const { data } = usePublicActivationStatus(companyId);

  // Hidden while loading, on error, and once the company has an admin.
  if (data?.hasActiveAdmin !== false) {
    return null;
  }

  return (
    <div className="bg-primary/5 border-b">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-medium">{t("bannerTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("bannerDescription")}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link
            href={`/company-admin/activate/request?companyId=${encodeURIComponent(companyId)}`}
          >
            {t("bannerCta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

In `apps/frontend/src/features/company-admin/index.ts` add:

```ts
export * from "./components/activate-company-banner";
```

- [ ] **Step 6: Render it on the portal**

In `apps/frontend/src/app/[locale]/client-dashboard/[clientId]/page.tsx`, add the import (with the other `@/features` imports):

```tsx
import { ActivateCompanyBanner } from "@/features/company-admin";
```

and replace the last line of the component

```tsx
  return <Overview data={overviewData} isLoading={isLoading} error={error} />;
```

with

```tsx
  return (
    <>
      <ActivateCompanyBanner companyId={clientId as string} />
      <Overview data={overviewData} isLoading={isLoading} error={error} />
    </>
  );
```

- [ ] **Step 7: Run tests and typecheck**

Run: `pnpm --filter frontend exec jest src/features/company-admin src/features/dashboard --ci && pnpm --filter frontend exec tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/features/company-admin \
  "apps/frontend/src/app/[locale]/client-dashboard" \
  apps/frontend/src/messages/en.json apps/frontend/src/messages/pt-BR.json
git commit -m "feat(company-admin): offer activation on the public portal (MW-28)"
```

---

### Task 6: Prove the whole flow in a browser

**Files:**
- Modify: `packages/e2e/playwright.config.ts`
- Modify: `packages/e2e/tests/email-links.spec.ts`

next-intl detects the locale from `Accept-Language`, and Chromium defaults to `en-US`. Without a fixed locale the portal banner would render in English and the Portuguese selectors below would miss.

- [ ] **Step 1: Fix the browser locale**

In `packages/e2e/playwright.config.ts`, change the `use` block to:

```ts
  use: {
    locale: "pt-BR",
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
  },
```

- [ ] **Step 2: Share the link extraction and keep the user token**

In `packages/e2e/tests/email-links.spec.ts`, add below `const emailedLinks = ...`:

```ts
let userToken = "";
```

Replace `collectLinks` with these two functions:

```ts
function frontendLinksIn(html: string): string[] {
  const frontendOrigin = new URL(FRONTEND_URL).origin;
  const links: string[] = [];
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(href.replace(/&amp;/g, "&"));
    if (url.origin === frontendOrigin && url.search) {
      links.push(url.toString());
    }
  }
  return links;
}

function collectLinks(html: string) {
  for (const link of frontendLinksIn(html)) {
    emailedLinks.set(new URL(link).pathname, link);
  }
}
```

In `beforeAll`, right after the `const user = await api("/auth/register", ...)` call, add:

```ts
  userToken = user.access_token;
```

- [ ] **Step 3: Add the full-flow test**

Append to the same file, before the final `every route in FRONTEND_ROUTES is exercised by an email` test:

```ts
test("a company representative activates from the public portal and lands on the dashboard", async ({
  page,
}) => {
  const run = Date.now();
  const contact = `e2e-flow-${run}@example.test`;
  const company = await api(
    "/companies",
    { company: `E2E Flow ${run}`, email: contact },
    userToken,
  );

  // Entry point: the public portal banner.
  await page.goto(`${FRONTEND_URL}/client-dashboard/${company.id}`);
  await page.getByRole("link", { name: "Ativar minha Empresa" }).click();
  await expect(page).toHaveURL(
    `${FRONTEND_URL}/company-admin/activate/request?companyId=${company.id}`,
  );

  // Request page.
  await page.getByLabel("Email").fill(contact);
  await page.getByRole("button", { name: "Enviar link de ativação" }).click();
  await expect(page.getByText(/enviamos um link de confirmação/)).toBeVisible();

  // Emailed link, confirmation page, session, dashboard.
  const email = await mail.waitForEmail(contact, "Activation");
  const [link] = frontendLinksIn(email.html);
  await page.goto(link);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Ativar conta" }).click();
  await expect(page).toHaveURL(`${FRONTEND_URL}/company-admin/dashboard`);
});
```

- [ ] **Step 4: Typecheck and run the smoke**

Run: `pnpm --filter @its-done/e2e run typecheck && pnpm e2e:email-links`
Expected: 6 passed. The flow test ends on `/company-admin/dashboard`. `companyAdminInvite` still shows the expected-failure mark (MW-29).

If the flow test fails at the last `toHaveURL`, look at `logs/preview-frontend.log` and `packages/e2e/test-results/*/error-context.md` first: the usual suspects are `NEXTAUTH_SECRET` missing (the preview script sets it) or `signIn` returning `ok: false`.

- [ ] **Step 5: Commit**

```bash
git add packages/e2e
git commit -m "test(e2e): cover company activation from the portal to the dashboard (MW-28)"
```

---

### Task 7: Bring the spec up to date

**Files:**
- Modify: `.tasks/empresa-admin-ativacao-frontend.md`

The spec still uses the old `empresa-admin` and `empresaId` names, says the backend answers 400 for an already activated company (it answers 409), and lists the entry point as an open blocker. Update it in place (repo rule: one topic, one file).

- [ ] **Step 1: Apply these edits**

Rewrite the file's sections as follows, keeping its existing headings and table formats:

- **Intent:** routes are `/company-admin/activate` (confirmation) and `/company-admin/activate/request?companyId=`. The emailed link (`sendCompanyActivationEmail`, `apps/backend/src/notifications/notifications.service.ts`) pointed to a page that did not exist. The request step needed a `companyId` nobody could obtain.
- **Criteria 1 to 3:** rename `empresaId` to `companyId` and `/empresa-admin/` to `/company-admin/`. Criterion 3 becomes: if the backend answers 400, 404 or 409 (email or domain doesn't prove ownership, unknown company, already activated), the form shows the message returned and stays on the page.
- **Criterion 6:** the backend answers 400 for a bad or expired token and 409 for "already activated" or "email already used". The page shows the returned message and a link to `/login`.
- **New criterion 7:** when the company has no admin (`hasActiveAdmin === false`), the share menu on the company card offers copy, WhatsApp and email for `/company-admin/activate/request?companyId=<id>`. Companies with an admin don't show these items.
- **New criterion 8:** `/client-dashboard/[clientId]` shows a banner with a link to the request page only when `GET /public/company/:companyId/activation-status` returns `hasActiveAdmin: false`. The banner is hidden while loading, on error and once the company has an admin.
- **Surface table:** add `GET /public/company/:companyId/activation-status` (public, no auth, `200` or `404`, criterion 8).
- **Decided:** the entry points are the share menu and the portal banner (both), chosen on 2026-09-19. Query string for `companyId` stays.
- **Unresolved:** delete row 1 (answered). Row 2 (notice about Pending Invites and Authorized Domains after the first login) stays open and stays non-blocking.
- **Sources:** add this plan, `docs/superpowers/plans/2026-09-19-mw-28-company-activation-frontend.md`.

- [ ] **Step 2: Commit**

```bash
git add .tasks/empresa-admin-ativacao-frontend.md \
  docs/superpowers/plans/2026-09-19-mw-28-company-activation-frontend.md
git commit -m "docs(mw-28): update activation spec and add implementation plan"
```

---

## Final verification

- [ ] `pnpm --filter backend exec tsc --noEmit -p tsconfig.json && pnpm --filter backend exec jest --ci --silent`
- [ ] `pnpm --filter frontend exec tsc --noEmit && pnpm --filter frontend exec jest --ci`
- [ ] `pnpm e2e:email-links` (6 passed)
- [ ] Manual look with `pnpm preview:start`: open a company card share menu for a company with no admin, open the portal for it, click through. Run `pnpm preview:stop` after.
- [ ] Move MW-28 to done in Jira. MW-29 (invite page) is the next ticket in the same class and reuses the same pattern.

## Risks

- **Auto sign-in after confirm** goes through NextAuth `authorize`, which tries the `User` login first and then the CompanyAdmin login. It works for register today, and Task 6 checks it end to end, but this is the step most likely to need debugging.
- **Public status endpoint** tells anyone holding a company id whether the company has an admin. Company ids are UUIDs and the portal already exposes that company's invoices to the same holder, so the plan accepts it.
- **Unknown company on the status endpoint** answers 404. The banner treats that like "hide", so a stale link shows no banner rather than an error.
- **Email language** is English (backend template) while the pages are Portuguese. Out of scope here.
