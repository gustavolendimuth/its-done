import { expect, test } from "@playwright/test";
import {
  FRONTEND_ROUTES,
  KNOWN_MISSING_PAGES,
} from "../../../apps/backend/src/notifications/frontend-routes";
import { MockResend } from "./support/mock-resend";

// Smoke: trigger every email that carries a frontend link, then open each link
// in a real browser. Catches the MW-28/MW-29 class of bug: a backend that emails
// a URL nobody built. Run through scripts/e2e-email-links.sh.

const BACKEND_URL = requiredEnv("E2E_BACKEND_URL");
const FRONTEND_URL = requiredEnv("E2E_FRONTEND_URL");
const MAIL_PORT = Number(process.env.E2E_MAIL_PORT ?? 4010);
const PASSWORD = "E2e-Passw0rd!";
// `next dev` compiles each page on first visit, longer than expect's 5s default.
const NEXT_DEV_COMPILE_MS = 30_000;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run this through scripts/e2e-email-links.sh (pnpm e2e:email-links).`,
    );
  }
  return value;
}

const mail = new MockResend();
// path -> full URL found in an email, filled by beforeAll
const emailedLinks = new Map<string, string>();
let userToken = "";

async function api<T = any>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /api${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}

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

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await mail.start(MAIL_PORT);

  const run = Date.now();
  const email = (label: string) => `e2e-${label}-${run}@example.test`;

  // Regular user: password reset.
  const user = await api("/auth/register", {
    name: "E2E User",
    email: email("user"),
    password: PASSWORD,
  });
  userToken = user.access_token;
  await api("/auth/forgot-password", { email: email("user") });
  collectLinks((await mail.waitForEmail(email("user"), "Reset")).html);

  // Company admin: password reset and invite.
  const admin = await api("/company-admin/auth/register", {
    company: `E2E Company ${run}`,
    email: email("admin"),
    password: PASSWORD,
  });
  await api("/company-admin/auth/forgot-password", { email: email("admin") });
  collectLinks((await mail.waitForEmail(email("admin"), "Reset")).html);

  await api(
    "/company-admin/auth/invite",
    { email: email("invitee") },
    admin.access_token,
  );
  collectLinks((await mail.waitForEmail(email("invitee"), "invited")).html);

  // Company without an admin: activation.
  const company = await api(
    "/companies",
    { company: `E2E Orphan ${run}`, email: email("contact") },
    user.access_token,
  );
  await api(`/company-admin/auth/activate/${company.id}/request`, {
    email: email("contact"),
  });
  collectLinks((await mail.waitForEmail(email("contact"), "Activation")).html);
});

test.afterAll(async () => {
  await mail.stop();
});

for (const [name, path] of Object.entries(FRONTEND_ROUTES)) {
  test(`${name}: emailed link to ${path} opens a real page`, async ({
    page,
  }) => {
    const knownMissing = KNOWN_MISSING_PAGES[path];
    // Inverted expectation: fails if the page starts working, which forces the
    // allowlist entry to be removed once the ticket ships. E2E_STRICT=1 drops
    // the inversion to see the real failure.
    test.fail(
      !!knownMissing && !process.env.E2E_STRICT,
      `${knownMissing}: page not built yet`,
    );

    const url = emailedLinks.get(path);
    expect(
      url,
      `No email in the smoke produced a link to ${path}. Add a trigger for it in beforeAll.`,
    ).toBeTruthy();

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(url!);

    expect(response?.status(), `GET ${url}`).toBeLessThan(400);
    expect(new URL(page.url()).pathname, "link redirected elsewhere").toBe(
      path,
    );
    expect(pageErrors, "uncaught errors while rendering").toEqual([]);
  });
}

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
    { timeout: NEXT_DEV_COMPILE_MS },
  );

  // Request page.
  await page.getByLabel("Email").fill(contact);
  await page.getByRole("button", { name: "Enviar link de ativação" }).click();
  await expect(page.getByText(/enviamos um link de confirmação/)).toBeVisible({
    timeout: NEXT_DEV_COMPILE_MS,
  });

  // Emailed link, confirmation page, session, dashboard.
  const email = await mail.waitForEmail(contact, "Activation");
  const [link] = frontendLinksIn(email.html);
  await page.goto(link);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Ativar conta" }).click();
  await expect(page).toHaveURL(`${FRONTEND_URL}/company-admin/dashboard`, {
    timeout: NEXT_DEV_COMPILE_MS,
  });
});

test("every route in FRONTEND_ROUTES is exercised by an email", () => {
  const missing = Object.values(FRONTEND_ROUTES).filter(
    (path) => !emailedLinks.has(path),
  );
  expect(missing, "routes with no email trigger in beforeAll").toEqual([]);
});
