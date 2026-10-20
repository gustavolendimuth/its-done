# MW-31 — Auto-cadastro e recuperação de senha do EmpresaAdmin — Verification

**Verdict**: PASS
**Profile**: light — step 1 (binding sources / screens, `ui` only) and step 4 (fault
injection, `standard`/`ui` only) skipped per protocol. No `Coverage` or `Test policy`
section in the checklist — profile `light` doesn't require them, not treated as a gap.
**Diff range**: b22d71d..HEAD (HEAD c2e8526, 4 commits: 1 checklist + 3 code slices)
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Binding sources

Skipped — profile `light` runs step 1 only under `ui`.

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | Register succeeds, authenticates via same cookie mechanism as login, redirects to dashboard | `apps/frontend`: `npx jest --ci "empresa-admin/register/page.test"` — exit 0 | `register/page.test.tsx:35-40` — `expect(registerMock).toHaveBeenCalledWith("Acme Inc","admin@acme.com","supersecret")` and `expect(pushMock).toHaveBeenCalledWith("/empresa-admin/dashboard")`; `register/page.tsx:44-46` — `await register(company,email,password); router.push("/empresa-admin/dashboard")` | PASS |
| C2 | 409 shows backend message, keeps fields, no redirect | same run | `register/page.test.tsx:60-69` — `expect(await screen.findByText("An EmpresaAdmin already exists with this email")).toBeInTheDocument()`, `expect(pushMock).not.toHaveBeenCalled()`, `expect(screen.getByLabelText("Empresa")).toHaveValue("Acme Inc")` (+ Email, Senha) | PASS |
| C3 | Login page always shows "Criar conta" → `/empresa-admin/register` | `npx jest --ci "empresa-admin/login/page.test"` — exit 0 | `login/page.test.tsx:14-17` — `expect(screen.getByRole("link",{name:"Criar conta"})).toHaveAttribute("href","/empresa-admin/register")` | PASS |
| C4 | Login page always shows "Esqueci minha senha" → `/empresa-admin/forgot-password` (added mid-Extract, closes Jira AC) | same run | `login/page.test.tsx:23-25` — `expect(screen.getByRole("link",{name:"Esqueci minha senha"})).toHaveAttribute("href","/empresa-admin/forgot-password")` | PASS |
| C5 | Forgot-password submits and shows backend's generic message verbatim | `npx jest --ci "empresa-admin/forgot-password/page.test"` — exit 0 | `forgot-password/page.test.tsx:33-38` — `expect(mutateAsyncMock).toHaveBeenCalledWith({email:"admin@acme.com"})`, `expect(await screen.findByText("If the email exists, a reset link has been sent.")).toBeInTheDocument()` | PASS |
| C6 | Reset-password submits token+password, shows confirmation, redirects to login | `npx jest --ci "empresa-admin/reset-password/page.test"` — exit 0 | `reset-password/page.test.tsx:48-57` — `expect(mutateAsyncMock).toHaveBeenCalledWith({token:"valid-token",newPassword:"newpass123"})`, `expect(await screen.findByText(/Senha redefinida com sucesso/)).toBeInTheDocument()`, then after `advanceTimersByTime(3000)`: `expect(pushMock).toHaveBeenCalledWith("/empresa-admin/login")` | PASS |
| C7 | Missing token blocks the form pre-submit; backend-rejected token replaces form with error | same run | Missing: `reset-password/page.test.tsx:67-76` — `expect(screen.getByText("Link de redefinição inválido ou incompleto.")).toBeInTheDocument()`, `expect(screen.queryByRole("button",{name:"Redefinir senha"})).not.toBeInTheDocument()`, `expect(mutateAsyncMock).not.toHaveBeenCalled()`. Invalid/expired: `reset-password/page.test.tsx:95-101` — `expect(await screen.findByText("Reset token has expired")).toBeInTheDocument()`, `expect(pushMock).not.toHaveBeenCalled()` | PASS |
| C8 | Dedicated backend method for EmpresaAdmin reset email, URL fixed at `/empresa-admin/reset-password`, `forgotPassword` calls it instead of the shared method | `apps/backend`: `npx jest notifications.service.spec.ts empresa-admin-auth.service.spec.ts` — exit 0 | `notifications.service.spec.ts:40-43` — `expect(html).toContain("https://app.test/empresa-admin/reset-password?token=tok123")`, `expect(html).not.toMatch(/href="https:\/\/app\.test\/reset-password\?/)`. `empresa-admin-auth.service.spec.ts:46-55` — `expect(notificationsServiceMock.sendEmpresaAdminPasswordResetEmail).toHaveBeenCalledWith("admin@test.local","admin@test.local","reset-token")`, `expect(notificationsServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled()`. Source: `empresa-admin-auth.service.ts:104` calls `sendEmpresaAdminPasswordResetEmail(...)`, no remaining call to `sendPasswordResetEmail` in that file (confirmed via `rg`) | PASS |

All 8 named tests located with `rg -n` and confirmed to have run individually (not a filter matching zero).

## C4 scope-decision check

The checklist's `Sources` section documents C4 as a resolved ambiguity, not scope creep:
"Esta conversa - critério 8 adicionado por decisão do usuário: a task só cobria 'Criar
conta' (critério 3), deixando 'Esqueci minha senha' do AC original descoberto; usuário
confirmou adicionar" (`.checks/mw-31-...md:12-14`), and again inline at the check itself:
"C4 ... (critério adicionado - fecha o AC original do Jira)" (`.checks/mw-31-...md:60-61`).
The source task file (`.tasks/empresa-admin-cadastro-recuperacao-senha.md`) only carries
criteria 1-7, none of them the login-page "Esqueci minha senha" link — confirming C4 was
genuinely absent from the original slice and added, not silently invented. C4 carries the
same proof bar as every other check (table above) and its test ran and passed like the rest.

## Test policy rows

Not present in the checklist — profile `light` doesn't require this section. No gap
recorded for its absence.

## Swept-rows spot check

| Row | Claim | Verified against | Result |
|---|---|---|---|
| authorization: existing | `register`/`forgot-password`/`reset-password` are already public, unguarded | `empresa-admin-auth.controller.ts` — no `@UseGuards` on `register`/`forgot-password`/`reset-password` handlers | confirmed |
| external-dependency failure: existing | New method inherits the same `try/catch` pattern as `sendEmail` callers | `notifications.service.ts:179-202` — `sendEmpresaAdminPasswordResetEmail` wraps its `sendEmail` call in `try/catch`, returns `false` on failure and logs, same shape as the other `send*` methods | confirmed |
| one-way door (checklist table) | `sendPasswordResetEmail` unchanged, new `sendEmpresaAdminPasswordResetEmail` added alongside it | `git diff b22d71d..HEAD -- notifications.service.ts` — additive only (new method + new template), `sendPasswordResetEmail` body untouched | confirmed |

## Faults injected

Skipped — profile `light` runs step 4 only under `standard`/`ui`.

## Gate

`apps/frontend`: `npx jest --ci "empresa-admin/(register|login|forgot-password|reset-password)/page.test"` — 4 suites, 8 tests passed, 0 failed.

`apps/frontend`: `npx jest --ci` (full suite) — 57 suites, 486 tests: 485 passed, 1 failed
(`page-header.test.tsx` — "should navigate to work hours page when clicking the shortcut
button"). Confirmed pre-existing/unrelated: `git diff b22d71d..HEAD --stat` does not list
`page-header.test.tsx` — this file is untouched by the diff.

`apps/backend`: `npx jest notifications.service.spec.ts empresa-admin-auth.service.spec.ts`
— 2 suites, 2 tests passed, 0 failed.

`apps/backend`: `npx jest` (full suite) — 23 suites, 151 tests passed, 0 failed. No
regression from the additive `notifications.service.ts` change or the 2-line
`empresa-admin-auth.service.ts` call-site rename.

`apps/frontend`: `npx tsc --noEmit -p tsconfig.json` — clean, no output.

`apps/backend`: `npx tsc --noEmit -p tsconfig.json` — clean, no output.

Lint, touched/created files only:
- `apps/frontend` (11 files: 4 pages + 4 page tests + 3 `features/empresa-admin/*`) —
  `npx eslint <files>` clean, 0 problems.
- `apps/backend` (4 files) — `npx eslint <files>` reports 2 `prettier/prettier` errors in
  `empresa-admin-auth.service.ts:62` and `:126`. Confirmed pre-existing: running the same
  lint against `git show b22d71d:.../empresa-admin-auth.service.ts` (the file before this
  diff touched it) reproduces the identical 2 errors on the identical lines — this diff's
  only change to that file is the 1-line call-site rename at line 104, outside both
  flagged spans. Out of scope, not a regression.
