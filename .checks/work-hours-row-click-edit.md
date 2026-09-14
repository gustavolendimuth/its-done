# Work hours - clique na linha abre modal de edição

> Revisão: a versão original deste checklist (S2/S3 = C5-C9, C14) implementava
> visualizar→editar-por-campo com "Salvar" escondido até algum campo entrar em edição. Foi
> verificada 15/15 PASS (`work-hours-row-click-edit.verified.md`, Round 1) e depois revertida a
> pedido do usuário, que não gostou da UX. Esta versão substitui C5-C9 e C14 pelos novos C5, C6,
> C7 abaixo; C10-C13 e C15 tiveram só ajuste de texto (mesma alegação, sem mudança de payload ou
> de contrato). O relatório de verificação anterior cobre C1-C4, C10, C11 e a forma do payload de
> C13 (nada disso mudou nesta revisão); precisa de um Round 2 só pra C5-C7, C12, C13, C15.

Sources:

- `.tasks/work-hours-row-click-edit.md` - task de origem; decide o comportamento base (sem
  botão editar, clique na linha abre modal de edição) e registra a revisão que trocou
  visualizar→editar-por-campo por inputs sempre editáveis + Cancelar

## Out of scope

- Editar `projectId`/`clientId` pelo modal - `UpdateWorkHourDto` (backend) não aceita
  `projectId`, e o formulário já esconde esses campos no modo edição hoje
- Exibir `client`/`project` como informação somente-leitura no modal - assumido que não (task
  `Unresolved #1`); o modal continua mostrando só `date`, `hours`, `description`
- Diálogo de confirmação de "descartar alterações" ao clicar em "Cancelar" ou fechar o modal -
  descarte é silencioso (C7, C15); nenhum padrão desse tipo existe hoje no app
- Comportamento do botão de excluir (`AlertDialog`) - inalterado, exceto por não mais disparar
  o clique de linha (C3)
- Regra de negócio que bloqueia edição de work hours faturadas - já existe no backend
  (`WorkHoursService.update`, 400) e no frontend (`isWorkHourInvoiced`); só a forma de sinalizar
  na UI muda (C6)
- Botão "Cancelar" no modal de criação (sem `workHour`) - não pedido; formulário de criação
  inalterado

## Landing

Toca `work-hours-table.tsx` (remove o botão, adiciona clique/teclado na linha), `page.tsx`
(calcula e repassa `isInvoiced`, adiciona `onCancel`) e `work-hour-form.tsx` (inputs sempre
editáveis + botão "Cancelar"). Reaproveita o prop `onEdit` de `WorkHoursTable` (agora disparado
pela linha em vez do botão), a string i18n `cannotEditInvoiced` e `common.cancel` já existentes
(a mesma usada em `AlertDialogCancel`), e `isWorkHourInvoiced` de `work-hours-grouping.ts`
(reexportada pelo barrel `features/time-tracking/index.ts` pra `page.tsx` poder usá-la).

Ainda vale, mesmo após a revisão: salvar uma edição não fecha mais o modal automaticamente
(antes, `handleWorkHourEdited` chamava `setEditingWorkHour(null)` no sucesso) - o usuário fecha
manualmente (X, clique fora, `Esc`) ou clica em "Cancelar" (C7, novo nesta revisão).
Comportamento reversível, não é porta de mão única.

O padrão visualizar→editar-por-campo (linha `Landing` original desta seção) foi revertido nesta
revisão antes de chegar à `main` - nunca virou precedente pra nenhum outro código do app.
Nenhuma porta de mão única permanece: inputs sempre editáveis e um botão "Cancelar" reaproveitam
padrões de UI (`Input`/`Textarea`/`Button` do shadcn, `common.cancel`) já usados em outros
formulários e modais do app.

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

### S2 - Inputs sempre editáveis, Salvar e Cancelar sempre visíveis · 2 files · 18 KB · ~5k

**C5** - Em modo edição (`workHour` presente, não faturada), o modal abre com `date`, `hours` e `description` como inputs já editáveis e pré-preenchidos (o mesmo `date-picker`/input `HH:mm`/textarea de sempre), e os botões "Salvar" (`saveChanges`) e "Cancelar" (`common.cancel`) visíveis desde a abertura
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: renders always-editable inputs prefilled from workHour, with Save and Cancel always visible"`

**C6** - Quando `workHour.isInvoiced` é `true`, os inputs `date`/`hours`/`description` e o botão "Salvar" ficam desabilitados, e o modal mostra um texto fixo igual a `t("cannotEditInvoiced")`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: invoiced work hour disables every field and the save button, and shows the cannotEditInvoiced notice"`

**C7** - Clicar em "Cancelar" reverte os campos pro último valor salvo (ou ao valor original, se nenhum salvamento aconteceu ainda) e chama `onCancel`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: clicking Cancel discards the typed changes and calls onCancel"`

### S3 - Salvar as alterações · 2 files · 18 KB · ~5k

**C10** - O clique em "Salvar" chama `useUpdateTimeEntry` uma única vez com `PATCH /work-hours/:id` contendo somente os campos cujo valor mudou, dentre `date`, `hours`, `description`
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: save sends only the field that was changed"`

**C11** - Enquanto a mutação está pendente (`isPending`), o botão "Salvar" fica desabilitado e mostra o spinner já usado hoje
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: save button is disabled and shows the spinner while pending"`

**C12** - Given sucesso na mutação, os inputs mantêm os novos valores salvos, o `Alert` de sucesso já existente aparece, e o modal permanece aberto (não fecha sozinho)
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: a successful save keeps the new value in the input and shows the success alert"`

**C13** - If a mutação retorna erro, os inputs mantêm os valores digitados, e o `Alert` de erro já existente exibe a mensagem
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: a failed save keeps the typed value and shows the error alert"`

**C15** - Given uma alteração não salva, when o modal é fechado (sem clicar em "Salvar") e reaberto pra mesma work hour, then os inputs voltam a mostrar os valores originais (ou os últimos salvos), não os digitados
Proof: `cd apps/frontend && npx jest --ci src/features/time-tracking/components/work-hour-form.test.tsx -t "edit mode: unsaved changes are discarded when the form is remounted with the original workHour"`

Nota: a prova de C15 fica em `work-hour-form.test.tsx` (desmonta/remonta o componente real com o
mesmo `workHour`) em vez de `page.test.tsx` (que mocka `WorkHourForm` inteiro, sem campos reais
pra editar) - é o nível que de fato alcança a alegação (`page.tsx` já desmonta o formulário ao
fechar o modal via `{editingWorkHour && ... && <WorkHourForm .../>}`, então remontar com dados
originais já descarta o estado local não salvo; C7 - o botão "Cancelar" - cobre o outro caminho
de descarte, dentro da mesma montagem).

## Swept

- validation: existing - `editWorkHourFormSchema` (zod) e `UpdateWorkHourDto` (class-validator) inalterados
- failure modes: C13
- idempotency and retry: not in scope - nenhum retry automático; um segundo clique em Salvar durante `isPending` já fica bloqueado (C11)
- authorization: existing - `WorkHoursService.update` continua validando `req.user.id` e o bloqueio de invoiced (400) no servidor, independente da checagem client-side (C6)
- concurrency and ordering: C13 - cobre a work hour ser faturada entre a abertura do modal e o clique em Salvar
- data lifecycle: not in scope - não cria nem apaga work hours, só atualiza campos já existentes
- external-dependency failure: C13 - mesmo `Alert` de erro cobre falha de rede/API
- state transitions: C5, C6, C7, C12, C13, C15
- observability: not in scope - nenhum log ou métrica nova pedida

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| estado de faturamento (2) | não faturada C5 · faturada C6 | - |
| superfícies de clique na linha (2) | corpo da linha C1 · botão de excluir não propaga C3 | - |
| caminhos de descarte sem salvar (2) | botão Cancelar C7 · fechar/remontar o modal C15 | - |

- Claims que citam método/rota/forma de payload: C10 - a prova assere o payload no boundary do
  hook mockado (`useUpdateTimeEntry`), o mesmo nível já usado por todos os testes existentes de
  `work-hour-form.test.tsx` para `PATCH /work-hours/:id`; nenhuma prova mais profunda (integração
  contra o backend real) é exigida no profile `light`
- Nenhum outro check afirma mais do que o caso único que sua prova exercita

## Handoff

- S1 (~9k) + S2 (~5k) + S3 (~5k) = ~19k, todos em `apps/frontend`, bem abaixo dos 150k - build
  inteiro em um único batch, sem handoff necessário
