# Unified login session

Profile: `light` (the repository does not declare a `tlc-implement` profile).

Sources:

- `docs/superpowers/plans/2026-09-19-unified-login-session.md` - implementation sequence, concrete files, commands, and expected behaviour
- `docs/superpowers/specs/2026-09-19-unified-login-session-design.md` - binding architecture, security constraints, and scope
- `docs/adr/0002-empresa-admin-separate-auth.md` - separate `User` and `CompanyAdmin` identities

## Out of scope

- Refresh-token rotation - neither existing session mechanism rotates backend JWTs.
- Google login for `CompanyAdmin` - Google remains `User`-only.
- Unified password recovery - the dedicated CompanyAdmin recovery pages remain.
- Collaborator, invite, or authorized-domain behaviour beyond preventing a `User`/`CompanyAdmin` email collision.
- Production migration or deployment - this work is local only.

## Landing

The backend reuses the two identity services to prevent new cross-table email collisions. The frontend keeps NextAuth as the only browser session and generalizes the existing server-side CompanyAdmin proxy so backend JWTs remain outside client-side JavaScript.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| All authenticated browser-to-backend traffic uses one same-origin proxy | `/api/backend/[...path]` reads `JWT.accessToken` with `getToken()` and injects `Authorization` server-side | browser-side `getSession()` and Bearer injection - exposes the backend JWT to XSS |
| Credentials fallback distinguishes a missing User from a bad User password | after `/auth/login` fails, server-side `authorize()` queries existing `GET /users/check?email=...`; it calls `/company-admin/auth/login` only when `exists` is false | unconditional fallback - consumes the CompanyAdmin 10/min/IP throttle for a User password mistake |
| The browser-visible actor discriminator is explicit | `Session.user.actorType` is exactly `"USER" | "COMPANY_ADMIN"`; `accessToken` exists only on the internal NextAuth `JWT` | infer actor from `role` or route - CompanyAdmin has no platform role and inference is brittle |

- Nothing else in this change is hard to reverse.

## Checks

### S1 - Cross-identity email uniqueness · 5 files · 24 KB · ~6k

**C1** - `AuthService.register()` rejects an email owned by a `CompanyAdmin` with `ConflictException` before creating a `User`.
Proof: `cd apps/backend && npx jest src/auth/auth.service.spec.ts -t "rejects an email that already belongs to a CompanyAdmin"`

**C2** - `AuthService.googleAuth()` rejects creating a new `User` for an email owned by a `CompanyAdmin` with `ConflictException`.
Proof: `cd apps/backend && npx jest src/auth/auth.service.spec.ts -t "rejects creating a User for an email that already belongs to a CompanyAdmin"`

**C3** - Direct CompanyAdmin registration rejects an email owned by a `User` with `ConflictException`.
Proof: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts -t "register rejects an email that already belongs to a User"`

**C4** - Company activation confirmation rejects an admin email owned by a `User` with `ConflictException`.
Proof: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts -t "activation confirmation rejects an email that already belongs to a User"`

**C5** - Inviting a CompanyAdmin rejects an email owned by a `User` with `ConflictException`.
Proof: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts -t "admin invite rejects an email that already belongs to a User"`

**C6** - Confirming a CompanyAdmin invite rejects an email owned by a `User` with `ConflictException`.
Proof: `cd apps/backend && npx jest src/company-admin/company-admin-auth.service.spec.ts -t "invite confirmation rejects an email that already belongs to a User"`

### S2 - NextAuth token containment and generalized proxy · 5 files · 12 KB · ~3k

**C7** - A successful `User` credentials login returns `actorType: "USER"` and does not call CompanyAdmin login.
Proof: `cd apps/frontend && npx jest src/app/api/auth/\[...nextauth\]/route.test.ts -t "returns a User actor without trying CompanyAdmin"`

**C8** - A wrong password for an existing `User` returns invalid credentials without calling CompanyAdmin login.
Proof: `cd apps/frontend && npx jest src/app/api/auth/\[...nextauth\]/route.test.ts -t "does not spend CompanyAdmin throttle for a User password mistake"`

**C9** - A missing `User` email falls back to CompanyAdmin login and a successful response returns `actorType: "COMPANY_ADMIN"`.
Proof: `cd apps/frontend && npx jest src/app/api/auth/\[...nextauth\]/route.test.ts -t "falls back only when the email is not a User"`

**C10** - Google sign-in records `actorType: "USER"` and never creates a CompanyAdmin session.
Proof: `cd apps/frontend && npx jest src/app/api/auth/\[...nextauth\]/route.test.ts -t "tags Google sign-in as User"`

**C11** - The internal NextAuth JWT retains `accessToken`, while the client-facing session contains `actorType` and no `accessToken` property.
Proof: `cd apps/frontend && npx jest src/app/api/auth/\[...nextauth\]/route.test.ts -t "keeps the backend token out of the client session"`

**C12** - `/api/backend/[...path]` reads the internal token server-side and injects exactly `Authorization: Bearer <accessToken>` upstream.
Proof: `cd apps/frontend && npx jest src/app/api/backend/\[...path\]/route.test.ts -t "injects the internal backend token"`

**C13** - The generalized proxy preserves query strings, methods, request bodies, upstream status, JSON bodies, and binary bodies without adding an `accessToken` response field.
Proof: `cd apps/frontend && npx jest src/app/api/backend/\[...path\]/route.test.ts -t "preserves the upstream HTTP contract"`

### S3 - Unified entry and post-registration session · 6 files · 13 KB · ~3k

**C14** - Successful credentials login routes a `USER` session to `/work-hours`.
Proof: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx -t "sends a User to /work-hours"`

**C15** - Successful credentials login routes a `COMPANY_ADMIN` session to `/company-admin/dashboard`.
Proof: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx -t "sends a CompanyAdmin to /company-admin/dashboard"`

**C16** - Invalid credentials show exactly `Invalid email or password.` without navigating.
Proof: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx -t "shows an inline error"`

**C17** - `/login` has no dedicated CompanyAdmin login link.
Proof: `cd apps/frontend && npx jest src/features/auth/login-form.test.tsx -t "does not render a separate company-admin login link"`

**C18** - Successful CompanyAdmin registration authenticates with NextAuth credentials and routes directly to `/company-admin/dashboard`.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/register/page.test.tsx -t "authenticates through the same session mechanism"`

**C19** - A 409 registration response displays the backend message, retains all entered values, and does not authenticate or navigate.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/register/page.test.tsx -t "shows the backend's 409 error message"`

### S4 - CompanyAdmin consumers migrate to NextAuth · 14 files · 53 KB · ~13k

**C20** - The dashboard layout renders only for `COMPANY_ADMIN`, redirects unauthenticated and `USER` sessions to `/login`, and shows `Carregando…` while resolving.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard/layout.test.tsx`

**C21** - Dashboard logout calls `signOut({ redirect: false })` and navigates to `/login`.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard/layout.test.tsx -t "signs out"`

**C22** - Company deactivation calls NextAuth `signOut({ redirect: false })` and navigates to `/login?deactivated=1` after the mutation succeeds.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/dashboard/page.test.tsx -t "deactivates"`

**C23** - The CompanyAdmin-only provider, cookie helpers, proxy/logout routes, and dedicated login page are deleted, with no remaining imports or references.
Proof: `cd apps/frontend && test ! -e src/features/company-admin/use-company-admin-auth.tsx && test ! -e src/lib/company-admin-axios.ts && test ! -e src/lib/company-admin-session.ts && test ! -e 'src/app/api/company-admin/[...path]/route.ts' && test ! -e src/app/api/company-admin/logout/route.ts && test ! -e 'src/app/[locale]/company-admin/login/page.tsx' && ! rg 'useCompanyAdminAuth|CompanyAdminAuthProvider|company-admin-axios|company-admin-session|CompanyAdminProfile' src`

**C24** - Remaining CompanyAdmin registration and recovery links or redirects target `/login`, with no `/company-admin/login` reference under `src`.
Proof: `cd apps/frontend && npx jest src/app/\[locale\]/company-admin/reset-password -t "redirects" && ! rg 'company-admin/login' src`

**C25** - Both remaining CompanyAdmin services import the generalized `/api/backend` axios client.
Proof: `cd apps/frontend && test "$(rg -l '@/lib/axios' src/features/company-admin/company-admin-{auth,dashboard}.service.ts | wc -l)" -eq 2 && ! rg '@/lib/company-admin-axios' src/features/company-admin`

### S5 - Integrated build and regression gate · whole touched surface · ~25k total floor

**C26** - All backend Jest tests pass after the cross-identity dependency changes.
Proof: `cd apps/backend && npx jest --runInBand`

**C27** - All frontend Jest tests and the TypeScript compiler pass after the session migration.
Proof: `cd apps/frontend && npx jest --runInBand && npx tsc --noEmit`

**C28** - A local preview starts from this worktree and its unauthenticated `/login` and CompanyAdmin registration routes respond successfully.
Proof: `pnpm preview:start && source .preview-worktree.state && curl --fail --silent --show-error http://localhost:${FRONTEND_PORT}/login >/dev/null && curl --fail --silent --show-error http://localhost:${FRONTEND_PORT}/company-admin/register >/dev/null; status=$?; pnpm preview:stop; exit $status`

## Swept

- validation: C1-C6 and C19 cover duplicate identity creation and registration errors.
- failure modes: C8, C13, C16, C19, C20, C22, C26-C28.
- idempotency and retry: not in scope - no retryable write or idempotency key is introduced; repeated login remains read/authentication work and registration retains existing semantics.
- authorization: C20 verifies the CompanyAdmin dashboard actor guard; existing backend JWT guards remain unchanged.
- concurrency and ordering: registration checks remain application-level like the existing same-table checks; a database-wide cross-table uniqueness constraint is impossible without changing the separate-identity model. Login ordering is fixed by C7-C9.
- data lifecycle: C11 and C23 remove client-visible and legacy-cookie token paths; NextAuth JWT lifetime remains seven days.
- external-dependency failure: C16 covers credential failure; Google provider availability and OAuth consent are unchanged and are not automated because they require external credentials.
- state transitions: C14-C15, C18, C21-C22 cover login, post-registration login, logout, and deactivation transitions.
- observability: raw credentials and token/session debug logs are removed; error logs contain no password or backend JWT.

## Handoff

S1-S5 share the auth/session interface and total roughly 25k tokens of source reading, below the default 150k budget; one implementation batch avoids cutting the login transport midway. The batch boundary is after S5, followed by an independent verifier over the feature base through `HEAD`.
