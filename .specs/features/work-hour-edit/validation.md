# Edição de Work Hour — Validation

**Date**: 2026-09-13
**Spec**: `.specs/features/work-hour-edit/spec.md`
**Diff range**: `27aefb2..a2f9ce3`
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

| Task | Status  | Notes |
| ---- | ------- | ----- |
| T1: Align UpdateWorkHourDto validation | ✅ Done | `apps/backend/src/work-hours/dto/update-work-hour.dto.ts` |
| T2: Block updating invoiced work hour | ✅ Done | `apps/backend/src/work-hours/work-hours.service.ts` |
| T3: Add isWorkHourInvoiced helper | ✅ Done | `apps/frontend/.../work-hours-grouping.ts` |
| T4: Add edit-mode translation keys | ✅ Done | but the commit also carries an unrelated key `projects.noProjectsForClient` (used only by `projects/page.tsx`, a file the concurrent session "its-done-d2" is editing) — see Code Quality note below |
| T5: Disable edit button for invoiced rows | ✅ Done | `apps/frontend/.../work-hours-table.tsx` |
| T6: Add edit mode to WorkHourForm | ✅ Done | `apps/frontend/.../work-hour-form.tsx` |
| T7: Wire up handleEdit in the page | ✅ Done | `apps/frontend/.../work-hours/page.tsx` |

---

## Spec-Anchored Acceptance Criteria

### P1: Editar dados de uma work hour (WHE-01, WHE-02, WHE-03)

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1: clica Editar (não faturada) → abre modal edição pré-preenchido, campos cliente/projeto ocultos | modal em modo edição com `date`/`hours` (HH:mm)/`description` da entrada; cliente e projeto ocultos | `apps/frontend/src/features/time-tracking/components/work-hour-form.test.tsx:136-151` (hides client/project) + `:153-169` (prefills date/hours/description) + `apps/frontend/src/app/[locale]/(authenticated)/work-hours/__tests__/page.test.tsx:254-266` (edit button wiring passes the right entry to the form) | ✅ PASS |
| AC2: altera e confirma → PATCH com apenas 3 campos, toast sucesso, fecha modal | payload `{id, data:{date,hours,description}}`, sem `clientId`/`projectId` | `work-hour-form.test.tsx:171-203` — `expect(mockUpdateMutateAsync).toHaveBeenCalledWith({id:"wh-1", data:{date,hours,description}})` | ⚠️ Partial — payload shape PASS; "exibe toast de sucesso" and "fecha o modal" have **no test assertion** anywhere in scope (no test asserts `toast.success` was called, and `page.test.tsx`'s `WorkHourForm` mock never invokes `onSuccess`, so `handleWorkHourEdited`/modal-close is never exercised). Code visibly does both (`work-hour-form.tsx:143-144`, `page.tsx:116-118`), but per evidence-or-zero this counts as **not covered** |
| AC3: PATCH bem-sucedido → invalida as mesmas 5 queries que `useUpdateTimeEntry` já invalida | `["timeEntries"]`, `["timeEntries", id]`, `["workHours","stats"]`, `["clients","stats"]`, `["dashboard"]` | `apps/frontend/src/features/time-tracking/time-entries.ts:124-133` — pre-existing hook, unmodified by this diff, already invalidates exactly these 5 keys | ✅ PASS (by inspection of pre-existing, untouched code — no dedicated test in or out of scope for this hook) |
| AC4: `hours` fora de 0.1–24 ou formato inválido → bloqueia submit client-side com msg já usada na criação | mesma regex/mensagem `hoursFieldSchema` do create | `work-hour-form.test.tsx:205-230` — types `"9"`, asserts `screen.getByText("Invalid time format (HH:mm)")` and `mockUpdateMutateAsync` not called | ✅ PASS |

### P1: Bloquear edição de work hour já faturada (WHE-04, WHE-05)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1: work hour ligada a invoice `PENDING`/`PAID` → botão "Editar" desabilitado com tooltip/aria-label | `disabled=true`, `aria-label`/`title` = `cannotEditInvoiced` | `apps/frontend/src/features/time-tracking/components/work-hours-table.test.tsx:46-71` — `getByRole("button",{name:"cannotEditInvoiced"})`, `toBeDisabled()`, click doesn't call `onEdit` | ⚠️ Spec-precision gap on `title` — the accessible-name query covers `aria-label`, but no test reads the `title` attribute directly (Task T5's own Done-when lists both). Not a functional gap: `work-hours-table.tsx:307` sets `title={invoiced ? editLabel : undefined}` identically to `aria-label` |
| AC2: work hour ligada só a invoices `CANCELED` (ou nenhuma) → botão permanece habilitado | `disabled=false`, calls `onEdit` | `work-hours-table.test.tsx:27-44` (no invoice) and `:73-96` (CANCELED-only) | ✅ PASS |
| AC3: PATCH direto numa work hour com invoice `PENDING`/`PAID` → API responde 400 sem alterar o registro | `BadRequestException` thrown, `prisma.workHour.update` never called | `apps/backend/src/work-hours/work-hours.service.spec.ts:106-130` — `rejects.toThrow(BadRequestException)` + `expect(prismaMock.workHour.update).not.toHaveBeenCalled()` | ✅ PASS (unit-level; no e2e/HTTP-level 400 assertion exists, but the Test Coverage Matrix in tasks.md explicitly scopes this feature to unit tests only — "N/A for this feature — no e2e/integration task is planned" — so this is the agreed floor, not a gap) |

### P2: Validação consistente do UpdateWorkHourDto (WHE-06, WHE-07)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 (WHE-06): `hours` < 0.1, > 24, ou > 2 casas decimais → 400 | class-validator error on `hours` | `apps/backend/src/work-hours/dto/update-work-hour.dto.spec.ts:6-11` (>24), `:13-18` (<0.1), `:20-25` (3 decimals), `:27-32` (valid case, no error) | ✅ PASS (unit-level on the DTO directly; same scoping caveat as WHE-05 AC3 — no e2e proving the global `ValidationPipe` actually turns this into an HTTP 400, but that pipe is pre-existing infra untouched by this diff and out of the declared test scope) |
| AC2 (WHE-07): `date` como string ISO → convertida para `Date` antes de persistir | `dto.date instanceof Date` | `update-work-hour.dto.spec.ts:34-40` | ✅ PASS |

**Status**: ⚠️ Gaps present — one real coverage gap (AC2's toast/modal-close half untested) and two spec-precision/scoping notes (title attribute untested; unit-level floor for the two 400-response ACs, which matches the task's own declared scope).

---

## Discrimination Sensor

Scratch method used: file copy to `~/backup-*.bak` (outside the repo, outside `/tmp` per instructions), mutate in place, run tests, restore from backup, diff-confirm identical, delete backups. **No `git stash` used.**

| # | File:line | Description | Killed? |
| - | --- | --- | --- |
| 1 | `apps/backend/src/work-hours/work-hours.service.ts:216` | Flipped `invoice.status !== 'CANCELED'` → `=== 'CANCELED'` | ✅ Killed — 3/7 tests in `work-hours.service.spec.ts` failed (2 "throws" tests now pass wrongly is not what happened; actually the CANCELED-only and PENDING/PAID-throw tests flipped outcome and failed as expected) |
| 2 | `apps/frontend/src/features/time-tracking/components/work-hours-grouping.ts:27-31` | `isWorkHourInvoiced` hardcoded to always `return false` | ✅ Killed — `work-hours-grouping.test.ts` (1 test) and `work-hours-table.test.tsx` (1 test) both failed |
| 3 | `apps/frontend/src/features/time-tracking/components/work-hour-form.tsx:128` | `if (isEditMode && workHour)` → `if (false && isEditMode && workHour)` (edit branch unreachable) | ✅ Killed — `work-hour-form.test.tsx` "edit mode: submits via update..." failed (`mockUpdateMutateAsync` never called) |

**Sensor depth**: lightweight (3 targeted mutations, default tier)
**Result**: 3/3 killed — ✅ PASS

---

## Code Quality

| Principle | Status |
| --- | --- |
| No features beyond what was asked | ✅ |
| No abstractions for single-use code | ✅ |
| No unnecessary "flexibility" added | ✅ |
| Only touched files required for task | ⚠️ Commit `24b1e2b` (T4, "add i18n keys for work hour edit mode") also adds `projects.noProjectsForClient` to both message files — a key with no relation to this feature, consumed only by `projects/page.tsx`. Given the documented concurrent-editing context (another session, "its-done-d2", is actively working on `projects`/`clients` translation keys), this reads as an accidental sweep-in (likely a `git add` that staged a file the other session had already modified on disk) rather than deliberate scope creep by this feature's author. Harmless (doesn't break anything, valid JSON, doesn't touch this feature's own keys) but flagged per instructions to note without fixing |
| Didn't "improve" unrelated code | ✅ |
| Matches existing patterns/style | ✅ — edit mode reuses `WorkHourForm` via an optional prop exactly as the spec's Assumptions table decided, reuses `useUpdateTimeEntry` untouched, reuses the `findAvailable` invoice-status pattern in the service |
| Would senior engineer approve? | ✅ modulo the two gaps below |
| Tests map to acceptance criteria and are non-shallow (spot-check one story) | ✅ — spot-checked "Bloquear edição de work hour já faturada": all 4 branches (PENDING throws, PAID throws, CANCELED-only proceeds, no-invoice proceeds) are asserted at both the service layer and the table-button layer, non-shallow |
| Spec-anchored outcome check (asserted values match spec) | ⚠️ — see AC2 gap above (toast/modal-close untested) |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ per the Coverage Matrix's own declared floor (no e2e route required for this feature) |
| Every test maps to a spec requirement — no unclaimed tests | ✅ |
| Documented guidelines followed | tasks.md Test Coverage Matrix and Gate Check Commands — followed exactly |

---

## Edge Cases

- [x] Cancelar sem salvar → nenhum PATCH disparado (inerente ao `FormModal`/`onOpenChange`, nenhuma lógica nova; não há teste dedicado, mas nenhuma lógica nova precisa de um)
- [ ] PATCH falha por erro genérico → toast `errorSaving` + modal permanece aberto — **comportamento existe no código** (catch compartilhado com o create, `work-hour-form.tsx:167-173`, e o branch de edição não chama `reset()` nem fecha o modal em erro) **mas nenhum teste no diff exercita esse caminho** (nenhum `mockRejectedValue`/`toast` assertion em `work-hour-form.test.tsx`)
- [x] Work hour excluída por outra sessão entre abrir e submeter (404) → sem tratamento especial, cai no mesmo catch genérico — confirmado por inspeção (nenhum branch condicional por status code)
- [x] `description` vazio → salvo como `undefined`, igual ao create — `work-hour-form.tsx:139` (`formData.description || undefined`), mesmo padrão de `:153`

---

## Gate Check

- **Backend quick** (`pnpm test -- work-hours.service.spec.ts update-work-hour.dto.spec.ts`): 2 suites, 12 tests, all passed
- **Backend build**: `pnpm build` — succeeded, no errors
- **Backend lint**: `pnpm lint` — 30 pre-existing errors, **none in files touched by this diff** (errors are in `admin.service.spec.ts`, `auth.*`, `invoices/dto/update-invoice.dto.ts`, `upload.service.ts`, `projects.service.ts`, `reports.service.ts`, `settings.service.ts`, `types/ui.ts`, `work-hours/services/draft-invoice.service.ts`, `work-hours/services/hours-threshold-checker.service.ts`, `work-hours/work-hours.module.ts`, `work-sessions.service.spec.ts`, `test/work-sessions-finish.e2e-spec.ts` — none of these are among the 4 backend files this diff touches)
- **Backend full test**: `pnpm test` — 10 suites / 55 tests; 8 suites / 53 tests passed; 2 pre-existing failures (`app.controller.spec.ts`, `invoices.controller.spec.ts`, both Nest DI-resolution errors) — confirmed via `git log` that both files are unchanged since the repo's initial commit and have zero diff in this range; unrelated to work-hours
- **Frontend quick** (`pnpm test:ci -- work-hours-grouping work-hours-table work-hour-form`): 3 suites, 11 tests, all passed
- **Frontend page test**: `pnpm test:ci -- page.test.tsx`: 8 tests, 6 passed, 2 failed — exactly the two pre-documented pre-existing failures (`should filter work hours by client`, `should handle work hour deletion`); the new test `should open edit modal pre-filled when clicking edit` passed
- **Frontend build**: `pnpm build` — compiled successfully, TypeScript check passed, all routes generated

**Test count before feature**: not independently re-derived (base commit tests not re-run in isolation); **delta declared by tasks.md**: +5 (DTO) +4 (service) +3 (grouping) +4 (table) +5 (form) +1 (page) = +22 new tests, all present and passing in their respective files.
**Skipped tests**: none.
**Failures**: 2 backend (pre-existing, unrelated files, present since initial commit), 2 frontend page-test (pre-existing, explicitly pre-documented as known, unrelated to the new edit button).

---

## Fix Plans (if issues found)

### Fix 1: AC2's "toast de sucesso" / "fecha o modal" have no test assertion

- **Root cause**: `work-hour-form.test.tsx`'s edit-mode submit test only asserts the mutation payload, never mocks/asserts `sonner`'s `toast.success`; `page.test.tsx`'s `WorkHourForm` mock never calls the `onSuccess` prop it receives, so `handleWorkHourEdited` (which resets `editingWorkHour` to `null`, closing the modal) is never exercised.
- **Fix task**: In `work-hour-form.test.tsx`, mock `sonner` and assert `toast.success` is called with the expected key after a successful edit submit. In `page.test.tsx`, extend the `WorkHourForm` mock to expose a way to trigger `onSuccess` (e.g. a button) and assert the edit `FormModal` closes (`editingWorkHour` resets) afterward.
- **Priority**: Minor — the underlying code is correct and shares the exact same call pattern already used (and left similarly untested) by the create-mode path; this is a coverage gap, not a behavior defect.

### Fix 2 (optional, cosmetic): `title` attribute on the disabled edit button untested

- **Root cause**: `work-hours-table.test.tsx` verifies the accessible name (which covers `aria-label`) but never reads `.title` directly, even though Task T5's own Done-when criterion calls out both.
- **Fix task**: Add `expect(editButton).toHaveAttribute("title", "cannotEditInvoiced")` to the PENDING-invoice test case.
- **Priority**: Cosmetic — implementation already sets it correctly (`work-hours-table.tsx:307`).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| WHE-01 | Implementing | ⚠️ Verified with minor gap (AC2 toast/close untested) |
| WHE-02 | Implementing | ✅ Verified |
| WHE-03 | Implementing | ✅ Verified |
| WHE-04 | Implementing | ⚠️ Verified with spec-precision gap (title attribute untested) |
| WHE-05 | Implementing | ✅ Verified |
| WHE-06 | Implementing | ✅ Verified (unit-level floor, matches declared scope) |
| WHE-07 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ⚠️ Issues (minor, non-blocking)

**Spec-anchored check**: 8/10 criteria fully matched spec outcome; 2 partial (AC2 half-covered — payload shape verified, toast/modal-close not; AC1-of-WHE-04 title attribute not directly asserted)
**Sensor**: 3/3 mutations killed
**Gate**: 5 gate levels run, all passed except 2 known pre-existing backend failures (unrelated files) + 2 known pre-existing frontend page-test failures (both pre-documented before this validation started)

**What works**: Backend DTO validation and invoiced-work-hour blocking are solid — every branch (PENDING/PAID/CANCELED/no-invoice) is tested at both the service and UI-button layers, and all three targeted mutations were caught by the existing tests. `WorkHourForm`'s edit mode correctly hides client/project, prefills from the existing entry, validates with the same schema as create, and submits the trimmed 3-field payload via `useUpdateTimeEntry`. The page wires the edit button through a second `FormModal` exactly as scoped. Frontend and backend builds are clean.

**Issues found**:
1. No test asserts the success toast is shown or that the edit modal actually closes after a successful PATCH (code does both; only the mutation call itself is asserted) — see Fix 1.
2. The disabled edit button's `title` attribute (called out explicitly in T5's Done-when) isn't asserted, only its `aria-label` — see Fix 2.
3. (Process note, not a feature bug) Commit `24b1e2b` also carries an unrelated `projects.noProjectsForClient` i18n key, apparently swept in from the concurrently-edited `projects` domain — harmless, not touched further per scope instructions.

**Next steps**: Route Fix 1 and Fix 2 back as fix tasks if the team wants full spec-anchored coverage before closing the feature; neither blocks shipping, since the underlying behavior is implemented correctly and independently verified by code inspection plus the discrimination sensor killing all 3 targeted mutations.
