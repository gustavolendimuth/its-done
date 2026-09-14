# Work hours - row click opens modal, always-editable inputs Verification

**Verdict**: PASS (3 non-blocking gaps - see below)
**Profile**: light
**Diff range (this round's fix)**: 9d58554..HEAD
**Diff range (full feature, context only)**: 5e29a27..HEAD
**Round**: 2 - scoped
**Verifier**: independent sub-agent (author != verifier)
**HEAD**: f2e4eab (previous Round 1 HEAD: 5af6194)

## What changed since Round 1

Round 1 (5af6194) verified a view-per-field/edit-per-field design (checks C5-C9, C14) PASS
15/15. The user disliked that UX after seeing it built; the checklist and task doc were revised
(see the "Revisão" notes at the top of `.checks/work-hours-row-click-edit.md` and
`.tasks/work-hours-row-click-edit.md`) to always-editable inputs + a "Cancelar" button. C5-C9 and
C14 were replaced by new C5, C6, C7; C10-C13 and C15 kept the same underlying claim (wording
adjusted only - no more "view mode" language). Commit 9d58554 (already at Round 1's HEAD lineage)
tightened C10/C11 assertions; commit `f2e4eab` (`fix(work-hours): revert edit modal to
always-editable inputs + Cancel`) is the actual revision diff for this round, touching
`work-hour-form.tsx`, `work-hour-form.test.tsx`, and `page.tsx`.

The checklist now has 12 checks total (C1-C7, C10-C13, C15).

## Profile-floor skips (light, unchanged from Round 1)

- **Step 1 (binding sources)**: skipped, `carried from 5af6194`. No binding design/contract
  exists in this feature (checklist's `Sources` names only the task doc and "conversation");
  re-checked that the current `Sources`/task doc still make no binding-source claim - confirmed,
  still none.
- **Coverage-join recompute**: skipped - `standard`/`ui` only.
- **Test-policy row judgment**: skipped - checklist carries no `## Test policy` section
  (confirmed by reading the current full checklist file).
- **Step 4 (fault injection)**: skipped - `standard`/`ui` only.

## Checks

| Check | Claim | Proof run | Evidence | Result | Status |
|---|---|---|---|---|---|
| C1 | Click on row (outside action cells) calls same callback as edit, with the work hour id | `work-hours-table.test.tsx -t "opens the row's modal when a non-invoiced row is clicked outside the action cell"` exit 0 | `work-hours-table.test.tsx:39-40` - `fireEvent.click(screen.getByTestId("work-hour-row")); expect(onEdit).toHaveBeenCalledWith("wh-1")` | PASS | verified at f2e4eab |
| C2 | Edit icon button no longer rendered in the actions cell | `-t "does not render an edit icon button"` exit 0 | `work-hours-table.test.tsx:54-56` - `expect(screen.queryByRole("button", { name: "edit workHour" })).not.toBeInTheDocument()` | PASS | verified at f2e4eab |
| C3 | Delete button click does not open the modal (no propagation to `TableRow`) | `-t "does not trigger the row's onEdit when the delete button is clicked"` exit 0 | `work-hours-table.test.tsx:74-75` - `fireEvent.click(screen.getByTestId("delete-button")); expect(onEdit).not.toHaveBeenCalled()` | PASS | verified at f2e4eab |
| C4 | `TableRow` has `role="button"`/`tabIndex={0}`; Enter/Space call the same callback as click | `-t "opens the row's modal when Enter or Space is pressed on a focused row"` exit 0 | `work-hours-table.test.tsx:90-93` - attribute checks + `fireEvent.keyDown` for Enter/Space each followed by `expect(onEdit).toHaveBeenCalledWith("wh-1")` | PASS | verified at f2e4eab |
| C5 | Edit mode: `date`/`hours`/`description` render as always-editable, prefilled inputs; "Salvar" and "Cancelar" visible from opening | `work-hour-form.test.tsx -t "edit mode: renders always-editable inputs prefilled from workHour, with Save and Cancel always visible"` exit 0 | `work-hour-form.test.tsx:168-177` - `getByTestId("date-picker")).toHaveValue("2026-01-05")`, `getByPlaceholderText("HH:mm")).toHaveValue("01:30")`, `getByDisplayValue("Existing work")`, `getByRole("button",{name:"saveChanges"})`, `getByRole("button",{name:"cancel"})` all present | PASS | verified at f2e4eab |
| C6 | Invoiced: `date`/`hours`/`description` and "Salvar" disabled, fixed `cannotEditInvoiced` text shown | `-t "edit mode: invoiced work hour disables every field and the save button, and shows the cannotEditInvoiced notice"` exit 0 | `work-hour-form.test.tsx:209-214` - `getByText("cannotEditInvoiced")`, `getByPlaceholderText("HH:mm")).toBeDisabled()`, `getByDisplayValue("Existing work")).toBeDisabled()`, `getByRole("button",{name:"saveChanges"})).toBeDisabled()` | PASS* (gap) | verified at f2e4eab |
| C7 | Clicking "Cancelar" reverts fields to last-saved value (or original, if nothing saved yet) and calls `onCancel` | `-t "edit mode: clicking Cancel discards the typed changes and calls onCancel"` exit 0 | `work-hour-form.test.tsx:190-198` - types "09:00", clicks cancel, `getByPlaceholderText("HH:mm")).toHaveValue("01:30")`, `onCancel).toHaveBeenCalledTimes(1)` | PASS* (gap) | verified at f2e4eab |
| C10 | Salvar calls `useUpdateTimeEntry` once, `PATCH` payload has only changed fields | `-t "edit mode: save sends only the field that was changed"` exit 0 | `work-hour-form.test.tsx:230-236` - `expect(mockUpdateMutateAsync).toHaveBeenCalledWith({id:"wh-1",data:{hours:2}})` + `expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1)` | PASS | verified at f2e4eab |
| C11 | While `isPending`, Salvar disabled and shows spinner | `-t "edit mode: save button is disabled and shows the spinner while pending"` exit 0 | `work-hour-form.test.tsx:252-253` - `getByRole("button",{name:/saving/})).toBeDisabled()` + `getByTestId("save-spinner")` present | PASS | verified at f2e4eab |
| C12 | On success, inputs keep new values, success `Alert` appears, modal remains open (does not close by itself) | `-t "edit mode: a successful save keeps the new value in the input and shows the success alert"` exit 0 | `work-hour-form.test.tsx:276-277` - `getByPlaceholderText("HH:mm")).toHaveValue("02:00")` + `getByText("savedSuccessfully")` present | PASS* (gap) | verified at f2e4eab |
| C13 | On error, typed values stay, existing error `Alert` shows the message | `-t "edit mode: a failed save keeps the typed value and shows the error alert"` exit 0 | `work-hour-form.test.tsx:300-301` - `getByPlaceholderText("HH:mm")).toHaveValue("02:00")` + `getByText("errorSaving")` present | PASS | verified at f2e4eab |
| C15 | Unsaved edits discarded on modal close/reopen (remount with original `workHour`) | `-t "edit mode: unsaved changes are discarded when the form is remounted with the original workHour"` exit 0 | `work-hour-form.test.tsx:328-340` - types "09:00", `unmount()`, remounts with same `editableWorkHour`, `getByPlaceholderText("HH:mm")).toHaveValue("01:30")` | PASS | verified at f2e4eab |

All 12 named tests ran individually via `rg -n` lookup (test text exists at the cited lines) and
via actual jest execution (see Gate below) - none matched via `passWithNoTests`.

### Gaps found this round (non-blocking, but real)

1. **C6 - date field's disabled state is unproven.** The claim names `date`, `hours` and
   `description` as all becoming disabled when invoiced. The code only gives `hours`
   (`Input`) and `description` (`Textarea`) an actual `disabled={fieldsDisabled}` prop
   (`work-hour-form.tsx:304`, `:325`); the date field is instead wrapped in a plain `<div
   className={fieldsDisabled ? "pointer-events-none opacity-70" : undefined}>`
   (`work-hour-form.tsx:206-210`) around `DatePickerComponent`, which itself never receives a
   `disabled` prop. The C6 test (`work-hour-form.test.tsx:201-215`) asserts `hours`, `description`
   and the Salvar button are disabled, but never touches `date-picker` at all. So the "date"
   third of the claim has zero located assertion, and the underlying implementation for that
   field is CSS-only (not an actual `disabled` state), which the test never checks either way.
2. **C7 - only the "nothing saved yet" branch is tested.** The claim has two branches: revert to
   last-saved value, or to the original if no save has happened. The only Cancel test
   (`work-hour-form.test.tsx:180-199`) types a new value and cancels without ever saving first,
   so only the "reverts to original" branch is exercised. No test types a value, saves
   successfully, types a second value, then cancels to check it reverts to the *saved* value
   rather than the very first original. (The implementation's `handleCancel` calls bare `reset()`,
   which relies on `reset(formData)` inside `onSubmit`'s success path (`work-hour-form.tsx:152`)
   having re-baselined react-hook-form's defaults - structurally plausible, but unproven.)
3. **C12 - "modal remains open" has no test anywhere.** `work-hour-form.test.tsx` cannot assert
   this: `WorkHourForm` does not own the modal (`FormModal`/`Dialog` lives in `page.tsx`). Checked
   `page.test.tsx` for coverage (`rg -n "editingWorkHour|onSuccess|does not close|stays open"` -
   no hits); `page.test.tsx` mocks `WorkHourForm` entirely (noted in the checklist's own C15 nota
   for a different check) and has no test that drives a save-success round trip through the real
   modal. The claim is true by code inspection only: `page.tsx:267-275` never passes `onSuccess`
   to the edit-mode `WorkHourForm`, and the edit-mode branch of `onSubmit`
   (`work-hour-form.tsx:134-154`) never calls `onSuccess?.()` or closes the modal - but "true by
   code reading" is not the same as "proven by a proof line," and the checklist commits this
   check to a single proof (the form-only test above) that cannot reach this clause.

None of these three contradict the implementation - in each case the untested portion of the
claim is structurally plausible from the code, and nothing observed suggests it's actually wrong.
They are assertion-coverage gaps against the checklist's own wording, the same class of finding
Round 1 recorded for C10's `toHaveBeenCalledTimes` (which has since been fixed - see below), not
blocking failures.

### Fixed since Round 1

- **C10's Round 1 gap is closed.** Round 1 flagged that no assertion checked call count
  (`toHaveBeenCalledTimes(1)`), only `toHaveBeenCalledWith(...)`. Commit `9d58554` (already
  applied before this round's diff range starts) added
  `expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1)` at `work-hour-form.test.tsx:236`,
  confirmed present and passing at current HEAD.

## Swept rows checked (resolve to "existing"), carried from 5af6194 and re-confirmed this round

| Row | Constraint cited | Verified in code |
|---|---|---|
| validation | `editWorkHourFormSchema` (zod, client) and `UpdateWorkHourDto` (class-validator, server) unchanged | `work-hour-form.tsx:56-62` - schema untouched by the `9d58554..HEAD` diff (confirmed: the diff hunk touches only the JSX below the schema, not the `z.object` declarations); `git diff --stat 9d58554..HEAD` shows no `apps/backend` files touched at all, so `UpdateWorkHourDto` is unchanged |
| authorization | `WorkHoursService.update` still validates `req.user.id` and blocks invoiced (400), independent of client-side check | Unchanged since Round 1 (backend untouched this round); Round 1's citation (`work-hours.service.ts:189-198`, `:213-221`) stands - `carried from 5af6194`, re-confirmed only via the empty backend diff-stat above, not re-read line by line |

All other Swept rows resolve to `not in scope`/pointers at other checks, unchanged from Round 1 -
`carried from 5af6194`.

## Coverage / Test policy

- `Coverage` join: not recomputed (profile floor, `light`) - `carried from 5af6194`.
- `## Test policy`: absent from the checklist, re-confirmed by reading the current full file -
  `verified at f2e4eab`.

## Faults injected

Skipped (profile floor, `light` - fault injection is `standard`/`ui` only).

## Gate

```
cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx \
  -t "opens the row's modal when a non-invoiced row is clicked outside the action cell|does not render an edit icon button|does not trigger the row's onEdit when the delete button is clicked|opens the row's modal when Enter or Space is pressed on a focused row"
# Tests: 4 passed, 4 total

cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx \
  -t "edit mode: renders always-editable inputs prefilled from workHour, with Save and Cancel always visible|edit mode: invoiced work hour disables every field and the save button, and shows the cannotEditInvoiced notice|edit mode: clicking Cancel discards the typed changes and calls onCancel|edit mode: save sends only the field that was changed|edit mode: save button is disabled and shows the spinner while pending|edit mode: a successful save keeps the new value in the input and shows the success alert|edit mode: a failed save keeps the typed value and shows the error alert|edit mode: unsaved changes are discarded when the form is remounted with the original workHour"
# Tests: 8 passed, 3 skipped (unrelated tests in the same file correctly skipped by the -t filter), 11 total
```

All 12 named tests (4 in `work-hours-table.test.tsx` + 8 in `work-hour-form.test.tsx`) individually
show `✓` and passed at `HEAD` (`f2e4eab`), run in this round, not reused from Round 1's output.
