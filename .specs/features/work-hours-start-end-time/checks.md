# Work Hours - Start/End Time Entry checks

Profile: light
Plan: `.specs/features/work-hours-start-end-time/plan.md`

## Intent

18 checks in 5 slices · 2 one-way doors · 0 open, of which 0 block

## Checks

### S1 - Selecionar o modo de lançamento · 2 files · 23 KB · ~6k

**C1** - Create mode renders the entry-mode selector ("Duração" / "Hora inicial e hora final") defaulted to "Duração" (WH-01, AC 1, 2)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "create mode: renders the entry-mode selector defaulted to Duração"`

**C2** - "Duração" selected shows only the single `HH:mm` duration input, interval inputs hidden (WH-01, AC 3)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "entry mode: Duração shows only the duration input"`

**C3** - "Hora inicial e hora final" selected shows the two `HH:mm` inputs, duration input hidden (WH-01, AC 4)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "entry mode: Hora inicial e hora final shows startTime\/endTime inputs"`

**C4** - "Duração" selected + submit omits `startTime`/`endTime` from the request body (WH-01, AC 5)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "create mode: Duração mode submits without startTime\/endTime"`

### S2 - Lançar por hora inicial e hora final · 8 files · 44 KB · ~11k

**C5** - Interval mode with `endTime` strictly after `startTime` submits `hours` computed as the decimal difference plus both raw `HH:mm` strings (WH-02, AC 6)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "create mode: interval entry computes hours and sends startTime\/endTime"`

**C6** - `endTime` not strictly after `startTime` blocks submission, shows the `endTimeBeforeStart` message under "Hora final", and `mutateAsync` is not called (WH-02, AC 7)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "create mode: endTime not after startTime blocks submit"`

**C7** - A `WorkHour` created via `WorkHoursService.create` persists `startTime`/`endTime` when given, and `null` for both when only `hours` is given - table-driven over both members (WH-02, AC 8)
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "persists startTime and endTime when provided"`
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "persists null startTime and endTime when only hours is provided"`

### S3 - Editar um lançamento existente · 9 files · 45 KB · ~11k

**C8** - Editing a `WorkHour` with non-null `startTime`/`endTime` opens with the selector pre-set to "Hora inicial e hora final" and both fields pre-filled (WH-03, AC 1 edit-half, AC 9)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "edit mode: interval workHour pre-selects Hora inicial e hora final"`

**C9** - Editing a `WorkHour` with null `startTime`/`endTime` opens with the selector pre-set to "Duração", single-input behaviour unchanged (WH-03, AC 1 edit-half, AC 10)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "edit mode: duration workHour pre-selects Duração"`

**C10** - An invoiced `WorkHour` renders the mode selector and both new inputs disabled, same as the existing duration field (WH-03, AC 11)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "edit mode: invoiced work hour disables the entry-mode selector and interval inputs"`

**C11** - Interval mode in edit, only `startTime` (or only `endTime`) changed: the `PATCH` payload includes recomputed `hours` plus only the changed time field (WH-03, AC 12)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "edit mode: changing only startTime resends recomputed hours"`

**C12** - Clicking "Cancelar" after switching mode resets the selector to the mode the `WorkHour` had when the modal opened, alongside the existing field reset (WH-03, AC 13)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "edit mode: Cancel resets the entry-mode selector to the original mode"`

### S4 - Preencher minutos automaticamente com zero · 9 files · 45 KB · ~11k

**C13** - A `HH:mm`-shaped field holding only 1-2 digits with no colon rewrites to `HH:00` on blur/submit, before format validation - table-driven over the 3 fields (duração, hora inicial, hora final) (WH-04, AC 14)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "hour-only entry auto-fills minutes with 00"`

**C14** - A field already containing a colon (e.g. `"8:3"`) is left unmodified by the auto-fill rule (WH-04, AC 15)
Proof: `pnpm --filter frontend exec jest src/features/time-tracking/components/work-hour-form.test.tsx --ci -t "partial HH:mm entry with a colon is not auto-filled"`

### S5 - Validar hora inicial e hora final no servidor · 12 files · 126 KB · ~32k

**C15** - `startTime`/`endTime` not matching `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$` fails DTO validation on both `CreateWorkHourDto` and `UpdateWorkHourDto`, same error shape as `hours` (WH-05, AC 16)
Proof: `cd apps/backend && npx jest work-hours/dto/create-work-hour.dto.spec.ts -t "rejects a startTime\/endTime not matching HH:mm"`
Proof: `cd apps/backend && npx jest work-hours/dto/update-work-hour.dto.spec.ts -t "rejects a startTime\/endTime not matching HH:mm"`

**C16** - `WorkHoursService.create` throws `BadRequestException` when exactly one of `startTime`/`endTime` is given, and `prisma.workHour.create` is never called (WH-05, AC 17)
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "rejects creation when only one of startTime\/endTime is provided"`

**C17** - `WorkHoursService.update` merges the DTO with the existing row before judging pairing: patching one time field when the other already exists on the row succeeds, patching one when the row has neither throws `BadRequestException` and `prisma.workHour.update` is never called - table-driven over both members (WH-05, AC 18)
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "allows patching a single time field when the row already has both"`
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "rejects patching a single time field when the row has neither"`

**C18** - The effective `startTime`/`endTime` pair - DTO values on create, DTO merged with the existing row on update - is rejected with `BadRequestException` when `endTime` is not strictly after `startTime`, on both `create` and `update` - table-driven over both members (WH-05, AC 19)
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "rejects creation when endTime is not after startTime"`
Proof: `cd apps/backend && npx jest work-hours/work-hours.service.spec.ts -t "rejects an update that makes the merged endTime not after startTime"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| entry-mode selector options (2) | Duração C2 · Hora inicial e hora final C3 | - |
| `startTime`/`endTime` persisted on create (2) | interval mode -> both set C7 · duration mode -> both null C7 | - |
| `PATCH` merged pairing outcomes (2) | existing-both + patch-one -> allowed C17 · existing-neither + patch-one -> 400 C17 | - |
| effective order-check surfaces (2) | create C18 · update (merged) C18 | - |
| `HH:mm`-shaped fields auto-fill (3) | duração C13 · hora inicial C13 · hora final C13 (table-driven, one proof) | - |
| `POST /work-hours` new failure status | 400 C15, C16, C18 (create portion) | - |
| `PATCH /work-hours/:id` new failure status | 400 C15, C17, C18 (update portion) | - |

- Claims naming a status code or persisted field: C7, C15, C16, C17, C18 - each has a proof that asserts the mock call arguments or the thrown exception directly, not a path that merely traverses the code
- No other check claims more than the single case its proof exercises
- `POST /work-hours` `201`, `PATCH /work-hours/:id` `200`/`404`: unaffected by this feature - the Nest defaults and the existing not-found path are untouched, so they carry no new obligation here

## Swept

- validation: C6, C15, C16, C17, C18
- failure modes: C6, C16, C17, C18 - `BadRequestException` before any `prisma.workHour.create`/`update` call
- idempotency and retry: n/a - `create`/`update` are already not idempotent; unchanged by this feature
- authorization: existing - `JwtAuthGuard` + `req.user.id` ownership in `WorkHoursService`, unaffected by the new fields
- concurrency and ordering: n/a - no new concurrent-edit scenario; the existing invoiced-lock race is untouched by this feature
- data lifecycle: C7 - nullable columns added to a populated table, existing rows read back as `null`, no backfill
- external-dependency failure: n/a - no external dependency involved
- state transitions: n/a - the displayed mode is derived from stored `startTime`/`endTime` on each render (C8, C9), not a persisted state machine
- observability: n/a - not requested; no new logging or metric in this feature

## Handoff

Intended split, with the arithmetic:

- S1-S5 = ~129 KB across 12 files (schema.prisma, 2 DTOs + 2 new/existing DTO specs, service.ts +
  service.spec.ts, 1 new migration file, work-hour-form.tsx + its test file, en.json + pt-BR.json)
  ≈ 32k tokens, all in one feature area (`work-hours` backend module + `WorkHourForm`) -> well
  under the 150k budget, single builder, no handoff.
