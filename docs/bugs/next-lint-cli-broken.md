# Bug: `pnpm lint` broken under Next 16 (`next lint` CLI arg parsing)

**Severity**: Low (tooling only, no runtime impact — but no lint gate currently runs at all)
**Status**: Fixed
**Found during**: `frontend-architecture-refactor` (`.specs/features/frontend-architecture-refactor/`), every task's gate check
**Affected**: `apps/frontend` — `pnpm lint` (`next lint`), Next `^16.2.10`

## Symptom

```
$ cd apps/frontend && pnpm lint
> frontend@0.1.0 lint /home/.../apps/frontend
> next lint

Invalid project directory provided, no such directory: /home/.../apps/frontend/lint
```

`next lint` is parsing `lint` (from the npm script name reaching the CLI, or an arg-forwarding change) as a positional "project directory" argument instead of running against the current directory. This reproduces on a clean checkout, unrelated to any code change — confirmed pre-existing before and throughout the entire `frontend-architecture-refactor` branch.

## Impact

No lint gate currently runs in this project via `pnpm lint` / `pnpm --filter frontend lint` / `turbo run lint` (frontend workspace). `CLAUDE.md`'s documented `pnpm lint` command is not currently usable as-is.

## Root cause

`next lint` was removed entirely from the Next.js 16 CLI (`node_modules/next/dist/bin/next` no longer
registers a `lint` command — only `build`, `dev`, `start`, `export`, `info`, `telemetry`, `typegen`,
`upgrade`, `experimental-*`, `internal`). With no `lint` subcommand, commander falls through to the
default `dev` command and treats the literal string `"lint"` as its `[directory]` positional argument,
producing the misleading "Invalid project directory" error. Confirmed by running
`./node_modules/.bin/next lint` directly (same error, ruling out pnpm/turbo arg-forwarding) and by
grepping the CLI source for `.command(`.

## Fix

Ran ESLint directly instead of going through the (now-removed) `next lint` wrapper, matching the
pattern already used by `apps/backend`'s `lint` script:

```diff
- "lint": "next lint",
+ "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
```

The project's existing `eslint@8` + `.eslintrc.json` (legacy config format) needed no migration to
flat config since the major version wasn't bumped.

## Follow-up: pre-existing lint/test findings surfaced once the gate ran

With the CLI fixed, `pnpm lint` surfaced 88 real problems that had been silently unchecked. All were
fixed as part of this change:

- 74 auto-fixable via `eslint --fix` (`import/order`, `unused-imports`).
- `src/features/profile/profile.service.test.ts` — deleted: a stale, unfinished duplicate (literal
  `// ... rest of the tests ...` placeholder, mismatched `Profile` shape) of the complete
  `profile.service.test.tsx`, which already covered the same hook. Both matched Jest's `testMatch`
  glob and were running redundantly.
- `src/features/time-tracking/work-hours-stats.test.ts` — renamed to `.test.tsx`: the file used JSX
  (`<QueryClientProvider>`) but had a `.ts` extension, which `@typescript-eslint/parser` correctly
  rejects as a parse error.
- `src/test-utils.tsx` — `export * from "@testing-library/react"` followed by
  `export { renderWithProviders as render }` is the standard, intentional Testing-Library
  custom-render pattern (named export shadows the star export at runtime), but `import/export`
  flags it as ambiguous. Added targeted `eslint-disable-next-line import/export` comments on both
  lines instead of restructuring working code.
- `cypress.config.ts` — `setupNodeEvents(on, config)` params are required by Cypress's API but
  unused; renamed to `_on`/`_config` to match the project's configured
  `unused-imports/no-unused-vars` allowlist (`/^_/`).

`pnpm lint` now exits 0 with no output.

**Not fixed here (separate, larger, pre-existing issue):** `pnpm test:ci` has 215 failing tests across
30 suites, unrelated to this lint fix (confirmed pre-existing — the two renamed/touched test files'
failures reproduce identically before and after, since only the file extension changed, not content).
Needs its own investigation.
