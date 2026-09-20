# MW-28 company activation frontend Verification

**Verdict**: PASS with findings (29/29 checks proven; no failing proof; 0 blocking gaps; 1 unresolved flake report, 7 non-blocking findings below)
**Profile**: light (default; declared nowhere)
**Diff range**: 72d4644..HEAD (HEAD = 6858086)
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier), read-only; only this file written. `git status --porcelain` empty before and after.

Steps skipped by profile: step 1 (no source marked binding - checklist says "Nothing is marked binding"), fault injection (step 4), Coverage-join recompute, Test-policy verdicts (no `Test policy` section). Steps 2, 3 and this report ran.

## Binding sources

None marked binding. Step 1 skipped.

## Proof runs (all at HEAD 6858086)

| Target | Command | Result |
|---|---|---|
| frontend jest (5 files) | `pnpm --filter frontend exec jest "src/app/\[locale\]/company-admin/activate" src/features/companies/components/company-share-menu.test.tsx src/features/company-admin/components src/messages --ci --verbose` | 5 suites, 38 tests passed; each named test listed individually as run |
| backend unit jest (2 files) | `pnpm --filter backend exec jest src/notifications/frontend-links.contract.spec.ts src/companies/companies.service.spec.ts --verbose` | 2 suites, 13 passed |
| backend e2e filtered (C21) | `pnpm --filter backend run test:e2e company-activation.e2e-spec.ts -t "activation-status"` | 3 passed, 8 skipped |
| backend e2e full file x3 (flake probe) | `pnpm --filter backend run test:e2e company-activation.e2e-spec.ts` | run 1, 2, 3: exit 0, 11/11 passed each |
| Playwright smoke (C26, C27) | `pnpm e2e:email-links` | exit 0, 6 passed; test 4 `companyAdminInvite` shows the expected-failure mark; preview torn down by the script, ports 3100/3102 free afterwards, `pnpm preview:stop` not needed |
| C28 grep | `! grep -nE "empresaId\|/empresa-admin/" .tasks/empresa-admin-ativacao-frontend.md` | exit 0 |
| C29 grep | the four-part `grep -qE ... && ! grep -qE "^\| 1 \| blocks"` chain | exit 0 (row 1 existed at 72d4644 line 119, gone at HEAD) |

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | confirm posts `{token,password}`, signs in with returned email, goes to dashboard | frontend jest, test ran and passed | `activate/page.test.tsx:51` `expect(mutateAsyncMock).toHaveBeenCalledWith({token:"activation-token",password:"supersecret"})`; `:55` `expect(signInMock).toHaveBeenCalledWith("credentials",{email:"admin@acme.com",password:"supersecret",redirect:false})`; `:60` `expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard")` | PASS |
| C2 | missing token: error text, no password field, no mutation | same | `page.test.tsx:68-72` `getByText("Link de ativação inválido ou incompleto.")`, `queryByLabelText("Senha")).not.toBeInTheDocument()`, `mutateAsyncMock).not.toHaveBeenCalled()` | PASS |
| C3 | mismatched passwords: message, no mutation | same | `page.test.tsx:79-80` `getByText("As senhas não coincidem.")`, `mutateAsyncMock).not.toHaveBeenCalled()` | PASS |
| C4 | 409: backend message + "Ir para o login" href=/login, no signIn | same | `page.test.tsx:96-104` `findByText("Company is already activated; use the Admin invite flow instead")`, `getByRole("link",{name:"Ir para o login"})).toHaveAttribute("href","/login")`, `signInMock).not.toHaveBeenCalled()`. Message equals backend source `company-admin-auth.service.ts:414` | PASS (component level, see F3/F4) |
| C5 | confirm ok, signIn `ok:false`: message, no navigation | same | `page.test.tsx:116-121` `findByText("Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login.")`, `pushMock).not.toHaveBeenCalled()` | PASS |
| C6 | `/company-admin/activate` out of `KNOWN_MISSING_PAGES`, contract finds a page | backend jest: `companyAdminActivate (/company-admin/activate) has a frontend page` and `keeps KNOWN_MISSING_PAGES honest` both ran, passed | `frontend-routes.ts:23-24` map holds only `'/company-admin/invite': 'MW-29'` (activate removed in diff); `frontend-links.contract.spec.ts:60-65` `if (!resolves(path)) throw new Error(...)` (activate not in map, so this branch guards it); `:69-77` `expect({path,inFrontendRoutes:declared.includes(path)}).toEqual({path,inFrontendRoutes:true})` | PASS |
| C7 | request with companyId+email, blank domain undefined, form hidden, confirmation text | frontend jest | `request/page.test.tsx:40-44` `toHaveBeenCalledWith({companyId:"company-1",email:"contato@acme.com",domain:undefined})`; `:45-48` `findByText(/enviamos um link de confirmação/)`, `queryByLabelText("Email")).not.toBeInTheDocument()` | PASS |
| C8 | filled domain sent as `"acme.com"` | same | `request/page.test.tsx:62-66` `toHaveBeenCalledWith({companyId:"company-1",email:"ana@acme.com",domain:"acme.com"})` | PASS |
| C9 | missing companyId: error, no email field, no mutation | same | `request/page.test.tsx:74-78` `getByText("Link inválido: a Empresa não foi identificada.")`, `queryByLabelText("Email")).not...`, `mutateAsyncMock).not.toHaveBeenCalled()` | PASS |
| C10 | 400 keeps form (email preserved) + backend message | same | `request/page.test.tsx:96-99` `findByText(/must match the Company's registered contact email/)`, `getByLabelText("Email")).toHaveValue("outro@acme.com")` | PASS (component level, see F3/F4) |
| C11 | dashboard "Copy link" still copies `<origin>/client-dashboard/c1` | frontend jest | `company-share-menu.test.tsx:76-78` `expect(writeText).toHaveBeenCalledWith(\`${window.location.origin}/client-dashboard/c1\`)` | PASS |
| C12 | `hasActiveAdmin:true`: no activation items | same | `company-share-menu.test.tsx:86-91` `queryByText("Invite company to activate")).not...`, `queryByRole("menuitem",{name:"Copy activation link"})).not...` | PASS |
| C13 | `false`: copies `<origin>/company-admin/activate/request?companyId=c1`, toast "Link copied" | same | `company-share-menu.test.tsx:116-119` `writeText).toHaveBeenCalledWith(\`${window.location.origin}/company-admin/activate/request?companyId=c1\`)`, `toastSuccess).toHaveBeenCalledWith("Link copied")` | PASS |
| C14 | WhatsApp item opens `https://wa.me/?text=...` in `_blank` | same | `company-share-menu.test.tsx:130-133` `openSpy).toHaveBeenLastCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/\?text=/),"_blank")` | PASS |
| C15 | email item opens `mailto:contact@acme.test?subject=` | same | `company-share-menu.test.tsx:144-146` `openSpy).toHaveBeenLastCalledWith(expect.stringMatching(/^mailto:contact@acme\.test\?subject=/))` | PASS |
| C16 | `hasActiveAdmin` undefined: no activation items | same | `company-share-menu.test.tsx:99-104` same two `.not.toBeInTheDocument()` with `setup({...baseCompany})`; code `company-share-menu.tsx:42` `company.hasActiveAdmin === false` | PASS |
| C17 | en + pt-BR carry the 10 new keys (7 `clients`, 3 `companyActivation`) | frontend jest, 20 `activation message keys` cases ran (10 per locale) | `activation-keys.test.ts:30-31` `expect(typeof value).toBe("string")`, `expect(value.length).toBeGreaterThan(0)`; `:37-38` same for `companyActivation`; key lists `:4-18`; json diff shows all 10 in both files | PASS (see F5) |
| C18 | `getActivationStatus` true when count 1, `findUnique` with `select:{_count:{select:{companyAdmins:true}}}` | backend jest | `companies.service.spec.ts:94-96` `resolves.toEqual({hasActiveAdmin:true})`; `:97-100` `findUnique).toHaveBeenCalledWith({where:{id:'company-1'},select:{_count:{select:{companyAdmins:true}}}})` | PASS |
| C19 | false when count 0 | same | `companies.service.spec.ts:108-110` `resolves.toEqual({hasActiveAdmin:false})` | PASS |
| C20 | `NotFoundException` for unknown company | same | `companies.service.spec.ts:116-118` `rejects.toThrow(NotFoundException)`; source `companies.service.ts:75-77`; HTTP 404 proven at C21 | PASS |
| C21 | public GET: 200 false, 200 true after admin, 404 unknown, no Authorization header | e2e filtered run, 3 tests ran, passed | `company-activation.e2e-spec.ts:213-216` `.get(\`/public/company/${company.id}/activation-status\`).expect(200)` + `expect(res.body).toEqual({hasActiveAdmin:false})`; `:236-239` `.expect(200)` + `toEqual({hasActiveAdmin:true})` (admin made via `/activate/confirm` `:231-233`); `:244-248` `.expect(404)` + `expect(res.body.message).toBe('Company not found')`. No `.set('Authorization',...)` anywhere in the three | PASS |
| C22 | banner text + link href + hook called with "c1" | frontend jest | `activate-company-banner.test.tsx:40` `expect(useStatusMock).toHaveBeenCalledWith("c1")`; `:41` `getByText("Do you represent this company?")`; `:42-44` `getByRole("link",{name:"Activate my company"})).toHaveAttribute("href","/company-admin/activate/request?companyId=c1")` | PASS |
| C23 | `true`: renders nothing | same | `activate-company-banner.test.tsx:52` `expect(container).toBeEmptyDOMElement()` | PASS |
| C24 | loading/error (`data` undefined): renders nothing | same | `activate-company-banner.test.tsx:56,60` `useStatusMock.mockReturnValue({data:undefined})`, `expect(container).toBeEmptyDOMElement()`; code `activate-company-banner.tsx:22` `data?.hasActiveAdmin !== false` | PASS (see F6) |
| C25 | portal renders banner with route clientId above overview | settled by C27 + reading | `client-dashboard/[clientId]/page.tsx:112-116` `<ActivateCompanyBanner companyId={clientId as string} />` then `<Overview .../>`, no early return in the component (`return` only at :90 inside memo and :112); `clientId` from `useParams()` `:13`. C27 run reaches the banner at `/client-dashboard/${company.id}` `email-links.spec.ts:166-167` | PASS (order proven by reading only, see F6) |
| C26 | emailed activation link opens a real page; only `companyAdminInvite` remains expected failure | `pnpm e2e:email-links`: test 3 passed, test 4 expected-fail mark, 6 passed | `email-links.spec.ts:146-150` `expect(response?.status()).toBeLessThan(400)`, `expect(new URL(page.url()).pathname).toBe(path)`, `expect(pageErrors).toEqual([])`; `:130` `test.fail(!!knownMissing && !process.env.E2E_STRICT, ...)`; `frontend-routes.ts:23-24` map has exactly one entry (invite) | PASS |
| C27 | portal banner -> request -> emailed link -> confirm -> `/company-admin/dashboard` | `pnpm e2e:email-links`: test 5 (17.1s) passed | `email-links.spec.ts:167` click "Ativar minha Empresa"; `:168-171` `toHaveURL(...activate/request?companyId=${company.id})`; `:176` `getByText(/enviamos um link de confirmação/)).toBeVisible`; `:187` `expect(page).toHaveURL(\`${FRONTEND_URL}/company-admin/dashboard\`, ...)` | PASS (see F7) |
| C28 | spec has no `empresaId` / `/empresa-admin/` | grep negation exit 0 | `.tasks/empresa-admin-ativacao-frontend.md`: grep for the pattern returns no lines (base had hits at :93) | PASS |
| C29 | spec has criteria 7, 8, `activation-status` row, Unresolved row 1 gone | grep chain exit 0 | `.tasks/empresa-admin-ativacao-frontend.md:57` `7. When a Empresa não tem Administrador`; `:61` `8. When alguém abre`; `:89,:117,:125` `activation-status`; Unresolved table `:142-146` holds only row 2 (row `1 | blocks` was base :119) | PASS |

Named-test existence: every `-t` name in the checklist appears verbatim in the verbose output above and at the cited `it(` lines (page.test.tsx:42,63,75,83,107; request/page.test.tsx:31,51,69,81; company-share-menu.test.tsx:70,81,94,107,122,136; activate-company-banner.test.tsx:35,47,55; companies.service.spec.ts:89,103,113; company-activation.e2e-spec.ts:209,219,242). No filter matched nothing.

## Judgements requested

**(a) `Swept` rows resolving to "existing"**
- validation: holds. DTOs untouched (no dto file in the diff); `ConfirmCompanyActivationDto.password` is `@MinLength(6)` (`dto/company-admin-auth.dto.ts:70-72`), matching `minLength={6}` in the page (`activate/page.tsx:127,139`).
- authorization: holds. `public-companies.controller.ts:5` `@Controller('public/company/:companyId')`, no `@UseGuards` in the file (`rg UseGuards` on it: none); sibling `public-invoices.controller.ts:4` is also unguarded; C21 calls with no header. Omission: the global `APP_GUARD ThrottlerGuard` (`app.module.ts:73`, default 60/min/IP, `:43-49`) applies to the new route and the row does not mention it. Not a defect, a precision gap (F8).
- data lifecycle: holds. `company-admin-auth.service.ts:198` `{ expiresIn: '1h' }`, unchanged.
- concurrency: does NOT hold as written. See F2.

**(b) Level gaps** (checks naming status code, route or response shape)
- C21: proof at HTTP level over the real app (`supertest`, `AppModule`). Reaches the claim. No gap.
- C20: unit proof throws the exception; the 404 status is reached by C21 at HTTP. No gap.
- C4 (409) and C10 (400): proofs assert page behaviour on a hand-built axios error object (`{response:{status:409,data:{message}}}`). The checklist's Coverage section declares this and points to `company-activation.e2e-spec.ts` for the backend codes. That file does assert the statuses (400 at `:63,72,84,156`; 409 at `:185,199`) but never the body `message` the pages render, and no test connects the two ends. Message text is proven only by literal equality between test fixture and backend source (409: `service.ts:414`). Within the checklist's stated bar, but it is the one place a status/shape claim rests on a mock. See F4.

**(c) Precision gaps in the checklist**: F3, F5, F6, F7, F8 below.

## Findings (ranked, none flips a check)

1. **F1 - Unresolved flake report (orchestrator-recorded, 1 of 11 once).** Not reproduced: filtered run passed, full file 3 of 3 passed (11/11 each, exit 0), plus the smoke. Cause not captured, so it stays open. Concrete lead found while reading, not proven as the cause: the e2e file boots the full `AppModule` with the `.env` Resend key and sends real emails (`notifications.service.ts:339-361`, `:219`); the 3 full runs logged 9 `Email enviado via Resend` lines and `Company activation email sent to ...@company-e2e.test`. `test/jest-e2e.json` sets no `testTimeout` (Jest default 5s). A slow or failed Resend round trip could trip a request-phase test; `sendCompanyActivationEmail` swallows send errors (`:230-232`) so only latency would fail a test. The new MW-28 cases send no email. Throttle ruled out as cause: `activate/:id/request` limit 20/min is hit 8 times, `activate/confirm` limit 10/min is hit 6 times per file, and the in-memory store resets per app boot. Recommendation for the orchestrator: mock `NotificationsService` (or Resend) in this e2e, or accept the residual risk knowingly.
2. **F2 - Swept "concurrency: assertCompanyNotActivated serialises activation" is overstated.** `assertCompanyNotActivated` is `companyAdmin.count({where:{companyId}})` then throw if >0 (`company-admin-auth.service.ts:408-417`), called before `companyAdmin.create` (`:223-234`) with no transaction or lock; `CompanyAdmin` has only `email @unique` (`schema.prisma:92`), not `companyId`. Two concurrent confirms with different emails can both pass. C4 only proves the sequential 409 (`e2e-spec.ts:185-199`). Existing backend behaviour, not introduced by MW-28; the row's wording should say "rejects sequentially".
3. **F3 - C4 omits the 400 branch the spec promises.** Spec criterion 6 (`.tasks/...:50-53`) says 400 (invalid/expired token) or 409 (already activated, or email in use) shows the message and a login link. C4 and its test cover 409 only. Same code path (`setBlockingError(getErrorMessage(err))`), but no 400 assertion exists. Also `getErrorMessage` types `message` as `string`; Nest `ValidationPipe` 400s return `message` as an array, which no test exercises.
4. **F4 - C4/C10 message text not proven across the boundary** (see (b)). Low risk: the axios shape is standard and `lib/axios.ts:10-14` does not redirect on `/auth/` URLs.
5. **F5 - C17 says "same keys" but asserts only that 10 named keys are non-empty strings in each file**; it does not compare key sets or the `{url}`/`{company}` placeholders across locales. Separately, `company-share-menu.test.tsx:17-37` uses hand-written messages with no placeholders, so the real templates with `{url}`/`{company}` are never rendered in any test. Code passes `url` and `company` (`company-share-menu.tsx` diff), so nothing is wrong today.
6. **F6 - C24 and C25.** C24 collapses "loading" and "error" into one mock (`data:undefined`), which is what the code does (`banner.tsx:22`), fine. C25's "above the overview" is settled by reading `page.tsx:112-116` only; no test asserts order (the smoke just clicks the banner link).
7. **F7 - C27 stops at the URL.** `email-links.spec.ts:187` asserts the URL `/company-admin/dashboard`, not dashboard content or a session cookie. Acceptable given `router.push` only runs after `signIn` ok (`activate/page.tsx:100-107`); noted so a redirect-only regression is understood to be caught only by URL.
8. **F8 - Checklist precision:** Swept `authorization` omits the global 60/min/IP throttle on the new unauthenticated boolean endpoint; Coverage does not list the `hasActiveAdmin`-from-list-payload dependency of the menu (`companies.service.ts` `findAll`, existing, proven by `companies.service.spec.ts` earlier tests).

Plan conformance: I extracted every non-trivial line of every code block in `docs/superpowers/plans/2026-09-19-mw-28-company-activation-frontend.md` and searched it in the changed files. All matched except four lines: the WhatsApp/email test split (declared, C14/C15), the client-dashboard return (plan expresses it as the fragment now in the code), and two Playwright `expect` calls that now carry `{ timeout: NEXT_DEV_COMPILE_MS }`. The timeouts are not listed under "Deviations"; they change no behaviour, only wait time. `playwright.config.ts` `locale: "pt-BR"` is in the plan (`:44`).

Entry-point reachability: menu is rendered by `company-card.tsx:228`; banner by the public portal; emailed link by C26/C27. No page missing. Still out of scope and named: `/company-admin/invite` (MW-29).

## Test policy rows

No `Test policy` section in the checklist and profile is `light`. Not run.

## Faults injected

Skipped (`light`).

## Gate

- `pnpm --filter backend exec tsc --noEmit -p tsconfig.json` - exit 0
- `pnpm --filter frontend exec tsc --noEmit` - exit 0
- Proofs: frontend 38 passed, backend unit 13 passed, backend e2e 11/11 x3 (+3/3 filtered), Playwright 6 passed; 0 failed.
