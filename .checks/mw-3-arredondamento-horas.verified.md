# Arredondamento configurável de horas lançadas — Verification

**Verdict**: PASS
**Profile**: standard
**Diff range**: 93f923d..HEAD (1eda95f docs, 18e94d0 feat/Settings, 1420fdf feat/work-hours rounding)
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Binding sources

Profile is `standard`, not `ui` - no design source binding is declared for this checklist. Step 1
(binding-source enumeration) does not apply; noting that and moving on, per verify.md's rule that
a step with no input is a line, not an investigation.

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | Settings shows `roundingIncrementMinutes` saved, or `0` when no row exists | `pnpm exec jest settings.service.spec.ts` exit 0 | `settings.service.spec.ts:27-33` `expect(result.roundingIncrementMinutes).toBe(0)`; `settings.service.spec.ts:35-46` `expect(result.roundingIncrementMinutes).toBe(15)` | PASS |
| C2 | `PATCH /settings` persists a value in `{0,5,10,15,30,60}` | `pnpm exec jest settings.service.spec.ts create-settings.dto.spec.ts` exit 0 | `settings.service.spec.ts:74-81` `expect(prismaMock.settings.update).toHaveBeenCalledWith(expect.objectContaining({data: expect.objectContaining({roundingIncrementMinutes: 30})}))`; `create-settings.dto.spec.ts:7-19` `it.each([0,5,10,15,30,60])` → `expect(errors).toHaveLength(0)` | PASS |
| C3 | `PATCH /settings` rejects a value outside `{0,5,10,15,30,60}` | `pnpm exec jest create-settings.dto.spec.ts` exit 0 | `create-settings.dto.spec.ts:21-31` `expect(errors.length).toBeGreaterThan(0)`; `expect(errors[0].property).toBe('roundingIncrementMinutes')` | PASS |
| C4 | `POST /work-hours` with `N>0` persists `hours` rounded to nearest `N`-minute multiple (2 decimals) | `pnpm exec jest round-hours.util.spec.ts work-hours.service.spec.ts` exit 0 | `round-hours.util.spec.ts:8-23` `it.each` over `[5,10,15,30,60]` → `expect(...).toBeCloseTo(expected,2)`; `work-hours.service.spec.ts:53-70` `expect(prismaMock.workHour.create).toHaveBeenCalledWith(expect.objectContaining({data: expect.objectContaining({hours: 1.25})}))` | PASS |
| C5 | With increment `0`, persisted value is the raw `hours`, unchanged | `pnpm exec jest round-hours.util.spec.ts work-hours.service.spec.ts` exit 0 | `round-hours.util.spec.ts:4-6` `expect(roundHoursToIncrement(1.37, 0)).toBe(1.37)`; `work-hours.service.spec.ts:34-51` `expect(...).toHaveBeenCalledWith(expect.objectContaining({data: expect.objectContaining({hours: 1.37})}))` | PASS |
| C6 | `PATCH /work-hours/:id` rounds edited `hours` the same way as creation | `pnpm exec jest work-hours.service.spec.ts` exit 0 | `work-hours.service.spec.ts:102-120` `expect(prismaMock.workHour.update).toHaveBeenCalledWith(expect.objectContaining({where: {id: 'wh1'}, data: expect.objectContaining({hours: 1.5})}))` | PASS |
| C7 | Rounding below `0.1` hour is rejected, nothing persisted | `pnpm exec jest work-hours.service.spec.ts` exit 0 | `work-hours.service.spec.ts:72-86` `await expect(service.create(...)).rejects.toThrow(BadRequestException)` + `expect(prismaMock.workHour.create).not.toHaveBeenCalled()`; `work-hours.service.spec.ts:122-136` same pattern for `update` | PASS |
| C8 | Rounding an already-rounded value is idempotent | `pnpm exec jest round-hours.util.spec.ts` exit 0 | `round-hours.util.spec.ts:30-41` nested loop over 5 increments × 6 samples, `expect(twice).toBe(once)` | PASS |
| C9 | Invoice calculation uses the already-rounded `hours`, no duplicated rounding logic | `pnpm exec jest invoices.service.spec.ts` exit 0 (unchanged test, unchanged file) | `invoices.service.spec.ts:45` `computes amount from project hourly rates when amount is not provided` still green; `git diff 93f923d..HEAD --name-only` confirms neither `invoices/invoices.service.ts` nor `work-hours/services/draft-invoice.service.ts` appear in the changed-files list | PASS |

All 28 tests across the 5 target files ran in a single `jest` invocation and passed (`Test Suites: 5
passed, 5 total / Tests: 28 passed, 28 total`). Each named test above was located with `rg`/direct
read in the spec file, not inferred from a suite-level "green" summary.

## Test policy rows

| Row | Files it classifies | Required proof | Expectation met |
|---|---|---|---|
| `round-hours.util.ts` (decide, not reached directly by a route) | `round-hours.util.ts` | own-level unit test | yes - one case per increment in `{0,5,10,15,30,60}` (C4/C5) plus the tie case (`round-hours.util.spec.ts:25-28`) plus idempotency (C8) |
| `WorkHoursService.create`/`update` (decide, reached via `POST`/`PATCH /work-hours(:id)`) | `work-hours.service.ts` | own-level test, prisma mocked | yes - all 4 combinations of write-path × outcome present: create-within-min (C4), create-below-min (C7), update-within-min (C6), update-below-min (C7); a 5th test (`does not consult rounding when hours is not part of the update`) is a bonus, not required |
| `SettingsService.findByUserId`/`update` (decide, reached via `GET`/`PATCH /settings`) | `settings.service.ts` | own-level test | yes - absent-Settings and present-Settings each asserted (C1) |
| `CreateSettingsDto`/`UpdateSettingsDto` (decide via `@IsIn`, reached via `POST`/`PATCH /settings`) | `create-settings.dto.ts` (inherited by `update-settings.dto.ts` via `PartialType`) | `validate()` called directly on the class | yes - all 6 accepted values plus one rejected value (`create-settings.dto.spec.ts`); confirmed `UpdateSettingsDto extends PartialType(CreateSettingsDto)` (`update-settings.dto.ts:4`) so the same `@IsIn` decorator applies to `PATCH` |
| `SettingsController`/`WorkHoursController` (instrumentation, no own decision) | none | none required, covered by the service proof | yes - `git diff 93f923d..HEAD --name-only` shows no controller file touched, consistent with "forwards the DTO with no decision of its own" |

## Coverage (recomputed from the code, not from the checklist's table)

| Set (size) | Members (from code) | Member → proof | Unproven |
|---|---|---|---|
| Rounding increments (6): `{0,5,10,15,30,60}` from `ALLOWED_ROUNDING_INCREMENTS` in `create-settings.dto.ts:3` | `0,5,10,15,30,60` | `0` → `round-hours.util.spec.ts:4-6`; `5,10,15,30,60` → `round-hours.util.spec.ts:8-23` (table-driven, one row per increment) | none |
| DTO-accepted set (6): same `ALLOWED_ROUNDING_INCREMENTS` array | `0,5,10,15,30,60` | all 6 → `create-settings.dto.spec.ts:7-19` `it.each` | none |
| `Settings` row existence (2): absent, present — from `SettingsService.findByUserId` branch on `!settings` | absent, present | absent → `settings.service.spec.ts:27-33`; present → `settings.service.spec.ts:35-46` | none |
| Write path × outcome (4): create-within-min, create-below-min, update-within-min, update-below-min — from the two call sites of `applyRounding` in `work-hours.service.ts` (`create` and `update`) crossed with the `rounded < MIN_HOURS` branch | 4 combinations | create-within-min → `work-hours.service.spec.ts:53-70`; create-below-min → `work-hours.service.spec.ts:72-86`; update-within-min → `work-hours.service.spec.ts:102-120`; update-below-min → `work-hours.service.spec.ts:122-136` | none |

Recomputation matches the checklist's own `## Coverage` table for all 4 rows - no member was found
uncovered, and no additional member (e.g. a 7th DTO value, a 3rd Settings existence state) exists
in the code that the checklist's rows failed to name.

One addition swept but not previously tabled: `work-hours.service.spec.ts` also carries `update()
does not consult rounding when hours is not part of the update` - this asserts `settingsService.
findByUserId` is never called when `hours` is absent from the patch. It is not required by any
numbered check, but is real extra coverage, not a gap.

## Faults injected

Isolated in a separate `git worktree add --detach <scratch> HEAD` (not `git stash`), with
`node_modules` symlinked in read-only for running `jest`. Baseline `git status --porcelain` of the
real tree was empty before and after.

| # | Mutation | Location | Covering proof | Killed |
|---|---|---|---|---|
| 1 | `Math.round` → `Math.floor` when computing `roundedMinutes` | `round-hours.util.ts:17` | `pnpm exec jest round-hours.util.spec.ts` | yes - 4 of 9 tests failed (tie case, idempotency case, and 2 table-driven cases) |
| 2 | `rounded < MIN_HOURS` → `rounded < 0` (drops the 0.1h floor) | `work-hours.service.ts:33` | `pnpm exec jest work-hours.service.spec.ts` | yes - both `rejects when rounding produces less than 0.1 hours` tests failed (create and update) |
| 3 | `create()` persists raw `createWorkHourDto.hours` instead of the rounded value (rounding still computed but discarded) | `work-hours.service.ts:45-50` | `pnpm exec jest work-hours.service.spec.ts` | yes - `persists the rounded hours when a rounding increment is configured` failed |
| 4 | Default `roundingIncrementMinutes: 0` → `15` in the no-row fallback | `settings.service.ts:35` | `pnpm exec jest settings.service.spec.ts` | yes - `returns roundingIncrementMinutes 0 when no settings row exists` failed |
| 5 | Removed `@IsIn(ALLOWED_ROUNDING_INCREMENTS)`, replaced with plain `@IsNumber()` | `create-settings.dto.ts:14-18` | `pnpm exec jest create-settings.dto.spec.ts` | yes - `rejects a value outside the allowed set` failed |

5 of 5 mutants killed - one per distinct assertion surface (rounding formula, minimum-hours
rejection, rounding actually applied at the write, Settings default, DTO membership check). No
surviving mutant.

## Pre-existing, unrelated test failures (confirmed, not caused by this feature)

- Backend: `src/app.controller.spec.ts` and `src/invoices/invoices.controller.spec.ts` fail with
  "Nest can't resolve dependencies" - both build a `TestingModule` with only `controllers: [...]`
  and no `providers`, so `InvoicesService`/equivalent can never resolve. Root cause has nothing to
  do with `Settings`/`WorkHours`/rounding; confirmed by reading both spec files directly. Full
  backend suite: `Test Suites: 2 failed, 6 passed, 8 total / Tests: 2 failed, 33 passed, 35 total`.
- Frontend: `settings-form.test.tsx` fails all 10 tests with "No QueryClient set, use
  QueryClientProvider to set one" - `render(<SettingsForm />)` is called with no `QueryClientProvider`
  wrapper. Confirmed via `git show 93f923d:apps/frontend/src/components/settings/__tests__/
  settings-form.test.tsx` that every `render(<SettingsForm />)` call site in the pre-feature version
  is identical (no wrapper there either) - the feature's 5-line diff to this file only added the new
  `roundingIncrementMinutes` field/assertions, touching nothing about rendering or mocking. The
  failure mode is unchanged before and after; the feature's edits made nothing worse.

## Gate

`cd apps/backend && pnpm exec jest src/work-hours/utils/round-hours.util.spec.ts src/settings/settings.service.spec.ts src/settings/dto/create-settings.dto.spec.ts src/work-hours/work-hours.service.spec.ts src/invoices/invoices.service.spec.ts` - 28 passed, 0 failed.
