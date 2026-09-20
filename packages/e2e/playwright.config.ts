import { defineConfig } from "@playwright/test";

// The stack (backend, frontend, Postgres, Redis) is started by
// scripts/e2e-email-links.sh, which also exports these URLs.
export default defineConfig({
  testDir: "./tests",
  // Tests share the emails captured by one mock Resend server, so run in order.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // `next dev` compiles each page on first visit.
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    locale: "pt-BR",
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
