# MW-28 company activation frontend

Profile: `light` (no `tlc-implement` declaration in `AGENTS.md`/`CLAUDE.md`; default). Handoff: on.

Sources:

- `docs/superpowers/plans/2026-09-19-mw-28-company-activation-frontend.md` - settles scope, code, copy, routes and test text for every task. Decisions of 2026-09-19 (full flow, two entry points) live there.
- `.tasks/empresa-admin-ativacao-frontend.md` - original spec; plan Task 7 brings it up to date.
- No design source: UI copy is fixed by the plan, not by a design. Nothing is marked binding.

## Out of scope

- `/company-admin/invite` page - belongs to MW-29; stays in `KNOWN_MISSING_PAGES`.
- Backend activation endpoints (`.../activate/:companyId/request`, `.../activate/confirm`) - unchanged.
- Email language (backend template is English) - plan Risks.
- Moving MW-28 to done in Jira - outward-facing, needs an explicit go-ahead.

## Landing

Touches `features/company-admin`, `features/companies`, the client-dashboard page, `companies` backend module, `notifications/frontend-routes.ts`, `packages/e2e`, `.tasks`. Reuses the register page's `signIn("credentials")` pattern, the `companyAdminApi` axios instance, `PublicInvoicesController`'s no-guard pattern and `buildFrontendUrl`/`FRONTEND_ROUTES`.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| New public endpoint (contract the portal consumes) | `GET /public/company/:companyId/activation-status` -> `200 { hasActiveAdmin: boolean }`, `404` unknown company, no auth, in `PublicCompaniesController` | extending the invoices payload - couples activation to invoices and needs a scan of all invoices to answer a boolean |
| Activation request URL (linked from menu, banner, copied by users) | `/company-admin/activate/request?companyId=<id>` | path segment `/request/:companyId` - already rejected in the spec `Decided` table |

- Nothing else in this change is hard to reverse (pages, hooks and copy are refactor-cost only).

## Handoff

Batch 1 = S1-S5 (built in parallel, one agent per file-ownership group) + S6/S7 after merge. Reading floor: S1 ~2k, S2 ~1k, S3 ~22k, S4 ~4k, S5 ~1k, S6 ~1k, S7 ~2k = ~33k, far under 150k, so no token handoff is needed. Parallel split is by file ownership only (shared working tree, no builder commits, no builder spawns agents, orchestrator commits and verifies):

- Builder A: S1 + S2 + S5 (`features/company-admin/**`, `app/[locale]/company-admin/activate/**`, `client-dashboard/[clientId]/page.tsx`, `backend/src/notifications/frontend-routes.ts`). Owns `company-admin-auth.service.ts` and `index.ts`.
- Builder B: S3 (`features/companies/components/company-share-menu*`) and **all** edits to `en.json`/`pt-BR.json`, including the `companyActivation` namespace S5 needs.
- Builder C: S4 (`apps/backend/src/companies/**`, `apps/backend/test/company-activation.e2e-spec.ts`).
- Builder D: S7 (`.tasks/empresa-admin-ativacao-frontend.md`).
- Orchestrator after the merge: S6 (`packages/e2e/**`, runs `pnpm e2e:email-links`), final verification, then the Verifier.

## Checks

### S1 - Confirmation page · 4 files · ~2k

**C1** - A valid confirm posts `{ token, password }`, signs in with `signIn("credentials", { email: <admin.email>, password, redirect: false })`, then navigates to `/company-admin/dashboard`
Proof: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/page.test.tsx" --ci -t "confirms with the token, signs in with the returned email and goes to the dashboard"`

**C2** - A missing `token` query param shows "Link de ativação inválido ou incompleto.", renders no password field and never calls the mutation
Proof: same file, `-t "shows an error and no form when the token is missing"`

**C3** - Different password and confirmation show "As senhas não coincidem." and never call the mutation
Proof: same file, `-t "blocks the submit when the passwords differ"`

**C4** - A 409 on confirm shows the backend message and a link "Ir para o login" with `href="/login"`, and never calls `signIn`
Proof: same file, `-t "shows the backend message and a login link when the company was already activated"`

**C5** - When confirm succeeds but `signIn` returns `ok: false`, the page shows "Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login." and does not navigate
Proof: same file, `-t "explains that the account exists when the automatic sign-in fails"`

**C6** - `/company-admin/activate` is no longer in `KNOWN_MISSING_PAGES`, and the contract test finds a page serving it
Proof: `pnpm --filter backend exec jest src/notifications/frontend-links.contract.spec.ts -t "companyAdminActivate"` and `-t "keeps KNOWN_MISSING_PAGES honest"`

**C30** - A 400 on confirm (invalid or expired token) shows the backend message and the "Ir para o login" link, and never calls `signIn`
Proof: same file, `-t "shows the backend message and a login link when the token is invalid or expired"`

**C31** - A `message` that is a list (Nest `ValidationPipe` 400) is shown joined by `"; "` on the confirm page
Proof: same file, `-t "joins a list of validation messages into one readable line"`

### S2 - Request page · 2 files · ~1k

**C7** - Submitting with `companyId` from the URL and an email calls the mutation with `{ companyId, email, domain: undefined }` for a blank domain, then hides the form and shows "enviamos um link de confirmação"
Proof: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/request" --ci -t "requests activation with the companyId and email, omitting a blank domain"`

**C8** - A filled domain is sent as `domain: "acme.com"`
Proof: same file, `-t "sends the domain when it is filled in"`

**C9** - A missing `companyId` shows "Link inválido: a Empresa não foi identificada.", renders no email field and never calls the mutation
Proof: same file, `-t "shows an error and no form when the companyId is missing"`

**C10** - A 400 keeps the form (email value preserved) and shows the backend message
Proof: same file, `-t "keeps the form and shows the backend message on 400"`

**C32** - A `message` that is a list is shown joined by `"; "` on the request page
Proof: `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate/request" --ci -t "joins a list of validation messages into one readable line"`

### S3 - Share menu entry point · 3 files · ~22k

**C11** - The existing dashboard "Copy link" still copies `<origin>/client-dashboard/c1`
Proof: `pnpm --filter frontend exec jest src/features/companies/components/company-share-menu.test.tsx --ci -t "still copies the dashboard link"`

**C12** - A company with `hasActiveAdmin: true` shows no activation items
Proof: same file, `-t "hides the activation items when the company already has an admin"`

**C13** - A company with `hasActiveAdmin: false` copies `<origin>/company-admin/activate/request?companyId=c1` and toasts "Link copied"
Proof: same file, `-t "copies the activation request link when the company has no admin"`

**C14** - "Activation via WhatsApp" opens a URL starting `https://wa.me/?text=` in `_blank`
Proof: same file, `-t "opens WhatsApp for the activation link"` (split from the plan's combined test)

**C15** - "Activation via email" opens a URL starting `mailto:contact@acme.test?subject=`
Proof: same file, `-t "opens the mail client for the activation link"` (split from the plan's combined test)

**C16** - A company with `hasActiveAdmin` undefined shows no activation items
Proof: same file, `-t "hides the activation items when hasActiveAdmin is unknown"` (added: the code comment promises it)

**C17** - `en.json` and `pt-BR.json` carry the same keys under `clients` (7 new) and `companyActivation` (3 new)
Proof: `pnpm --filter frontend exec jest src/messages --ci -t "activation message keys"` (new `src/messages/activation-keys.test.ts`, asserts the 10 key names present in both files and the same `companyActivation` key set in both)

**C33** - In both locales the activation templates use exactly the placeholders the share menu passes: `activationWhatsappMessage` `{url}`, `activationEmailSubject` `{company}`, `activationEmailBody` `{url}`, and no other new `clients` key has any
Proof: same file, `-t "activation message keys"` (`placeholders` describe blocks)

### S4 - Public activation status endpoint · 4 files · ~4k

**C18** - `getActivationStatus` returns `{ hasActiveAdmin: true }` when `_count.companyAdmins` is 1, querying `findUnique` with `select: { _count: { select: { companyAdmins: true } } }`
Proof: `pnpm --filter backend exec jest src/companies/companies.service.spec.ts -t "returns hasActiveAdmin: true when the company has an admin"`

**C19** - `getActivationStatus` returns `{ hasActiveAdmin: false }` when the count is 0
Proof: same file, `-t "returns hasActiveAdmin: false when the company has no admin"`

**C20** - `getActivationStatus` throws `NotFoundException` for an unknown company
Proof: same file, `-t "throws NotFoundException for an unknown company"`

**C21** - `GET /public/company/:companyId/activation-status` with no `Authorization` header answers `200 { hasActiveAdmin: false }` for a company with no admin, `200 { hasActiveAdmin: true }` once it has one, and `404` for an unknown id
Proof: `pnpm --filter backend run test:e2e company-activation.e2e-spec.ts -t "activation-status"` (new cases in `apps/backend/test/company-activation.e2e-spec.ts`, real app over HTTP, needs postgres)

### S5 - Portal banner entry point · 5 files · ~1k

**C22** - With `hasActiveAdmin: false` the banner shows "Do you represent this company?" and a link "Activate my company" with `href="/company-admin/activate/request?companyId=c1"`, and calls the hook with `"c1"`
Proof: `pnpm --filter frontend exec jest src/features/company-admin/components --ci -t "links to the request page when the company has no admin"`

**C23** - With `hasActiveAdmin: true` the banner renders nothing
Proof: same file, `-t "renders nothing when the company already has an admin"`

**C24** - While loading or on error (`data` undefined) the banner renders nothing
Proof: same file, `-t "renders nothing while loading or when the status request fails"`

**C25** - `/client-dashboard/<companyId>` renders the banner with that id, above the overview
Proof: C27 (portal step): the flow test asserts the banner link is visible, sits above the overview heading (`Company Dashboard`; the name falls back to "Company" for a company with no invoices), and that the click lands on the request URL with `companyId`; no unit test on this page

### S6 - Whole flow in a browser · 2 files · ~1k

**C26** - The emailed activation link opens a real page (`companyAdminActivate`) and only `companyAdminInvite` remains an expected failure
Proof: `pnpm e2e:email-links` (test `companyAdminActivate: emailed link to /company-admin/activate opens a real page`)

**C27** - A representative goes portal banner -> request page -> emailed link -> confirm page, lands on `/company-admin/dashboard`, sees the admin dashboard content and holds a NextAuth session cookie
Proof: `pnpm e2e:email-links` (test `a company representative activates from the public portal and lands on the dashboard`; 6 passed)

### S7 - Spec brought up to date · 1 file · ~2k

**C28** - The spec no longer uses the old names: no `empresaId`, no `/empresa-admin/` path
Proof: `! grep -nE "empresaId|/empresa-admin/" .tasks/empresa-admin-ativacao-frontend.md`

**C29** - The spec has criteria 7 (share menu) and 8 (portal banner) and the `activation-status` surface row, and Unresolved row 1 is gone
Proof: `grep -qE "^7\. " .tasks/empresa-admin-ativacao-frontend.md && grep -qE "^8\. " .tasks/empresa-admin-ativacao-frontend.md && grep -q "activation-status" .tasks/empresa-admin-ativacao-frontend.md && ! grep -qE "^\| 1 \| blocks" .tasks/empresa-admin-ativacao-frontend.md`

## Swept

- validation: existing - backend DTOs unchanged; C3 (password match), C9 (companyId), C2 (token); `minLength={6}` on password inputs mirrors the DTO
- failure modes: C2, C4, C5, C9, C10, C20, C21, C24
- idempotency: n/a - request is already safe to repeat (spec Swept); the status endpoint is a read
- authorization: C21 (no auth header, public by design, same as `PublicInvoicesController`); the boolean is exposed to any holder of the company UUID - plan Risks accepts it. Only the global 60/min/IP `ThrottlerGuard` limits the endpoint
- concurrency: existing, with a gap - `assertCompanyNotActivated` is a `count` then `create` with no transaction and no unique on `CompanyAdmin.companyId` (`email` only), so it rejects sequential activations (409, C4) but two simultaneous confirms with different emails can both pass. MW-19 behaviour, not changed here (plan: backend activation endpoints stay as they are)
- data lifecycle: existing - token expires in 1h, unchanged
- dependency failure: C5 (`signIn` fails after account creation), C24 (status endpoint fails)
- state transitions: C12/C13 (menu follows `hasActiveAdmin`), C22/C23 (banner follows status)
- observability: not in scope - no log requirement

## Coverage (level and sampling)

- Claims naming a status code, route or response shape: C4 (409), C10 (400), C20 and C21 (404/200). C4 and C10 assert what the page does with a mocked error (component level; the backend returns those codes today, proven by `company-activation.e2e-spec.ts`). C21 crosses the HTTP boundary for the new endpoint.
- Frontend `hasActiveAdmin` set: true C12, false C13-C15, undefined C16 (3 members, 3 proofs).
- The share menu shows activation items only when the list payload carries `hasActiveAdmin: false` (`companies.service.ts` `findAll`, existing, proven by `companies.service.spec.ts`); C12/C13/C16 assert the menu side only.
- C4/C10/C30 assert the page with a mocked axios error. The exact messages they mock are pinned against the real backend in `company-activation.e2e-spec.ts` (409 already activated, 400 request that does not prove ownership; 400 wrong token type asserts a non-empty message). C30 mocks `Token has expired`, the backend's own string (`company-admin-auth.service.ts:399`), which no e2e case triggers.
- No other check claims more than the single case its proof exercises.

## Deviations from the plan (decided while writing this checklist)

- Plan Task 1 step 7 (`pnpm e2e:email-links` after removing the allowlist entry) runs once in S6, where it covers a superset (6 tests). The unit contract test (C6) settles the allowlist claim at commit time. Reason: one preview stack at a time, and builders run in parallel.
- Plan tests for S3 WhatsApp/email split into two tests (C14, C15) so each check has one proof; C16, C17 and C21 are additions the plan lacked (unknown-`hasActiveAdmin` claim in its own comment, message parity, boundary proof for the new route).
- Builders never commit; the orchestrator commits per task with the plan's commit messages.
- The `{ timeout: NEXT_DEV_COMPILE_MS }` (30s) on post-navigation `expect`s in the flow test are wiring: `next dev` compiles each page on first visit, longer than the 5s default. No assertion changed.

## Amendments after verification round 1

Findings F1-F8 of `.checks/mw-28-company-activation-frontend.verified.md` were fixed in a follow-up: `company-activation.e2e-spec.ts` now overrides `NotificationsService` (no real Resend calls, F1) and pins the backend messages (F4); C30-C33 added (F3, F5); C25/C27 assertions strengthened in the flow test (F6, F7); the concurrency and authorization Swept rows and Coverage text corrected (F2, F8). Additive only: no earlier check was weakened.
