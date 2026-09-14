# Frontend Architecture Refactor — Validation

**Date**: 2026-09-12
**Spec**: `.specs/features/frontend-architecture-refactor/spec.md`
**Diff range**: `ec3a7c1..HEAD` (39 commits, branch `refactor/frontend-feature-architecture`)
**Verifier**: independent sub-agent (author ≠ verifier) — no prior context inherited from the implementer's session.

---

## Task Completion

All 32 tasks (T1–T32) in `tasks.md` are marked `✅ Complete` with commit hashes. Spot-checked commit hashes against `git log` — all present in the diff range. No blocked/partial tasks found.

---

## Spec-Anchored Acceptance Criteria

### FEARCH-01 — Domínio de negócio co-localizado

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1: domain code co-located under `features/<domain>/` | `find apps/frontend/src/components apps/frontend/src/services -maxdepth 1` → `components/` contains only `layout/`, `ui/`, `__tests__/`, `mode-toggle.tsx`; `services/` contains only the 13 documented orphans (`backup`, `export`, `import`, `webhook`, `webhook-delivery`, `webhook-event`, `system`, `logs`, `audit`, `sms`, `email`, `push`, `user-stats`) + 3 cross-cutting (`avatar`, `gravatar`, `network-status`). `features/` has 11 domain folders. | ✅ PASS |
| AC2: shared code stays out of `features/` | Same listing — `components/ui`, `components/layout` retained at root; no duplication found (`find features -type f … \| xargs basename \| sort \| uniq -d` → only `index.ts`/`types.ts`, expected 1-per-feature). | ✅ PASS |
| AC3: old technical folders gone, no dead code | Confirmed above — zero domain subfolders remain in `components/`; zero empty dirs (`find components services -type d -empty` → empty). | ✅ PASS |
| AC4: `pnpm build:frontend` compiles clean | `cd apps/frontend && pnpm build` — succeeded, all routes generated, TypeScript project-wide check passed. | ✅ PASS |

**Status**: ✅ All 4 ACs covered with direct evidence.

---

### FEARCH-02 — Nenhuma regressão de comportamento

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1/AC2: exact same test set passing, no passing→failing flips | `pnpm test:ci` on HEAD: `32 failed, 14 passed, 46 total` suites / `220 failed, 167 passed, 387 total` tests — matches `baseline.md` exactly. Went further than count-matching: ran `--json` on a `git worktree` at `ec3a7c1` and at `HEAD`, diffed full test names (`fullName`) by status. Result: **0 tests newly failing, 0 newly passing, 0 test names added/removed** (386 unique full names, identical set both sides). | ✅ PASS (aggregate + name-level) |
| AC3: Cypress scenarios unchanged | Not re-run live in this verification (needs docker/dev-server/backend/DB, consistent with the documented environment constraint in T7/T8/T13/T17). Trusted the T32 recorded run against a live docker stack: 1/4 auth specs pass, others fail on pre-existing fixture/env issues unrelated to file moves — this matches the "no new failures" bar. | ⚠️ Not independently re-run (accepted on recorded evidence) |
| AC4: manual Playwright pass shows no regression | Not re-run in this verification session (no live dev/backend/DB stack). Trusted `baseline.md`'s T32 write-up, which is itself well-evidenced (curl status codes, a legitimate pre-existing `FileList`/SSR bug root-caused and confirmed byte-identical pre/post refactor — see below). | ⚠️ Not independently re-run (accepted on recorded evidence) |

**❌ CRITICAL GAP FOUND (not from tasks.md's own claims — found by independently reading the diff):**

Commit `ce25dac` ("refactor(formatTimeAgo): simplify time calculation using a unified structure") rewrites `formatTimeAgo()` in `apps/frontend/src/lib/utils.ts`. This is **not a file move / import-path change** — it is a genuine algorithm rewrite, and it is **not listed in any of the 32 tasks** in `tasks.md`, has no corresponding `SPEC_DEVIATION` note, and is not mentioned in `baseline.md`.

Concrete behavior change (traced by hand): the old code resolved the time bucket via a cascading smallest→largest chain (`diffInMinutes` → `diffInHours` → … → `diffInYears`), each with its own singular/plural threshold. The new code iterates largest→smallest and returns the first unit where `floor(diffInMinutes / unitMinutes) >= 1`. These are **not equivalent** at unit boundaries. Example: for a date ~29 days in the past —
- OLD: `diffInWeeks = floor(29/7) = 4` → `weeks < 4` is false → falls through to `diffInMonths = floor(29/30) = 0` → `months < 2` is true → returns **`t("timeAgo.month")`** (singular "month").
- NEW: `diffInMinutes = 29*1440 = 41760` → month-count `floor(41760/43200) = 0`, week-count `floor(41760/10080) = 4` → returns **`t("timeAgo.weeks", {count: 4})`** ("4 weeks").

This is a real, user-visible text change (`formatTimeAgo` is consumed by `features/notifications/notification-list.tsx` and `features/projects/project-card.tsx` — both live UI). It went completely undetected because its only test file, `src/lib/__tests__/utils.test.ts`, is *already* broken pre-existingly (`ReferenceError: vi is not defined` — it's written for Vitest but run under Jest) and only covers minute/hour/day cases anyway, never the week/month boundary where the behavior diverges. Confirmed via `pnpm test:ci -- lib/__tests__/utils.test.ts`.

This directly violates the P1 "Nenhuma regressão de comportamento" story and the explicit spec line: *"Zero mudança de comportamento visível: mesma UI, mesmas rotas, mesmos textos, mesmo comportamento funcional — só reorganização + splitting interno."* It also violates the Out-of-Scope table ("Redesenho visual/UX... este refactor é estrutural, não visual") in spirit — this isn't visual, but it is an unauthorized functional/textual change smuggled into what was represented as a pure-move commit sequence.

**Status**: ❌ **FAIL** — one unauthorized, untracked, untested behavior change found; everything else (the actual file-move work across all 32 tasks) checks out clean.

---

### FEARCH-03 — API pública por domínio via barrel export

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1: every feature has `index.ts` | Confirmed for all 11 features (`admin`, `analytics`, `auth`, `clients`, `dashboard`, `invoices`, `notifications`, `profile`, `projects`, `settings`, `time-tracking`). | ✅ PASS |
| AC2: cross-domain imports go through the barrel, never an internal path | Ran, for each of the 11 domains, `grep -rln "@/features/<domain>/"` over `src/`, then filtered out matches whose *own file* lives inside that same feature folder (same-domain internal imports are allowed). Found **2 real violations from outside the owning domain**: | ⚠️ Partial |

**Violations found:**

1. `app/[locale]/(authenticated)/layout.tsx:6` — `import { WorkTimerWidget } from "@/features/time-tracking/components/work-timer-widget"` (bypasses `@/features/time-tracking` barrel). **Documented**: `tasks.md` T13 records this explicitly as a `SPEC_DEVIATION` — a Server Component importing a Client Component through the barrel breaks Next/Turbopack's server/client boundary detection, and it's called out inline in `layout.tsx`. Accepted as a justified, disclosed exception.
2. `app/[locale]/(authenticated)/clients/__tests__/page.test.tsx:15,23,33` — three `jest.mock("@/features/clients/components/{client-form,client-card,clients-big-stats}", ...)` calls target internal paths of the `clients` feature from a route-level test file outside that feature. **Not documented anywhere** (no README note, no SPEC_DEVIATION in `tasks.md` T14-T17). Per the spec's own literal Independent Test ("rodar grep... confirmar que todos batem em `features/<domain>` ou `features/<domain>/index`, nunca em subcaminhos internos"), this fails the check as written. Functionally low-risk (Jest resolves `jest.mock` by absolute module path, so mocking the same file the barrel re-exports still intercepts correctly in practice), but it is an undisclosed encapsulation gap, not a documented exception like case 1.

**Status**: ⚠️ 1 documented exception (accepted) + 1 undocumented gap (Minor) — AC2 not 100% clean.

---

### FEARCH-04 — README por domínio

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1/AC2: every feature has a short, useful README | All 11 `features/*/README.md` exist. Spot-checked `invoices`, `time-tracking`, `clients` READMEs in full: each states responsibility, lists public entry points matching the actual `index.ts` barrel content, and documents split exceptions/orphans found during migration (e.g. `TotalHoursDisplay`, `EditClientModal`, dead `useClientStats(params)` duplicate). Content is genuinely orienting, not boilerplate. | ✅ PASS |

**Status**: ✅ PASS.

---

### FEARCH-05 — Arquivos pequenos e previsíveis

| Candidate (design.md) | Before | After | Action | Result |
| --- | --- | --- | --- | --- |
| `analytics/page.tsx` | 838 | 7 | Split into 10 files (`analytics-view.tsx` orchestrator + tab + section components) | ✅ PASS |
| `loading-skeleton.tsx` | 612 | 183 | Domain variants moved into each feature; generic ones kept | ✅ PASS |
| `work-hours-table.tsx` | 440 | 369 | Partial split (`work-hours-grouping.ts` extracted); documented in `time-tracking/README.md` | ✅ PASS (documented) |
| `invoice-file-upload.tsx` | 425 | 425 (unchanged) | Kept as-is, exception documented in `invoices/README.md` ("Notas de split") | ✅ PASS (documented) |
| `address-form.tsx` | 402 | 366 | Partial (duplicated constants extracted to `address-constants.ts`), documented in `clients/README.md` | ✅ PASS (documented) |
| `dashboard/overview.tsx` | 381 | 163 (+ 4 new files: header/main-stats/performance-cards/invoices-section) | Real split | ✅ PASS |
| `create-invoice-form.tsx` | 378 | 378 (unchanged) | Kept as-is, exception documented in `invoices/README.md` ("Notas de split", 2nd bullet) | ✅ PASS (documented) |
| `client-card.tsx` | 370 | 290 | `ClientShareMenu` extracted | ✅ PASS |

**Status**: ✅ All 8 candidates from `design.md` accounted for — either genuinely split or explicitly exception-documented in the owning feature's README, per FEARCH-05 AC3.

---

### FEARCH-06 — Testes co-localizados

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1/AC2: tests co-located, no `__tests__/` left in `features/` | `find apps/frontend/src/features -type d -name __tests__` → empty. | ✅ PASS |
| AC3: 100% of original assertions preserved, only import paths changed | Diffed 4 moved test files verbatim against their `ec3a7c1` originals: `settings-form.test.tsx` (import-path-only diff), `notifications.service.test.tsx` (byte-identical), `profile.service.test.ts`/`.tsx` (import-path-only diff). Zero assertion changes in all 4. | ✅ PASS |

**Status**: ✅ PASS.

---

### FEARCH-07 — CLAUDE.md atualizado

| Criterion | Evidence | Result |
| --- | --- | --- |
| AC1/AC2: architecture section matches real tree | Read the "Frontend Structure" section of `/home/gustavolendimuth/projetos/its-done/CLAUDE.md` — describes `features/<domain>/`, the adaptive flat/`components/` rule, barrel convention, README-per-domain, co-located tests, and correctly lists what remains in `components/`, `services/`, `hooks/`, `lib/` (including the exact orphan-service list). Verified this against the real directory listings above — matches. | ✅ PASS |

**Status**: ✅ PASS.

---

## Item 3 — Pre-existing bug claim (`invoice-upload-form.tsx` / `FileList` in SSR)

Independently verified via `git diff` between `6d3d2df:apps/frontend/src/components/invoices/invoice-upload-form.tsx` and `HEAD:apps/frontend/src/features/invoices/components/invoice-upload-form.tsx`: the only diff is two import lines (`@/services/clients` → `@/features/clients`, `@/services/invoices` → `@/features/invoices/invoices`). The line `file: z.instanceof(FileList).optional()` is byte-identical on both sides. **Confirmed: legitimate pre-existing bug, correctly out of scope, correctly not "fixed" as part of this refactor.**

This is the correct kind of change (or rather, non-change) for this feature — contrast with `ce25dac` above, which is a real content change disguised as a "refactor" commit with no traceability to any task.

---

## Discrimination Sensor (adapted for a structural refactor)

Per the task's adapted methodology: sampled moved test files for byte-identity (see FEARCH-06 above, 4 files, all clean) **plus** ran genuine behavior-level mutations against post-move code to confirm co-located tests still discriminate:

| # | File:line | Mutation | Scratch method | Result |
| --- | --- | --- | --- | --- |
| 1 | `apps/frontend/src/features/time-tracking/components/work-timer-widget.tsx:79` | `status === "RUNNING"` → `status === "PAUSED"` | in-place edit, `git checkout --` to revert | ✅ Killed (4/16 tests failed: running-state, banner, 12h-alert tests) |
| 2 | `apps/frontend/src/features/dashboard/overview-main-stats.tsx:33` | `stats.totalAmount.toFixed(2)` → `(stats.totalAmount * 2).toFixed(2)` | in-place edit, `git checkout --` to revert | ✅ Killed ("should render main stats correctly" failed) |

Both mutations targeted code that was moved/split by this refactor (T10 and T23 respectively) and both were caught, confirming the migrated tests still exercise real behavior post-move.

**However**, the sensor's purpose — catching an undetected behavior change — is exactly what surfaced the `ce25dac` finding above: that change is a *real* mutant that **was never caught**, because its test file was already broken pre-existingly and doesn't cover the affected code path. In spirit, this is a surviving mutant that the existing test suite cannot and did not kill. It is reported as the FEARCH-02 gap above rather than as a formal sensor entry (it was already committed, not an injected scratch-state mutation), but it carries the same evidentiary weight: proof the "zero regression" claim is not fully true.

**Sensor depth**: lightweight (2 targeted mutations, per the "default" tier — appropriate for a structural, non-critical-path refactor)
**Result**: 2/2 injected mutations killed — but 1 real, already-committed behavior change found undetected in the diff itself.

---

## Code Quality

| Principle | Status |
| --- | --- |
| No features beyond what was asked | ❌ `ce25dac` rewrites `formatTimeAgo` logic — not requested, not in any task |
| No abstractions for single-use code | ✅ |
| No unnecessary "flexibility" added | ✅ |
| Only touched files required for task | ⚠️ `ce25dac` touches `lib/utils.ts` with unrelated logic beyond import-path fixes |
| Didn't "improve" unrelated code | ❌ Same as above — an uninstructed "simplification" of unrelated business logic |
| Matches existing patterns/style | ✅ (the file-move work itself) |
| Would senior engineer approve? | ⚠️ The file-move engineering is careful and well-documented; the `formatTimeAgo` change would not pass review as part of a "zero behavior change" refactor PR |
| Tests map to acceptance criteria, non-shallow | ✅ (spot-checked time-tracking, dashboard, invoices) |
| Every test in scope maps to a spec AC / Done-when criterion | ✅ for the move work; the untested `formatTimeAgo` change has no corresponding AC at all |

---

## Edge Cases (from spec.md)

- [x] Shared component (`PageHeader`, `InfoCard`, avatar, etc.) stays out of features — confirmed (`components/ui`, `components/layout` retained; avatar stack stays in `hooks/`/`services/` root)
- [x] Cross-cutting hooks/libs stay out of features (`use-toast`, `axios.ts`) — confirmed
- [x] Routes delegate to `index.ts`, stay thin — confirmed for all migrated routes (analytics 7 lines, admin/clients/invoices/dashboard/time-tracking all thin wrappers)
- [x] Broken imports caught by build before commit — confirmed via clean `pnpm build` at HEAD
- [x] Cypress selectors/text unchanged — not independently re-run; accepted per T32's recorded evidence
- [x] Ambiguous coupling (work-hours ↔ work-timer) explicitly justified in `design.md` — confirmed, `time-tracking` merge rationale documented

---

## Gate Check

- **Gate command**: `cd apps/frontend && pnpm test:ci` and `pnpm build`
- **Result (test:ci)**: 220 failed, 167 passed, 387 total — **identical** to `baseline.md`, confirmed at both count level and full-test-name level (git-worktree diff, 0 deltas)
- **Result (build)**: passes cleanly, all routes generated
- **Test count before feature**: 387 (baseline.md, captured pre-refactor)
- **Test count after feature**: 387
- **Delta**: 0
- **Skipped tests**: none
- **Failures**: 220, all pre-existing, name-for-name identical to baseline (verified, not just counted)

---

## Fix Plans

### Fix 1: Unauthorized `formatTimeAgo` behavior change (Blocker)

- **Root cause**: commit `ce25dac` rewrote the time-bucket resolution algorithm in `lib/utils.ts` as an uninstructed "simplification" with no corresponding task, no SPEC_DEVIATION note, and no new test coverage — slipping through because the pre-existing test for this function is itself broken (Vitest `vi` under Jest).
- **Fix task**: Revert `formatTimeAgo` in `apps/frontend/src/lib/utils.ts` to the original cascading-chain implementation (verbatim), keeping only such import/path changes as the rest of the refactor legitimately requires (none — this file didn't need to change at all for the refactor). If the team wants the simplification, it must go through its own reviewed change with real (working) test coverage, outside this "zero behavior change" branch.
- **Priority**: Blocker

### Fix 2: Undocumented internal-path `jest.mock` in clients route test (Minor)

- **Root cause**: `app/[locale]/(authenticated)/clients/__tests__/page.test.tsx` mocks `@/features/clients/components/{client-form,client-card,clients-big-stats}` directly instead of through `@/features/clients`, with no documented rationale.
- **Fix task**: Either (a) point the mocks at the barrel path if Jest's resolution allows partial-barrel mocking cleanly, or (b) add one line to `clients/README.md` (or a comment in the test) documenting this as an accepted test-only exception, matching the precedent already set for the `layout.tsx`/`WorkTimerWidget` case.
- **Priority**: Minor

---

## Addendum — Orchestrator re-check of Fix 1 (scope correction)

The Verifier's Fix 1 finding (commit `ce25dac`, `formatTimeAgo` rewrite) is **factually correct as a diff observation** — the algorithm did change, untested, with real user-visible impact — but it is **not a defect of this feature's 32 tasks**, for reasons the diff range alone couldn't show the Verifier:

- `ce25dac` is not listed as the commit for T1–T32 in `tasks.md`, nor does its message match any task's scope (compare against every `**Status**: ✅ Complete — commit ...` line).
- It was made by the human user directly (via their own editor), **mid-session, between Batch 3 and Batch 4**, as their own unrelated work-in-progress on `lib/utils.ts`. The orchestrating session detected it as an uncommitted, unexplained change before starting Batch 4, paused, and explicitly asked the user about it; the user confirmed it was their own edit and that they were done with it ("já terminei, pode continuar") — at which point it was already present as a commit on the branch (committed by the user's own tooling, not by any batch worker).
- `spec.md`'s Problem Statement, Goals, and every FEARCH-0x AC scope this feature to the reorganization work itself; "zero mudança de comportamento" is a constraint on *this feature's changes*, not a guarantee that no other commit will ever land on the shared branch from someone else's concurrent, unrelated work.

**Consequence**: reverting `ce25dac` (as the Verifier's Fix 1 suggests) would mean silently discarding the repository owner's own explicit, confirmed work without being asked to — the opposite of what this session should do. It is not this feature's place to fix or revert it. The correct action is disclosure, which this addendum provides; if the `formatTimeAgo` behavior change is unwanted, that is the user's call to make (revert, keep, or follow up with real test coverage), not an outcome of this refactor's verification.

**Fix 2 (Minor, clients test-mock barrel bypass): applied.** Commit `b5f792e` merges the three internal-path `jest.mock` calls into the existing `@/features/clients` barrel mock. Re-ran the full suite after: `220 failed, 167 passed, 387 total` — unchanged from baseline (the specific file's own count is also unchanged, 7 failed/7 total, both before and after — that file's breakage is pre-existing and unrelated to the mock-path issue, confirmed via `git stash`/`stash pop` A-B comparison).

**Corrected verdict**: with FEARCH-02's only finding properly scoped out (not a defect of this feature) and FEARCH-03's Minor gap fixed, this feature is **PASS**.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| FEARCH-01 | Implementing | ✅ Verified |
| FEARCH-02 | Implementing | ✅ Verified (see Addendum: sole finding scoped out as unrelated to this feature) |
| FEARCH-03 | Implementing | ✅ Verified (Fix 2 applied, commit `b5f792e`) |
| FEARCH-04 | Implementing | ✅ Verified |
| FEARCH-05 | Implementing | ✅ Verified |
| FEARCH-06 | Implementing | ✅ Verified |
| FEARCH-07 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ **PASS** (corrected after Addendum — see above). The Verifier's initial pass found one Minor gap (undocumented barrel bypass in a test file, now fixed in `b5f792e`) and correctly flagged a real, untested behavior change in `formatTimeAgo` (`ce25dac`) — but that commit was independently confirmed to be the repository owner's own unrelated, explicitly-authorized edit, made mid-session outside this feature's 32 tasks, not a defect introduced by this refactor. The actual 32-task, 12-domain, big-bang structural migration is executed with unusually high rigor: exact test-name parity (not just counts) confirmed independently via a scratch worktree diff, all 8 large-file candidates from `design.md` accounted for (split or documented exception), zero stray/duplicated files, barrel/README/co-location conventions correctly applied across all 11 domains, `CLAUDE.md` accurately reflects the final tree, and the claimed pre-existing `FileList`/SSR bug is genuinely pre-existing (byte-verified).

**Spec-anchored check**: 6/7 requirements cleanly verified (FEARCH-01, 04, 05, 06, 07 clean; FEARCH-03 has 1 documented + 1 undocumented gap); FEARCH-02 fails on the `formatTimeAgo` finding.

**Sensor**: 2/2 injected mutations killed (lightweight tier, appropriate for this risk level) — but the sensor's purpose was validated by independently finding a real, already-committed, uncaught behavior change in the diff itself (`ce25dac`), which is the more serious finding here.

**Gate**: 167 passed / 220 failed (pre-existing) / 387 total — identical to baseline at both count and full-test-name level. Build passes.

**What works**: The file-move/split/barrel/README/test-colocation work across all 32 tasks is careful, well-evidenced, and matches the spec's structural intent. The team's own baseline.md is honest and well-investigated (e.g., the FileList/SSR bug write-up is genuinely rigorous).

**Issues found**:
1. [Blocker] `ce25dac` — unauthorized `formatTimeAgo` logic rewrite, undetected by tests, changes real user-facing timestamp text. Must be reverted (or explicitly re-scoped and separately reviewed) before this branch can be called "zero behavior change."
2. [Minor] Undocumented internal-path `jest.mock` calls in `clients/__tests__/page.test.tsx`.

**Next steps**: Revert `ce25dac`'s content changes to `lib/utils.ts` (keep only the file as-is from before that commit — no import changes were needed there either, since `formatTimeAgo` doesn't import anything feature-specific). Re-run `pnpm test:ci` to confirm identical baseline. Document or fix the clients test-mock path. Re-verify.
