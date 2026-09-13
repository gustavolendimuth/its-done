# Bug: `formatTimeAgo` test file broken (Vitest API under Jest), masking a real behavior change

**Severity**: Medium (no crash, but a user-visible text regression could ship silently)
**Status**: Resolved — ported to Jest API (`jest.useFakeTimers`/`setSystemTime`/`useRealTimers`), added boundary tests (7d, 28d, 29d, 30d, 365d), confirmed the `ce25dac` table-lookup behavior is the intended one. All 17 tests pass under `pnpm test:ci`.
**Found during**: `frontend-architecture-refactor` (`.specs/features/frontend-architecture-refactor/`), independent Verifier pass
**Affected files**: `apps/frontend/src/lib/utils.ts` (`formatTimeAgo`), `apps/frontend/src/lib/__tests__/utils.test.ts`

## Symptom

`apps/frontend/src/lib/__tests__/utils.test.ts` fails to run under the project's actual test runner:

```
$ pnpm test:ci -- lib/__tests__/utils.test.ts
ReferenceError: vi is not defined
  at src/lib/__tests__/utils.test.ts:31:5   (vi.useFakeTimers())
  at src/lib/__tests__/utils.test.ts:36:5   (vi.useRealTimers())

Test Suites: 1 failed, 1 total
Tests:       6 failed, 6 passed, 12 total
```

The project uses **Jest** (`jest.config.js`, `pnpm test:ci` → `jest --ci`), but this test file is written against the **Vitest** API (`vi.useFakeTimers()`/`vi.setSystemTime()`/`vi.useRealTimers()` — Vitest's mocking utility, never imported, since it doesn't exist under Jest). 6 of 12 tests fail every run; the 6 that pass are the ones that don't touch fake timers.

## Why this matters beyond a broken test

Because this test never actually runs, a real algorithm change to `formatTimeAgo()` (commit `ce25dac`, made directly by a developer during this refactor's session — not part of the refactor's own 32 tasks) went in with **zero working test coverage**, and changes user-visible text at unit boundaries:

- Old: cascading smallest→largest resolution (minutes → hours → days → weeks → months → years), each with its own singular/plural threshold.
- New: largest→smallest table lookup, first unit where `floor(diffInMinutes / unitMinutes) >= 1`.

These are **not equivalent**. Example, for a date 29 days in the past:
- Old returns `t("timeAgo.month")` → "1 month" (falls through weeks-cap of 4, lands in months bucket).
- New returns `t("timeAgo.weeks", { count: 4 })` → "4 weeks".

`formatTimeAgo` is consumed by live UI: `features/notifications/notification-list.tsx` and `features/projects/project-card.tsx`. Neither the old nor the new boundary behavior is verified by a passing test today.

## Suggested fix

1. Port `utils.test.ts` to Jest's API: replace `vi.useFakeTimers()` → `jest.useFakeTimers()`, `vi.setSystemTime(now)` → `jest.setSystemTime(now)`, `vi.useRealTimers()` → `jest.useRealTimers()` (Jest has supported modern fake timers with `setSystemTime` since Jest 27+, already in use elsewhere in this codebase's test suite — confirm exact API against the installed Jest version).
2. Add test cases at the exact unit boundaries (29 days, 4 weeks, etc.) to lock in whichever behavior is intended going forward.
3. Decide whether the `ce25dac` behavior change is wanted; once tests are working, either confirm the new output is correct and keep it, or revert to the original cascading logic if the old text was the intended UX.
