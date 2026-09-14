# Edição de Work Hour — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Spec**: `.specs/features/work-hour-edit/spec.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase sampling (`work-hours.service.spec.ts`, `work-session-finish-form.test.tsx`, `work-hours/__tests__/page.test.tsx`, `form-translations.test.tsx`) and the spec's ACs. Guidelines found: none dedicated to testing depth in `CLAUDE.md`/`AGENTS.md` — strong default applied, floored by each layer's existing test depth in this repo.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend service (`work-hours.service.ts`) | unit | 1:1 to WHE-05; happy path + both edge cases (invoiced, canceled-only-invoice, no invoice) | `apps/backend/src/work-hours/work-hours.service.spec.ts` | `cd apps/backend && pnpm test -- work-hours.service.spec.ts` |
| Backend DTO (`update-work-hour.dto.ts`) | unit | 1:1 to WHE-06/WHE-07: bounds + decimal places on `hours`, `date` transform | `apps/backend/src/work-hours/dto/update-work-hour.dto.spec.ts` (new) | `cd apps/backend && pnpm test -- update-work-hour.dto.spec.ts` |
| Frontend pure logic (`work-hours-grouping.ts`) | unit | New `isWorkHourInvoiced` helper: 1:1 to WHE-04 AC1/AC2 | `apps/frontend/src/features/time-tracking/components/work-hours-grouping.test.ts` (new) | `cd apps/frontend && pnpm test:ci -- work-hours-grouping` |
| Frontend component (`WorkHoursTable`) | unit (RTL) | WHE-04 AC1/AC2 on the rendered button (disabled + aria-label/title) | `apps/frontend/src/features/time-tracking/components/work-hours-table.test.tsx` (new) | `cd apps/frontend && pnpm test:ci -- work-hours-table` |
| Frontend component (`WorkHourForm`) | unit (RTL) | WHE-01 AC1/AC2/AC4 in edit mode, plus create-mode regression | `apps/frontend/src/features/time-tracking/components/work-hour-form.test.tsx` (new) | `cd apps/frontend && pnpm test:ci -- work-hour-form` |
| Frontend page (`work-hours/page.tsx`) | unit (RTL) | Floor = existing suite; add WHE-01 AC1 wiring case (edit button opens prefilled modal) | `apps/frontend/src/app/[locale]/(authenticated)/work-hours/__tests__/page.test.tsx` (existing, extended) | `cd apps/frontend && pnpm test:ci -- app/\[locale\]/\(authenticated\)/work-hours/__tests__/page.test.tsx` |
| i18n messages (`pt-BR.json`/`en.json`) | none | Static data; new keys are exercised indirectly by the RTL tests above (`next-intl` mocked as `key => key` in most, real messages only in `form-translations.test.tsx` which this feature doesn't need to touch) | — | build gate only |

**Coverage Expectation values** — strong default (no project-wide testing guideline found), floored by existing repo depth per layer:

| Layer type | Applied here |
| --- | --- |
| Domain / service (backend) | All branches touched by this feature; 1:1 to spec ACs |
| DTO / validation | 1:1 to the validation rules being added |
| Pure frontend logic | 1:1 to spec ACs, no framework noise |
| React component (RTL) | Happy path + every listed edge case for this feature's props/behavior |
| Page (thin wrapper) | Extend existing suite with the one new wiring behavior; no new suite created |

## Gate Check Commands

> Generated from `package.json` scripts (root, `apps/backend`, `apps/frontend`) — confirmed against existing CI usage (`test:ci` for frontend, `jest` for backend).

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `cd apps/backend && pnpm test -- <file>` (backend) or `cd apps/frontend && pnpm test:ci -- <pattern>` (frontend) — see per-task Run Command above |
| Full | After tasks with e2e/integration tests | N/A for this feature — no e2e/integration task is planned |
| Build | After phase completion or config/no-test tasks | Backend: `cd apps/backend && pnpm build && pnpm lint && pnpm test` — Frontend: `cd apps/frontend && pnpm build && pnpm lint && pnpm test:ci` |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, tasks within a phase run in order.

### Phase 1: Backend

```
T1 → T2
```

### Phase 2: Frontend Foundation

```
T3 → T4
```

### Phase 3: Frontend UI

```
T5 → T6 → T7
```

---

## Task Breakdown

### T1: Align `UpdateWorkHourDto` validation with `CreateWorkHourDto`

**What**: Add the same `hours`/`date` validation rules the create DTO already has (bounds + decimal places + date transform), without adding `projectId` (out of scope per spec).
**Where**: `apps/backend/src/work-hours/dto/update-work-hour.dto.ts`
**Depends on**: None
**Reuses**: `apps/backend/src/work-hours/dto/create-work-hour.dto.ts` (same decorators)
**Requirement**: WHE-06, WHE-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `hours` keeps `@IsOptional()` and gains `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0.1)`, `@Max(24)` (same messages as create)
- [ ] `date` keeps `@IsOptional()`/`@IsDate()` and gains `@Transform(({ value }) => new Date(value))`
- [ ] `projectId` is NOT added to this DTO (out of scope)
- [ ] Gate check passes: `cd apps/backend && pnpm test -- update-work-hour.dto.spec.ts`
- [ ] Test count: 5 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `fix(work-hours): align update DTO validation with create DTO`

---

### T2: Block updating an already-invoiced work hour

**What**: `WorkHoursService.update` rejects the update (400) when the work hour is linked to at least one non-canceled invoice.
**Where**: `apps/backend/src/work-hours/work-hours.service.ts` (modify `update`), `apps/backend/src/work-hours/work-hours.service.spec.ts` (new `describe('update()')`)
**Depends on**: T1
**Reuses**: The same "non-canceled invoice" condition already used in `findAvailable`
**Requirement**: WHE-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] The initial `findFirst` in `update()` includes `invoiceWorkHours` with `invoice.status`
- [ ] If any `invoiceWorkHours[].invoice.status` is `PENDING` or `PAID`, `update()` throws `BadRequestException` before calling `prisma.workHour.update`
- [ ] If `invoiceWorkHours` is empty or every linked invoice is `CANCELED`, `update()` proceeds as before
- [ ] New tests in `work-hours.service.spec.ts`: (a) throws when linked to a `PENDING` invoice, (b) throws when linked to a `PAID` invoice, (c) proceeds when linked only to a `CANCELED` invoice, (d) proceeds when not linked to any invoice
- [ ] Gate check passes: `cd apps/backend && pnpm build && pnpm lint && pnpm test` (last task of Phase 1 → build gate)
- [ ] Test count: 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `fix(work-hours): block editing a work hour already tied to a non-canceled invoice`

---

### T3: Add `isWorkHourInvoiced` helper and extend `WorkHourRow`

**What**: Extend `WorkHourRow` with an optional `invoiceWorkHours` field and export a pure `isWorkHourInvoiced(row)` helper.
**Where**: `apps/frontend/src/features/time-tracking/components/work-hours-grouping.ts`, `apps/frontend/src/features/time-tracking/components/work-hours-grouping.test.ts` (new)
**Depends on**: None
**Reuses**: The `invoiceWorkHours` shape already present on `TimeEntry` (`apps/frontend/src/types/entities.ts`)
**Requirement**: WHE-04 (AC1, AC2 — logic only, UI wiring is T5)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `WorkHourRow` gains `invoiceWorkHours?: { invoice: { id: string; status: string } }[]`
- [ ] `isWorkHourInvoiced(row: WorkHourRow): boolean` returns `true` when at least one entry's `invoice.status` is not `"CANCELED"`
- [ ] Returns `false` when `invoiceWorkHours` is `undefined`, empty, or every entry's invoice is `"CANCELED"`
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci -- work-hours-grouping`
- [ ] Test count: 3 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(time-tracking): add isWorkHourInvoiced helper for invoiced-entry detection`

---

### T4: Add edit-mode translation keys

**What**: Add the new `workHours` translation keys needed by T5/T6 to both locales.
**Where**: `apps/frontend/src/messages/pt-BR.json`, `apps/frontend/src/messages/en.json`
**Depends on**: None
**Reuses**: Existing `workHours` namespace structure/style (see `addHoursFormSubtitle`, `saveWorkHour`)
**Requirement**: Supports WHE-01, WHE-04 (no dedicated requirement ID — enabling data for UI tasks)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `workHours.editWorkHourTitle`, `workHours.editHoursFormSubtitle`, `workHours.saveChanges`, `workHours.cannotEditInvoiced` added to `pt-BR.json`
- [ ] Same four keys added to `en.json` with matching meaning (not literal translations of each other, matching the file's existing tone)
- [ ] Both JSON files remain valid JSON (parse without error)
- [ ] Gate check passes: `cd apps/frontend && pnpm build && pnpm lint && pnpm test:ci` (last task of Phase 2 → build gate; no dedicated test for this task per the coverage matrix)

**Tests**: none
**Gate**: build

**Commit**: `feat(work-hours): add i18n keys for work hour edit mode`

---

### T5: Disable the edit button for already-invoiced work hours

**What**: `WorkHoursTable`'s "Editar" button is disabled (with explanatory `title`/`aria-label`) for rows where `isWorkHourInvoiced` is true.
**Where**: `apps/frontend/src/features/time-tracking/components/work-hours-table.tsx`, `apps/frontend/src/features/time-tracking/components/work-hours-table.test.tsx` (new)
**Depends on**: T3, T4
**Reuses**: `isWorkHourInvoiced` from T3, existing edit `Button` markup
**Requirement**: WHE-04 (AC1, AC2)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] The "Editar" `Button` for a row gets `disabled` when `isWorkHourInvoiced(workHour)` is `true`
- [ ] When disabled, `aria-label` and `title` are set to `t("cannotEditInvoiced")`; when enabled, they keep the current `` `${t("edit")} ${t("workHour")}` `` label
- [ ] Clicking the disabled button does NOT call `onEdit`
- [ ] Clicking the enabled button still calls `onEdit(workHour.id)` (regression)
- [ ] New tests in `work-hours-table.test.tsx`: (a) enabled + calls `onEdit` when no `invoiceWorkHours`, (b) disabled when linked to a `PENDING` invoice, (c) enabled when linked only to a `CANCELED` invoice, (d) `onEdit` not called when clicking the disabled button
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci -- work-hours-table`
- [ ] Test count: 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(time-tracking): disable edit action for already-invoiced work hours`

---

### T6: Add edit mode to `WorkHourForm`

**What**: `WorkHourForm` accepts an optional `workHour` prop; when present, it hides client/project fields, prefills `date`/`hours`/`description`, validates only those three fields, and submits via update instead of create.
**Where**: `apps/frontend/src/features/time-tracking/components/work-hour-form.tsx`, `apps/frontend/src/features/time-tracking/components/work-hour-form.test.tsx` (new)
**Depends on**: T4
**Reuses**: `useUpdateTimeEntry` (`../time-entries`, already implemented), existing `formatHHmm` mask, existing create-mode markup/validation
**Requirement**: WHE-01 (AC1, AC2, AC4)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] New optional prop `workHour: { id: string; date: string; hours: number; description?: string } | null` (or `undefined`); `isEditMode = !!workHour`
- [ ] In edit mode, the Client and Project form sections are not rendered
- [ ] In edit mode, `date`/`hours` (formatted `HH:mm`)/`description` default values come from `workHour`
- [ ] In edit mode, zod validates only `date`/`hours`/`description` (same `hours` regex `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$` as create); submitting an invalid `hours` value blocks submit client-side with the existing error message
- [ ] On submit in edit mode, calls `useUpdateTimeEntry().mutateAsync({ id: workHour.id, data: { date, hours: decimalHours, description } })` — no `clientId`/`projectId` in the payload — instead of `useCreateTimeEntry`
- [ ] Submit button label is `t("saveChanges")` in edit mode
- [ ] On success: same toast (`savedSuccessfully`) and `onSuccess?.()` call as create mode; on failure: same toast (`errorSaving`) as create mode
- [ ] Create mode (no `workHour` prop) behaves exactly as before (regression)
- [ ] New tests in `work-hour-form.test.tsx`: (a) create mode still renders client/project fields and calls create mutation (regression), (b) edit mode does not render client/project fields, (c) edit mode prefills date/hours/description from `workHour`, (d) edit mode submit calls the update mutation with the correct `{id, data}` payload, (e) edit mode blocks submit on invalid `hours` format
- [ ] Gate check passes: `cd apps/frontend && pnpm test:ci -- work-hour-form`
- [ ] Test count: 5 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(time-tracking): add edit mode to WorkHourForm`

---

### T7: Wire up `handleEdit` in the Work Hours page

**What**: `work-hours/page.tsx`'s `handleEdit` opens a prefilled edit modal (using T6's edit mode) instead of the `console.log` `TODO`.
**Where**: `apps/frontend/src/app/[locale]/(authenticated)/work-hours/page.tsx`, `apps/frontend/src/app/[locale]/(authenticated)/work-hours/__tests__/page.test.tsx` (modify)
**Depends on**: T5, T6
**Reuses**: Existing `FormModal`, existing `WorkHoursTable`'s `onEdit` prop (unchanged contract)
**Requirement**: WHE-01 (AC1, AC2, AC3)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] New state `editingWorkHour` (the found entry or `null`); `handleEdit(id)` looks it up in the already-loaded `workHours` list and sets it
- [ ] A second `FormModal` instance (or the existing one reused, whichever keeps the diff smaller) renders `<WorkHourForm workHour={editingWorkHour} clients={clients} onSuccess={...} />` only when `editingWorkHour` is set, with title `t("editWorkHourTitle")` / description `t("editHoursFormSubtitle")`
- [ ] On successful edit (`onSuccess`), the edit modal closes and `editingWorkHour` resets to `null`
- [ ] `WorkHoursTable` still receives `onEdit={handleEdit}` — no prop contract change
- [ ] `page.test.tsx` mock for `WorkHoursTable` gains an edit button (`aria-label="edit work hour"`) calling `onEdit(workHour.id)`
- [ ] New test in `page.test.tsx`: clicking the edit button opens the edit modal with the correct work hour passed to `WorkHourForm`
- [ ] All pre-existing tests in `page.test.tsx` still pass unmodified in intent (mock signature changes only as needed to add the edit button)
- [ ] Gate check passes: `cd apps/frontend && pnpm build && pnpm lint && pnpm test:ci` (last task of Phase 3 and of the feature → build gate)
- [ ] Test count: at least 1 new test passes, all pre-existing `page.test.tsx` tests still pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `feat(work-hours): wire up edit action to open a prefilled edit form`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4
Phase 3:  T5 ──→ T6 ──→ T7
```

Execution is strictly sequential — 7 tasks total, fits a single batch (≤ ~8). No sub-agent delegation offer needed; executing inline.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Align UpdateWorkHourDto validation | 1 file (DTO) | ✅ Granular |
| T2: Block updating invoiced work hour | 1 function (service method) | ✅ Granular |
| T3: Add isWorkHourInvoiced helper | 1 function + 1 type extension, same file | ✅ Granular |
| T4: Add edit-mode translation keys | 2 JSON files, same keys | ✅ Granular |
| T5: Disable edit button for invoiced rows | 1 component | ✅ Granular |
| T6: Add edit mode to WorkHourForm | 1 component | ✅ Granular |
| T7: Wire up handleEdit in the page | 1 page + its co-located test | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | (start of Phase 2) | ✅ Match |
| T4 | None | T3 → T4 | ✅ Match (T4 does not need T3's code, but Phase 2 runs T3 then T4 in order per the sequential-execution rule; no code dependency implied beyond ordering) |
| T5 | T3, T4 | T5 at start of Phase 3, after Phase 2 | ✅ Match |
| T6 | T4 | T5 → T6 | ✅ Match |
| T7 | T5, T6 | T6 → T7 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Align UpdateWorkHourDto validation | Backend DTO | unit | unit | ✅ OK |
| T2: Block updating invoiced work hour | Backend service | unit | unit | ✅ OK |
| T3: Add isWorkHourInvoiced helper | Frontend pure logic | unit | unit | ✅ OK |
| T4: Add edit-mode translation keys | i18n messages | none | none | ✅ OK |
| T5: Disable edit button for invoiced rows | Frontend component (WorkHoursTable) | unit (RTL) | unit | ✅ OK |
| T6: Add edit mode to WorkHourForm | Frontend component (WorkHourForm) | unit (RTL) | unit | ✅ OK |
| T7: Wire up handleEdit in the page | Frontend page | unit (RTL) | unit | ✅ OK |

No violations — every task's `Tests` field matches its layer's Coverage Matrix requirement.

---

## Tools note

No project MCP or skill beyond `tlc-spec-driven` itself is needed for these tasks — plain file edits, `class-validator`/Prisma (backend), React/RTL/zod (frontend). Confirmed with the user before execution (see chat).
