# Arredondamento configurável de horas lançadas

Sources:

- `.tasks/mw-3-arredondamento-horas.md` - task completa (critérios, Decided, Unresolved); todo
  critério abaixo corresponde 1:1 a um critério numerado lá.
- MW-3 (Jira) - título original, sem descrição própria; já normalizado na task acima.

## Out of scope

- Re-arredondar lançamentos já existentes quando o incremento muda - task `Out of scope`.
- Preservar o valor bruto digitado - task `Decided`, sobrescreve `hours`.
- Corrigir a falta de `Min`/`Max` em `update-work-hour.dto.ts` - lacuna pré-existente, não tocada.
- Preview do valor arredondado no client antes de salvar - arredondamento é só server-side.
- Modo de arredondamento pra cima/pra baixo como opção do usuário - task `Unresolved 1`.

## Landing

Toca `settings/` (schema, dto, service) e `work-hours/` (service, novo util de arredondamento) no
backend, e `settings-form.tsx`/`services/settings.ts` no frontend. Reusa o padrão de default
hardcoded já usado por `alertHours` em `SettingsService`, e o padrão de `forwardRef` já existente
entre `SettingsModule`/`WorkHoursModule` (agora nos dois sentidos).

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Coluna `Settings.roundingIncrementMinutes` | `Int @default(0)` em `Settings`, valores permitidos `{0,5,10,15,30,60}` via `@IsIn` em `CreateSettingsDto` (herdado por `UpdateSettingsDto`) | `Int?` nulo pra "desligado" - rejeitado, duplica tratamento de null em DTO/service/frontend em vez de reusar o `@default` já usado por `alertHours` |
| Arredondamento calculado e persistido server-side em `WorkHoursService.create`/`update`, via novo `roundHoursToIncrement` em `work-hours/utils/round-hours.util.ts`, sobrescrevendo `hours` | nenhum campo novo em `WorkHour`; valor bruto digitado não é retido | arredondar no client em `work-hour-form.tsx` antes do `POST` - rejeitado, não cobre chamada direta à API e duplica a fórmula em dois lugares |

Ambas as linhas já vêm decididas da task; nada novo apareceu na leitura do código além delas.

## Test policy (proposed - the repo does not declare this)

Evidence:
- `apps/backend/src/invoices/invoices.service.ts` (`computedAmount`): decide o valor a partir de
  `wh.hours * rate`, 1 branch por `projectId` presente/ausente - decisão, testada hoje em
  `invoices.service.spec.ts` com prisma mockado à mão (sem `TestingModule`, sem transporte real).
  Esse é o único analógico de teste de lógica de negócio no repo hoje; sigo o mesmo formato.
- `apps/backend/src` inteiro: só existe um `*.e2e-spec.ts` (`app.e2e-spec.ts`, health-check trivial)
  e zero `*.dto.spec.ts`/`*.controller.spec.ts` fora de `invoices/`. Não há convenção de teste
  cruzando a fronteira HTTP real (supertest) pra nenhuma feature hoje - é uma lacuna do repo
  inteiro, não desta feature. Sigo a prática existente: decisão provada no nível do service/DTO,
  com o `ValidationPipe` global (inalterado) confiado pelo framework pra mapear erro de validação
  em `400` - ninguém no repo re-prova esse mapeamento hoje.
- `SettingsController`/`WorkHoursController`: encaminham o `dto` inteiro pro service sem nenhuma
  decisão própria (nenhuma linha muda nos controllers nesta feature) - instrumentation, sem prova
  própria.
- `work-hours/utils/round-hours.util.ts` (novo): decide o valor arredondado - 6 branches (um por
  incremento em `{0,5,10,15,30,60}`) mais o caso de empate no meio do incremento - decisão isolada,
  sem I/O, a mais densa da feature.
- `WorkHoursService.create`/`update`: decide aplicar arredondamento e decide rejeitar quando o
  resultado cai abaixo de `0.1` - 2 branches, alcançada via `POST /work-hours` e
  `PATCH /work-hours/:id`.
- `SettingsService.findByUserId`/`update`: decide o default `0` quando não existe `Settings` -
  1 branch, mesma forma já usada por `alertHours`.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| `round-hours.util.ts` (decide, não alcançado direto por rota) | um no próprio nível | um caso testado por incremento do conjunto `{0,5,10,15,30,60}` + o caso de empate |
| `WorkHoursService.create`/`update` (decide, alcançado por `POST`/`PATCH /work-hours(:id)`) | um no próprio nível (service, prisma mockado) | um caso por combinação incremento-configurado × dentro-do-mínimo/abaixo-do-mínimo |
| `SettingsService.findByUserId`/`update` (decide, alcançado por `GET`/`PATCH /settings`) | um no próprio nível | ausência de `Settings` e presença de `Settings`, cada um com uma asserção |
| `CreateSettingsDto`/`UpdateSettingsDto` (decide via `@IsIn`, alcançado por `POST`/`PATCH /settings`) | um chamando `class-validator`'s `validate()` direto na classe | cada valor aceito do conjunto + um valor fora dele |
| `SettingsController`/`WorkHoursController` (instrumentation) | nenhuma própria | coberta pela prova do service que ela chama |

Cost: 5 arquivos de teste novos (`round-hours.util.spec.ts`, `settings.service.spec.ts`,
`work-hours.service.spec.ts`, `create-settings.dto.spec.ts`, mais os casos novos dentro de
`invoices.service.spec.ts` continuando verde sem alteração). Sem essas linhas, a tabela de
decisão do arredondamento (a mais densa da feature) ficaria provada só de passagem por quem
chamasse o service, o que não fecha nem o caso de empate nem o de abaixo-do-mínimo.

> Estas linhas são o piso sob o qual eu construo - aprovar o checklist já basta pra isso. Gravar
> elas em algum guia do repo (não existe um hoje pra testes de service) precisa de um "sim"
> explícito à parte, e viraria commit próprio antes do build. Sem resposta, eu construo sob elas e
> não crio o arquivo de guia.

## Checks

### S1 - Configuração de arredondamento nas Settings · 3 files · ~1.7k

**C1** - Settings mostra o incremento salvo, ou `0` quando não existe registro
Proof: `apps/backend/src/settings/settings.service.spec.ts::"returns roundingIncrementMinutes 0 when no settings row exists"`
Proof: `apps/backend/src/settings/settings.service.spec.ts::"returns the stored roundingIncrementMinutes when a settings row exists"`

**C2** - `PATCH /settings` persiste um `roundingIncrementMinutes` em `{0,5,10,15,30,60}`
Proof: `apps/backend/src/settings/settings.service.spec.ts::"persists roundingIncrementMinutes on update"`
Proof: `apps/backend/src/settings/dto/create-settings.dto.spec.ts::"accepts every value in the allowed set"`

**C3** - `PATCH /settings` rejeita um valor fora de `{0,5,10,15,30,60}`
Proof: `apps/backend/src/settings/dto/create-settings.dto.spec.ts::"rejects a value outside the allowed set"`

### S2 - Arredondamento aplicado ao gravar horas · 5 files · ~6.6k

**C4** - `POST /work-hours` com incremento `N>0` grava `hours` arredondado pro múltiplo de `N`
minutos mais próximo (2 casas decimais)
Proof: `apps/backend/src/work-hours/utils/round-hours.util.spec.ts::it.each` sobre `[5,10,15,30,60]`
Proof: `apps/backend/src/work-hours/work-hours.service.spec.ts::"create persists the rounded hours when a rounding increment is configured"`

**C5** - Com incremento `0`, o valor persistido é o `hours` bruto, sem alteração
Proof: `apps/backend/src/work-hours/utils/round-hours.util.spec.ts::"returns the input unchanged when incrementMinutes is 0"`
Proof: `apps/backend/src/work-hours/work-hours.service.spec.ts::"create persists the raw hours when no rounding increment is configured"`

**C6** - `PATCH /work-hours/:id` arredonda o `hours` editado da mesma forma que na criação
Proof: `apps/backend/src/work-hours/work-hours.service.spec.ts::"update persists the rounded hours when hours is edited and a rounding increment is configured"`

**C7** - Se o arredondamento resultar em menos de `0.1` hora, a requisição é rejeitada e nada é
persistido
Proof: `apps/backend/src/work-hours/work-hours.service.spec.ts::"create rejects when rounding produces less than 0.1 hours"`
Proof: `apps/backend/src/work-hours/work-hours.service.spec.ts::"update rejects when rounding produces less than 0.1 hours"`

**C8** - Arredondar um valor já arredondado devolve o mesmo valor (idempotente)
Proof: `apps/backend/src/work-hours/utils/round-hours.util.spec.ts::"rounding an already-rounded value is idempotent"`

**C9** - O cálculo de fatura usa o `hours` já arredondado gravado na linha, sem lógica de
arredondamento duplicada
Proof: `apps/backend/src/invoices/invoices.service.spec.ts::"computes amount from project hourly rates when amount is not provided"` (existente, permanece verde sem nenhuma mudança em `invoices.service.ts`/`draft-invoice.service.ts` - a ausência de alteração nesses arquivos é o próprio critério)

## Swept

- validation: C2, C3, C7
- failure modes: C7
- idempotency and retry: C8
- authorization: existing - `JwtAuthGuard` + escopo por `req.user.id`, inalterado em ambos os controllers
- concurrency and ordering: not in scope - escrita de `Settings`/`WorkHour` continua single-row por usuário, nenhum multi-writer novo
- data lifecycle: not in scope - `hours` arredondado segue o mesmo ciclo de vida de qualquer valor de `WorkHour`
- external-dependency failure: not in scope - cálculo é local, sem chamada externa
- state transitions: not in scope - nem `WorkHour` nem `Settings` ganham máquina de estados
- observability: not in scope - task `Unresolved 3`, nenhum log novo foi pedido

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| incrementos de arredondamento (6): `0,5,10,15,30,60` | `0` C5 · `5,10,15,30,60` C4 (table-driven) | - |
| conjunto aceito pelo DTO (6): `0,5,10,15,30,60` | C2, table-driven sobre os 6 | - |
| existência de `Settings` (2): ausente, presente | ausente C1 · presente C1 | - |
| caminho de escrita × resultado (4): create-dentro-do-mínimo, create-abaixo, update-dentro, update-abaixo | create-dentro C4 · create-abaixo C7 · update-dentro C6 · update-abaixo C7 | - |

- Claims que citam status code, rota ou response shape: C2, C3, C4, C6, C7 - cada uma provada no
  nível do DTO/service (`validate()` direto ou service com prisma mockado), nunca cruzando um
  transporte HTTP real - o repo inteiro não tem esse tipo de prova hoje (ver `Test policy`), então
  esse é o teto real de rigor disponível sem inventar infraestrutura nova.
- Nenhum outro check afirma mais do que o caso único que sua prova exercita.

## Handoff

Feature pequena: ~8.3k tokens estimados de leitura (soma dos arquivos tocados / 4), bem abaixo dos
150k do orçamento padrão. Build inteiro em um agente só, sem handoff.
