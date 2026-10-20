# Ponto de entrada visível pro login da Empresa Verification

**Verdict**: PASS
**Profile**: light
**Diff range**: c2e852653d66dd8f6e04d95864b71ebc69d74044..HEAD
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Binding sources

Skipped under `light` (step 1 runs only under `ui`). The checklist names no binding design/contract
source anyway - `Sources` lists a task file (`.tasks/empresa-admin-entrada-visivel.md`, itself the
decision record) and Jira MW-32, which the checklist says "ratifica os mesmos 2 critérios, sem
informação adicional" - nothing external to compare the checks against.

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | `/login` renders a link whose `href` is `/empresa-admin/login` | `npx jest login-form.test.tsx -t "pointing to /empresa-admin/login\|without any session mocked"` exit 0 (batched with C2) | `login-form.test.tsx:26-28` - `expect(screen.getByRole("link", { name: "empresaAdminLink" })).toHaveAttribute("href", "/empresa-admin/login")` | PASS |
| C2 | The link is present in the DOM with no session/auth mocked | same invocation, exit 0 | `login-form.test.tsx:34-36` - `expect(screen.getByRole("link", { name: "empresaAdminLink" })).toBeInTheDocument()`; file mocks only `next-auth/react`'s `signIn` (a `jest.fn()`, no session) and `next-intl`/`next/image` - no auth/session state is injected | PASS |

Both named tests exist and ran (not a vacuous filter): batched run shows `Tests: 2 passed, 2
total`, both listed individually as `✓`. `rg` confirms both `it(...)` blocks and their assertions
at the cited lines. Diff-touch check: the test file is new in this diff (`git diff --stat` shows
`login-form.test.tsx | 38 +++...`, all additions) - the proof exercises new code, not pre-existing
behavior.

Implementation matches the claim at `login-form.tsx:156-163`:
```tsx
<p className="text-sm text-muted-foreground">
  <a href="/empresa-admin/login" className="text-primary hover:underline">
    {t("empresaAdminLink")}
  </a>
</p>
```
`t("empresaAdminLink")` resolves via `en.json`/`pt-BR.json`, both diffed in this range to add the
key with the equivalent copy the checklist names ("É administrador de uma empresa? Entre aqui" /
"Are you a company administrator? Sign in here"). Target route exists:
`apps/frontend/src/app/[locale]/empresa-admin/login/page.tsx` is present in the tree (pre-existing,
untouched by this diff).

No precision gaps: both checks name a concrete `href` value and a concrete DOM-presence assertion,
both readable at the assertion site without walking fixtures.

## Test policy rows

None - checklist carries no `## Test policy` section. Per profile, this judgment is skipped rather
than substituted with the repo's general convention.

## Coverage

No `## Coverage` join to recompute - the checklist states "Sem sets de enumeração declarados nesta
task ... nada a recompor aqui," and that's accurate: the task's `Criteria` section lists exactly 2
items, no enumerated table/list of cases exists anywhere in the task or checklist for this feature.
Confirmed rather than recomputed, per profile.

## Swept

Checked the one row resolving to **existing** against the code:

- `authorization: existing - /login e /empresa-admin/login já são públicas, nenhuma mudança de
  guard` - confirmed. `apps/frontend/src/middleware.ts` only runs `next-intl`'s locale middleware
  (matcher excludes `/api`, `/_next`, `/_vercel`, and dotted paths); it carries no auth/session
  check or redirect logic. Neither `src/app/[locale]/login/page.tsx` nor
  `src/app/[locale]/empresa-admin/login/page.tsx` gained a guard in this diff (diff stat above
  shows neither file touched). The constraint the row cites is actually there.

All other Swept rows are `n/a`, out of scope for existing-row verification under this profile.

## Faults

Skipped - step 4 (fault injection) runs only under `standard`/`ui`, not `light`.

## Gate

`cd apps/frontend && npx jest login-form.test.tsx -t "pointing to /empresa-admin/login|without any session mocked" --verbose` - 2 passed, 0 failed
