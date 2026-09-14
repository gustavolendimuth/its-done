# Arredondamento configurável de horas lançadas

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

Hoje o usuário lança horas em precisão decimal livre (até 2 casas, ex.: 1.37h) via máscara `HH:mm`,
e todo valor digitado é gravado e faturado exatamente como digitado. Não existe forma de o usuário
padronizar seus lançamentos em blocos fixos (ex.: sempre para o quarto de hora mais próximo) sem
arredondar manualmente antes de digitar. O ticket de origem (MW-3) não declara o problema nem
quem paga por ele — apenas o título "Configuração de arredondamento para o usuário" — então isso
fica registrado como lacuna em `Unresolved`, não inventado aqui.

Com a mudança, a tela de Settings ganha uma preferência de incremento de arredondamento. A partir
daí, todo lançamento de horas criado ou editado é gravado já arredondado para o incremento
escolhido pelo usuário, e esse mesmo valor gravado é o que aparece em relatórios e é usado no
cálculo de fatura — nada muda para quem deixa a preferência desligada (comportamento atual).

9 criterios em 2 slices · 2 one-way doors · 4 open, dos quais 0 bloqueiam

## Criteria

### Configuração de arredondamento nas Settings

1. When o usuário abre Settings, o campo de arredondamento mostra o `roundingIncrementMinutes`
   salvo (`0`, `5`, `10`, `15`, `30` ou `60`), assumindo `0` ("Sem arredondamento") quando ainda não
   existe registro de `Settings` para o usuário — mesmo padrão que `alertHours` já usa hoje.
2. When o usuário salva Settings com `roundingIncrementMinutes` em `{0, 5, 10, 15, 30, 60}`, then
   `PATCH /settings` persiste exatamente esse valor.
3. If o usuário envia `roundingIncrementMinutes` fora de `{0, 5, 10, 15, 30, 60}`, then
   `PATCH /settings` responde `400` com erro de validação e nada é gravado.

### Arredondamento aplicado ao gravar horas

4. Given `roundingIncrementMinutes = N` (`N > 0`), when o usuário cria um lançamento via
   `POST /work-hours` com `hours = H`, then o valor persistido é `H` arredondado para o múltiplo de
   `N` minutos mais próximo, convertido de volta para horas e arredondado a 2 casas decimais (o
   limite já existente do campo `hours`) — para `N` em `{15, 30, 60}` o valor gravado bate
   exatamente no limite de minuto; para `N` em `{5, 10}` o valor gravado fica a no máximo 0.01h
   (36s) do limite exato de minuto, por causa do próprio limite de 2 casas decimais do campo.
5. Given `roundingIncrementMinutes = 0`, when um lançamento é criado ou editado, then o valor
   persistido é exatamente o `hours` bruto enviado, sem alteração — comportamento de hoje.
6. Given `roundingIncrementMinutes = N` (`N > 0`), when o usuário edita `hours` de um lançamento via
   `PATCH /work-hours/:id`, then o valor recém-persistido é o `hours` editado arredondado da mesma
   forma que na criação (critério 4).
7. If o arredondamento resultar em `0` horas, then a requisição é rejeitada da mesma forma que a
   validação `Min(0.1)` já rejeita hoje, e nada é persistido. *(default assumido — ver Unresolved 2)*
8. Always, aplicar o arredondamento sobre um valor já arredondado devolve o mesmo valor — regravar
   um lançamento sem mudar `hours` nunca desloca o valor de novo (arredondamento é idempotente).
9. Always, o valor de fatura calculado a partir de um lançamento (`InvoicesService.create`,
   `DraftInvoiceService.createDraft`) usa o `hours` já arredondado gravado na linha — nenhuma lógica
   de arredondamento é duplicada em nenhum dos dois cálculos de fatura.

## Out of scope

- Re-arredondar retroativamente lançamentos já existentes quando o usuário muda o incremento —
  a mudança só afeta lançamentos criados ou editados depois dela, pra não alterar valores já
  faturados.
- Preservar o valor bruto digitado junto do arredondado — decisão foi sobrescrever `hours` (ver
  `Decided`); guardar o valor original é um pedido separado, maior escopo.
- Corrigir a falta de validação de min/max em `update-work-hour.dto.ts` — lacuna pré-existente, não
  relacionada ao arredondamento.
- Preview do valor arredondado no formulário antes de salvar — arredondamento é só server-side; a
  tela mostra o valor já arredondado depois que a lista recarrega.
- Modo de arredondamento sempre-para-cima ou sempre-para-baixo como opção do usuário — ver
  Unresolved 1.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen Settings | loading state | existing - skeleton já usado por `useSettings` |
| screen Settings | error state | existing - padrão de toast/validação já usado nos campos de `alertHours`/email |
| screen Settings | unauthorised state | existing - guard de rota autenticada, inalterado |
| screen Settings | destructive action confirma antes | n/a - preferência não é ação destrutiva |
| screen Work Hours (form) | qualquer estado novo | n/a - nenhum estado novo; arredondamento é transparente ao form, aplicado no servidor |
| API `PATCH /settings` | response/error shape | existing - erro `400` de `class-validator`, inalterado |
| API `PATCH /settings` | quem pode chamar | existing - `JwtAuthGuard` + escopo por `req.user.id` |
| API `PATCH /settings` | versionamento | n/a - API interna autenticada, sem contrato público versionado |
| API `PATCH /settings` | rate limit | n/a - não há rate limiting nesta API hoje |
| API `POST /work-hours` | response shape | 4 |
| API `POST /work-hours` | error shape | 7 |
| API `POST /work-hours` | quem pode chamar | existing - `JwtAuthGuard` |
| API `POST /work-hours` | rate limit | n/a - não há rate limiting nesta API hoje |
| API `PATCH /work-hours/:id` | response shape | 6 |
| API `PATCH /work-hours/:id` | error shape | 7 |

## Swept

- validation: 3, 7
- failure modes: existing - ausência de `Settings` já resolvida por default hardcoded em `SettingsService.findByUserId`, arredondamento cai em `0` (desligado) no mesmo caso
- idempotency and retry: 8
- authorization: existing - `JwtAuthGuard` + escopo por `req.user.id`, inalterado tanto em `settings` quanto em `work-hours`
- concurrency and ordering: n/a - escrita de `Settings` e de `WorkHour` já é single-row por usuário; nada nesta feature introduz concorrência multi-writer nova
- data lifecycle: n/a - `hours` arredondado tem o mesmo ciclo de vida de qualquer valor de `WorkHour` hoje, sem retenção/expiração nova
- external-dependency failure: n/a - cálculo é puramente local, sem chamada a serviço externo
- state transitions: n/a - nem `WorkHour` nem `Settings` têm máquina de estados afetada
- observability: Unresolved 3

## Impact

| Front | What changes |
|---|---|
| domain | new term: `roundingIncrementMinutes` - incremento de arredondamento preferido do usuário (`0`=desligado, ou `5`/`10`/`15`/`30`/`60` minutos), vive em `Settings` |
| domain | existing term: `WorkHour.hours` - antes significava "exatamente o que o usuário digitou", agora pode significar "o valor digitado arredondado para o incremento do usuário" - todo leitor de `hours` (`InvoicesService.create`, `DraftInvoiceService.createDraft`, `WorkHoursService.getStats`, `work-hour-card.tsx`, `lib/utils.ts`) continua funcionando sem mudança porque só lê o valor já gravado, mas o usuário pode ver um número diferente do que digitou |
| stored data | nada a migrar nas linhas de `WorkHour` existentes - só passam a ser arredondadas as que forem criadas ou editadas depois da mudança; a nova coluna `Settings.roundingIncrementMinutes` recebe o default `0` nas linhas já existentes via migration |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| Novo campo em `Settings` guarda a preferência | `roundingIncrementMinutes Int @default(0)`, valores permitidos `{0,5,10,15,30,60}` | Campo `Int?` nulo representando "desligado" - rejeitado por duplicar tratamento de null em DTO/service/frontend em vez de reusar o padrão de `@default` já usado em `alertHours` |
| Arredondamento aplicado no momento de gravar, em `WorkHoursService.create`/`update`, sobrescrevendo `hours` | Nenhum campo novo em `WorkHour`; o valor bruto digitado não é preservado | Aplicar no client (`work-hour-form.tsx`) antes do `POST` - rejeitado porque não cobre chamadas diretas à API e duplicaria a fórmula de arredondamento em dois lugares |

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `PATCH /settings` | `roundingIncrementMinutes` (`0\|5\|10\|15\|30\|60`) | `roundingIncrementMinutes` | `200`, `400` | 2, 3 |
| `POST /work-hours` | `hours` (inalterado) | `hours` (agora possivelmente arredondado) | `201`, `400` | 4, 7 |
| `PATCH /work-hours/:id` | `hours` (inalterado) | `hours` (agora possivelmente arredondado) | `200`, `400` | 6, 7 |

## Sources

- MW-3 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-3) - título da feature:
  "Configuração de arredondamento para o usuário"; sem descrição, sem anexos, sem documento
  vinculado.
- Conversa de planejamento (esta sessão) - `user delegated`: arredondamento altera o valor
  salvo/faturado, não é só exibição; incrementos são uma lista fixa `{5,10,15,30,60}` minutos com
  padrão desligado (`0`).

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 1 | open | Modo de arredondamento: sempre pro mais próximo, ou o usuário também escolhe pra cima/pra baixo? | Critérios 4 e 6 assumem "mais próximo" (round half) como único modo |
| 2 | open | Quando o arredondamento zera as horas (critério 7), a requisição deve ser rejeitada ou o valor deve subir pro mínimo representável do incremento? | Critério 7 assume rejeição, espelhando a mensagem de erro já existente do `Min(0.1)` |
| 3 | open | Faz sentido registrar/logar quando o valor arredondado difere do digitado, pra suporte conseguir explicar uma fatura? | Nenhum log novo foi assumido; comportamento atual de logging estruturado permanece inalterado |
| 4 | open | O ticket MW-3 não declara por que essa configuração é necessária nem quem sente esse problema hoje - qual é o cenário real que motivou o pedido? | Intent assume, sem confirmação, que é a necessidade de faturar em blocos fixos (ex.: consultoria cobrando por quarto de hora) |
