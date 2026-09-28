import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

// Regression: right after signing in, every /api/backend call answered 401 (the
// proxy could not read the NextAuth session cookie), and the axios interceptor
// sent the user back to /login. Both unit levels passed because they mock
// getToken; this drives a real browser through sign-in and checks the calls
// the landing page makes. Run through scripts/e2e-email-links.sh.

const BACKEND_URL = requiredEnv("E2E_BACKEND_URL");
const FRONTEND_URL = requiredEnv("E2E_FRONTEND_URL");
// `next dev` compiles each page on first visit, longer than expect's 5s default.
const NEXT_DEV_COMPILE_MS = 30_000;
const PASSWORD = `E2e-${randomUUID()}`;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run this through scripts/e2e-email-links.sh (pnpm e2e:email-links).`,
    );
  }
  return value;
}

async function api(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST /api${path} -> ${res.status}: ${await res.text()}`);
  }
}

async function signInThroughTheForm(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
}

// Collects every proxied call the page makes, with its status.
function trackProxyCalls(page: import("@playwright/test").Page) {
  const calls: { path: string; status: number }[] = [];
  page.on("response", (res) => {
    const { pathname } = new URL(res.url());
    if (pathname.startsWith("/api/backend/")) {
      calls.push({ path: pathname, status: res.status() });
    }
  });
  return calls;
}

test.describe("signing in keeps the session on the backend proxy", () => {
  test("a user lands on /work-hours, its data calls succeed and it is not sent back to /login", async ({
    page,
  }) => {
    const email = `e2e-session-user-${Date.now()}@example.test`;
    await api("/auth/register", {
      name: "E2E Session",
      email,
      password: PASSWORD,
    });
    const calls = trackProxyCalls(page);

    await signInThroughTheForm(page, email);

    await expect(page).toHaveURL(`${FRONTEND_URL}/work-hours`, {
      timeout: NEXT_DEV_COMPILE_MS,
    });
    // The landing page fetches its data through the proxy.
    await expect
      .poll(() => calls.some((c) => c.path === "/api/backend/work-hours"), {
        timeout: NEXT_DEV_COMPILE_MS,
      })
      .toBe(true);
    // Give an interceptor redirect time to happen if a call had failed.
    await page.waitForTimeout(3_000);

    expect(calls.filter((c) => c.status === 401)).toEqual([]);
    expect(calls.filter((c) => c.status >= 400)).toEqual([]);
    expect(new URL(page.url()).pathname).toBe("/work-hours");
  });

  test("a company admin lands on the dashboard and its calls succeed", async ({
    page,
  }) => {
    const run = Date.now();
    const email = `e2e-session-admin-${run}@example.test`;
    await api("/company-admin/auth/register", {
      company: `E2E Session ${run}`,
      email,
      password: PASSWORD,
    });
    const calls = trackProxyCalls(page);

    await signInThroughTheForm(page, email);

    await expect(page).toHaveURL(`${FRONTEND_URL}/company-admin/dashboard`, {
      timeout: NEXT_DEV_COMPILE_MS,
    });
    await expect
      .poll(() => calls.length, { timeout: NEXT_DEV_COMPILE_MS })
      .toBeGreaterThan(0);
    await page.waitForTimeout(3_000);

    expect(calls.filter((c) => c.status === 401)).toEqual([]);
    expect(new URL(page.url()).pathname).toBe("/company-admin/dashboard");
  });
});
