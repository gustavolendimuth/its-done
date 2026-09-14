# Work hours - clique na linha abre modal de visualização, edição por campo

Sources:

- `.tasks/work-hours-row-click-edit.md` - task de origem; decide o comportamento base (sem
  botão editar, clique na linha abre modal de visualização, clique no campo libera edição) e a
  porta de mão única (padrão visualizar→editar-por-campo com salvar único)

## Out of scope

- Editar `projectId`/`clientId` pelo modal - `UpdateWorkHourDto` (backend) não aceita
  `projectId`, e o formulário já esconde esses campos no modo edição hoje
- Exibir `client`/`project` como informação somente-leitura no modal - assumido que não (task
  `Unresolved #1`); o modal continua mostrando só `date`, `hours`, `description`
- Diálogo de confirmação de "descartar alterações" ao fechar o modal - descarte é silencioso
  (C15); nenhum padrão desse tipo existe hoje no app
- Comportamento do botão de excluir (`AlertDialog`) - inalterado, exceto por não mais disparar
  o clique de linha (C3)
- Regra de negócio que bloqueia edição de work hours faturadas - já existe no backend
  (`WorkHoursService.update`, 400) e no frontend (`isWorkHourInvoiced`); só a forma de sinalizar
  na UI muda (C9)
- Modal de criação (sem `workHour`) - continua sempre editável com o botão "Salvar" visível
  desde a abertura; `isEditMode` continua controlando o modo do formulário

## Landing

Toca `work-hours-table.tsx` (remove o botão, adiciona clique/teclado na linha), `page.tsx`
(calcula e repassa `isInvoiced`) e `work-hour-form.tsx` (visualização por campo). Reaproveita o
prop `onEdit` de `WorkHoursTable` (agora disparado pela linha em vez do botão), a string i18n
`cannotEditInvoiced` já existente, e `isWorkHourInvoiced` de `work-hours-grouping.ts` (passou a
ser reexportada pelo barrel `features/time-tracking/index.ts` pra `page.tsx` poder usá-la).

Descoberta durante o build, consequência direta de C12 ("os campos voltam ao modo de
visualização" - não "o modal fecha"): salvar uma edição não fecha mais o modal automaticamente
(antes, `handleWorkHourEdited` chamava `setEditingWorkHour(null)` no sucesso). Removido
`handleWorkHourEdited` e o prop `onSuccess` passado ao `WorkHourForm` de edição em `page.tsx`;
`page.test.tsx` ajustado (mock ganhou `isWorkHourInvoiced`, o botão "simulate edit success" do
mock - que só existia pra essa chamada - foi removido). Comportamento reversível, não é porta de
mão única.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Padrão de interação visualizar→editar-por-campo com salvar único (não existe hoje no codebase) | Estado local por campo dentro de `WorkHourForm` (ex.: `Set` dos nomes de campo em edição) alterna cada campo entre view/edit; um único botão "Salvar" dispara um `PATCH /work-hours/:id` com somente os campos alterados | Edição de um campo por vez (serializado) - rejeitada pelo usuário: exigiria bloquear os demais campos até cada edição terminar |

## Checks

### S1 - Abrir o modal pelo clique na linha · 4 files · 34 KB · ~9k

**C1** - Clicar na linha (fora das células de ação) chama o mesmo callback que hoje abre o modal de edição, com o id da work hour
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx -t "opens the row's modal when a non-invoiced row is clicked outside the action cell"`

**C2** - O botão de ícone `Edit` não é mais renderizado na célula de ações
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx -t "does not render an edit icon button"`

**C3** - Clicar no botão de excluir não dispara a abertura do modal (o clique não se propaga pra `TableRow`)
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx -t "does not trigger the row's onEdit when the delete button is clicked"`

**C4** - A `TableRow` tem `role="button"` e `tabIndex={0}`; pressionar `Enter` ou `Espaço` com foco na linha chama o mesmo callback que o clique do mouse
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hours-table.test.tsx -t "opens the row's modal when Enter or Space is pressed on a focused row"`

### S2 - Editar por campo dentro do modal · 3 files · 26 KB · ~7k

**C5** - Em modo edição (`workHour` presente, não faturada), o modal abre com `date`, `hours` e `description` em modo de visualização (`data-testid="field-date-view"`, `field-hours-view`, `field-description-view`), sem o `date-picker`/input `HH:mm`/textarea, e sem o botão "Salvar"
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: opens in view mode with no editable inputs and no save button"`

**C6** - Clicar em `field-date-view` revela o `date-picker` (já existente) e o botão "Salvar" (`saveChanges`)
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: clicking the date field reveals the date picker and the save button"`

**C7** - Clicar em `field-hours-view` revela o input com máscara `HH:mm` (já existente) e o botão "Salvar"
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: clicking the hours field reveals the HH:mm input and the save button"`

**C8** - Com um campo já em edição, clicar em outro campo ainda em visualização também o torna editável, mantendo o(s) anterior(es) editável(is) e exibindo um único botão "Salvar"
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: editing a second field keeps the first editable and shows exactly one save button"`

**C9** - Quando `workHour.isInvoiced` é `true`, nenhum campo responde a clique (`field-*-view` não vira input) e o modal mostra um texto fixo igual a `t("cannotEditInvoiced")`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: invoiced work hour keeps every field read-only and shows the cannotEditInvoiced notice"`

### S3 - Salvar as alterações · 2 files · 18 KB · ~5k

**C10** - O clique em "Salvar" chama `useUpdateTimeEntry` uma única vez com `PATCH /work-hours/:id` contendo somente os campos cujo valor mudou, dentre `date`, `hours`, `description`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: save sends only the field that was changed"`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: a field opened for editing but left unchanged is not sent"`

**C11** - Enquanto a mutação está pendente (`isPending`), o botão "Salvar" fica desabilitado e mostra o spinner já usado hoje
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: save button is disabled and shows the spinner while pending"`

**C12** - Given sucesso na mutação, todos os campos abertos voltam ao modo de visualização com os valores atualizados e o botão "Salvar" desaparece
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: fields return to view mode with updated values after a successful save"`

**C13** - If a mutação retorna erro, os campos alterados permanecem em modo de edição com os valores digitados preservados, e o `Alert` de erro já existente exibe a mensagem
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: a failed save keeps the field editable with the typed value and shows the error alert"`

**C14** - Always, enquanto nenhum campo estiver em edição, nenhum botão "Salvar" é exibido (mesma prova de C5)
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: opens in view mode with no editable inputs and no save button"`

**C15** - Given um campo em edição sem salvar, when o modal é fechado e reaberto pra mesma work hour, then ele volta a abrir em modo de visualização com os valores originais (não os digitados)
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: unsaved changes are discarded when the form is remounted with the original workHour"`

Nota: a prova de C15 foi movida de `page.test.tsx` (que mocka `WorkHourForm` inteiro, sem campos
reais pra editar) pra `work-hour-form.test.tsx`, que desmonta/remonta o componente real com o
mesmo `workHour` - é o nível que de fato alcança a alegação (`page.tsx` já unmounta o formulário
ao fechar o modal via `{editingWorkHour && ... && <WorkHourForm .../>}`, então remontar com dados
originais já descarta o estado local não salvo).

## Swept

- validation: existing - `editWorkHourFormSchema` (zod) e `UpdateWorkHourDto` (class-validator) inalterados; a edição por campo roda os mesmos validadores
- failure modes: C13
- idempotency and retry: not in scope - nenhum retry automático; um segundo clique em Salvar durante `isPending` já fica bloqueado (C11)
- authorization: existing - `WorkHoursService.update` continua validando `req.user.id` e o bloqueio de invoiced (400) no servidor, independente da checagem client-side (C9)
- concurrency and ordering: C13 - cobre a work hour ser faturada entre a abertura do modal e o clique em Salvar
- data lifecycle: not in scope - não cria nem apaga work hours, só atualiza campos já existentes
- external-dependency failure: C13 - mesmo `Alert` de erro cobre falha de rede/API
- state transitions: C6, C7, C8, C12, C13, C15
- observability: not in scope - nenhum log ou métrica nova pedida

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| campos editáveis (3) | date C6 · hours C7 · description C8 | - |
| estado de faturamento (2) | não faturada C5-C8 · faturada C9 | - |
| superfícies de clique na linha (2) | corpo da linha C1 · botão de excluir não propaga C3 | - |
| inclusão no payload de salvar (2 arestas) | campo alterado incluído C10 (1ª prova) · campo aberto e não alterado excluído C10 (2ª prova) | - |

- Claims que citam método/rota/forma de payload: C10 - a prova assere o payload no boundary do
  hook mockado (`useUpdateTimeEntry`), o mesmo nível já usado por todos os testes existentes de
  `work-hour-form.test.tsx` para `PATCH /work-hours/:id`; nenhuma prova mais profunda (integração
  contra o backend real) é exigida no profile `light`
- Nenhum outro check afirma mais do que o caso único que sua prova exercita

## Handoff

- S1 (~9k) + S2 (~7k) + S3 (~5k) = ~21k, todos em `apps/frontend`, bem abaixo dos 150k - build
  inteiro em um único batch, sem handoff necessário
