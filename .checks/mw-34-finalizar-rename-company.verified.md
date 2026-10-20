# MW-34 - Finalizar limpeza e validacao do rename para Company Verification

**Verdict**: PASS
**Profile**: light (default; no `AGENTS.md` declaration found)
**Diff range**: `2d706c1c975a0e89fb144e933a716a85b5702cfd..369ed91163b56882e2b96501002618f00521f1c4`
**Fix diff reviewed**: `c89ef99110be985e1350419bf3253163730bcbdb..369ed91163b56882e2b96501002618f00521f1c4`
**HEAD verified**: `369ed91163b56882e2b96501002618f00521f1c4`
**Round**: 2 - scoped
**Verifier**: independent sub-agent (author != verifier)

15 of 15 checks are proven. Every proof was rerun at the new HEAD. Assertion review for unchanged surfaces is carried explicitly from round 1 at `c89ef99`; the fix diff and the prior non-PASS checks C13/C15 were reviewed afresh.

## Binding sources

Carried from `c89ef99110be985e1350419bf3253163730bcbdb`: skipped by `profile: light`. The Jira ticket and the two local design/plan documents were not opened or compared to the checklist; binding-source contradiction and omitted-source coverage remain outside this profile.

| Source named by checklist | Source comparison |
| --- | --- |
| Jira MW-34 | skipped by profile |
| `docs/superpowers/specs/2026-09-18-rename-client-empresa-to-company-design.md` | skipped by profile |
| `docs/superpowers/plans/2026-09-18-rename-client-empresa-to-company.md` | skipped by profile |

## Checks

| Check | Claim | Proof rerun at `369ed91` | Located evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | `NotificationLog` and `WorkSession` expose only `companyId` for this relation | `prisma validate` plus negative `rg`; exit 0 | Assertion review carried from `c89ef99`: `apps/backend/prisma/schema.prisma:218-229` declares `NotificationLog.companyId`; `:248-268` declares `WorkSession.companyId`; current proof found no `clientId` | PASS |
| C2 | additive migration renames two columns and the index, with no destructive statement | checklist shell proof; exit 0 | Carried from `c89ef99`: `apps/backend/prisma/migrations/20260919150000_finish_company_rename/migration.sql:1-6` has two `RENAME COLUMN` and one `ALTER INDEX ... RENAME TO`, with no `DROP`, `DELETE`, or `CREATE TABLE` | PASS |
| C3 | local migration chain is applied and current | `pnpm --filter @its-done/backend exec prisma migrate status`; exit 0 | Current command reported 27 migrations and `Database schema is up to date!`; command evidence refreshed at `369ed91` | PASS |
| C4 | START persists `companyId`; replay is idempotent | batched targeted Jest invocation; 2 named tests passed | Assertion review carried from `c89ef99`: `apps/backend/src/work-sessions/work-sessions.service.spec.ts:92-105` asserts create data with `companyId`; `:381-392` asserts replay leaves update and ledger create at one call | PASS |
| C5 | finish accepts `companyId`, creates matching WorkHour, ends session, and rejects cross-company project with 400 | checklist command exit 0; normalized direct Jest invocation showed exactly 2/2 named tests passing | Carried from `c89ef99`: `apps/backend/test/work-sessions-finish.e2e-spec.ts:118-129` asserts 201, WorkHour fields, and `ENDED`; `:181-190` asserts 400 for mismatched Company/project | PASS |
| C6 | NotificationLog dedup reads and writes `companyId` | batched targeted Jest invocation; named test passed | Carried from `c89ef99`: `apps/backend/src/work-hours/services/hours-threshold-checker.service.spec.ts:51-66` asserts `companyId: 'company-1'` in both `findFirst` and `create` | PASS |
| C7 | shared types use `Company`, `companyId`, and `company` on the named entities and filters | checklist negative `rg`; exit 0; build passed | Carried from `c89ef99`: `packages/types/src/entities.ts:22-86`, `:99-110`, `:132-168`, and `apps/backend/src/types/api.ts:37-42`; current proof found no prohibited names | PASS |
| C8 | invoice same-company verification is named `companyIds` | checklist shell proof; exit 0 | Carried from `c89ef99`: `apps/backend/src/invoices/invoices.service.ts:43-46` and `:304-307` use `const companyIds`; current proof found no `const clientIds` | PASS |
| C9 | hour and invoice reports filter by `companyId` and return `companyBreakdown/companyName` | batched targeted Jest invocation; 2 named report tests passed | Carried from `c89ef99`: `apps/backend/src/reports/reports.service.spec.ts:25-38` and `:60-74` assert the filter, breakdown shape, and absence of `clientBreakdown` | PASS |
| C10 | affected e2e suite compiles and runs on renamed contracts | `pnpm --filter @its-done/backend test:e2e --runInBand --forceExit`; exit 0 | Current Jest run reported 16/16 suites and 86/86 tests passed | PASS |
| C11 | frontend report hooks send `companyId` and consume `companyBreakdown/companyName` | checklist Jest proof; exit 0, 2/2 tests passed | Carried from `c89ef99`: `apps/frontend/src/features/analytics/reports.service.test.tsx:55-58` and `:85-88` assert both URLs and returned `companyName` | PASS |
| C12 | report/export/import contracts use Company vocabulary | checklist negative `rg`; exit 0; build passed | Carried from `c89ef99`: `apps/frontend/src/features/analytics/reports.service.ts:5-49`, `:64-100`, `apps/frontend/src/services/export.ts:5-18`, and `apps/frontend/src/services/import.ts:5-8`; current proof found no prohibited names | PASS |
| C13 | every remaining exact Client/client occurrence is a deliberate listed exception | `scripts/check-company-rename.sh`; exit 0; 367 raw hits independently reviewed | Refreshed at `369ed91`: `scripts/check-company-rename.sh:32-54` rejects non-OAuth/public-route `clientId(s)` and executable variables named `client`; `:59-77` replaces the former blanket test-path exclusion with quote/comment/regex-specific fixture and translated-copy patterns. Renamed domain fixtures use `mockCompanies.map((company) => ...)`, e.g. `project-create-dialog.test.tsx:48-69,91-94` and `project-edit-dialog.test.tsx:50-71,93-96` | PASS |
| C14 | uncached workspace builds, complete unit suites pass, and the stale Topbar shortcut expectation matches existing modal behavior without implementation change | all three checklist proofs; exit 0 | Refreshed at `369ed91`: build 3/3 with 0 cached; backend 25/25 suites and 154/154 tests; frontend 59/59 suites and 490/490 tests. `apps/frontend/src/components/layout/__tests__/page-header.test.tsx:198-217` clicks the shortcut and asserts modal copy; `apps/frontend/src/components/layout/topbar.tsx` has no feature-range diff | PASS |
| C15 | isolated local smoke proves all named flows and cleans up preview/database | exact `scripts/run-mw34-smoke.sh`; exit 0 | Refreshed at `369ed91`: committed `scripts/run-mw34-smoke.sh:16-21,37-59,70-106` creates a unique DB/runtime, starts tracked processes, delegates to the smoke, stops process groups, drops the DB, and removes runtime state. `scripts/smoke-mw34.sh:79-111` proves common register/login, Company create/list/detail, CompanyAdmin register, collaborators/invites, and frontend routes. Post-run audit found no `its_done_mw34_*` DB, no listeners on 3200/3202, and no smoke process | PASS |

## Named-test existence and execution

Current at `369ed91163b56882e2b96501002618f00521f1c4`:

- C4/C6/C9: one direct Jest invocation over the three target files with the combined name pattern and `--verbose` showed all five named tests individually passing.
- C5: the checklist package command exited 0 but its separator widened Jest matching; a normalized direct invocation showed exactly the two required tests passing and four skipped.
- C11: the checklist invocation showed both required frontend tests individually passing.
- C10/C14 are whole-suite gates; current suite/test totals are recorded below.

## Swept existing constraints

Carried from `c89ef99110be985e1350419bf3253163730bcbdb`; the fix diff did not touch these constraints.

| Swept row marked existing | Located constraint | Result |
| --- | --- | --- |
| authorization | `apps/backend/src/companies/companies.controller.ts:16-20` keeps `JwtAuthGuard`; `apps/backend/src/company-admin/company-dashboard.controller.ts:4-13` keeps `CompanyAdminJwtAuthGuard`; equivalent guards remain on the other Company Admin controllers | PASS |
| concurrency and ordering | `apps/backend/prisma/migrations/20260912045737_add_work_session_push_subscription/migration.sql:54-57` retains the partial unique active-session index; `apps/backend/prisma/schema.prisma:282-286` retains the event ledger keyed by `eventId`; the residual rename migration is last in the current applied chain | PASS |
| state transitions | `apps/backend/prisma/schema.prisma:289-294` retains `RUNNING`, `PAUSED`, `STOPPING`, `ENDED`, and `DISCARDED`; current targeted and full work-session suites passed | PASS |

Rows resolved by C-checks or declared not in scope require no additional existing-constraint investigation under the light profile.

## Profile-gated sections

Carried from `c89ef99110be985e1350419bf3253163730bcbdb`; the profile remains `light`.

- Binding-source comparison and screen enumeration: skipped (`ui` only).
- `Coverage` join: skipped (`standard`/`ui` only); the checklist has no `Coverage` section.
- `Test policy` verdicts: skipped (`standard`/`ui` only); the checklist has no `Test policy` section.
- Fault injection: skipped (`standard`/`ui` only). No mutants were injected in either round.

## Scoped fix-diff review

Fresh review at `369ed91163b56882e2b96501002618f00521f1c4`: `c89ef99..369ed91` changes 10 files with 224 insertions and 91 deletions. It renames the Company-domain fixture variables previously hidden by C13, narrows test exceptions in the sweep, adds the committed isolated smoke runner, and lets the smoke consume an explicit state file. No dirty `scripts/preview-worktree.sh` content is referenced. `git diff --check c89ef99..HEAD` and `git diff --check 2d706c1..HEAD` both passed.

The round-1 Topbar scope note is resolved at checklist level: updated C14 explicitly includes aligning the stale shortcut expectation with the existing modal behavior, and the feature changes only the test assertion, not `topbar.tsx`. Binding-source comparison, including independently opening Jira, remains skipped under the light profile; this report does not claim a source-level comparison.

## Gate

| Command | Result |
| --- | --- |
| `pnpm --filter @its-done/backend exec prisma validate` | PASS - schema valid |
| `pnpm --filter @its-done/backend exec prisma migrate status` | PASS - 27 migrations, schema up to date |
| batched C4/C6/C9 Jest proof | PASS - 3/3 suites, 5/5 selected tests |
| normalized C5 Jest proof | PASS - 1/1 suite, 2/2 selected tests |
| `pnpm --filter @its-done/backend test:e2e --runInBand --forceExit` | PASS - 16/16 suites, 86/86 tests |
| C11 frontend Jest proof | PASS - 1/1 suite, 2/2 tests |
| `pnpm turbo run build --force` | PASS - 3/3 tasks, 0 cached |
| `pnpm --filter @its-done/backend test -- --runInBand` | PASS - 25/25 suites, 154/154 tests |
| `pnpm --filter frontend test:ci` | PASS - 59/59 suites, 490/490 tests |
| `scripts/check-company-rename.sh` | PASS - exit 0; no blanket test-path exemption; 367 remaining raw hits independently classified |
| `scripts/run-mw34-smoke.sh` | PASS - exit 0; named flows passed; preview stopped; disposable DB removed |
| `git diff --check 2d706c1..HEAD` | PASS |

## Ranked gaps

None.
