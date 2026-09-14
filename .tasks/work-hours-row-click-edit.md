# Remover botão de editar da tabela de horas - visualização e edição por campo no modal

> Build this with **tlc-implement**.
> Cada critério abaixo vira um check com uma prova, referenciado pelo número. Nada em
> `Unresolved` é resolvido durante a implementação.

## Intent

Hoje, pra editar uma work hour, o usuário precisa mirar num ícone pequeno de lápis que só
aparece no hover da linha (`work-hours-table.tsx:293-314`), competindo por espaço com o botão de
excluir na mesma célula. O modal que abre em seguida (`FormModal` + `WorkHourForm`) já entra
direto em modo de edição, com todos os três campos editáveis (`date`, `hours`, `description`) e o
botão "Salvar" sempre visível - não há como só consultar uma work hour sem já estar em posição de
alterá-la.

A mudança: o botão de editar sai da tabela. Clicar em qualquer parte da linha (fora dos botões de
ação) abre o mesmo modal, diretamente em modo de edição - `date`, `hours` e `description` já
aparecem como inputs editáveis, pré-preenchidos, com os botões "Salvar" e "Cancelar" sempre
visíveis no rodapé.

## Revisão

A primeira versão implementada (visualização por padrão, campo vira editável só ao clicar nele,
botão "Salvar" escondido até algum campo entrar em edição) foi revertida a pedido do usuário
depois de construída e verificada - ver "Sources". Os critérios 5-9 e 14 da versão original foram
substituídos pelos critérios abaixo; a porta de mão única original (padrão visualizar→editar-por-
campo) foi desfeita antes de chegar à `main`, então não chegou a virar precedente pra nenhum outro
código - ver "Decided".

12 critérios em 3 slices · 0 portas de mão única · 1 aberto, dos quais 0 bloqueiam

## Criteria

### Abrir o modal pelo clique na linha

1. Given a tabela de horas renderizada, when o usuário clica em qualquer área de uma `TableRow`
   fora das células de ação, then o modal de detalhes da work hour abre em modo de visualização
   (nenhum campo editável, nenhum botão "Salvar" visível).
2. Always, o botão de ícone `Edit` (lucide-react) não é mais renderizado na célula de ações da
   tabela.
3. Given uma linha da tabela, when o usuário clica no botão de excluir (dentro do `AlertDialog`
   existente), then o modal de visualização não abre - o clique não se propaga pra `TableRow`.
4. Always, a `TableRow` tem `role="button"` e `tabIndex={0}`, e pressionar `Enter` ou `Espaço` com
   foco na linha abre o mesmo modal de visualização que o clique do mouse.

### Inputs sempre editáveis, Salvar e Cancelar sempre visíveis

5. Given o modal de edição aberto (workHour não faturada), then `date`, `hours` e `description`
   são renderizados como inputs editáveis (os mesmos controles já usados hoje em `WorkHourForm`),
   pré-preenchidos com os valores atuais, e os botões "Salvar" e "Cancelar" estão sempre visíveis
   no rodapé do modal desde a abertura.
6. Given a work hour vinculada a uma invoice com status diferente de `CANCELED`
   (`isWorkHourInvoiced` retorna `true`), then os inputs `date`, `hours`, `description` e o botão
   "Salvar" ficam desabilitados, e o modal exibe um aviso fixo reaproveitando a string
   `cannotEditInvoiced` já usada hoje como tooltip do antigo botão de editar. O botão "Cancelar"
   continua habilitado (só fecha o modal).
7. When o usuário clica em "Cancelar", then os campos voltam aos valores originais (ou aos
   últimos valores salvos, se já houve um salvamento nesta sessão do modal) e o modal é fechado.

### Salvar as alterações

10. Given pelo menos um campo com valor alterado, when o usuário clica em "Salvar", then
    `useUpdateTimeEntry` é chamado uma única vez com `PATCH /work-hours/:id` contendo somente os
    campos cujo valor mudou dentre `date`, `hours`, `description`.
11. While a mutação de salvar está pendente (`isPending`), o botão "Salvar" fica desabilitado e
    mostra o spinner já usado hoje no formulário.
12. Given a mutação retorna sucesso, then os inputs mantêm os novos valores salvos, o `Alert` de
    sucesso já existente em `WorkHourForm` aparece, e as mesmas invalidações de query já
    existentes (`timeEntries`, `timeEntries/id`, `workHours/stats`, `clients/stats`, `dashboard`)
    são disparadas. O modal permanece aberto - o usuário fecha manualmente (X, clique fora, `Esc`
    ou "Cancelar") quando terminar.
13. If a mutação retorna erro (ex.: 400 porque a work hour foi faturada entre a abertura do modal
    e o clique em "Salvar"), then os inputs mantêm os valores digitados, e o `Alert` de erro já
    existente em `WorkHourForm` exibe a mensagem retornada pela API.
15. Given uma alteração não salva em algum campo, when o usuário fecha o modal sem clicar em
    "Salvar" (X, clique fora, `Esc`, ou o "Cancelar" do critério 7), then a alteração não é
    persistida; reabrindo o modal pra mesma work hour, os campos voltam a mostrar os valores
    originais (ou os últimos salvos).

## States

```mermaid
stateDiagram-v2
    [*] --> Editing: clique/Enter na linha (1, 4, 5)
    Editing --> EditingDisabled: workHour faturada (6)
    Editing --> Saving: clique em Salvar (10)
    Saving --> Editing: sucesso (12)
    Saving --> Editing: erro (13)
    Editing --> [*]: fecha modal ou Cancelar sem salvar - descarta (7, 15)
```

## Out of scope

- Editar `projectId`/`clientId` pelo modal - `UpdateWorkHourDto` do backend não aceita
  `projectId`, e o formulário já esconde esses campos no modo edição hoje.
- Confirmação de "descartar alterações" ao clicar em "Cancelar" ou fechar o modal com edições não
  salvas - descarte é silencioso (critérios 7, 15), sem diálogo de confirmação; nenhum padrão
  desse tipo existe hoje no app.
- Botão "Cancelar" no modal de criação (sem `workHour`) - não pedido; o formulário de criação
  segue como estava.
- Alterar o comportamento do botão de excluir (`AlertDialog`) - inalterado por esta task.
- Alterar a regra de negócio que bloqueia edição de work hours faturadas - o bloqueio já existe
  no backend (`WorkHoursService.update`) e no frontend (`isWorkHourInvoiced`); só a forma de
  sinalizar na UI muda (critério 9).

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| modal "detalhes da work hour" | empty state | n/a - só abre pra uma work hour já carregada na lista |
| modal "detalhes da work hour" | loading state | n/a - `clients` já está carregado antes da tabela ficar interativa (`page.tsx` retorna cedo enquanto `isInitialLoading`) |
| modal "detalhes da work hour" | error state | 13 |
| modal "detalhes da work hour" | unauthorised state | existing - `WorkHoursService.update` valida `req.user.id`, sem UI nova |
| modal "detalhes da work hour" | destructive action confirma antes | existing - `AlertDialog` de exclusão já presente na linha, inalterado |
| modal "detalhes da work hour" | densidade/ordenação | n/a - nenhuma mudança na ordenação ou agrupamento da tabela |
| tabela de horas (linha) | empty state | existing - `data-testid="empty-state"` já cobre tabela sem work hours |
| API `PATCH /work-hours/:id` | forma de resposta e erro | existing - contrato já usado hoje por `WorkHourForm`, sem mudança |
| API `PATCH /work-hours/:id` | quem pode chamar | existing - guard de autenticação e ownership já aplicados no controller/service |
| API `PATCH /work-hours/:id` | versionamento | n/a - endpoint interno, sem consumidor externo |
| API `PATCH /work-hours/:id` | comportamento no rate limit | n/a - fora de escopo, herdado do endpoint já existente |

## Swept

- validation: existing - reaproveita `editWorkHourFormSchema` (zod) no cliente e
  `UpdateWorkHourDto` (class-validator) no servidor; a edição por campo não muda as regras
- failure modes: 13
- idempotency and retry: n/a - nenhum retry automático introduzido; um segundo clique em Salvar
  durante `isPending` já fica bloqueado (11)
- authorization: existing - `WorkHoursService.update` continua validando `req.user.id` e o
  bloqueio de invoiced (400) no servidor, independente da checagem client-side (9)
- concurrency and ordering: 13 - cobre o caso da work hour ser faturada entre a abertura do
  modal e o clique em Salvar
- data lifecycle: n/a - não cria nem apaga work hours, só atualiza campos já existentes
- external-dependency failure: 13 - mesmo `Alert` de erro cobre falha de rede/API
- state transitions: 5, 6, 7, 12, 13, 15 (ver diagrama em States)
- observability: n/a - não solicitado; nenhum log ou métrica nova nesta task

## Impact

| Front | What changes |
|---|---|
| domain | existing term: "editar work hour" antes disparado por botão dedicado na linha (`onEdit` prop de `WorkHoursTable`), agora por clique na linha + clique no campo - consumidores diretos: `work-hours/page.tsx` (`handleEdit`), `WorkHoursTable`, `WorkHourForm` |
| tests | `work-hours-table.test.tsx` - 3 testes buscam `getByRole("button", { name: "edit workHour" })`, precisam ser reescritos pra simular clique/Enter na linha |
| tests | `work-hours/__tests__/page.test.tsx` - mock de `WorkHoursTable` e o teste "should open edit modal..." (linhas ~121-126, ~258-273) usam o botão "edit work hour", precisam simular clique na linha |
| tests | `work-hour-form.test.tsx` - testes do modo edição reescritos de novo na revisão (removidos os que testavam clique-por-campo/visualização; adicionados os de Cancelar e inputs sempre editáveis) |
| stored data | nothing to migrate - nenhuma mudança de schema, DTO ou payload persistido |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| ~~Padrão de interação visualizar→editar-por-campo com salvar único~~ - revertido nesta revisão antes de chegar à `main`; nunca virou precedente pra outro código | - | - |

None além disso é porta de mão única - inputs sempre editáveis e botão "Cancelar" são UI comum já
usada em outros modais do app (ex.: `AlertDialogCancel`), sem contrato ou schema novo.

## Sources

- Pedido do usuário nesta conversa - define o comportamento base: sem botão de editar na tabela,
  clique na linha abre modal de edição
- Respostas às perguntas de esclarecimento nesta conversa (versão original, revertida) -
  `user delegated`: múltiplos campos podem ficar em edição simultânea com um único botão "Salvar"
  (critério 10, mantido); work hours faturadas ficam com campos desabilitados e aviso fixo
  reaproveitando `cannotEditInvoiced` (critério 6, mantido - só a forma de desabilitar mudou)
- Pedido de revisão do usuário, depois de ver a primeira implementação construída e verificada -
  reverte o padrão visualizar→editar-por-campo (critérios 5-9, 14 originais): inputs sempre
  editáveis, botão "Salvar" sempre visível, novo botão "Cancelar" (critérios 5, 6, 7, 12, 15
  revisados)

Esta task é o registro da decisão. Se um documento vinculado divergir, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 1 | open | O modal em modo de visualização deve exibir `client`/`project` como informação somente-leitura, já que o formulário de edição atual não inclui esses campos? | Assumido que não - o modal mostra apenas os mesmos 3 campos que `WorkHourForm` já expõe hoje no modo edição: `date`, `hours`, `description` |
