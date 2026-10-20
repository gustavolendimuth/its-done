# MW-30 authorized domain confirmation email and page

Profile: `light` (no `tlc-implement` declaration in `AGENTS.md`/`CLAUDE.md`; default). Handoff: on, single batch (see `## Handoff`).

Sources:

- Jira MW-30 (https://gustavolendimuth.atlassian.net/browse/MW-30) - 4 acceptance criteria.
- `.tasks/empresa-admin-fix-confirmacao-dominio.md` - full task. Written before the MW-34 rename: `empresa-admin` is now `company-admin`, `DominiosAutorizadosService` is `AuthorizedDomainsService`, `Dominio Autorizado` is `AuthorizedDomain`. Every path below uses the current names.
- No design source: UI copy is fixed here. Nothing is marked binding.

## Out of scope

- Token format (`DOMAIN_CONFIRMATION_TOKEN_TYPE`) and `AuthorizedDomainsService.confirm` - already correct (MW-22).
- Auto-resend of an expired confirmation - the "request confirmation" action in the dashboard Vínculos tab (MW-24) already exists.
- Email language (backend templates are English) - same as the activation and invite emails.
- Moving MW-30 in Jira - outward-facing, needs an explicit go-ahead.

## Landing

Touches `notifications/` (route table, new send method, template), `company-admin/authorized-domains.service.ts`, `features/company-admin` (one hook), one new page under `app/[locale]/company-admin/domains/confirm`, `packages/e2e`. Reuses `buildFrontendUrl`/`FRONTEND_ROUTES`, the `sendCompanyActivationEmail` shape, the invite page's `getErrorMessage`/`ErrorCard` structure, and the smoke's `beforeAll` trigger pattern.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Emailed URL (lives in inboxes, cannot be recalled) | `/company-admin/domains/confirm?token=<jwt>`, route name `companyAdminDomainConfirm` in `FRONTEND_ROUTES` | token as a path segment `/domains/confirm/<jwt>` - puts the token in access logs and `Referer`, and every other emailed link here uses `?token=` |
| New notification method | `sendAuthorizedDomainConfirmationEmail(toEmail: string, domain: string, token: string): Promise<boolean>`, subject `Confirm Authorized Domain - Its Done`, same try/catch-returns-false shape as `sendCompanyActivationEmail` | keep `sendPasswordResetEmail` and only swap the URL - the email would still say "Reset Your Password" for a domain confirmation (task `Decided`) |

- The page fires the POST on mount, not on a button click, because AC2 says opening the link makes the call. A GET-prefetching mail scanner cannot trigger it (it is a POST from client JS), so no click is needed for safety. Guarded by a ref so React StrictMode's double effect cannot send it twice (C2).
- Nothing else in this change is hard to reverse.

## Handoff

Single batch: S1 ~4k, S2 ~10k, S3 ~9k = ~23k reading floor, far under 150k. No token handoff. Orchestrator builds S1-S3, commits, then dispatches one fresh Verifier over `<base>..HEAD` with every check.

## Checks

### S1 - Confirmation page · 4 files · ~4k

**C1** - Opening `/company-admin/domains/confirm?token=abc` with no session provider posts `{ token: "abc" }` to `POST /company-admin/domains/confirm` and, on success, shows "Domínio confirmado" and "O domínio acme.com agora está confirmado." (domain from the response)
Proof: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/domains/confirm/page.test.tsx" --ci -t "confirms the domain from the token and shows its name"`

**C2** - The request is sent exactly once when the page renders under `React.StrictMode`
Proof: same file, `-t "sends the confirmation once under StrictMode"`

**C3** - While the request is pending the page shows "Confirmando domínio…" and neither the success nor the error text
Proof: same file, `-t "shows a loading state while the request is pending"`

**C4** - A backend error (400 `Invalid or expired confirmation token`, 400 `Authorized domain is not pending confirmation`, 404 `Authorized domain not found`) is shown verbatim, and the request is not repeated (1 call)
Proof: same file, `-t "shows the backend message"` (table-driven over the 3 messages)

**C5** - A missing `token` shows "Link de confirmação inválido ou incompleto." and sends no request
Proof: same file, `-t "shows an error and sends no request when the token is missing"`

**C6** - Success and error states both offer a link "Ir para o painel" with `href="/company-admin/dashboard"`
Proof: same file, `-t "links to the dashboard from the success and error states"`

### S2 - Dedicated email · 4 files · ~10k

**C7** - `sendAuthorizedDomainConfirmationEmail("admin@test.local", "acme.com", "tok123")` sends to `admin@test.local` with subject `Confirm Authorized Domain - Its Done`
Proof: `pnpm --filter @its-done/backend exec jest src/notifications/notifications.service.spec.ts -t "sendAuthorizedDomainConfirmationEmail sends to the admin with its own subject"`

**C8** - The email html links to `https://app.test/company-admin/domains/confirm?token=tok123`, names `acme.com`, and contains neither `/reset-password` nor "Reset Your Password"
Proof: same file, `-t "sendAuthorizedDomainConfirmationEmail links to the domain confirmation page"`

**C9** - When sending fails, the method returns `false` and does not throw
Proof: same file, `-t "sendAuthorizedDomainConfirmationEmail returns false when the send fails"`

**C10** - `requestConfirmation` signs the token, calls `sendAuthorizedDomainConfirmationEmail(adminEmail, domain, token)` and never calls `sendPasswordResetEmail`
Proof: `pnpm --filter @its-done/backend exec jest src/company-admin/authorized-domains.service.spec.ts -t "requestConfirmation sends the dedicated confirmation email"`

**C11** - `FRONTEND_ROUTES.companyAdminDomainConfirm` is `/company-admin/domains/confirm`, has a `page.tsx`, and `KNOWN_MISSING_PAGES` stays empty
Proof: `pnpm --filter @its-done/backend exec jest src/notifications/frontend-links.contract.spec.ts -t "companyAdminDomainConfirm"` and `-t "keeps KNOWN_MISSING_PAGES honest"`

### S3 - Emailed link in a real browser · 1 file · ~9k

**C12** - The smoke triggers the domain confirmation email and its link opens a real page (status < 400, no redirect, no page errors)
Proof: `pnpm e2e:email-links -g "companyAdminDomainConfirm"` and `-g "every route in FRONTEND_ROUTES is exercised by an email"`

**C13** - A logged-out browser opening the emailed link sees "Domínio confirmado", the admin's `GET /company-admin/domains` then lists the domain as `CONFIRMED`, and the browser holds no session cookie
Proof: `pnpm e2e:email-links -g "confirms the authorized domain from the emailed link without a session"`

**C14** - Opening the same link a second time shows "Authorized domain is not pending confirmation" and the domain stays `CONFIRMED`
Proof: `pnpm e2e:email-links -g "reusing the domain confirmation link shows the backend error"`

**C15** - A tampered token shows "Invalid or expired confirmation token"
Proof: `pnpm e2e:email-links -g "a tampered domain confirmation token shows the backend error"`

## Swept

- validation: existing - `confirm()` checks `type`, `actorType`, existence and `PENDING` (`authorized-domains.service.ts:112-139`); C4, C14, C15 show the messages. Missing token: C5 (local message, see note below)
- failure modes: C4, C5, C14, C15
- idempotency and retry: C2 (one request per page load), C4 (no repeat after error), C14 (second use gets 400)
- authorization: existing - `POST /company-admin/domains/confirm` is public, the token is the proof (`authorized-domains.controller.ts:52-58`); C1 (no session provider), C13 (no session cookie)
- concurrency and ordering: not in scope - no shared state added; two concurrent confirms are settled by the existing `PENDING` check
- data lifecycle: existing - token expires in 1h (`requestConfirmation` `expiresIn: '1h'`)
- dependency failure: C9 - failed send returns `false`, same as the other notification methods
- state transitions: existing - `PENDING -> CONFIRMED` is `confirm()`; C13 shows it is now reachable from the email
- observability: not in scope - existing `console.log`/`console.error` pattern in the new method

**Note on AC3 and a missing token.** AC3 says a missing token shows the backend's message. The backend's answer to `{}` is a class-validator string ("token must be a string"), which is not a message for a person, and the two sibling pages (activate, invite) show a local message and send nothing. C5 follows the siblings. Expired, invalid and not-pending tokens do reach the backend and show its message (C4, C14, C15). Change this if you want the empty-token request sent.

## Entry point

Dashboard -> Vínculos tab -> "request confirmation" on a `PENDING` domain (`useRequestCompanyDomainConfirmation`, MW-24) -> email to the admin's login address -> `/company-admin/domains/confirm?token=...` (this ticket). Every hop exists after this change.

## Coverage

Light profile: no `Coverage` join. Sets touched, for the record: backend error messages (3) all in C4; page states (4: missing token C5, loading C3, success C1, error C4).

- Claims naming a route, status text or response shape: C4, C11, C12, C13, C14, C15 - C12-C15 cross the browser and HTTP boundary; C4 and C11 are unit and contract level by design
