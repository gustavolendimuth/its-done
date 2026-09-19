/**
 * MW-24 — The CompanyAdmin session is an identity separate from User: it
 * doesn't go through NextAuth. The admin's JWT lives in an httpOnly cookie
 * (never exposed to JS in the browser), following the same security pattern
 * documented for the rest of the application (CLAUDE.md: "JWT tokens stored
 * in HTTP-only cookies"). All backend access goes through the proxy at
 * `app/api/company-admin/[...path]/route.ts`, which reads this cookie
 * server-side and injects the Bearer token into the real call to NestJS.
 */
export const COMPANY_ADMIN_COOKIE_NAME = "company_admin_token";

// Mirrors the backend's `expiresIn: '30d'` from JwtModule (company-admin.module.ts).
export const COMPANY_ADMIN_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function companyAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COMPANY_ADMIN_COOKIE_MAX_AGE_SECONDS,
  };
}
