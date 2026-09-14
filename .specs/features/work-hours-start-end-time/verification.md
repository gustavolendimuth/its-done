# Work Hours - Start/End Time Entry verification

**Verdict**: PASS
**Profile**: light
**Diff range**: e28b8a5..HEAD
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

Commits in range: `c767d0f` feat(work-hours): add start/end time entry mode to WorkHourForm,
`dde9384` feat(work-hours): persist and validate startTime/endTime,
`25fc1e0` docs(work-hours-start-end-time): add plan, checks and task artifacts.

Note: the real tree carried an unrelated pre-existing uncommitted diff on
`apps/frontend/src/messages/en.json` / `pt-BR.json` (`addHours` → `"Add Session"`, `entries` →
`"sessões"`) present before this session started. It does not touch any key this feature reads or
introduces (`workHours.invalidTimeFormat`, `endTimeBeforeStart`, `durationMode`, `intervalMode`,
`entryMode`, `startTime`, `endTime` — all confirmed present, see Checks below) and is out of this
feature's diff range, so it is noted but does not affect the verdict.

Profile is `light`: Step 1 (binding-source comparison), `Coverage` recompute, `Test policy`
verdicts and fault injection are `standard`/`ui`-only and did **not** run — noted here rather than
skipped silently. What did run: every proof at HEAD, existence/pass confirmation for each named
test, one located assertion per check, the level/sampling judgment, and a re-read of `Swept`
against the code.

## Checks

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | Selector renders, defaults to Duração | `pnpm --filter frontend exec jest .../work-hour-form.test.tsx --ci -t "create mode: renders the entry-mode selector defaulted to Duração"` exit 0 | `work-hour-form.test.tsx:171-172` — `expect(durationButton).toHaveAttribute("aria-pressed", "true")`; `expect(intervalButton).toHaveAttribute("aria-pressed", "false")` | PASS |
| C2 | Duração shows only duration input | same file, `-t "entry mode: Duração shows only the duration input"` exit 0 | `work-hour-form.test.tsx:178-180` — `getByPlaceholderText("HH:mm")` present, `queryByTestId("start-time-input")`/`"end-time-input"` absent | PASS |
| C3 | Interval mode shows both HH:mm inputs, duration hidden | `-t "entry mode: Hora inicial e hora final shows startTime\/endTime inputs"` exit 0 | `work-hour-form.test.tsx:188-190` — both testids present, `queryAllByPlaceholderText("HH:mm")` length 2 | PASS |
| C4 | Duração submit omits startTime/endTime | `-t "create mode: Duração mode submits without startTime\/endTime"` exit 0 | `work-hour-form.test.tsx:211-213` — `expect(payload).not.toHaveProperty("startTime")` / `"endTime"` | PASS |
| C5 | Interval submit computes hours + sends both HH:mm strings | `-t "create mode: interval entry computes hours and sends startTime\/endTime"` exit 0 | `work-hour-form.test.tsx:239-241` — `payload.hours` = 3.5, `payload.startTime` = "09:00", `payload.endTime` = "12:30" | PASS |
| C6 | endTime not after startTime blocks submit | `-t "create mode: endTime not after startTime blocks submit"` exit 0 | `work-hour-form.test.tsx:264-266` — `getByText("endTimeBeforeStart")` present, `mockCreateMutateAsync` not called | PASS |
| C7 | create persists startTime/endTime when given, null when omitted | `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "persists startTime and endTime when provided"` exit 0; `-t "persists null startTime and endTime when only hours is provided"` exit 0 | `work-hours.service.spec.ts:106-113` — `create` called `expect.objectContaining({data: expect.objectContaining({startTime: "09:00", endTime: "12:30"})})`; `:127-134` — same with `startTime: undefined, endTime: undefined` | PASS |
| C8 | Edit interval workHour pre-selects interval, fields prefilled | `-t "edit mode: interval workHour pre-selects Hora inicial e hora final"` exit 0 | `work-hour-form.test.tsx:351-355` — intervalMode button `aria-pressed="true"`, start/end inputs `toHaveValue("09:00")`/`"12:30"` | PASS |
| C9 | Edit duration workHour pre-selects Duração | `-t "edit mode: duration workHour pre-selects Duração"` exit 0 | `work-hour-form.test.tsx:363-366` — durationMode button `aria-pressed="true"`, duration input present | PASS |
| C10 | Invoiced workHour disables selector + interval inputs | `-t "edit mode: invoiced work hour disables the entry-mode selector and interval inputs"` exit 0 | `work-hour-form.test.tsx:415,418-420` — both mode buttons and both time inputs `toBeDisabled()` | PASS |
| C11 | Editing one time field resends recomputed hours + only that field | `-t "edit mode: changing only startTime resends recomputed hours"` exit 0 | `work-hour-form.test.tsx:460-464` — `mockUpdateMutateAsync` called with `{id: "wh-2", data: {startTime: "10:00", hours: 2.5}}` | PASS |
| C12 | Cancel resets selector to original mode | `-t "edit mode: Cancel resets the entry-mode selector to the original mode"` exit 0 | `work-hour-form.test.tsx:374-383` — after switching + clicking Cancel, `durationMode` button back to `aria-pressed="true"` | PASS |
| C13 | Hour-only entry auto-fills `:00` on blur, table-driven over 3 fields | `-t "hour-only entry auto-fills minutes with 00"` exit 0 | `work-hour-form.test.tsx:565,572,578` — duration/startTime/endTime each `toHaveValue("08:00")`/`"09:00"`/`"17:00"` after blur | PASS |
| C14 | Value with colon left unmodified | `-t "partial HH:mm entry with a colon is not auto-filled"` exit 0 | `work-hour-form.test.tsx:597,601` — `toHaveValue("08:3")` before and after blur | PASS |
| C15 | Bad `HH:mm` fails DTO validation, same shape on both DTOs | `cd apps/backend && npx jest work-hours/dto/create-work-hour.dto.spec.ts -t "rejects a startTime\/endTime not matching HH:mm"` exit 0; `.../update-work-hour.dto.spec.ts` same `-t` exit 0 | `create-work-hour.dto.spec.ts:38,43` — `errors.some(e => e.property === "startTime"/"endTime")` true; `update-work-hour.dto.spec.ts:58,63` — same | PASS |
| C16 | create() throws BadRequestException when exactly one of the pair given, no create call | `-t "rejects creation when only one of startTime\/endTime is provided"` exit 0 | `work-hours.service.spec.ts:145-148` — `rejects.toThrow(BadRequestException)`, `expect(prismaMock.workHour.create).not.toHaveBeenCalled()` | PASS |
| C17 | update() merges DTO with row before judging pairing, table-driven | `-t "allows patching a single time field when the row already has both"` exit 0; `-t "rejects patching a single time field when the row has neither"` exit 0 | `work-hours.service.spec.ts:251` — `update` called (existing-both case); `:265-266` — `rejects.toThrow(BadRequestException)`, `update` not called (existing-neither case) | PASS |
| C18 | Effective pair rejected when endTime not strictly after startTime, table-driven create/update | `-t "rejects creation when endTime is not after startTime"` exit 0; `-t "rejects an update that makes the merged endTime not after startTime"` exit 0 | `work-hours.service.spec.ts:160-163` (create); `:278-281` (update) — both `rejects.toThrow(BadRequestException)`, respective `create`/`update` not called | PASS |

All 18 named tests confirmed present via `rg`/direct read and shown passing in the runs below —
none matched via an empty/`passWithNoTests` filter.

## Additional grounding (not gated by any single check, verified because the plan/checks reference them)

- `apps/backend/prisma/schema.prisma:37-38` — `startTime String?`, `endTime String?` on `WorkHour`, matching the plan's Landing door 1.
- `apps/backend/prisma/migrations/20260914034220_work_hours_start_end_time/migration.sql` — pure `ADD COLUMN` nullable, no backfill, matching the plan's "nothing to migrate" Impact note.
- `apps/backend/src/main.ts:37-38` — global `ValidationPipe` confirms DTO/`BadRequestException` failures in C15-C18 translate to HTTP `400` (pre-existing Nest wiring, untouched by this feature); this is why a DTO/service-level assertion is the right level for the "`400`" claims in C15-C18 rather than a level gap.
- `apps/backend/src/work-hours/work-hours.controller.ts:19,25,36,50,64,79` — `@UseGuards(JwtAuthGuard)` + `req.user.id` on every route, confirming the `Swept` row "authorization: existing" is accurate.
- Translation keys confirmed present with matching copy (frontend tests mock `next-intl` to echo the raw key, so this is the only real check that the strings resolve): `en.json`/`pt-BR.json` → `workHours.invalidTimeFormat`, `endTimeBeforeStart` ("A hora final deve ser depois da hora inicial" in pt-BR, matching AC 7 verbatim), `durationMode`, `intervalMode`, `entryMode`, `startTime`, `endTime`.
- `apps/frontend/src/types/entities.ts:65-66,170-171` and `apps/frontend/src/types/index.ts:22-23` — `startTime`/`endTime` added to both the `WorkHour` and DTO type declarations, matching the diff's touched files.

## Coverage (not recomputed — `standard`/`ui` only; reading checks.md's own table as declared, not verified)

`checks.md`'s own Coverage table lists 7 sets with no `Unproven` cells. Not independently
recomputed under `light`.

## Test policy rows

`checks.md` carries no `Test policy` section — n/a under `light` (also n/a regardless, since it's a
`standard`/`ui` step).

## Faults injected

Not run — `light` profile, fault injection is `standard`/`ui` only.

## Swept

Re-read against the code, not merely against the table:

| Row | As declared in the artifact | Confirmed in the tree | Match |
| --- | --- | --- | --- |
| validation | C6, C15, C16, C17, C18 | All 5 checks' assertions confirmed above | yes |
| failure modes | C6, C16, C17, C18 — `BadRequestException` before any `create`/`update` call | `work-hours.service.spec.ts:148,163,266,281` all assert the mock not called | yes |
| idempotency and retry | n/a | policy — nothing to verify | n/a |
| authorization | existing — `JwtAuthGuard` + `req.user.id` | `work-hours.controller.ts:19,25,36,...` — guard + `req.user.id` on every route | yes |
| concurrency and ordering | n/a | policy — nothing to verify | n/a |
| data lifecycle | C7 — nullable columns, no backfill | `migration.sql` is pure `ADD COLUMN ... TEXT` nullable | yes |
| external-dependency failure | n/a | policy — nothing to verify | n/a |
| state transitions | n/a — mode derived from stored fields each render | `work-hour-form.tsx:169-171` — `useState(() => hasStoredInterval(workHour) ? "interval" : "duration")`, no persisted mode field on `WorkHour` | yes |
| observability | n/a | policy — nothing to verify | n/a |

## Observation (does not change the verdict)

C11's check text ("only startTime (or only endTime) changed") and the underlying plan AC 12 both
name two symmetric branches, but the check's own `Proof:` line and `checks.md`'s Coverage section
("No other check claims more than the single case its proof exercises") explicitly narrow C11 to
the `startTime`-only branch. The code path is symmetric
(`work-hour-form.tsx:249-251` — `if (dirtyFields.startTime) ...; if (dirtyFields.endTime) ...`),
and `checks.md` — the frozen, human-reviewed contract — pre-declares the narrower scope rather than
silently under-proving it, so this is not treated as a coverage gap. Flagged for visibility only;
Step 1 (which would judge this against the plan as a binding source) is `ui`-only and does not run
under `light`.

## Gate

`cd apps/backend && npx jest work-hours/dto/create-work-hour.dto.spec.ts work-hours/dto/update-work-hour.dto.spec.ts work-hours/work-hours.service.spec.ts --verbose` — 24 passed, 0 failed
`pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci --verbose` — 25 passed, 0 failed
