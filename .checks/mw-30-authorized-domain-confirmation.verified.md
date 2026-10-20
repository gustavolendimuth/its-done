# MW-30 Authorized domain confirmation Verification

**Verdict**: PASS
**Profile**: light
**Diff range**: b82ac6f..6955b4a (HEAD)
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

Skipped, not forgotten: step 1 (checklist declares no binding source), Coverage join, Test policy verdicts (no section) and fault injection (`light` profile). Every proof was run by the verifier at HEAD `6955b4a`; worktree clean before and after.

## Binding sources

None marked binding (checklist `Sources`). Step 1 not run. The Jira/task ACs were read only to judge the AC3 note (see Findings).

## Checks

Runs: backend jest, one invocation (3 spec files, alternated `-t`): 3 suites passed, 6 passed. Contract spec run whole for names: 8 passed. Frontend jest, one file: 8 passed. `pnpm e2e:email-links`, one invocation: 18 passed. Each name below appeared individually as passed in `--verbose`/list output and was located with `rg`/`cat -n`.

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | posts `{token:"abc"}`, no session provider, shows "Domínio confirmado" + "O domínio acme.com agora está confirmado." | jest `confirms the domain from the token and shows its name` ✓ | `page.test.tsx:42` `findByText("Domínio confirmado")`, `:43-45` `getByText("O domínio acme.com agora está confirmado.")`, `:46` `toHaveBeenCalledWith({ token: "domain-token" })`; no next-auth mock (`:16`). Hook is mocked, so route/method reached only by e2e `email-links.spec.ts:485-490` (real page, real POST) | PASS |
| C2 | one request under StrictMode | jest `sends the confirmation once under StrictMode` ✓ | `page.test.tsx:59` `expect(mutateAsyncMock).toHaveBeenCalledTimes(1)` inside `<StrictMode>` (`:53`); guard `page.tsx:61,64-67` | PASS |
| C3 | pending: loading text, neither success nor error | jest `shows a loading state while the request is pending` ✓ | `page.test.tsx:67` `getByText("Confirmando domínio…")`, `:68` `queryByText("Domínio confirmado")).not...`, `:69-71` error title `.not...` | PASS |
| C4 | 3 backend messages verbatim, 1 call | jest `shows the backend message: <msg>` x3 ✓ | `page.test.tsx:83` `findByText(message)` over `:75-77` (the 3 literals), `:85` `toHaveBeenCalledTimes(1)` | PASS |
| C5 | missing token: local message, no request | jest `shows an error and sends no request when the token is missing` ✓ | `page.test.tsx:93-95` `getByText("Link de confirmação inválido ou incompleto.")`, `:96` `not.toHaveBeenCalled()` | PASS (see AC3 note) |
| C6 | "Ir para o painel" -> `/company-admin/dashboard` in success and error | jest `links to the dashboard from the success and error states` ✓ | `page.test.tsx:103-105` and `:117-119` `getByRole("link",{name:"Ir para o painel"})).toHaveAttribute("href","/company-admin/dashboard")`; `dashboard/page.tsx` exists | PASS |
| C7 | sends to `admin@test.local`, subject `Confirm Authorized Domain - Its Done` | jest `...sends to the admin with its own subject` ✓ | `notifications.service.spec.ts:46-47` (`to` `.toBe('admin@test.local')`, `subject` `.toBe('Confirm Authorized Domain - Its Done')`); code `notifications.service.ts` subject literal matches | PASS |
| C8 | html links `https://app.test/company-admin/domains/confirm?token=tok123`, names acme.com, no `/reset-password`, no "Reset Your Password" | jest `...links to the domain confirmation page` ✓ | `notifications.service.spec.ts:58-60` `toContain('https://app.test/company-admin/domains/confirm?token=tok123')`, `:61` `toContain('acme.com')`, `:62` `not.toContain('/reset-password')`, `:63` `not.toMatch(/reset your password/i)` | PASS |
| C9 | send failure -> `false`, no throw | jest `...returns false when the send fails` ✓ | `notifications.service.spec.ts:67` `sendEmail` rejects, `:70-76` `await expect(...).resolves.toBe(false)`; catch returns `false` in code | PASS |
| C10 | `requestConfirmation` calls new method with `(adminEmail, domain, token)`, never `sendPasswordResetEmail` | jest `requestConfirmation sends the dedicated confirmation email` ✓ | `authorized-domains.service.spec.ts:21-23` `toHaveBeenCalledWith('admin@acme.com','acme.com','signed-token')`, `:24-26` `sendPasswordResetEmail).not.toHaveBeenCalled()`; token from `jwtServiceMock.sign` (`:17`) so the token arg is genuinely the signed one | PASS |
| C11 | route = `/company-admin/domains/confirm`, has `page.tsx`, `KNOWN_MISSING_PAGES` empty | contract `-t companyAdminDomainConfirm` ✓ and `keeps KNOWN_MISSING_PAGES honest` ✓ | `frontend-routes.ts` `companyAdminDomainConfirm: '/company-admin/domains/confirm'` (diff +1), `KNOWN_MISSING_PAGES = {}` (`:24`); `frontend-links.contract.spec.ts:~46-66` throws unless a `page.tsx` resolves the path (and, if the path were in KNOWN_MISSING_PAGES, expects `resolves:false`, which would fail now that the page exists); route literal also fixed by C8 (`?token` URL) and by e2e `confirmPath` | PASS (precision note P1) |
| C12 | smoke triggers the email, link opens a real page (<400, no redirect, no page errors) | e2e test 5 `companyAdminDomainConfirm: emailed link ...` ✓, test 18 `every route ... exercised by an email` ✓ | `email-links.spec.ts:204` `toBeLessThan(400)`, `:205-207` pathname `toBe(path)`, `:208` `pageErrors).toEqual([])`; trigger `:169-173`; `:527-531` `missing).toEqual([])` | PASS |
| C13 | logged-out browser sees "Domínio confirmado", API lists `CONFIRMED`, no session cookie | e2e test 15 `confirms the authorized domain from the emailed link without a session` ✓ | `email-links.spec.ts:480` pre `PENDING`, `:485` `getByText("Domínio confirmado")` visible, `:491` `domainStatus(...)).toBe("CONFIRMED")`, `:492` `sessionCookies(page)).toEqual([])` (filter `/session-token/`, `:328-332`) | PASS |
| C14 | same link again -> "Authorized domain is not pending confirmation", stays `CONFIRMED` | e2e test 16 `reusing the domain confirmation link ...` ✓ | `email-links.spec.ts:500` first use via API, `:504-506` message visible, `:507` `"Domínio confirmado" toHaveCount(0)`, `:508` `toBe("CONFIRMED")` | PASS (P2) |
| C15 | tampered token -> "Invalid or expired confirmation token" | e2e test 17 `a tampered domain confirmation token ...` ✓ | `email-links.spec.ts:520-522` `getByText("Invalid or expired confirmation token")` visible; `:523` domain still `PENDING` | PASS |

Proven 15/15. No test named by a proof is missing or unrun; all names found (`rg -n`/listing above). Feature diff touches every proof file (none is a pre-existing untouched test).

## Test policy rows

No `## Test policy` section (light profile). Level judgment for checks claiming route/status/message: C4 unit-level but the same three messages cross the real browser+HTTP boundary in C14 (not-pending) and C15 (invalid); "Authorized domain not found" is only unit-level (see P3). C11 contract-level by design; C12-C15 browser+HTTP.

## Swept rows resolving to "existing"

- validation: `authorized-domains.service.ts` `confirm()` checks `type`/`actorType` (`:118-125`), existence (`:127-131`), `PENDING` (`:134`). Present. Line cited in checklist (`112-139`) is off by ~1 (real `113-140`).
- authorization: `POST confirm` has no `@UseGuards` and is throttled 10/min (`authorized-domains.controller.ts:59-63`); the other routes carry `CompanyAdminJwtAuthGuard`. Present. Cited `52-58` is off by ~3.
- data lifecycle: `expiresIn: '1h'` (`authorized-domains.service.ts:99`). Present.
- state transitions: `PENDING -> CONFIRMED` update (`:140-142`). Present.

## Landing rows vs code

- URL shape: `/company-admin/domains/confirm?token=<jwt>`, route name `companyAdminDomainConfirm`, built via `buildFrontendUrl(..., 'companyAdminDomainConfirm', { token })`. Match; token is a query param.
- Method: `sendAuthorizedDomainConfirmationEmail(toEmail: string, domain: string, confirmationToken: string)`. Types and order match. Third param is named `confirmationToken`, not `token` (cosmetic). No explicit `Promise<boolean>` annotation; inferred `Promise<boolean>` from `return true/false`, same as sibling `sendCompanyActivationEmail` (also unannotated). Not a defect.
- Subject: `Confirm Authorized Domain - Its Done`. Match.
- Shape: try/catch, logs, returns `false` on failure. Match. Old `sendPasswordResetEmail` call removed from `requestConfirmation`.
- Files: hook `useConfirmCompanyDomain` in `features/company-admin/company-admin-auth.service.ts`, re-exported by existing `index.ts`; page under `app/[locale]/company-admin/domains/confirm`; e2e in `packages/e2e`. Match.

## AC3 and missing token (a)

Task AC3: "If the token is absent, expired, invalid, or domain not PENDING, the screen shows the error message returned by the backend, without retrying automatically." C5 shows a local message and sends no request for the absent case. This departs from AC3's literal text only on "absent", exactly what the checklist note declares, with the reason (backend answers `{}` with the class-validator string "token must be a string"; `ConfirmAuthorizedDomainDto` is `@IsString() token`) and the sibling-page precedent. Expired, invalid, not-pending all reach the backend and show its message (C4, C14, C15). "No automatic retry" holds (C4 `:85`, C2). Judgment: reasonable reading, no contradiction beyond the note. Not a finding. It is a user decision the note already surfaces.

## Findings (none blocking)

- P1 (precision, low): C11 "KNOWN_MISSING_PAGES stays empty". `keeps KNOWN_MISSING_PAGES honest` iterates existing entries, so it passes vacuously on `{}` and would also pass with an unrelated entry. Empty for this route is still enforced by the `has a frontend page` test (would fail if the path were listed while the page exists). The literal path is asserted through C8's URL, not by the contract test's title interpolation. Optional: assert `KNOWN_MISSING_PAGES` equals `{}` or lacks the path.
- P2 (precision, low): C14 says "opening the same link a second time". The test consumes the token through the API (`:500`) and opens the link once in the browser, not twice in the browser. Equivalent for the backend state; the claim's wording is a touch stronger than the proof.
- P3 (level, low): the 404 "Authorized domain not found" message is proven only at unit level (mocked rejection, `page.test.tsx:77`). No real-boundary proof; the message is passed through by the same `getErrorMessage` path proven at boundary for the other two, so risk is small. C1's route/method is likewise asserted only through the real browser in C13 (unit mocks the hook).
- P4 (nit): `Swept` cites line ranges that have drifted by 1-3 lines.

## Faults injected

Not run (`light` profile).

## Gate

- `pnpm --filter @its-done/backend exec jest <3 specs> -t "..." --verbose` - 6 passed, 0 failed (3 suites; skipped tests are other cases filtered out by `-t`); contract spec whole - 8 passed.
- `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/domains/confirm/page.test.tsx" --ci --verbose` - 8 passed, 0 failed.
- `pnpm e2e:email-links` - 18 passed, 0 failed. No stale preview state file; script started and stopped its own preview ("Preview derrubado"). After the run no listeners on 310x, no preview processes, `git status` clean.
