import { normalizeUrl } from '../utils/url';

/**
 * Single source of truth for every frontend page the backend links to from an
 * email or notification. Paths must match a `page.tsx` under
 * `apps/frontend/src/app`; `frontend-links.contract.spec.ts` enforces that and
 * the Playwright smoke in `packages/e2e` clicks each link for real.
 */
export const FRONTEND_ROUTES = {
  resetPassword: '/reset-password',
  companyAdminResetPassword: '/company-admin/reset-password',
  companyAdminActivate: '/company-admin/activate',
  companyAdminInvite: '/company-admin/invite',
} as const;

export type FrontendRouteName = keyof typeof FRONTEND_ROUTES;

/**
 * Routes above whose page is not built yet, keyed by path, valued by the
 * ticket that builds it. The contract test and the smoke both fail once an
 * entry becomes resolvable, so this list only ever shrinks.
 */
export const KNOWN_MISSING_PAGES: Record<string, string> = {
  '/company-admin/invite': 'MW-29',
};

export function buildFrontendUrl(
  baseUrl: string | undefined,
  route: FrontendRouteName,
  query: Record<string, string> = {},
): string {
  const base = normalizeUrl(baseUrl || 'localhost:3000');
  const search = new URLSearchParams(query).toString();
  return `${base}${FRONTEND_ROUTES[route]}${search ? `?${search}` : ''}`;
}
