# Work Hours - Start/End Time Entry

Sources:

- Conversation with o usuário (esta sessão) - define o escopo: adicionar modo de lançamento por
  hora inicial e hora final ao `WorkHourForm`, mantendo o modo de duração existente, com
  preenchimento automático de minutos quando só a hora for digitada.
- `.tasks/work-hours-start-end-time.md` (tlc-plan, mesma sessão) - grounding no código já feito:
  schema, DTOs, `WorkHourForm`, ausência prévia de `startTime`/`endTime`; decisões já tomadas
  reaproveitadas abaixo.

## Problem

Hoje, lançar uma hora trabalhada exige informar a duração da sessão já convertida - "quanto
tempo durou" - mesmo quando o que a pessoa sabe de cabeça é a que horas começou e a que horas
terminou (ex.: "9h às 12h30"), obrigando a fazer a subtração antes de digitar. O mesmo input
(`hours`, mascarado como `HH:mm` em `work-hour-form.tsx:49-51`) também exige os 4 dígitos
completos pra passar na validação - digitar só a hora (ex.: "8") e sair do campo deixa o
formulário em erro até completar os minutos, mesmo quando a sessão durou um número fechado de
horas.

O formulário de lançar horas (criação e edição, ambos via `WorkHourForm`) passa a oferecer dois
modos de entrada, escolhidos por um seletor: o modo "Duração" de hoje, inalterado, e um novo modo
"Hora inicial e hora final", que calcula a duração automaticamente a partir dos dois horários
digitados. Nos três campos no formato `HH:mm` (duração, hora inicial, hora final), digitar só a
hora e sair do campo completa os minutos com zero automaticamente.

## Out of scope

| Excluded | Why |
| --- | --- |
| Exibir hora inicial/hora final como coluna na tabela de listagem (`work-hours-table.tsx`) | Não solicitado; a feature cobre só a entrada de dados no formulário |
| Recalcular `hours` no servidor a partir de `startTime`/`endTime` | Ver `Flow` - o servidor só valida formato/ordem, `hours` continua confiado ao cliente |
| Corrigir outras mensagens de erro do formulário ainda não traduzidas (ex.: "Please select a date", "Project is required") | Fora do pedido; só a mensagem de formato de hora é tocada porque passa a ser compartilhada pelos três campos |
| Sessões que cruzam a meia-noite (hora final ≤ hora inicial) | Ver `Assumptions` - rejeitadas por decisão do usuário |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Sessão com hora final ≤ hora inicial (cruzando a meia-noite, ex.: início 23:00, fim 01:00) | Rejeitar com erro de validação, cliente e servidor - sem cálculo de duração com virada de dia | Decisão do usuário nesta conversa: mais simples e consistente com `date` representar um único dia | y |
| O seletor de modo (duração/intervalo) fica travado no modo em que o registro foi salvo, ou continua editável durante a edição? | Continua interativo - o usuário pode converter um registro salvo em duração pra intervalo e vice-versa durante a edição | Mesmo componente de seletor usado na criação; nenhum padrão existente do app trava um controle assim, e travar exigiria justificativa que ninguém levantou | n |
| O que acontece com o(s) campo(s) do outro modo ao trocar de modo em criação/edição | Intervalo → Duração: o campo de duração é pré-preenchido com o `HH:mm` já computado. Duração → Intervalo: `startTime`/`endTime` ficam vazios (não dá pra derivar dois horários de uma duração única) | Evita reentrada de um dado já conhecido; não existe forma de decompor uma duração em dois horários de relógio arbitrários | n |

**Open questions:** none - all resolved or logged above.

## Criteria

### S1: Selecionar o modo de lançamento (P1)

**Acceptance Criteria**

1. The `WorkHourForm` SHALL display an entry-mode selector with two options - "Duração" and
   "Hora inicial e hora final" - above the hours section, in both create and edit.
2. WHEN a new work hour is being created THEN the system SHALL default the selector to
   "Duração".
3. WHEN "Duração" is selected THEN the system SHALL show only the existing masked `HH:mm`
   duration input, unchanged from current behaviour.
4. WHEN "Hora inicial e hora final" is selected THEN the system SHALL show two masked `HH:mm`
   inputs - "Hora inicial" and "Hora final" - and hide the duration input.
5. WHEN "Duração" is selected and the form is submitted THEN the system SHALL omit `startTime`
   and `endTime` from the request body.

**Independent test:** abrir o formulário de criação, alternar entre os dois modos e conferir que
os campos certos aparecem/somem, sem submeter.

### S2: Lançar por hora inicial e hora final (P1)

**Acceptance Criteria**

6. WHEN "Hora inicial e hora final" is selected with both fields in valid `HH:mm` format and `endTime` strictly after `startTime`, and the form is submitted, THEN the system SHALL send `hours` computed as `(endTime − startTime)` in decimal hours, plus `startTime` and `endTime` as the two entered `HH:mm` strings.
7. IF `endTime` is not strictly after `startTime` (equal, earlier, or crossing midnight) THEN the system SHALL block submission and display a validation error under "Hora final" ("A hora final deve ser depois da hora inicial").
8. The system SHALL persist `startTime`/`endTime` as `HH:mm` strings for a `WorkHour` created or
   updated in interval mode, and `null` for both in duration mode.

**Independent test:** criar um lançamento em modo intervalo com horários válidos e conferir
`hours`, `startTime`, `endTime` persistidos; repetir com hora final igual/anterior à inicial e
conferir o bloqueio.

### S3: Editar um lançamento existente (P2)

**Acceptance Criteria**

9. WHEN a `WorkHour` with non-null `startTime`/`endTime` is opened for editing THEN the system SHALL pre-select "Hora inicial e hora final" with both fields pre-filled from the stored values.
10. WHEN a `WorkHour` with null `startTime`/`endTime` is opened for editing THEN the system SHALL pre-select "Duração", with the existing single-input behaviour unchanged.
11. WHILE the `WorkHour` being edited is already invoiced (`isInvoiced` true) THE system SHALL keep the mode selector and both new inputs non-interactive, same as the existing duration field today (`cannotEditInvoiced` alert applies).
12. WHEN in edit mode with interval selected and only `startTime` or only `endTime` changes THEN the system SHALL include the recomputed `hours` in the `PATCH` payload together with whichever time field(s) changed.
13. WHEN the user clicks the existing "Cancelar" button in edit mode THEN the system SHALL also reset the entry-mode selector to whichever mode the `WorkHour` had when the modal opened, in addition to the existing field reset (`reset()`).

**Independent test:** abrir pra edição um registro em modo duração e um em modo intervalo, e
conferir que cada um abre pré-selecionado no seu próprio modo com os valores certos; trocar de
modo e clicar Cancelar, e conferir que volta ao modo original.

### S4: Preencher minutos automaticamente com zero (P1)

**Acceptance Criteria**

14. WHEN any `HH:mm`-shaped field (duração, hora inicial, hora final) contains only digits with no colon - 1 or 2 characters, e.g. "8" or "08" - and loses focus or the form is submitted, THEN the system SHALL rewrite the value to "HH:00" (e.g. "08:00") before format validation runs, and the input SHALL reflect the rewritten value.
15. IF the same field already contains a colon (partial or complete, e.g. "8:3") THEN the system SHALL NOT rewrite it - the existing `HH:mm` format validation applies unchanged.

**Independent test:** digitar "8" em cada um dos três campos, sair do campo, e conferir que vira
"08:00"; digitar "8:3" e conferir que não é reescrito.

### S5: Validar hora inicial e hora final no servidor (P1)

**Acceptance Criteria**

16. IF `POST /work-hours` or `PATCH /work-hours/:id` receives `startTime` or `endTime` not matching `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$` THEN the system SHALL return `400` with a validation error message, in the same shape as the existing `hours` validation errors.
17. IF `POST /work-hours` receives exactly one of `startTime`/`endTime` (the other omitted) THEN the system SHALL return `400` and SHALL NOT create the record.
18. IF `PATCH /work-hours/:id` would leave the record with exactly one of `startTime`/`endTime` set - combining whatever the DTO provides with whatever the existing record already holds for the field the DTO omits - THEN the system SHALL return `400` and SHALL NOT update the record.
19. IF the effective `startTime`/`endTime` pair - the DTO's values on `POST`, or the DTO merged with the existing record's values on `PATCH` - has `endTime` not strictly after `startTime` THEN the system SHALL return `400` and SHALL NOT create or update the record.

**Independent test:** chamar a API diretamente (sem passar pelo form) com combinações inválidas de
`startTime`/`endTime` - incluindo um `PATCH` que só envia um dos dois campos sobre um registro já
existente com os dois preenchidos (deve passar) e sobre um que só tem um preenchido (deve
rejeitar) - e conferir `400`/sucesso em cada caso.

## Traceability

| ID | Slice | Criteria | Status |
| --- | --- | --- | --- |
| WH-01 | S1 | 1, 2, 3, 4, 5 | Pending |
| WH-02 | S2 | 6, 7, 8 | Pending |
| WH-03 | S3 | 9, 10, 11, 12, 13 | Pending |
| WH-04 | S4 | 14, 15 | Pending |
| WH-05 | S5 | 16, 17, 18, 19 | Pending |

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| `WorkHourForm` (modal de criar/editar) | empty state | n/a - o formulário sempre abre com `defaultValues` já resolvidos, padrão existente |
| `WorkHourForm` (modal de criar/editar) | loading state | existing - `activeMutation.isPending` já desabilita o submit e mostra o spinner, cobre o formulário inteiro |
| `WorkHourForm` (modal de criar/editar) | error state | AC 7, 16, 17, 18 (client) + existing - `Alert` de `errorSaving` já cobre erro de backend |
| `WorkHourForm` (modal de criar/editar) | unauthorised state | existing - guard de autenticação do endpoint inalterado |
| `WorkHourForm` (modal de criar/editar) | destructive action confirma antes | n/a - nenhuma ação destrutiva nesta superfície |
| `WorkHourForm` (modal de criar/editar) | densidade/ordenação | n/a - formulário único, sem lista |
| API `POST /work-hours` | forma de resposta | AC 6, 8 (corpo estendido com `startTime`/`endTime` opcionais) |
| API `POST /work-hours` | forma de erro e códigos | AC 16, 17, 18, 19 |
| API `POST /work-hours` | quem pode chamar | existing - guard de autenticação inalterado |
| API `POST /work-hours` | versionamento | n/a - endpoint interno, sem consumidor externo |
| API `POST /work-hours` | comportamento no rate limit | n/a - não implementado em nenhum endpoint do projeto |
| API `PATCH /work-hours/:id` | forma de resposta | AC 12 |
| API `PATCH /work-hours/:id` | forma de erro e códigos | AC 16, 17, 18, 19 + existing - bloqueio de work hour faturada inalterado |
| API `PATCH /work-hours/:id` | quem pode chamar | existing - ownership por `userId` inalterado |

## Flow

Reaproveita o padrão já existente de `hours` computado e confiado no cliente - a própria conversão
`HH:mm` → decimal da duração de hoje nunca é reconferida no servidor - e o padrão de
Salvar/Cancelar sempre visíveis já existente em `WorkHourForm` (revertido de um modo de edição
por campo em `f2e4eab`, de volta a inputs sempre editáveis). Só o lado de entrada do campo de
horas ganha um caminho alternativo; a máscara, os DTOs e o model Prisma são estendidos, não
substituídos.

1. Entrada do usuário → `WorkHourForm` (exists,
   `apps/frontend/src/features/time-tracking/components/work-hour-form.tsx`) - captura a máscara
   única de duração ou o par `startTime`/`endTime`, conforme o modo selecionado, e computa
   `hours` no cliente.
2. `WorkHourForm` → `useCreateTimeEntry`/`useUpdateTimeEntry` (exists) - envia
   `{hours, startTime?, endTime?, ...}` via `POST`/`PATCH`.
3. `CreateWorkHourDto`/`UpdateWorkHourDto` (exists, estendido) - valida `hours` como hoje, mais o
   formato, a presença pareada e a ordem de `startTime`/`endTime` (door 1).
4. `WorkHoursService.create`/`.update` (exists) - persiste `startTime`/`endTime` junto com `hours`
   na linha de `WorkHour`; ownership, bloqueio de faturada e notificação de threshold
   inalterados.
5. out: o `WorkHour` persistido (com os dois campos novos) volta na resposta;
   `work-hours-table.tsx` (exists, inalterado) continua lendo só `hours`.

## Relations

Nenhuma entidade ou relacionamento novo. `WorkHour` ganha dois campos opcionais (door 1 abaixo em
`Landing`) - sem cardinalidade nova e sem constraint one-way além da registrada lá.

## Surface

| Route | In | Out | Status |
| --- | --- | --- | --- |
| `POST /work-hours` | `date`, `hours`, `description?`, `clientId`, `projectId?`, `startTime?`, `endTime?` | `WorkHour` persistido (`id`, `date`, `hours`, `startTime`, `endTime`, `description`, `clientId`, `projectId`, `createdAt`, `updatedAt`) | `201`, `400` |
| `PATCH /work-hours/:id` | `date?`, `hours?`, `description?`, `startTime?`, `endTime?` | `WorkHour` atualizado (mesma forma) | `200`, `400`, `404` |

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| `WorkHour` ganha duas colunas nullable guardando texto `HH:mm` 24h | Migration Prisma: `startTime String?`, `endTime String?` no model `WorkHour` (`apps/backend/prisma/schema.prisma`) | Combinar com `date` em duas colunas `DateTime` - rejeitado porque `date` já só rastreia o dia (sem convenção de horário-com-timezone no codebase) e um `DateTime` traria fuso que a feature não precisa, já que `hours` continua o único valor que faturamento/estatísticas consomem |
| Seletor de dois modos ("Duração" / "Hora inicial e hora final") na seção de horas do `WorkHourForm` | Estado local de componente alternando qual bloco de inputs renderiza e alimenta `hours` antes do submit; em edição, pré-selecionado conforme o registro ter ou não `startTime`/`endTime` | Mostrar duração e hora inicial/final sempre juntos e editáveis - rejeitado por contrariar "manter a possibilidade de só informar a duração" como alternativa, e por deixar ambíguo qual valor vale quando os dois estão preenchidos |

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: `startTime`/`endTime` no `WorkHour` - strings opcionais `HH:mm` (24h) do horário de início/fim da sessão, vivem em `apps/backend/prisma/schema.prisma` e nos DTOs de create/update; consumidores: `WorkHourForm`, `WorkHoursService.create`/`update` |
| domain | existing term: a mensagem "Invalid time format (HH:mm)" (hoje hardcoded em inglês em `hoursFieldSchema`, `work-hour-form.tsx:51`) passa a vir de uma chave i18n (`workHours.invalidTimeFormat`, en + pt-BR), porque o mesmo validador passa a ser compartilhado pelos campos de duração, hora inicial e hora final - nenhum outro consumidor depende da string hoje |
| stored data | nothing to migrate - migração adiciona duas colunas nullable a uma tabela populada; linhas existentes recebem `null` automaticamente, sem constraint dependente de dado |
