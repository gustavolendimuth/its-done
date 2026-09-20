# MW-28 company activation frontend Verification

**Verdict**: PASS with findings (33/33 checks proven at HEAD; 8/8 round 1 findings fixed; 0 blocking gaps; 5 low, non-blocking residual gaps below)
**Profile**: light (default; declared nowhere): no step 1, no fault injection, no Coverage join, no Test-policy verdicts
**Diff range**: 72d4644..HEAD (HEAD = b50ff9a). Round 1 verified at 6858086; fix diff = `3caf921..HEAD` (4 commits, 9 files: 3 test files, 2 pages, 1 e2e spec, 1 Playwright spec, 1 spec doc, 1 checklist)
**Round**: 2 - scoped
**Verifier**: independent sub-agent (author != verifier), read-only; only this file written. `git status --porcelain` empty before and after (incl. after the preview run).

Scoping: proofs C1-C33 all re-run in full at b50ff9a. Evidence for untouched code is marked `carried from 6858086`; files the fix diff touched are re-cited and marked `verified at b50ff9a`.

## Binding sources

None marked binding (checklist: "Nothing is marked binding"). Step 1 skipped. `carried from 6858086`.

## Proof runs (all at HEAD b50ff9a)

| Target | Command | Result |
|---|---|---|
| frontend jest, full | `pnpm --filter frontend exec jest --ci --verbose` | 66 suites, 559 tests passed, 0 failed; every named C1-C17/C22-C24/C30-C33 test listed individually as run and passed |
| backend unit jest (C6, C18-C20) | `pnpm --filter backend exec jest src/notifications/frontend-links.contract.spec.ts src/companies/companies.service.spec.ts --ci --verbose` | 2 suites, 13 passed; each named test listed |
| backend jest, full (gate) | `pnpm --filter backend exec jest --ci --silent` | 27 suites, 170 tests passed |
| C21 | `pnpm --filter backend run test:e2e company-activation.e2e-spec.ts -t "activation-status"` | 3 passed, 8 skipped (the 3 activation-status tests each shown) |
| backend e2e full file x3 | `pnpm --filter backend run test:e2e company-activation.e2e-spec.ts` | run 1, 2, 3: exit 0, 11/11 passed each. Log lines matching `Resend\|Email enviado\|activation email sent`: 0, 0, 0 (round 1: 9 real sends per 3 runs). Email-path tests now 214-265 ms |
| C26, C27 | `pnpm e2e:email-links` | exit 0, `6 passed`; test 4 `companyAdminInvite` shows the inverted expected-failure mark; 3, 5 and 6 pass. Script tore the preview down; ports 3100/3102 free afterwards (`lsof` empty), `pnpm preview:stop` not needed |
| C28 | `! grep -nE "empresaId\|/empresa-admin/" .tasks/empresa-admin-ativacao-frontend.md` | exit 0 |
| C29 | the four-part `grep` chain | exit 0 |

## Checks

| Check | Claim | Proof run | Evidence | Result | Status |
|---|---|---|---|---|---|
| C1 | confirm posts `{token,password}`, signs in with returned email, goes to dashboard | frontend jest, ran+passed | `activate/page.test.tsx:51` `toHaveBeenCalledWith({token:"activation-token",password:"supersecret"})`; `:55` `signInMock ... ("credentials",{email:"admin@acme.com",password:"supersecret",redirect:false})`; `:60` `pushMock ... ("/company-admin/dashboard")` | PASS | assertions carried from 6858086 (file touched by fix: lines shifted only above `:120`, test bodies unchanged); run at b50ff9a |
| C2 | missing token: error, no password field, no mutation | same | `page.test.tsx:68-72` `getByText("Link de ativação inválido ou incompleto.")`, `queryByLabelText("Senha")).not...`, `mutateAsyncMock).not.toHaveBeenCalled()` | PASS | carried; run at b50ff9a |
| C3 | mismatched passwords | same | `page.test.tsx:79-80` `getByText("As senhas não coincidem.")`, `mutateAsyncMock).not.toHaveBeenCalled()` | PASS | carried; run at b50ff9a |
| C4 | 409: backend message + login link, no signIn | same | `page.test.tsx:96-104` `findByText("Company is already activated; use the Admin invite flow instead")`, link `href="/login"`, `signInMock).not.toHaveBeenCalled()`. String equals backend `company-admin-auth.service.ts:414` and is now asserted against the real HTTP body at `company-activation.e2e-spec.ts:220-222` `expect(res.body.message).toBe('Company is already activated; use the Admin invite flow instead')` | PASS | verified at b50ff9a |
| C5 | signIn `ok:false`: message, no navigation | same | `page.test.tsx:116-121` `findByText("Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login.")`, `pushMock).not.toHaveBeenCalled()` | PASS | carried; run at b50ff9a |
| C6 | activate out of `KNOWN_MISSING_PAGES`, contract finds a page | backend jest: `companyAdminActivate (/company-admin/activate) has a frontend page`, `keeps KNOWN_MISSING_PAGES honest` ran+passed | `frontend-routes.ts:23-24` map has only `'/company-admin/invite': 'MW-29'`; `frontend-links.contract.spec.ts:60-65`, `:69-77` | PASS | carried; run at b50ff9a |
| C7 | request with companyId+email, blank domain undefined, form hidden | frontend jest | `request/page.test.tsx:40-44` `toHaveBeenCalledWith({companyId:"company-1",email:"contato@acme.com",domain:undefined})`; `:46` `findByText(/enviamos um link de confirmação/)` | PASS | carried; run at b50ff9a |
| C8 | filled domain sent | same | `request/page.test.tsx:62-66` `... domain:"acme.com"` | PASS | carried; run at b50ff9a |
| C9 | missing companyId | same | `request/page.test.tsx:74-78` `getByText("Link inválido: a Empresa não foi identificada.")`, no Email field, mutation not called | PASS | carried; run at b50ff9a |
| C10 | 400 keeps form + backend message | same | `request/page.test.tsx:97-99` `findByText(/must match the Company's registered contact email/)`, `:100` `getByLabelText("Email")).toHaveValue("outro@acme.com")`. Mock string (`:87`) is byte-equal to backend `service.ts:187-188` and pinned at `company-activation.e2e-spec.ts:76-78` `expect(res.body.message).toBe("The email must match the Company's registered contact email, or a domain must be declared")` | PASS | verified at b50ff9a |
| C11 | dashboard copy link unchanged | same | `company-share-menu.test.tsx:76-78` `writeText).toHaveBeenCalledWith(\`${window.location.origin}/client-dashboard/c1\`)` | PASS | carried; run at b50ff9a |
| C12 | `hasActiveAdmin:true`: no items | same | `company-share-menu.test.tsx:86-91` `.not.toBeInTheDocument()` x2 | PASS | carried; run at b50ff9a |
| C13 | `false`: copies activation URL, toast | same | `:116-119` `writeText ... /company-admin/activate/request?companyId=c1`, `toastSuccess ... ("Link copied")` | PASS | carried; run at b50ff9a |
| C14 | WhatsApp URL | same | `:130-133` `stringMatching(/^https:\/\/wa\.me\/\?text=/),"_blank"` | PASS | carried; run at b50ff9a |
| C15 | mailto URL | same | `:144-146` `stringMatching(/^mailto:contact@acme\.test\?subject=/)` | PASS | carried; run at b50ff9a |
| C16 | undefined: no items | same | `:99-104`; code `company-share-menu.tsx:42` `company.hasActiveAdmin === false` | PASS | carried; run at b50ff9a |
| C17 | en + pt-BR carry the 10 keys; same `companyActivation` key set | frontend jest: `has the same companyActivation keys in every locale` + 20 `has clients.*/companyActivation.*` cases ran+passed | `activation-keys.test.ts:38-46` `expect(Object.keys(ptBR.companyActivation).sort()).toEqual(Object.keys(en.companyActivation).sort())` and `expect(Object.keys(en.companyActivation).sort()).toEqual([...COMPANY_ACTIVATION_KEYS].sort())`; `:70-71,:77-78` per-key `typeof value === "string"`, `length > 0` | PASS | verified at b50ff9a |
| C18 | `getActivationStatus` true, `findUnique` select shape | backend jest | `companies.service.spec.ts:94-100` `resolves.toEqual({hasActiveAdmin:true})`, `findUnique).toHaveBeenCalledWith({where:{id:'company-1'},select:{_count:{select:{companyAdmins:true}}}})` | PASS | carried; run at b50ff9a |
| C19 | false when 0 | same | `:108-110` `resolves.toEqual({hasActiveAdmin:false})` | PASS | carried; run at b50ff9a |
| C20 | NotFoundException | same | `:116-118` `rejects.toThrow(NotFoundException)` | PASS | carried; run at b50ff9a |
| C21 | public GET 200 false / 200 true / 404, no auth | e2e filtered, 3 ran+passed | `company-activation.e2e-spec.ts` activation-status tests: `expect(res.body).toEqual({hasActiveAdmin:false})`, `...true`, `.expect(404)` + `:271` `expect(res.body.message).toBe('Company not found')`; no `.set('Authorization',...)` | PASS | carried evidence; file touched by fix (line shifts +~12 after `:63`); run at b50ff9a |
| C22 | banner text, href, hook called with "c1" | frontend jest | `activate-company-banner.test.tsx:40-44` | PASS | carried; run at b50ff9a |
| C23 | `true`: renders nothing | same | `:52` `expect(container).toBeEmptyDOMElement()` | PASS | carried; run at b50ff9a |
| C24 | loading/error: renders nothing | same | `:56,60`; code `activate-company-banner.tsx:22` `data?.hasActiveAdmin !== false` | PASS | carried; run at b50ff9a |
| C25 | portal renders banner with route id above the overview | `pnpm e2e:email-links` test 5 passed | `email-links.spec.ts:167-168` `getByRole("link",{name:"Ativar minha Empresa"})` `toBeVisible`; `:171-176` overview `getByRole("heading",{level:1,name:"Company Dashboard"})` `toBeVisible`; `:180` `expect(bannerBox!.y).toBeLessThan(overviewBox!.y)`; `:182-186` after click `toHaveURL(...activate/request?companyId=${company.id})`. Code: `client-dashboard/[clientId]/page.tsx:112-115` banner then `<Overview>`; h1 text is `overview-header.tsx:25-26` `{clientInfo.name} Dashboard` with the `|| "Company"` fallback at `page.tsx:87` | PASS (see R2, R5) | verified at b50ff9a |
| C26 | emailed activation link opens real page; only invite is expected failure | `pnpm e2e:email-links` test 3 ✓, test 4 ✘ (expected-fail mark), 6 passed | `email-links.spec.ts:146-150`; `:130` `test.fail(!!knownMissing && !process.env.E2E_STRICT, ...)`; `frontend-routes.ts:23-24` one entry | PASS | carried evidence; file touched; run at b50ff9a |
| C27 | portal -> request -> emailed link -> confirm -> dashboard; admin content; session cookie | `pnpm e2e:email-links` test 5 (16.8s) passed | `email-links.spec.ts:201-203` `toHaveURL(\`${FRONTEND_URL}/company-admin/dashboard\`)`; `:205-207` `getByRole("heading",{level:1,name:"Dashboard da Empresa"})` `toBeVisible` (source `company-admin/dashboard/page.tsx:158` `PageHeader title="Dashboard da Empresa"` -> `page-header.tsx:46` `<h1>`; layout's same text is a `<p>`, `layout.tsx:53`, so the heading query is discriminating); `:209-213` `cookies.some(c => /session-token/.test(c.name))).toBe(true)` (NextAuth cookie `next-auth.session-token`, `__Secure-` prefixed in prod: `next-auth/core/lib/cookie.js:21`) | PASS | verified at b50ff9a |
| C28 | spec has no old names | grep negation exit 0 | `.tasks/empresa-admin-ativacao-frontend.md` no match | PASS | verified at b50ff9a (file touched by fix) |
| C29 | spec criteria 7, 8, `activation-status`, Unresolved row 1 gone | grep chain exit 0 | same file | PASS | verified at b50ff9a |
| C30 | 400 on confirm: backend message + login link, no signIn | frontend jest: `shows the backend message and a login link when the token is invalid or expired` ran+passed | `activate/page.test.tsx:124-141`: mock `status:400`; `:136` `findByText("Invalid or expired activation token")`; `:139-140` `getByRole("link",{name:"Ir para o login"})).toHaveAttribute("href","/login")`; `:141` `expect(signInMock).not.toHaveBeenCalled()`. Component path `page.tsx:97` `setBlockingError(getErrorMessage(err))` (same as 409) | PASS (see R1) | verified at b50ff9a |
| C31 | list `message` joined by `"; "` on confirm page | frontend jest: `joins a list of validation messages into one readable line` (confirm file) ran+passed | `page.test.tsx:144-166`: mock `message:["password must be longer than or equal to 6 characters","token must be a string"]`; `:161-163` `findByText("password must be longer than or equal to 6 characters; token must be a string")`. Code `page.tsx:28-29` `Array.isArray(message) && message.length > 0 -> message.join("; ")` | PASS | verified at b50ff9a |
| C32 | same on request page | frontend jest (request file) | `request/page.test.tsx:102-118`: mock `["email must be an email","domain must be a string"]`; `:115-117` `findByText("email must be an email; domain must be a string")`. Code `request/page.tsx:26-27` | PASS | verified at b50ff9a |
| C33 | both locales use exactly the placeholders the share menu passes | frontend jest: `en placeholders` / `pt-BR placeholders` blocks, 14 cases ran+passed | `activation-keys.test.ts:25-29` `EXPECTED_PLACEHOLDERS = {activationWhatsappMessage:["url"],activationEmailSubject:["company"],activationEmailBody:["url"]}` (values readable at the assertion); `:47-55` `expect(placeholdersOf(value)).toEqual(expected)` per locale; `:57-63` the 4 other new `clients` keys `expect(placeholdersOf(value)).toEqual([])`. Matches share menu call args `company-share-menu.tsx:118` `{url}`, `:128` `{company}`, `:129` `{url}`; templates `en.json:324-326`, `pt-BR.json:324-326` | PASS (see R3) | verified at b50ff9a |

Named-test existence: every `-t` name for C1-C33 appears verbatim in the `--verbose` output above (frontend run: `page.test.tsx` 7 tests, `request/page.test.tsx` 5, `company-share-menu.test.tsx` 6, `activate-company-banner.test.tsx` 3, `activation-keys.test.ts` all; backend: 7 + 6 tests; e2e 3/3 + 11/11). No filter matched nothing.

## Round 1 findings

| # | Round 1 finding | Verdict | Evidence (fix diff, b50ff9a) |
|---|---|---|---|
| F1 | e2e file sends real Resend emails (flake lead) | FIXED (mitigation; original flake cause was never proven) | `company-activation.e2e-spec.ts:8` imports `NotificationsService`; `:15` `const sendCompanyActivationEmail = jest.fn().mockResolvedValue(true)`; `:26-27` `.overrideProvider(NotificationsService).useValue({ sendCompanyActivationEmail })`. Full-file runs x3: 11/11 each, exit 0, 0 lines matching Resend/email-sent (round 1: 9 sends). Email-path tests 214-265 ms |
| F2 | Swept "concurrency: serialises" overstated | FIXED | Checklist Swept: "concurrency: existing, with a gap - `assertCompanyNotActivated` is a `count` then `create` with no transaction and no unique on `CompanyAdmin.companyId` ... two simultaneous confirms with different emails can both pass"; spec `.tasks/empresa-admin-ativacao-frontend.md:96-97` same content in Portuguese. Matches code: `company-admin-auth.service.ts:408-417` count-then-throw, `schema.prisma:92` email-only unique (unchanged by the diff, verified in round 1) |
| F3 | 400 branch and list messages untested | FIXED | C30 `page.test.tsx:124-141` (400 + link + no signIn); C31 `:144-166`; C32 `request/page.test.tsx:102-118`; `getErrorMessage` handles `string \| string[]` in both pages: `activate/page.tsx:21-35`, `request/page.tsx:19-33`. Judgement below |
| F4 | C4/C10 messages never tied to the backend text | FIXED for C4/C10; C30 partial (see R1) | Backend pins: `company-activation.e2e-spec.ts:76-78` (400 ownership message) and `:220-222` (409 message). Page-test mocks compared: `request/page.test.tsx:87` == `e2e-spec.ts:77` == `service.ts:188` (byte-equal); `activate/page.test.tsx:88` == `e2e-spec.ts:221` == `service.ts:414` (byte-equal). Wrong-type 400: `e2e-spec.ts:173-174` `typeof res.body.message === 'string'`, `length > 0` only |
| F5 | C17 asserted only non-empty keys; placeholders untested | FIXED | `activation-keys.test.ts:38-46` (key-set equality across locales, and equal to the 3 expected), `:47-63` (placeholders per locale, C33). See R3 for the residual coupling |
| F6 | C25 "above the overview" proven by reading only | FIXED | `email-links.spec.ts:180` `expect(bannerBox!.y).toBeLessThan(overviewBox!.y)`, preceded by `toBeVisible` on both (`:168`, `:175`) and null checks (`:178-179`); test ran and passed. Checklist C25 reworded (see R5) |
| F7 | C27 stopped at the URL | FIXED | `email-links.spec.ts:205-207` heading `Dashboard da Empresa` visible; `:209-213` session-token cookie present. Test passed at b50ff9a |
| F8 | Swept authorization omitted throttle; Coverage omitted `hasActiveAdmin`-from-list dependency | FIXED | Checklist Swept authorization: "Only the global 60/min/IP `ThrottlerGuard` limits the endpoint"; Coverage adds "The share menu shows activation items only when the list payload carries `hasActiveAdmin: false` (`companies.service.ts` `findAll` ...)"; `.tasks/...:96` same throttle sentence. Throttle fact verified in round 1 (`app.module.ts:43-49,73`) |

8/8 fixed.

## Regression review (fix diff `3caf921..HEAD`)

Every hunk maps to a finding: e2e spec (F1, F4), both pages (F3), page tests (F3), activation-keys test (F5), Playwright spec (F6, F7), `.tasks` and checklist (F2, F8, F3-F7 wording). Nothing unexplained. No backend `src` change, no frontend non-test change beyond the two `getErrorMessage` helpers.

`getErrorMessage` (both pages, identical logic; `activate/page.tsx:21-35`, `request/page.tsx:19-33`):

| Input `response.data.message` | Before | After |
|---|---|---|
| non-empty string | the string | the string (unchanged) |
| non-empty array | raw array returned as `string` (type lie; React would concatenate items with no separator) | `join("; ")` (C31/C32 prove it) |
| empty array | truthy `[]` returned, blank message | falls through to the default text (correct; not tested) |
| empty string or missing | default text | default text (unchanged; not tested) |
| non-string, non-array (object) | object returned, React render error | default text (improvement; not tested) |

Verdict: correct and strictly safer; string path behaviour unchanged. Residual: array elements are not stringified (`[{...}]` would render `[object Object]`), which Nest's `ValidationPipe` never produces (strings only). The fallback branches have no test in either page (`rg "Não foi possível (ativar a conta|pedir a ativação)"` over `*.test.*`: no hits) and the helper is duplicated in two files (R2).

E2E override: `useValue({ sendCompanyActivationEmail })` provides one method. It boots and 11/11 pass, so no route under test, and no other `AppModule` provider at boot, calls another `NotificationsService` method. A future route that does would throw `is not a function` (loud, not silent). The mock is never asserted, see R4.

Playwright additions: the added `{ timeout: NEXT_DEV_COMPILE_MS }` are wiring, no assertion weakened. `NEXT_DEV_COMPILE_MS` (30 s) is used at `email-links.spec.ts:168,175,184,191,202,207`.

## Residual gaps (ranked, low, none flips a check)

1. **R1 - C30 mock text is invented, not pinned.** `page.test.tsx:128` mocks `"Invalid or expired activation token"`. Backend `verifyToken` throws `'Invalid token'` / `'Token has expired'` (`company-admin-auth.service.ts:394,399,402`); the e2e wrong-type test asserts only a non-empty string (`e2e-spec.ts:173-174`). The Coverage line "The exact messages they mock are pinned against the real backend" is true for C4/C10 and false for C30, though its parenthetical discloses the non-empty-only case. The check's claim (page shows whatever the backend sends) holds; the pin claim is overstated.
2. **R2 - `getErrorMessage` fallback branches untested and duplicated.** Empty array, missing/empty message, and non-string message reach the default text with no test in either page. The helper exists twice with identical logic.
3. **R3 - C33 compares templates to a test-local constant, not to the share menu's call.** `EXPECTED_PLACEHOLDERS` (`activation-keys.test.ts:25-29`) mirrors `company-share-menu.tsx:118,128,129`, but renaming an argument in the component (e.g. `{ link: ... }`) fails no test, since `company-share-menu.test.tsx` uses hand-written messages with no placeholders.
4. **R4 - e2e email mock never asserted; F1 root cause unproven.** `sendCompanyActivationEmail` (`e2e-spec.ts:15`) is not asserted, so no e2e proves an accepted request triggers the send (also not proven before the fix). The original 1-in-11 flake was never reproduced or captured, so F1 is a plausible mitigation, backed by 3 clean full runs plus 1 filtered run.
5. **R5 - checklist wording drift.** C25 says "banner link visible with `companyId` in its `href`"; the test asserts the URL after click (`email-links.spec.ts:182-186`), equivalent in effect but not the `href` attribute. The overview heading `"Company Dashboard"` depends on the no-invoice fallback name `|| "Company"`. The Deviations line "The two `{ timeout: ... }`" now understates the count (6 uses, `:168,175,184,191,202,207`; 3 uses at 3caf921).

## Test policy rows

No `Test policy` section; profile `light`. Not run.

## Faults injected

Skipped (`light`). Note: the fix added assertion surfaces (C30-C33, C25 order, C27 content and cookie) that were never made to fail once.

## Gate

- `pnpm --filter backend exec tsc --noEmit -p tsconfig.json` - exit 0 (verified at b50ff9a)
- `pnpm --filter frontend exec tsc --noEmit` - exit 0 (verified at b50ff9a)
- `pnpm --filter frontend exec jest --ci` - 66 suites, 559 passed, 0 failed
- `pnpm --filter backend exec jest --ci --silent` - 27 suites, 170 passed, 0 failed
- Backend e2e `company-activation.e2e-spec.ts` full x3 - 11/11 each; filtered `activation-status` 3/3
- `pnpm e2e:email-links` - 6 passed (invite = expected failure)
- C28, C29 greps - exit 0
