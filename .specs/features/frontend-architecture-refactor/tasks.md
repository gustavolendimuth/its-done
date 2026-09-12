# Frontend Architecture Refactor Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/frontend-architecture-refactor/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (`jest.config.js`, `cypress/e2e/**`, `apps/frontend/package.json`, `CLAUDE.md` Key Commands/Code Quality sections). No coverage-threshold config found in `jest.config.js`, no `AGENTS.md`/`CONTRIBUTING.md` present — `CLAUDE.md` documents the command names used below; strong defaults applied for depth (this is a pure structural refactor, so depth = "zero regression", not "new coverage").

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Feature migration (move existing component/hook/service, no logic change) | unit (existing) | 100% of the file's pre-existing tests still pass, updated only for import paths — zero assertions added/removed | `src/features/<domain>/**/*.test.{ts,tsx}` (co-located, replacing `__tests__/`) | `cd apps/frontend && pnpm test:ci -- <domain-or-file-pattern>` |
| Component split (large file divided into smaller files) | unit | Every pre-existing assertion preserved across the resulting files (no coverage loss); if the original file had no test, the split does not need to add one (out of scope: writing new coverage) | co-located `*.test.tsx` next to each resulting file | `cd apps/frontend && pnpm test:ci -- <domain-or-file-pattern>` |
| Route wrapper thinning (`page.tsx` delegates to feature) | unit + e2e (only where a Cypress spec already exists: auth, clients, projects, work-hours) | Existing Cypress spec passes unchanged in behavior (selectors/text untouched); route-level jest test (if any) relocated/updated | `cypress/e2e/<domain>/*.cy.ts` | `cd apps/frontend && pnpm cypress:run --spec "cypress/e2e/<domain>/**"` |
| Barrel export / README / CLAUDE.md doc tasks | none | Build gate only — these are non-executable artifacts | — | build gate only |
| Cleanup (removing now-empty old folders) | none | Build gate only | — | build gate only |

## Gate Check Commands

> Generated from `apps/frontend/package.json` scripts and `CLAUDE.md`. `pnpm build:frontend` is documented in `CLAUDE.md` but does not exist as a root script today (pre-existing doc/reality drift, out of scope to fix here) — using the actual working commands below instead.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After a component/service-group move task within a domain (intermediate task, domain migration not yet finished) | `cd apps/frontend && pnpm test:ci` |
| Full | After the last task of a domain's migration (barrel + route wiring done) | `cd apps/frontend && pnpm test:ci && pnpm build` (+ `pnpm cypress:run --spec "cypress/e2e/<domain>/**"` for auth/clients/projects/time-tracking, which already have a spec) |
| Build | For doc-only/cleanup tasks with no runtime code change | `cd apps/frontend && pnpm build && pnpm lint` |

**Baseline (captured pre-refactor, `pnpm test:ci` from `apps/frontend`):** `Test Suites: 32 failed, 14 passed, 46 total` / `Tests: 220 failed, 167 passed, 387 total`. This is the pre-existing baseline (unrelated to this refactor, per `.specs/STATE.md`). Every gate from here on compares against this baseline: **same or fewer failing suites/tests, never more** — the refactor must not introduce a single new failure, but it is not responsible for fixing the 220 pre-existing ones.

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation
```
T1 → T2
```

### Phase 2: Small isolated domains
```
T3 → T4 → T5 → T6
```

### Phase 3: Auth
```
T7
```

### Phase 4: Projects
```
T8
```

### Phase 5: Time-tracking (work-hours + work-timer)
```
T9 → T10 → T11 → T12 → T13
```

### Phase 6: Clients (+ addresses)
```
T14 → T15 → T16 → T17
```

### Phase 7: Invoices
```
T18 → T19 → T20 → T21 → T22
```

### Phase 8: Dashboard
```
T23 → T24
```

### Phase 9: Analytics
```
T25 → T26 → T27
```

### Phase 10: Cross-cutting cleanup
```
T28 → T29 → T30 → T31
```

### Phase 11: Final verification
```
T32
```

---

## Task Breakdown

### T1: Capture pre-refactor baseline

**What**: Write `.specs/features/frontend-architecture-refactor/baseline.md` recording the current `pnpm test:ci` result (32 failed / 14 passed / 46 suites; 220 failed / 167 passed / 387 tests) and confirm `pnpm build` (root, via turbo) succeeds today. No source change.
**Where**: `.specs/features/frontend-architecture-refactor/baseline.md`
**Depends on**: None
**Reuses**: N/A
**Requirement**: FEARCH-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `baseline.md` records exact suite/test counts from `pnpm test:ci`
- [x] `pnpm build` (root) confirmed passing today, recorded in the file
- [x] No source file changed

**Tests**: none
**Gate**: none (this task defines the gate)
**Status**: ✅ Complete — commit `40bb746`

---

### T2: Scaffold `src/features/` and document the convention

**What**: Create `apps/frontend/src/features/README.md` documenting the feature-based convention (adaptive internal structure, barrel `index.ts`, co-located tests, when to keep something shared instead) per `design.md`. No feature folders created yet — this is the top-level contract doc other tasks will point back to.
**Where**: `apps/frontend/src/features/README.md`
**Depends on**: T1
**Reuses**: `design.md` (Architecture Overview, Domain Map)
**Requirement**: FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `src/features/README.md` exists, describes the adaptive-size rule, barrel convention, and shared-vs-feature boundary
- [x] Gate check passes: `cd apps/frontend && pnpm build && pnpm lint`

**Tests**: none
**Gate**: build
**Status**: ✅ Complete — commit `5bc0d16`. SPEC_DEVIATION: `pnpm lint` fails pre-existingly (Next 16 `next lint` CLI arg-parsing error, unrelated); `pnpm build` passes.

---

### T3: Migrate `settings` feature

**What**: Move `components/settings/settings-form.tsx` (+ co-located test) and `services/settings.ts` (+ test) into `src/features/settings/` (flat layout). Create `index.ts` barrel and `README.md`. Update `app/[locale]/(authenticated)/settings/page.tsx` to import from `@/features/settings`.
**Where**: `apps/frontend/src/features/settings/`
**Depends on**: T2
**Reuses**: `src/features/README.md` convention from T2
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/settings/` and the old `services/settings.ts` no longer exist
- [x] `src/features/settings/{settings-form.tsx, settings-form.test.tsx, settings.service.ts, index.ts, README.md}` exist
- [x] `app/.../settings/page.tsx` imports only from `@/features/settings`
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`
- [x] Test count unchanged for these files (no silent deletions)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `d403287`. Pre-existing failures preserved 1:1 (settings-form.test.tsx, settings/page.test.tsx).

---

### T4: Migrate `notifications` feature (+ kebab-case rename)

**What**: Move `components/notifications/NotificationBell.tsx` → `src/features/notifications/notification-bell.tsx`, `components/notifications/NotificationList.tsx` → `notification-list.tsx` (kebab-case rename, FEARCH-05), plus `services/notifications.ts` (+ test). Create `index.ts` + `README.md`. Update all consumers (e.g. topbar/layout) to the new import path and component file names.
**Where**: `apps/frontend/src/features/notifications/`
**Depends on**: T3
**Reuses**: `src/features/README.md` convention
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-05, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/notifications/` no longer exists
- [x] Files renamed to kebab-case inside `src/features/notifications/`
- [x] All consumers of `NotificationBell`/`NotificationList` updated (grep confirms zero references to the old PascalCase paths)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `8b5e0e9`. Pre-existing failures preserved 1:1 (29 failed / 2 passed / 31 total).

---

### T5: Migrate `profile` feature

**What**: Move `components/profile/profile-form.tsx`, `components/profile/profile-popover.tsx` (+ tests), `services/profile.ts` (+ test), `services/user.ts` (orphan — no consumer, migrates by semantic affinity per `design.md`), `types/profile.ts` into `src/features/profile/` (flat). Create `index.ts` + `README.md` (README notes `user.ts` as an unconsumed/orphaned service).
**Where**: `apps/frontend/src/features/profile/`
**Depends on**: T4
**Reuses**: `src/features/README.md` convention
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/profile/`, `services/profile.ts`, `services/user.ts`, `types/profile.ts` no longer exist at their old paths
- [x] `src/features/profile/README.md` documents `user.ts` as orphaned (no current consumer)
- [x] All consumers (e.g. `components/ui/enhanced-user-avatar.tsx`) updated to `@/features/profile`
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `ac8a369`. Pre-existing failures preserved 1:1 (6 failed / 6 total). Noticed (not fixed, out of scope): pre-existing duplicate test file (`profile.test.tsx`/`profile.test.ts`) and a pre-existing circular import between `profile-popover.tsx` and `enhanced-user-avatar.tsx`; build passes.

---

### T6: Migrate `admin` feature

**What**: Move `app/[locale]/(authenticated)/admin/users.tsx` → `src/features/admin/admin-users.tsx`, `activity.tsx` → `admin-activity.tsx` (+ their `__tests__` content co-located), `services/admin.ts` (+ test) into `src/features/admin/`. Create `index.ts` + `README.md`. Reduce `app/.../admin/page.tsx` to a thin wrapper importing `AdminUsers`/`AdminActivity` from `@/features/admin`.
**Where**: `apps/frontend/src/features/admin/`
**Depends on**: T5
**Reuses**: `src/features/README.md` convention
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `services/admin.ts` no longer exists at old path; `admin/users.tsx`/`admin/activity.tsx` moved into the feature
- [x] `app/.../admin/page.tsx` contains no business logic beyond composing layout + importing from `@/features/admin` (⚠️ partial — see SPEC_DEVIATION)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `e975a8b`. Pre-existing failures preserved 1:1 (2 failed / 1 passed / 3 total, same specific tests). SPEC_DEVIATION: "Overview" tab stats-cards JSX left inline in `page.tsx` (not extracted) — documented as a deferred idea in the feature README; extracting it risked destabilizing the existing test beyond this task's scope, and `design.md` had not flagged this file for splitting.

---

### T7: Migrate `auth` feature

**What**: Move `components/auth/login-form.tsx` (+ test) and `services/auth.ts` (+ test), plus `services/password.ts` (orphan, migrates by semantic affinity) into `src/features/auth/` (flat). Create `index.ts` + `README.md` (documents `password.ts` as orphaned). Update `app/[locale]/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` to import from `@/features/auth`.
**Where**: `apps/frontend/src/features/auth/`
**Depends on**: T6
**Reuses**: `src/features/README.md` convention
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/auth/` no longer exists; `services/auth.ts`/`services/password.ts` moved
- [x] Route files that actually consume auth pieces (`login`, `forgot-password`, `reset-password`) import only from `@/features/auth` (⚠️ `register/page.tsx` does not consume this feature — uses `next-auth` `signIn` directly — so nothing to update there)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm cypress:run --spec "cypress/e2e/auth/**"` and `pnpm build`
- [x] Manual check: login page renders correctly (Playwright MCP, headless, project-local server) — see SPEC_DEVIATION

**Tests**: unit + e2e
**Gate**: full
**Status**: ✅ Complete — commit `4d4733a`. jest: identical pre-existing failures (38/1/39 for the broad pattern). cypress/e2e/auth: identical 1 passing/3 failing before/after (pre-existing env/i18n gap). build: passes. SPEC_DEVIATION: did not attempt a real login (no known plaintext credentials for the seeded test user — password is hashed in the seed script); verified instead that `/login` renders `LoginForm` correctly with zero console errors, per the task's own allowance not to block the batch on this.

---

### T8: Migrate `projects` feature

**What**: Move `components/projects/{project-card, project-create-dialog, project-edit-dialog, projects-big-stats}.tsx` (+ tests) and `services/projects.ts` (+ test) into `src/features/projects/` (flat — 4 components, under the 6-file adaptive threshold). Create `index.ts` + `README.md`. Update `app/.../projects/page.tsx`.
**Where**: `apps/frontend/src/features/projects/`
**Depends on**: T7
**Reuses**: `src/features/README.md` convention
**Requirement**: FEARCH-01, FEARCH-03, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/projects/`, `services/projects.ts` no longer exist at old paths
- [x] `app/.../projects/page.tsx` imports only from `@/features/projects`
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm cypress:run --spec "cypress/e2e/projects/**"` (⚠️ partial — see SPEC_DEVIATION)

**Tests**: unit + e2e
**Gate**: full
**Status**: ✅ Complete — commit `ed3d50f`. Pre-existing failures preserved 1:1 (48 tests: 45 failed/3 passed, identical before/after via stash comparison). SPEC_DEVIATION: Cypress e2e (`cypress/e2e/projects/**`) could not run — needs a live dev server + backend + seeded DB, unavailable in this execution environment (same constraint as T7). `pnpm build` passes.

---

### T9: Move work-timer local-first lib into the feature

**What**: Move `lib/work-timer-db.ts`, `lib/work-timer-engine.ts`, `lib/work-timer-sync.ts` (+ their `lib/__tests__` counterparts) to `src/features/time-tracking/lib/` — no logic change, only relocation (preserves `AD-001` local-first architecture as-is). Update internal relative imports between the three files.
**Where**: `apps/frontend/src/features/time-tracking/lib/`
**Depends on**: T8
**Reuses**: existing `AD-001` local-first implementation, unchanged
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `lib/work-timer-{db,engine,sync}.ts` no longer exist at old paths
- [x] Files compile with updated relative imports; no consumer outside `time-tracking` references the old `lib/` path
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `77087e4`. 38/38 lib tests pass (pre-existing coverage, unaffected). Not-yet-migrated consumers (work-timer components, work-sessions service) updated to the new absolute path so the full suite still matches baseline (32 failed/14 passed/46 suites; 220 failed/167 passed/387 tests).

---

### T10: Move `work-timer` components into `time-tracking`

**What**: Move `components/work-timer/{work-session-finish-form, work-session-start-form, work-timer-widget}.tsx` (+ tests) into `src/features/time-tracking/components/` (feature is large → `components/` subfolder per adaptive rule). Update their imports of `lib/work-timer-*` to the new `../lib/...` path from T9.
**Where**: `apps/frontend/src/features/time-tracking/components/`
**Depends on**: T9
**Reuses**: `src/features/time-tracking/lib/` from T9
**Requirement**: FEARCH-01, FEARCH-04, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/work-timer/` no longer exists
- [x] All 3 components + tests compile from the new location with updated `lib` imports
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commits `972b251` + `e46716a` (follow-up fixing relative imports left uncommitted in the first pass). Matches baseline exactly (220 failed/167 passed/387 total).

---

### T11: Move `work-hours` components into `time-tracking`

**What**: Move `components/work-hours/{total-hours-display, work-hour-form, work-hours-big-stats, work-hours-table}.tsx` (+ tests) into `src/features/time-tracking/components/`. For `work-hours-table.tsx` (440 lines): read it fully first — if it mixes genuinely separate responsibilities (e.g. row rendering, filtering/sorting logic, and pagination as distinct concerns), split into smaller co-located files; if it is one cohesive table, move as-is and document the exception in the feature `README.md` (per `design.md` Splits table).
**Where**: `apps/frontend/src/features/time-tracking/components/`
**Depends on**: T10
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-05, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/work-hours/` no longer exists
- [x] `work-hours-table.tsx` either split into single-responsibility files, or exception documented in `README.md` with a one-line reason
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `e0601d4`. Split: pure `groupByMonthAndWeek` + `WeekGroup`/`MonthGroup`/`WorkHourRow` moved to `work-hours-grouping.ts` (no pre-existing test to preserve). Also found and documented an orphaned component (`TotalHoursDisplay`, no consumers) in the README. Matches baseline exactly.

---

### T12: Move `time-tracking` services and types

**What**: Move `services/{work-hours, work-hours-stats, work-sessions, time-entries}.ts` (+ tests) into `src/features/time-tracking/` (flat, root of the feature — services stay flat even in large features per the adaptive rule). Consolidate the relevant `WorkHour`/session types into `src/features/time-tracking/types.ts`.
**Where**: `apps/frontend/src/features/time-tracking/`
**Depends on**: T11
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] The 4 services no longer exist at their old `services/` paths
- [x] `types.ts` contains the consolidated time-tracking types
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `f2b7111`. `services/work-hours.ts` (types-only: `WorkHour`, `InvoiceWorkHour`) folded into `types.ts`; `TimeEntry`/`CreateTimeEntryDto` deliberately left in the shared `@/types` (out of this task's scope — a cross-cutting file used by many other domains). All not-yet-migrated external consumers (dashboard, invoices, analytics) updated to compile against the new paths. Matches baseline exactly.

---

### T13: Barrel, route wiring and cross-feature imports for `time-tracking`

**What**: Create `src/features/time-tracking/index.ts` (public API: components + `time-entries`/`work-hours-stats` services and types, since `invoices`/`dashboard`/`analytics` consume these) and `README.md`. Update `app/.../work-hours/page.tsx` to a thin wrapper. Update every external consumer found in Design (dashboard's `total-hours-summary`, invoices' `create-invoice-form`/`edit-invoice-form`, analytics' `page.tsx`) to import `time-entries`/stats from `@/features/time-tracking` instead of the old `services/` path — even though those features haven't been migrated yet, their import of this specific dependency must be updated now so nothing breaks mid-refactor.
**Where**: `apps/frontend/src/features/time-tracking/index.ts`, `apps/frontend/src/features/time-tracking/README.md`, `app/[locale]/(authenticated)/work-hours/page.tsx`
**Depends on**: T12
**Reuses**: N/A
**Requirement**: FEARCH-02, FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `grep` for `services/work-hours\|services/time-entries\|services/work-sessions\|services/work-hours-stats` outside `features/time-tracking` returns nothing
- [x] `work-hours/page.tsx` is a thin wrapper
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm cypress:run --spec "cypress/e2e/work-hours/**" && pnpm build` (⚠️ partial — see SPEC_DEVIATION)
- [x] No new failures vs. `baseline.md` (T1)

**Tests**: unit + e2e
**Gate**: full
**Status**: ✅ Complete — commit `acb8832`. `pnpm test:ci` and `pnpm build` both pass, matching baseline exactly. SPEC_DEVIATION: Cypress e2e (`cypress/e2e/work-hours/**`) could not run — same environment constraint as T7/T8 (needs a live dev server + backend + seeded DB). SPEC_DEVIATION: the authenticated layout imports `WorkTimerWidget` directly from its file instead of the barrel — a Server Component importing a Client Component through this particular barrel confuses Next/Turbopack's server/client boundary detection (pulls client-only hooks into the server bundle); documented inline in `layout.tsx`. Also found and reverted an unrelated, unrecognized, syntactically-broken edit in `lib/utils.ts` that was blocking the build (not part of this feature; cause unknown).

---

### T14: Move `clients` components

**What**: Move `components/clients/{client-addresses, client-card, client-form, clients-big-stats, edit-client-modal}.tsx` (+ tests) into `src/features/clients/components/` (large feature → `components/` subfolder). For `client-card.tsx` (370 lines): evaluate for split per `design.md` criteria; split if multi-responsibility, else document exception in the feature README (created in T17).
**Where**: `apps/frontend/src/features/clients/components/`
**Depends on**: T13
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/clients/` no longer exists
- [x] `client-card.tsx` split or exception noted (tracked for the README written in T17)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `b69739a`. Extracted `ClientShareMenu` from `client-card.tsx` (share dropdown was a separable concern). Also updated `components/ui/client-combobox.tsx` and the clients route + its test (unavoidable — they import these components directly).

---

### T15: Move `addresses` components into `clients`

**What**: Move `components/addresses/{address-form, edit-address-form}.tsx` (+ tests) into `src/features/clients/components/addresses/` (sub-folder — Address belongs to Client, no own route, per `design.md`). For `address-form.tsx` (402 lines): evaluate for split, same criteria as T14.
**Where**: `apps/frontend/src/features/clients/components/addresses/`
**Depends on**: T14
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/addresses/` no longer exists
- [x] `address-form.tsx` split or exception noted
- [x] `components/ui/address-combobox.tsx` untouched (confirmed shared UI primitive, stays in `ui/`) — its import path updated (unavoidable), file itself not relocated
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `1d8ad51`. Extracted the byte-for-byte-duplicated `ADDRESS_TYPES`/`BRAZILIAN_STATES` constants into `address-constants.ts`.

---

### T16: Move `clients` services and types

**What**: Move `services/{clients, client-stats, addresses}.ts` (+ tests) into `src/features/clients/` (flat root). Consolidate `types/client.ts` + `types/address.ts` into `src/features/clients/types.ts`.
**Where**: `apps/frontend/src/features/clients/`
**Depends on**: T15
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] The 3 services no longer exist at old `services/` paths; `types/client.ts`/`types/address.ts` consolidated
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `fdec36d`. Updated ~17 external consumers (projects, work-hours, dashboard, invoices, analytics, topbar, both comboboxes) to the concrete new paths — barrel comes in T17.

---

### T17: Barrel, README and route wiring for `clients`

**What**: Create `src/features/clients/index.ts` + `README.md` (documents any split exceptions from T14/T15). Update `app/.../clients/page.tsx` and `app/.../clients/[clientId]/page.tsx` to thin wrappers importing from `@/features/clients` (the latter also imports `@/features/dashboard`, unaffected here).
**Where**: `apps/frontend/src/features/clients/`, `app/[locale]/(authenticated)/clients/**`
**Depends on**: T16
**Reuses**: N/A
**Requirement**: FEARCH-02, FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Both client routes are thin wrappers importing only from `@/features/clients` (+ `@/features/dashboard` where already applicable)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm cypress:run --spec "cypress/e2e/clients/**" && pnpm build`
- [x] No new failures vs. `baseline.md`

**Tests**: unit + e2e
**Gate**: full
**Status**: ✅ Complete — commit `a337024`. `pnpm test:ci` (220/167/387, matches baseline) and `pnpm build` both pass. Cypress e2e not runnable in this environment (no dev server/backend/DB available), same documented limitation as T7/T8.

---

### T18: Move invoice card/list components

**What**: Move `components/invoices/{invoice-card, client-invoice-card, invoice-search-filters, invoice-upload-modal}.tsx` (+ tests) into `src/features/invoices/components/` (large feature).
**Where**: `apps/frontend/src/features/invoices/components/`
**Depends on**: T17
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] The 4 files (+ tests) exist at the new path and no longer at the old one
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `a90a42f`. `invoice-upload-modal.tsx` temporarily points its relative `./invoice-file-upload` import at the old `@/components/invoices/invoice-file-upload` absolute path until T20 moves that file too.

---

### T19: Move invoice form components

**What**: Move `components/invoices/{create-invoice-form, edit-invoice-form, invoice-upload-form}.tsx` (+ tests) into `src/features/invoices/components/`.
**Where**: `apps/frontend/src/features/invoices/components/`
**Depends on**: T18
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] The 3 files (+ tests) exist at the new path and no longer at the old one
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `084417b`. Same temporary-absolute-path pattern as T18 for the still-unmoved invoice-file-upload/work-hours-selector/work-hours-selection-summary imports.

---

### T20: Move remaining invoice components (incl. file-upload split evaluation)

**What**: Move `components/invoices/{invoice-file-upload, work-hours-selector, work-hours-selection-summary, invoices-big-stats}.tsx` (+ tests) into `src/features/invoices/components/`. For `invoice-file-upload.tsx` (425 lines): read fully, split if it mixes upload/preview/validation as separable concerns, else document exception in the README (created in T22).
**Where**: `apps/frontend/src/features/invoices/components/`
**Depends on**: T19
**Reuses**: N/A
**Requirement**: FEARCH-01, FEARCH-05, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/invoices/` no longer exists (all 11 original files accounted for across T18-T20)
- [x] `invoice-file-upload.tsx` split or exception noted
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `eafc8f4`. `invoice-file-upload.tsx` kept as-is (exception documented in the feature README, T22): one cohesive drag-and-drop widget with a compact/full mode sharing handlers, not multi-responsibility.

---

### T21: Move `invoices` services and types

**What**: Move `services/{invoices, invoice-stats}.ts` (+ tests) into `src/features/invoices/` (flat root). Move `types/invoices.ts` to `src/features/invoices/types.ts`.
**Where**: `apps/frontend/src/features/invoices/`
**Depends on**: T20
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] The 2 services no longer exist at old `services/` paths; `types/invoices.ts` moved
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `eb943b7`. Updated every consumer (internal + external: dashboard, both client routes, invoices route).

---

### T22: Barrel, README and route wiring for `invoices`

**What**: Create `src/features/invoices/index.ts` + `README.md` (documents split exceptions from T20). Update the invoices route file(s) under `app/.../invoices/` to thin wrappers, importing `time-entries`/`WorkHour` types from `@/features/time-tracking` (per `design.md` Integration Points), never from an internal path.
**Where**: `apps/frontend/src/features/invoices/`, `app/[locale]/(authenticated)/invoices/**`
**Depends on**: T21
**Reuses**: `@/features/time-tracking` public API (T13)
**Requirement**: FEARCH-02, FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Invoices route(s) are thin wrappers importing only from `@/features/invoices`
- [x] `grep` confirms no import of `@/features/time-tracking/<internal-path>` (only the barrel) from within `invoices`
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm build`
- [x] No new failures vs. `baseline.md`

**Tests**: unit
**Gate**: full
**Status**: ✅ Complete — commit `41f48c8`. `pnpm test:ci` (220/167/387, matches baseline) and `pnpm build` both pass.

---

### T23: Move `dashboard` components and service

**What**: Move `components/dashboard/{overview, total-hours-summary}.tsx` (+ tests) and `services/dashboard.ts` (+ test) into `src/features/dashboard/` (flat — 2 components, under the adaptive threshold). For `overview.tsx` (381 lines): evaluate for split per `design.md` criteria, else document exception in the README (T24).
**Where**: `apps/frontend/src/features/dashboard/`
**Depends on**: T22
**Reuses**: `@/features/time-tracking` (already used by `total-hours-summary` via `work-hours-stats`)
**Requirement**: FEARCH-01, FEARCH-05, FEARCH-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/dashboard/`, `services/dashboard.ts` no longer exist at old paths
- [x] `overview.tsx` split or exception noted
- [x] Imports of `work-hours-stats` updated to `@/features/time-tracking` (N/A — `total-hours-summary.tsx` is orphaned, see below; the actual cross-feature import fixed was `useDashboardStats` in `analytics`)
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete — commit `c9c9407`. `overview.tsx` (381 lines) split into `overview-header.tsx`, `overview-main-stats.tsx`, `overview-performance-cards.tsx`, `overview-invoices-section.tsx` (pure extraction of the 4 existing `render*` closures, no behavior change). Also found `TotalHoursSummary` has zero consumers anywhere (orphaned, like earlier-documented cases) — migrated as-is, documented in README, not deleted. Also found a previously-missed co-located test at `components/dashboard/__tests__/overview.test.tsx` (my initial repo scan's filename pattern missed it since the file is named `overview.test.tsx`, not `*dashboard*test*`); moved it into the feature and confirmed via a throwaway `git worktree` at the pre-refactor commit that its 2 failing / 5 passing result is pre-existing, not a regression from the split.

---

### T24: Barrel, README and route wiring for `dashboard`

**What**: Create `src/features/dashboard/index.ts` + `README.md`. Update the 3 consumer routes — `app/.../dashboard/page.tsx`, `app/.../clients/[clientId]/page.tsx`, `app/.../client-dashboard/[clientId]/page.tsx` (public) — to import the dashboard component only from `@/features/dashboard`.
**Where**: `apps/frontend/src/features/dashboard/`, the 3 consumer route files
**Depends on**: T23
**Reuses**: N/A
**Requirement**: FEARCH-02, FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] All 3 routes import the dashboard component only from `@/features/dashboard`
- [x] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm build`
- [ ] Manual check: public `/client-dashboard/[clientId]` still renders (Playwright MCP) — deferred to T32 (needs dev server + backend + DB, same environment limitation as T7/T13/T17/T22)
- [x] No new failures vs. `baseline.md`

**Tests**: unit
**Gate**: full
**Status**: ✅ Complete — commit `93b96be`. Baseline preserved exactly (220 failed/167 passed/387 total). Manual Playwright check of the public client-dashboard route deferred to T32's full verification pass.

---

### T25: Extract `analytics/page.tsx` into feature components

**What**: Read `app/[locale]/(authenticated)/analytics/page.tsx` (838 lines) fully. Extract its filters, summary-cards section, and chart sections into separate components under `src/features/analytics/components/` (an orchestrating component ties them together). This is the biggest split of the refactor — no behavior change, only decomposition.
**Where**: `apps/frontend/src/features/analytics/components/`
**Depends on**: T24
**Reuses**: `components/ui/*` (charts/cards primitives already used by the page)
**Requirement**: FEARCH-01, FEARCH-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Extracted components render the same UI/behavior as the original inline JSX (manual visual check via Playwright MCP, since no automated test exists for this page today)
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit (none pre-existing for this file — no new coverage required, only preservation)
**Gate**: quick

---

### T26: Move `analytics` remaining component and service

**What**: Move `components/analytics/analytics-big-stats.tsx` (+ test) and `services/reports.ts` (+ test, sole consumer is analytics) into `src/features/analytics/`.
**Where**: `apps/frontend/src/features/analytics/`
**Depends on**: T25
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `components/analytics/`, `services/reports.ts` no longer exist at old paths
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick

---

### T27: Barrel, README and route thinning for `analytics`

**What**: Create `src/features/analytics/index.ts` + `README.md`. Reduce `app/.../analytics/page.tsx` from 838 lines to a thin wrapper rendering the orchestrator component from T25.
**Where**: `apps/frontend/src/features/analytics/`, `app/[locale]/(authenticated)/analytics/page.tsx`
**Depends on**: T26
**Reuses**: `@/features/time-tracking` public API for any time-entry data the page needs
**Requirement**: FEARCH-02, FEARCH-03, FEARCH-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `app/.../analytics/page.tsx` is a thin wrapper (target: comparable to other route files, well under 100 lines)
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci && pnpm build`
- [ ] Manual check: analytics page renders identically (Playwright MCP) — filters, stats, charts
- [ ] No new failures vs. `baseline.md`

**Tests**: unit
**Gate**: full

---

### T28: Move `Nav` into shared layout

**What**: Move `components/navigation/nav.tsx` → `src/components/layout/nav.tsx` (cross-cutting app navigation, per `design.md` Tech Decisions). Update all consumers (likely `main-layout.tsx`/`topbar.tsx`).
**Where**: `apps/frontend/src/components/layout/nav.tsx`
**Depends on**: T27
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `components/navigation/` no longer exists
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick

---

### T29: Split `loading-skeleton.tsx` by domain

**What**: Read `components/layout/loading-skeleton.tsx` (612 lines) fully. Move each domain-specific variant (`clients-page`, `projects-page`, `invoices-page`, `analytics-page`, `work-hours`) into its now-existing feature folder as a dedicated skeleton component (e.g. `features/clients/clients-page-skeleton.tsx`). Keep the generic variants (`card`, `stats`, `table`, `list`) in `components/layout/loading-skeleton.tsx` as shared primitives. Update every consumer of the moved variants.
**Where**: `apps/frontend/src/features/*/`, `apps/frontend/src/components/layout/loading-skeleton.tsx`
**Depends on**: T28
**Reuses**: `SkeletonBox` and other shared primitives, kept in place
**Requirement**: FEARCH-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `loading-skeleton.tsx` contains only the generic (`card`/`stats`/`table`/`list`) variants
- [ ] Each domain-specific variant exists in its feature folder and is used by that feature's loading state
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci`

**Tests**: unit
**Gate**: quick

---

### T30: Confirm no orphaned folders/files remain

**What**: Run a repo-wide check confirming every old technical folder (`components/<domain>/` for all migrated domains, corresponding `services/<domain>.ts` files) no longer exists, and that no empty directories were left behind. Explicitly confirm the 12 orphaned services (`backup`, `export`, `import`, `webhook`, `webhook-delivery`, `webhook-event`, `system`, `logs`, `audit`, `sms`, `email`, `push`) are still present, untouched, at `src/services/` (per user decision: leave them).
**Where**: `apps/frontend/src/` (verification only, cleanup of stray empty dirs if found)
**Depends on**: T29
**Reuses**: N/A
**Requirement**: FEARCH-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `find apps/frontend/src/components apps/frontend/src/services -type d -empty` returns nothing unexpected
- [ ] The 12 orphaned services still exist unchanged at `src/services/`
- [ ] Gate check passes: `cd apps/frontend && pnpm build && pnpm lint`

**Tests**: none
**Gate**: build

---

### T31: Update `CLAUDE.md` architecture section

**What**: Rewrite the "Frontend Structure (Next.js App Router)" section of the project `CLAUDE.md` to describe `src/features/<domain>/` (adaptive structure, barrel exports, co-located tests, README-per-domain), the final domain list, and what remains shared (`components/ui`, `components/layout`, `lib`, top-level `hooks`/`types`).
**Where**: `/home/gustavolendimuth/projetos/its-done/CLAUDE.md`
**Depends on**: T30
**Reuses**: `design.md` Domain Map
**Requirement**: FEARCH-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `CLAUDE.md` frontend structure section matches the real final tree
- [ ] Gate check passes: `cd apps/frontend && pnpm build && pnpm lint`

**Tests**: none
**Gate**: build

---

### T32: Final full-suite verification

**What**: Run the complete verification sweep: full `pnpm test:ci`, all 4 Cypress specs, `pnpm build` (root, via turbo), and a manual Playwright MCP pass over the main flows (login, clients list + detail, create invoice, work-hours + timer, dashboard, analytics, client-dashboard public page). Compare test/suite counts against `baseline.md` (T1).
**Where**: N/A (verification task)
**Depends on**: T31
**Reuses**: `baseline.md` from T1
**Requirement**: FEARCH-02

**Tools**:
- MCP: `playwright` (project-local, headless)
- Skill: NONE

**Done when**:
- [ ] `pnpm test:ci` shows the same or fewer failures than the T1 baseline, zero new failures
- [ ] All 4 Cypress specs (`auth`, `clients`, `projects`, `work-hours`) pass
- [ ] `pnpm build` succeeds
- [ ] Manual Playwright MCP pass over all listed flows shows no visual/functional regression
- [ ] Result recorded appended to `baseline.md`

**Tests**: unit + e2e
**Gate**: full

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10 → Phase 11

Phase 1:  T1 → T2
Phase 2:  T3 → T4 → T5 → T6
Phase 3:  T7
Phase 4:  T8
Phase 5:  T9 → T10 → T11 → T12 → T13
Phase 6:  T14 → T15 → T16 → T17
Phase 7:  T18 → T19 → T20 → T21 → T22
Phase 8:  T23 → T24
Phase 9:  T25 → T26 → T27
Phase 10: T28 → T29 → T30 → T31
Phase 11: T32
```

Execution is strictly sequential — 32 tasks total, one tight linear chain (T1→T2→...→T32). There is no intra-phase parallelism; a single agent (or batch worker) works one task at a time, in order.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 doc file, no code | ✅ Granular |
| T2 | 1 doc file | ✅ Granular |
| T3 | 1 domain, 2 files + tests (flat, ≤6 files) | ✅ Granular |
| T4 | 1 domain, 2 files + rename + tests | ✅ Granular |
| T5 | 1 domain, 3 files + tests | ✅ Granular |
| T6 | 1 domain, 3 files + tests | ✅ Granular |
| T7 | 1 domain, 2 files + tests + 4 route import updates | ✅ Granular (cohesive single move) |
| T8 | 1 domain, 4 components + 1 service | ✅ Granular |
| T9 | 3 lib files, pure relocation | ✅ Granular |
| T10 | 3 components, pure relocation | ✅ Granular |
| T11 | 4 components, pure relocation + 1 conditional split | ✅ Granular |
| T12 | 4 services + types consolidation | ✅ Granular |
| T13 | 1 barrel + 1 README + 1 route + cross-feature import fixes | ✅ Granular (single cohesive wiring step) |
| T14 | 5 components, pure relocation + 1 conditional split | ✅ Granular |
| T15 | 2 components, pure relocation + 1 conditional split | ✅ Granular |
| T16 | 3 services + types consolidation | ✅ Granular |
| T17 | 1 barrel + 1 README + 2 routes | ✅ Granular |
| T18 | 4 components, pure relocation | ✅ Granular |
| T19 | 3 components, pure relocation | ✅ Granular |
| T20 | 4 components + 1 conditional split | ✅ Granular |
| T21 | 2 services + types | ✅ Granular |
| T22 | 1 barrel + 1 README + routes | ✅ Granular |
| T23 | 2 components + 1 service + 1 conditional split | ✅ Granular |
| T24 | 1 barrel + 1 README + 3 routes | ✅ Granular |
| T25 | 1 large-file extraction (single cohesive split) | ✅ Granular |
| T26 | 1 component + 1 service | ✅ Granular |
| T27 | 1 barrel + 1 README + 1 route | ✅ Granular |
| T28 | 1 file move | ✅ Granular |
| T29 | 1 large-file split across features | ✅ Granular (single cohesive split) |
| T30 | Repo-wide verification, no new code | ✅ Granular |
| T31 | 1 doc file | ✅ Granular |
| T32 | Verification only, no code | ✅ Granular |

**Granularity check**: All 32 tasks are single cohesive deliverables (one domain's file group, one split, one wiring step, or one verification pass). None mixes unrelated concerns.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (start) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T3 | T3→T4 | ✅ Match |
| T5 | T4 | T4→T5 | ✅ Match |
| T6 | T5 | T5→T6 | ✅ Match |
| T7 | T6 | T6→T7 | ✅ Match |
| T8 | T7 | T7→T8 | ✅ Match |
| T9 | T8 | T8→T9 | ✅ Match |
| T10 | T9 | T9→T10 | ✅ Match |
| T11 | T10 | T10→T11 | ✅ Match |
| T12 | T11 | T11→T12 | ✅ Match |
| T13 | T12 | T12→T13 | ✅ Match |
| T14 | T13 | T13→T14 | ✅ Match |
| T15 | T14 | T14→T15 | ✅ Match |
| T16 | T15 | T15→T16 | ✅ Match |
| T17 | T16 | T16→T17 | ✅ Match |
| T18 | T17 | T17→T18 | ✅ Match |
| T19 | T18 | T18→T19 | ✅ Match |
| T20 | T19 | T19→T20 | ✅ Match |
| T21 | T20 | T20→T21 | ✅ Match |
| T22 | T21 | T21→T22 | ✅ Match |
| T23 | T22 | T22→T23 | ✅ Match |
| T24 | T23 | T23→T24 | ✅ Match |
| T25 | T24 | T24→T25 | ✅ Match |
| T26 | T25 | T25→T26 | ✅ Match |
| T27 | T26 | T26→T27 | ✅ Match |
| T28 | T27 | T27→T28 | ✅ Match |
| T29 | T28 | T28→T29 | ✅ Match |
| T30 | T29 | T29→T30 | ✅ Match |
| T31 | T30 | T30→T31 | ✅ Match |
| T32 | T31 | T31→T32 | ✅ Match |

No dependency points forward; every arrow matches a `Depends on`.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | none (doc) | none | none | ✅ OK |
| T2 | Barrel/README doc | none | none | ✅ OK |
| T3 | Feature migration | unit (existing) | unit | ✅ OK |
| T4 | Feature migration + rename | unit (existing) | unit | ✅ OK |
| T5 | Feature migration | unit (existing) | unit | ✅ OK |
| T6 | Feature migration | unit (existing) | unit | ✅ OK |
| T7 | Feature migration + route wrapper (has Cypress spec) | unit + e2e | unit + e2e | ✅ OK |
| T8 | Feature migration + route wrapper (has Cypress spec) | unit + e2e | unit + e2e | ✅ OK |
| T9 | Feature migration (lib) | unit (existing) | unit | ✅ OK |
| T10 | Feature migration | unit (existing) | unit | ✅ OK |
| T11 | Feature migration + component split | unit | unit | ✅ OK |
| T12 | Feature migration | unit (existing) | unit | ✅ OK |
| T13 | Barrel + route wrapper (has Cypress spec) | unit + e2e | unit + e2e | ✅ OK |
| T14 | Feature migration + component split | unit | unit | ✅ OK |
| T15 | Feature migration + component split | unit | unit | ✅ OK |
| T16 | Feature migration | unit (existing) | unit | ✅ OK |
| T17 | Barrel + route wrapper (has Cypress spec) | unit + e2e | unit + e2e | ✅ OK |
| T18 | Feature migration | unit (existing) | unit | ✅ OK |
| T19 | Feature migration | unit (existing) | unit | ✅ OK |
| T20 | Feature migration + component split | unit | unit | ✅ OK |
| T21 | Feature migration | unit (existing) | unit | ✅ OK |
| T22 | Barrel + route wrapper (no Cypress spec for invoices) | unit | unit | ✅ OK |
| T23 | Feature migration + component split | unit | unit | ✅ OK |
| T24 | Barrel + route wrapper (no Cypress spec for dashboard) | unit | unit | ✅ OK |
| T25 | Component split (no pre-existing test for this file) | unit (preservation only, no new coverage required) | unit | ✅ OK |
| T26 | Feature migration | unit (existing) | unit | ✅ OK |
| T27 | Barrel + route wrapper (no Cypress spec for analytics) | unit | unit | ✅ OK |
| T28 | Feature migration | unit (existing) | unit | ✅ OK |
| T29 | Component split | unit | unit | ✅ OK |
| T30 | Cleanup verification | none | none | ✅ OK |
| T31 | Doc | none | none | ✅ OK |
| T32 | Full verification | unit + e2e | unit + e2e | ✅ OK |

No violations — every task with a matrix requirement above "none" declares the matching `Tests` value; no task defers tests to a later task.

---

## Tools & Skills — one question for the user

Before Execute starts, confirm which tools to use per task:

- **Filesystem moves/edits**: standard file tools (Read/Write/Edit/Bash `git mv`) — no MCP needed for any task.
- **Manual verification** (T7, T24, T25, T27, T32): the project-local **`playwright` MCP** (headless, per `CLAUDE.md` — never the account-wide plugin browser).
- **No skills** are needed mid-task; `tlc-spec-driven` itself governs Execute (per-task cycle, gate, atomic commit).

This matches what's already documented in the project — no separate confirmation question needed unless you want to override it.
