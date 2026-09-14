# Work hours - row click opens modal, per-field edit Verification

**Verdict**: PASS
**Profile**: light
**Diff range**: 5e29a27..HEAD
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Profile-floor skips (light)

- **Step 1 (binding sources)**: skipped. The checklist's `Sources` section names only
  `.tasks/work-hours-row-click-edit.md` (explicitly not binding per the task doc's own text -
  "there is no design/contract source in this feature") and "conversation". No binding
  design/contract exists to open and compare against.
- **Coverage-join recompute** (part of step 3): skipped - `standard`/`ui` only.
- **Test-policy row judgment** (part of step 3): skipped - the checklist carries no `## Test
  policy` section (confirmed by reading the full checklist file).
- **Step 4 (fault injection)**: skipped - `standard`/`ui` only.

Everything else in step 2 and step 3 ran in full.

## Checks

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | Click on row (outside action cells) calls same callback as edit, with the work hour id | `work-hours-table.test.tsx -t "opens the row's modal when a non-invoiced row is clicked outside the action cell"` exit 0 | `work-hours-table.test.tsx:39-40` - `fireEvent.click(screen.getByTestId("work-hour-row")); expect(onEdit).toHaveBeenCalledWith("wh-1")` | PASS |
| C2 | Edit icon button no longer rendered in the actions cell | `-t "does not render an edit icon button"` exit 0 | `work-hours-table.test.tsx:54-56` - `expect(screen.queryByRole("button", { name: "edit workHour" })).not.toBeInTheDocument()` | PASS |
| C3 | Delete button click does not open the modal (no propagation to `TableRow`) | `-t "does not trigger the row's onEdit when the delete button is clicked"` exit 0 | `work-hours-table.test.tsx:74-75` - `fireEvent.click(screen.getByTestId("delete-button")); expect(onEdit).not.toHaveBeenCalled()` | PASS |
| C4 | `TableRow` has `role="button"`/`tabIndex={0}`; Enter/Space call the same callback as click | `-t "opens the row's modal when Enter or Space is pressed on a focused row"` exit 0 | `work-hours-table.test.tsx:91-99` - attribute checks + `fireEvent.keyDown(row,{key:"Enter"})`/`{key:" "}` each followed by `expect(onEdit).toHaveBeenCalledWith("wh-1")` | PASS |
| C5 | Edit mode opens in view mode: `field-*-view` testids, no editable inputs, no Salvar button | `work-hour-form.test.tsx -t "edit mode: opens in view mode with no editable inputs and no save button"` exit 0 | `work-hour-form.test.tsx:168-183` - view-testid text-content checks + `queryByTestId("date-picker")`/`queryByPlaceholderText("HH:mm")`/`queryByPlaceholderText("descriptionPlaceholder")`/`queryByRole("button",{name:"saveChanges"})` all `.not.toBeInTheDocument()` | PASS |
| C6 | Clicking `field-date-view` reveals `date-picker` + Salvar button | `-t "edit mode: clicking the date field reveals the date picker and the save button"` exit 0 | `work-hour-form.test.tsx:193-196` - `expect(screen.getByTestId("date-picker")).toHaveValue("2026-01-05")` + `getByRole("button",{name:"saveChanges"})` present | PASS |
| C7 | Clicking `field-hours-view` reveals `HH:mm` input + Salvar button | `-t "edit mode: clicking the hours field reveals the HH:mm input and the save button"` exit 0 | `work-hour-form.test.tsx:206-209` - `getByPlaceholderText("HH:mm")).toHaveValue("01:30")` + Salvar button present | PASS |
| C8 | Opening a second field keeps the first open and shows exactly one Salvar button | `-t "edit mode: editing a second field keeps the first editable and shows exactly one save button"` exit 0 | `work-hour-form.test.tsx:220-226` - both inputs present + `getAllByRole("button",{name:"saveChanges"})).toHaveLength(1)` | PASS |
| C9 | Invoiced work hour: fields stay read-only, fixed `cannotEditInvoiced` text shown | `-t "edit mode: invoiced work hour keeps every field read-only and shows the cannotEditInvoiced notice"` exit 0 | `work-hour-form.test.tsx:237-250` - `getByText("cannotEditInvoiced")` present; after clicking all three views, no `date-picker`/`HH:mm`/`descriptionPlaceholder`/Salvar button appear | PASS |
| C10 | Salvar calls `useUpdateTimeEntry` once, `PATCH` payload has only changed fields | `-t "edit mode: save sends only the field that was changed"` and `-t "edit mode: a field opened for editing but left unchanged is not sent"` both exit 0 | `work-hour-form.test.tsx:267-272` - `expect(mockUpdateMutateAsync).toHaveBeenCalledWith({id:"wh-1",data:{hours:2}})`; `work-hour-form.test.tsx:293-298` - same call shape after opening (but not changing) `date` too, still `data:{hours:2}` | PASS* (see gap below) |
| C11 | While `isPending`, Salvar button disabled and shows spinner | `-t "edit mode: save button is disabled and shows the spinner while pending"` exit 0 | `work-hour-form.test.tsx:315` - `expect(screen.getByRole("button",{name:/saving/})).toBeDisabled()` | PASS |
| C12 | On success, opened fields return to view mode with updated values, Salvar disappears | `-t "edit mode: fields return to view mode with updated values after a successful save"` exit 0 | `work-hour-form.test.tsx:331-339` - `field-hours-view` shows `"02:00"`, `HH:mm` input and Salvar button gone | PASS |
| C13 | On error, changed fields stay editable with typed values, existing Alert shows the message | `-t "edit mode: a failed save keeps the field editable with the typed value and shows the error alert"` exit 0 | `work-hour-form.test.tsx:363-364` - `expect(screen.getByPlaceholderText("HH:mm")).toHaveValue("02:00")` + `getByText("errorSaving")` present | PASS |
| C14 | While no field is being edited, no Salvar button is shown (same proof as C5) | same run as C5 | `work-hour-form.test.tsx:181-183` | PASS |
| C15 | Unsaved edits discarded on modal close/reopen (remount with original `workHour`) | `-t "edit mode: unsaved changes are discarded when the form is remounted with the original workHour"` exit 0 | `work-hour-form.test.tsx:392-405` - types `"09:00"`, `unmount()`, remounts with same `editableWorkHour`, `expect(screen.getByTestId("field-hours-view")).toHaveTextContent("01:30")` | PASS |

*C10 gap: the checklist claim says the mutation is called "uma única vez" (a single time), but
neither cited assertion uses `toHaveBeenCalledTimes(1)` - both only check `toHaveBeenCalledWith(...)`,
which does not fail if the mock were called more than once as long as one call matches. The payload
half of the claim (only changed fields sent) is precisely asserted; the call-count half is not
directly asserted anywhere in the test. Not a blocking finding (the test only triggers one click, so
nothing contradicts the claim), but it is a real assertion gap against the checklist's own wording.

## Swept rows checked (resolve to "existing")

| Row | Constraint cited | Verified in code |
|---|---|---|
| validation | `editWorkHourFormSchema` (zod, client) and `UpdateWorkHourDto` (class-validator, server) unchanged | `work-hour-form.tsx:63-69` schema untouched by the diff (no hunk touches it); `apps/backend/src/work-hours/dto/update-work-hour.dto.ts:12-34` - `date?`, `description?`, `hours?`, `clientId?` only, no `projectId` (matches the checklist's Out-of-scope claim too); `git diff --stat 5e29a27..HEAD -- apps/backend` is empty, confirming the backend is untouched |
| authorization | `WorkHoursService.update` still validates `req.user.id` and blocks invoiced (400), independent of client-side check | `apps/backend/src/work-hours/work-hours.service.ts:189-198` - `prisma.workHour.findFirst({ where: { id, userId } })` (ownership scoping) then `:213-221` - `isInvoiced` computed from `invoice.status !== 'CANCELED'` and `throw new BadRequestException(...)` when true. Frontend's `isWorkHourInvoiced` (`work-hours-grouping.ts:27-31`) uses the identical `status !== "CANCELED"` predicate, so the client-side C9 gate mirrors the server's real rule rather than diverging from it |

All other Swept rows resolve to `not in scope`/pointers at other checks (C6-C8, C12, C13, C15), which
the protocol treats as policy already approved - nothing in the code for them to be wrong about, so
not re-checked here.

## Coverage / Test policy

- `Coverage` join: not recomputed (profile floor, `light`).
- `## Test policy`: absent from the checklist, confirmed by reading the full file - nothing to judge.

## Faults injected

Skipped (profile floor, `light` - fault injection is `standard`/`ui` only).

## Gate

```
cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx \
  -t "opens the row's modal when a non-invoiced row is clicked outside the action cell|does not render an edit icon button|does not trigger the row's onEdit when the delete button is clicked|opens the row's modal when Enter or Space is pressed on a focused row"
# Tests: 4 passed, 4 total

cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx \
  -t "opens in view mode with no editable inputs and no save button|clicking the date field reveals the date picker and the save button|clicking the hours field reveals the HH:mm input and the save button|editing a second field keeps the first editable and shows exactly one save button|invoiced work hour keeps every field read-only and shows the cannotEditInvoiced notice|save sends only the field that was changed|a field opened for editing but left unchanged is not sent|save button is disabled and shows the spinner while pending|fields return to view mode with updated values after a successful save|a failed save keeps the field editable with the typed value and shows the error alert|unsaved changes are discarded when the form is remounted with the original workHour"
# Tests: 11 passed, 11 total (3 unrelated tests in the same file correctly skipped by the -t filter)
```

All 13 unique named tests (C10 and C14/C5 each reuse one proof, for 15 checks total) individually
show `✓` and passed at `HEAD` (`5af6194`).
