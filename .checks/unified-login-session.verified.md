# Unified login session Verification

**Verdict**: PASS
**Checks proven**: 28/28; G5 resolved; no blocking gap
**Profile**: light
**Diff range**: 3353c4c..2da008a (HEAD)
**Fix diff**: d9b9e25..2da008a
**Round**: 4 - scoped
**Verifier**: independent sub-agent (author != verifier)
**Date**: 2026-09-19

Round-3 FAIL was only G5 (spec :93 vs Landing :26). `git diff d9b9e25..HEAD --stat` at 2da008a: 2 files, 3 insertions, 1 deletion - `.checks/unified-login-session.md` (one Handoff paragraph at :146) and the spec (:93 rewritten). No application implementation or test file changed. Proofs re-ran in full at 2da008a; everything else is marked `verified at 2da008a` or `carried from <sha>`.

## Binding sources

| Source | Opened | Contradiction | Uncovered |
|---|---|---|---|
| .checks/unified-login-session.md | yes, Landing :20-26 and Handoff :140-150 reread at 2da008a | none (G5 resolved) | no check added or removed since round 3 |
| docs/superpowers/specs/2026-09-19-unified-login-session-design.md | yes, all 202 lines reread at 2da008a (verified at 2da008a) | none introduced by the :93 rewrite; :100 advisory A1 below | no full UI enumeration under light |
| docs/superpowers/plans/2026-09-19-unified-login-session.md | Tasks 4 and 8 and Global Constraints reopened at 2da008a; rest carried from c7cc20b | Task 4 (:612-718, body :671) and Task 8 (:1544) contradict Landing :26 and spec :93; stale, see F1 | UI/manual authenticated scenarios not executed |
| docs/adr/0002-empresa-admin-separate-auth.md | yes, reread at 2da008a (verified at 2da008a) | none; separate identities untouched by :93 | no domain redesign |

CLAUDE.md, application CLAUDE.md files and verify.md instructions are carried from prior rounds. Coverage join, Test policy and fault injection remain excluded by light (carried from 3353c4c..d9b9e25 rounds).

## G5 resolution: spec :93 vs Landing :26 vs code

Verified at 2da008a:

- Spec :93 now says: JSON responses pass a recursive removal of the key `access_token` before returning to the browser; `POST /company-admin/auth/register` returns the backend JWT in the body; company registration calls `/api/backend/company-admin/auth/register`, not a direct `fetch`; login does not go through this proxy. Landing :26 says: recursively remove the exact `access_token` key from every JSON response; registration uses `/api/backend/company-admin/auth/register`; direct browser fetch rejected. Same rule, same key, same URL, same rejected alternative. Contradiction gone.
- Code agrees with both: `apps/frontend/src/app/api/backend/[...path]/route.ts:6-20` recursion over arrays and objects, `:14` filters exactly `key !== "access_token"`, `:51` applies it to the JSON branch; binary branch `:56-60` is untouched. `apps/frontend/src/app/[locale]/company-admin/register/page.tsx:34` fetches `/api/backend/company-admin/auth/register`, then `:30` `signIn("credentials", { ..., redirect: false })`, `:40` pushes `/company-admin/dashboard`. Test `apps/frontend/src/app/api/backend/[...path]/route.test.ts:137` "removes access_token while preserving the JSON response status and fields" ran and passed (assertions carried from d9b9e25: :170 status 201, :171-175 exact retained object without root or nested `access_token`).
- No new contradiction with other spec lines:
  - :35-37 (backend `accessToken` never exposed to the client): complementary. Session drops `accessToken`; the proxy strips the backend's snake-case `access_token`. Same intent, different surface.
  - :91 (`session()` stops forwarding `accessToken`): unrelated to the proxy; consistent.
  - :113-118, :133-136 (login via `authorize()`, manual Network check for `accessToken`): consistent; :93 keeps "login does not pass through this proxy".
  - :181 (proxy is "praticamente uma cópia" of the existing one): still true, the added sanitizer is disclosed at :93 and the copy claim is loose, not contradictory.
  - :100: see advisory A1.
- Handoff paragraph (checklist :146) accurately describes the fix; it says a fresh Verifier must confirm, which this round does.

## Plan Task 4 and Task 8 vs the Landing (F1, not edited)

- Plan Task 4, `docs/superpowers/plans/2026-09-19-unified-login-session.md:612-718`: the proxy body (`:671`) is `NextResponse.json(data, { status })` with no `access_token` removal. Contradicts Landing :26 and spec :93.
- Plan Task 8, same file `:1544`: `fetch(\`${getApiUrl()}/company-admin/auth/register\`, ...)`, a direct backend fetch from the browser; `:1404` states this as the intended pattern. Contradicts Landing :26 (direct browser fetch is the rejected alternative) and spec :93.
- Both also conflict with the plan's own Global Constraints, `:17`: "`accessToken` must never appear in any JSON response the browser can read". The plan is internally inconsistent.
- Authority: the spec (binding architecture and security constraints, now :93 and :35-37) plus the checklist Landing (a later, explicit decision recorded as a one-way door) win. Plan Tasks 4 and 8 are stale implementation guidance superseded by the round-1 G1 fix. The code follows the Landing and the spec, not the plan text. Checklist Sources describe the plan as "implementation sequence", not binding architecture, so this does not block. The plan file is untracked (`??`), so it is a working file; the author may add a supersession note there, no gate depends on it.

## Advisory

- A1, spec `:100` (advisory, not blocking, not introduced by 2da008a): the row for `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` says "Só o link 'voltar ao login' ... passa a /login". At 3353c4c the register page consumed `useCompanyAdminAuth().register` (provider removed by spec :96), so it necessarily changes beyond the link; spec :170 also names `register/page.test.tsx` as rewritten to mock `next-auth/react`, and :93 now describes the register call. :100 was already loose against C18 and :170 in rounds 1-3 and no earlier round treated it as a decision. It is a sentence-precision issue, not a decided constraint the code violates.
- A2, F1 above (plan text stale).

## Proof runs

All verified at 2da008a.

- B: `cd apps/backend && npx jest --runInBand --verbose --silent`; exit 0, 26 suites, 160 tests passed, 0 failed. Six named backend proofs each appear as individual passes (rejects an email that already belongs to a CompanyAdmin; rejects creating a User for an email that already belongs to a CompanyAdmin; register rejects an email that already belongs to a User; activation confirmation rejects ...; admin invite rejects ...; invite confirmation rejects ...).
- F: `cd apps/frontend && npx jest --runInBand --verbose --silent`; exit 0, 61 suites, 503 tests passed, 0 failed. Then `npx tsc --noEmit`; exit 0. Every named frontend proof appears individually as a pass, including the sanitizer test "removes access_token while preserving the JSON response status and fields" and all five `dashboard/layout.test.tsx` tests.
- S: C23 six `test ! -e` plus `! rg 'useCompanyAdminAuth|...' src`: exit 0. C24 `! rg 'company-admin/login' src`: exit 0 (reset-password "redirects" named test ran in F). C25 `rg -l '@/lib/axios' ... | wc -l` equals 2 and `! rg '@/lib/company-admin-axios'`: exit 0.
- P: `pnpm preview:start`, `source .preview-worktree.state`, curl `--fail` on `/login` and `/company-admin/register` at FRONTEND_PORT=3100, `pnpm preview:stop` on an EXIT trap. The first, literal single-shot run failed with curl exit 7 (connection refused right after start, Next dev had not yet bound the port; same startup race as round 3, not an app defect) and cleanup ran. Second run waited for readiness: `/login` HTTP 200 on attempt 2, `/company-admin/register` HTTP 200 on attempt 1, then the literal `curl --fail` pair exit 0. Migrations: no pending. After stop: ports 3100 and 3102 not listening, `.preview-worktree.state` absent, no preview next/nest process for this worktree (only the long-running turbo daemon, pid 150883, unrelated to preview).
- No empty-filter success was accepted: each named test above was located in the verbose output.

## Checks

Every check is `verified at 2da008a` for its proof execution (B/F/S/P above). Per-check assertion citations are `carried from d9b9e25` (itself carried from 4b4849e): no application or test file changed in d9b9e25..2da008a, and the checklist lines they cite (:109, :112, :115, :120, :123, :126) did not move because the only checklist change is a paragraph added after Checks at :146. Citations are repository-relative.

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | User registration rejects CompanyAdmin email before creation | B: rejects an email that already belongs to a CompanyAdmin | apps/backend/src/auth/auth.service.spec.ts:54: rejects.toThrow(ConflictException); :56: expect(usersServiceMock.create).not.toHaveBeenCalled() | PASS |
| C2 | Google cannot create User for CompanyAdmin email | B: rejects creating a User for an email that already belongs to a CompanyAdmin | apps/backend/src/auth/auth.service.spec.ts:74: rejects.toThrow(ConflictException); :76: expect(usersServiceMock.create).not.toHaveBeenCalled() | PASS |
| C3 | Direct CompanyAdmin registration rejects User email | B: register rejects an email that already belongs to a User | apps/backend/src/company-admin/company-admin-auth.service.spec.ts:79: rejects.toThrow(ConflictException) | PASS |
| C4 | Activation rejects User email | B: activation confirmation rejects an email that already belongs to a User | apps/backend/src/company-admin/company-admin-auth.service.spec.ts:110: rejects.toThrow(ConflictException) | PASS |
| C5 | Admin invite rejects User email | B: admin invite rejects an email that already belongs to a User | apps/backend/src/company-admin/company-admin-auth.service.spec.ts:133: rejects.toThrow(ConflictException) | PASS |
| C6 | Invite confirmation rejects User email | B: invite confirmation rejects an email that already belongs to a User | apps/backend/src/company-admin/company-admin-auth.service.spec.ts:162: rejects.toThrow(ConflictException) | PASS |
| C7 | Successful User login returns USER without fallback | F: returns a User actor without trying CompanyAdmin | apps/frontend/src/app/api/auth/[...nextauth]/route.test.ts:75: resolves.toMatchObject({ id: "user-1", actorType: "USER", accessToken: "user-token" }); :81: expect(global.fetch).toHaveBeenCalledTimes(1), with /auth/login at :82 | PASS |
| C8 | Existing User wrong password does not consume admin login | F: does not spend CompanyAdmin throttle for a User password mistake | apps/frontend/src/app/api/auth/[...nextauth]/route.test.ts:95: resolves.toBeNull(); :102: expect(global.fetch).not.toHaveBeenCalledWith("http://backend.test/company-admin/auth/login", expect.anything()) | PASS |
| C9 | Missing User falls back and returns COMPANY_ADMIN | F: falls back only when the email is not a User | apps/frontend/src/app/api/auth/[...nextauth]/route.test.ts:111 sets exists:false; :125: resolves.toMatchObject({ id: "admin-1", actorType: "COMPANY_ADMIN", accessToken: "admin-token" }); :135 asserts third fetch to /company-admin/auth/login | PASS |
| C10 | Google records USER | F: tags Google sign-in as User | apps/frontend/src/app/api/auth/[...nextauth]/route.test.ts:170: resolves.toBe(true); :172: expect(user).toMatchObject({ actorType: "USER", accessToken: "google-token" }) | PASS |
| C11 | Internal JWT retains token; client Session omits accessToken | F: keeps the backend token out of the client session | apps/frontend/src/app/api/auth/[...nextauth]/route.test.ts:190: expect(token).toMatchObject({ actorType: "COMPANY_ADMIN", accessToken: "admin-token" }); :203: expect(session.user.actorType).toBe("COMPANY_ADMIN"); :204: expect(session).not.toHaveProperty("accessToken") | PASS |
| C12 | Proxy reads internal JWT and injects exact Bearer | F: injects the internal backend token | apps/frontend/src/app/api/backend/[...path]/route.test.ts:124: expect(mockGetToken).toHaveBeenCalledWith({ req, secret: process.env.NEXTAUTH_SECRET }); :128 asserts upstream headers exactly { Authorization: "Bearer internal-token" } | PASS |
| C13 | Proxy preserves tested HTTP values and does not add accessToken | F: preserves the upstream HTTP contract | apps/frontend/src/app/api/backend/[...path]/route.test.ts:196 asserts query, PATCH, JSON body and headers; :209 status 202; :211 toEqual({ updated: true }); :212 not.toContain("accessToken"); :221 asserts GET and CSV query; :231 status 206; :235 resolves.toEqual(new Uint8Array([0, 1, 2, 255]).buffer). Current citations revalidated; token removal is separately proven below | PASS |
| C14 | User login navigates /work-hours | F: sends a User to /work-hours after a successful login | apps/frontend/src/features/auth/login-form.test.tsx:55: expect(pushMock).toHaveBeenCalledWith("/work-hours") | PASS |
| C15 | CompanyAdmin login navigates dashboard | F: sends a CompanyAdmin to /company-admin/dashboard after a successful login | apps/frontend/src/features/auth/login-form.test.tsx:68: expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard") | PASS |
| C16 | Exact invalid-credentials text without navigation | F: shows an inline error and does not navigate when credentials are invalid | apps/frontend/src/features/auth/login-form.test.tsx:82: screen.findByText("Invalid email or password.") followed by toBeInTheDocument(); :84: expect(pushMock).not.toHaveBeenCalled() | PASS |
| C17 | No separate CompanyAdmin login link | F: does not render a separate company-admin login link; S reference search | apps/frontend/src/features/auth/login-form.test.tsx:91: screen.queryByRole("link", { name: "companyAdminLink" }) followed by not.toBeInTheDocument(); .checks/unified-login-session.md:112: ! rg 'company-admin/login' src, exit 0 | PASS |
| C18 | Registration authenticates with NextAuth and opens dashboard | F: registers, authenticates through the same session mechanism as login, and redirects straight to the dashboard | apps/frontend/src/app/[locale]/company-admin/register/page.test.tsx:44 asserts fetch("/api/backend/company-admin/auth/register", expect.objectContaining({ method: "POST" })); :48 asserts signIn("credentials", { email: "admin@acme.com", password: "supersecret", redirect: false }); :53 asserts /company-admin/dashboard | PASS |
| C19 | HTTP 409 displays message, retains fields, no authentication/navigation | F: shows the backend's 409 error message and keeps the entered fields | apps/frontend/src/app/[locale]/company-admin/register/page.test.tsx:59 now supplies status:409; :76 asserts exact backend message; :79-80 expect(pushMock/signInMock).not.toHaveBeenCalled(); :82-84 assert all entered values with toHaveValue("Acme Inc"), toHaveValue("admin@acme.com"), toHaveValue("supersecret") | PASS |
| C20 | Only COMPANY_ADMIN renders content; others redirect; loading text | F: all five dashboard layout tests | apps/frontend/src/app/[locale]/company-admin/dashboard/layout.test.tsx:37 asserts COMPANY_ADMIN content; :50-51 assert unauthenticated redirect and absent content; :66 asserts USER redirect; new :67 expect(screen.queryByText("dashboard content")).not.toBeInTheDocument() proves USER exclusion; :79 asserts screen.getByText("Carregando…").toBeInTheDocument() | PASS |
| C21 | Logout calls signOut without automatic redirect, then /login | F: signs out through NextAuth and returns to /login | apps/frontend/src/app/[locale]/company-admin/dashboard/layout.test.tsx:98: expect(signOutMock).toHaveBeenCalledWith({ redirect: false }); :100: expect(pushMock).toHaveBeenCalledWith("/login") | PASS |
| C22 | Deactivation signs out and routes only after mutation success | F: deactivates only after the confirmation dialog is accepted | apps/frontend/src/app/[locale]/company-admin/dashboard/page.test.tsx:249-254 installs deferred mutation; :274 expects exactly one mutation call; :276-277 expect(signOutMock/pushMock).not.toHaveBeenCalled() while pending; :279 resolves it; :282 expects signOut({ redirect:false }); :285 expects push("/login?deactivated=1") | PASS |
| C23 | Legacy provider/cookies/proxy/logout/login removed and unreferenced | S: complete shell proof from checklist | .checks/unified-login-session.md:109: all six test ! -e assertions and ! rg 'useCompanyAdminAuth\|CompanyAdminAuthProvider\|company-admin-axios\|company-admin-session\|CompanyAdminProfile' src returned exit 0. Deleted files cannot have current source-line citations; this located command is the absence proof | PASS |
| C24 | Remaining entry links target /login; no old route | F: submits the new password with the token, shows confirmation and redirects to login; S | apps/frontend/src/app/[locale]/company-admin/reset-password/page.test.tsx:57: expect(pushMock).toHaveBeenCalledWith("/login"); register/page.tsx:130 and forgot-password/page.tsx:84: href="/login"; reset-password/page.tsx:89: router.push("/login"); .checks/unified-login-session.md:112 absence search exit 0 | PASS |
| C25 | Both admin services use generalized axios | S | apps/frontend/src/features/company-admin/company-admin-auth.service.ts:3 and company-admin-dashboard.service.ts:3 import from "@/lib/axios"; apps/frontend/src/lib/axios.ts:4: baseURL:"/api/backend". .checks/unified-login-session.md:115: matching-file count exactly 2 and no legacy import, exit 0 | PASS |
| C26 | Entire backend Jest suite passes | B | .checks/unified-login-session.md:120 command with --verbose --silent; observed 26 passed suites, 160 passed tests, exit 0 at d9b9e25 | PASS |
| C27 | Entire frontend Jest suite and TypeScript pass | F | .checks/unified-login-session.md:123 commands with Jest --verbose --silent; observed 61 passed suites, 503 passed tests; TypeScript exit 0 at d9b9e25 | PASS |
| C28 | Worktree preview serves both public routes | P | .checks/unified-login-session.md:126 proof with startup retry and EXIT cleanup; package.json:12-13 start/stop scripts. curl --fail returned login HTTP 200 and register HTTP 200; cleanup exit 0 at d9b9e25 | PASS |

## Swept constraints

All rows `carried from d9b9e25` (evidence from 4b4849e, related proofs re-run at 2da008a); the data-lifecycle row additionally re-checked against code and spec at 2da008a (see G5 resolution).

| Row | Evidence / provenance | Result |
|---|---|---|
| validation | C1-C6 assertions carried from c7cc20b, proofs rerun; C19 now supplies status:409 at register/page.test.tsx:59 and asserts message/values/no signIn/no push | PASS, carried from 4b4849e; proof rerun at d9b9e25 |
| failure modes | All named proof executions rerun; C19/C20/C22 gaps closed as above | PASS, carried from 4b4849e; proof rerun at d9b9e25 |
| idempotency and retry | Out-of-scope decision carried from c7cc20b | Scope accepted |
| authorization | Backend guard/strategy inspection carried from c7cc20b; fix does not touch them. C20 now checks absent content for USER at dashboard/layout.test.tsx:67 | PASS, C20 recarried from 4b4849e; proof rerun at d9b9e25 |
| concurrency and ordering | Application-level uniqueness approach and login-ordering interpretation carried from c7cc20b; code untouched; C7-C9 proofs rerun | PASS within stated application-level scope |
| data lifecycle | register/page.tsx:34 now calls /api/backend/company-admin/auth/register; register/page.test.tsx:44 asserts that route. Proxy route.ts:14 removes access_token recursively and :51 returns the sanitized data. New proxy route.test.ts:170 asserts status 201; :171 asserts exact body { admin: { id: "admin-1", email: "admin@acme.com" }, nested: { preserved: true }, message: "CompanyAdmin registered" }, excluding both original and nested token fields. C11 and C23 rerun; seven-day maxAge at auth route.ts:203 is unchanged from c7cc20b | PASS, G1 resolution carried from 4b4849e; Landing/code rechecked at d9b9e25 |
| external-dependency failure | C16 rerun. Google availability and consent exclusions carried from c7cc20b | Scope accepted; no live Google claim |
| state transitions | C14/C15/C18/C21 rerun; C22 now proves pending-versus-completed ordering at dashboard/page.test.tsx:276-285 | PASS, carried from 4b4849e; proof rerun at d9b9e25 |
| observability | Frontend direct credential/JWT/session dump removal inspection carried from c7cc20b; fix adds no logging. Arbitrary external error-object contents were not dynamically verified; existing backend logging remains outside the fix | Carried from c7cc20b |

## Ranked gaps

1. None blocking. G5 resolved.
2. A1 (advisory): spec :100 "Só o link" is looser than the register page change; sentence precision only.
3. F1 (advisory): plan Tasks 4 and 8 still show a proxy without sanitization and a direct backend fetch; superseded by spec :93 and Landing :26.

G1-G4 remain resolved (carried from 4b4849e, proofs re-run at 2da008a): G1 registration/proxy sanitization, G2 USER content exclusion, G3 deferred deactivation ordering, G4 explicit status:409.

## Coverage join

Not executed: excluded by light in all rounds.

## Test policy rows

Not executed: excluded by light in all rounds. The checklist has no Test policy section.

## Faults injected

Not executed: excluded by light in all rounds. No code mutations or scratch worktrees. The fix diff touches no application code, so no new assertion surface exists to mutate.

## Gate

Verified at 2da008a:

- Backend: 160 passed, 0 failed; 26 suites; exit 0.
- Frontend: 503 passed, 0 failed; 61 suites; exit 0.
- TypeScript: exit 0.
- C23-C25 shell checks: exit 0.
- Preview: `/login` 200, `/company-admin/register` 200; stopped, ports 3100/3102 free.
- Overall: PASS, 28/28 checks proven, G5 resolved, no new blocking contradiction.

## Workspace preservation

`git status --porcelain` was recorded before starting and matched after the last command; only this report was edited. Pre-existing modified and untracked user files were not touched. No stash, no push.
