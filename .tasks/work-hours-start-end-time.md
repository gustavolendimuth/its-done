# Lançar horas por hora inicial e hora final, com preenchimento automático de minutos

> Build this with **tlc-implement**.
> Cada critério abaixo vira um check com uma prova, referenciado pelo número. Nada em
> `Unresolved` é resolvido durante a implementação.

## Intent

Hoje, lançar uma hora trabalhada exige informar a duração da sessão já convertida —
"quanto tempo durou" — mesmo quando o que a pessoa sabe de cabeça é a que horas começou e a que
horas terminou (ex.: "9h às 12h30"), obrigando a fazer a subtração antes de digitar. O mesmo
input (`hours`, mascarado como `HH:mm` em `work-hour-form.tsx`) também exige os 4 dígitos
completos pra passar na validação — digitar só a hora (ex.: "8") e sair do campo deixa o
formulário em erro até completar os minutos, mesmo quando a sessão durou um número fechado de
horas.

O formulário de lançar horas (criação e edição, ambos usando `WorkHourForm`) passa a oferecer
dois modos de entrada, escolhidos por um seletor: o modo "Duração" de hoje, inalterado, e um novo
modo "Hora inicial e hora final", que calcula a duração automaticamente a partir dos dois
horários digitados. Nos três campos no formato `HH:mm` (duração, hora inicial, hora final),
digitar só a hora e sair do campo completa os minutos com zero automaticamente.

16 critérios em 5 slices · 4 portas de mão única · 0 abertos, dos quais 0 bloqueiam

## Criteria

### Selecionar o modo de lançamento (duração ou hora inicial/final)

1. Sempre, o formulário de lançar horas (criação e edição) exibe um seletor com duas opções —
   "Duração" e "Hora inicial e hora final" — acima do campo de horas, com "Duração" selecionado
   por padrão numa criação nova.
2. Dado "Duração" selecionado, então o formulário mostra só o input mascarado `HH:mm` já
   existente hoje (sem mudança de comportamento) e valida/envia `hours` como já faz atualmente.
3. Dado "Hora inicial e hora final" selecionado, então o formulário mostra dois inputs mascarados
   `HH:mm` — "Hora inicial" e "Hora final" — no lugar do input único de duração, que fica oculto.
4. Dado "Duração" selecionado, quando o usuário envia o formulário, então o corpo da requisição
   não inclui `startTime`/`endTime` (omitidos ou `null`).

### Lançar por hora inicial e hora final

5. Dado "Hora inicial e hora final" selecionado com os dois campos preenchidos em formato válido
   e a hora final estritamente depois da hora inicial, quando o usuário envia o formulário, então
   `hours` enviado ao backend é `(hora final − hora inicial)` em horas decimais, e o corpo da
   requisição também inclui `startTime` e `endTime` como as duas strings `HH:mm` digitadas.
6. Se a hora final não for estritamente depois da hora inicial (igual, anterior, ou cruzando a
   meia-noite — ex.: início 23:00, fim 01:00), então o envio é bloqueado com uma mensagem de erro
   sob o campo "Hora final" (`endTimeBeforeStart`: "A hora final deve ser depois da hora
   inicial") e nenhuma requisição é enviada.
7. Sempre, uma WorkHour criada ou atualizada em modo "Hora inicial e hora final" persiste
   `startTime` e `endTime` (strings `HH:mm`) na linha; uma criada em modo "Duração" persiste
   `null` nos dois campos.

### Editar um lançamento existente

8. Dado uma WorkHour existente com `startTime`/`endTime` preenchidos, quando o usuário abre o
   campo de horas pra editar, então o seletor de modo abre em "Hora inicial e hora final" com os
   dois campos pré-preenchidos com os valores armazenados.
9. Dado uma WorkHour existente com `startTime`/`endTime` nulos, quando o usuário abre o campo de
   horas pra editar, então o seletor de modo abre em "Duração", com o comportamento do input
   mascarado único inalterado.
10. Dado a WorkHour sendo editada já faturada (`isInvoiced` true), então o seletor de modo e os
    dois novos campos permanecem não-interativos, do mesmo jeito que o campo de duração já se
    comporta hoje (o alerta `cannotEditInvoiced` já existente continua valendo).
11. Dado o modo "Hora inicial e hora final" em edição, quando o usuário altera só `startTime` ou
    só `endTime`, então o `PATCH` disparado ao salvar inclui `hours` recalculado junto com o(s)
    campo(s) de horário alterado(s) — `hours` é sempre marcado como alterado quando qualquer um
    dos dois campos de horário muda.

### Preencher minutos automaticamente com zero

12. Dado qualquer um dos três campos no formato de hora (duração, hora inicial, hora final)
    contendo só dígitos sem dois-pontos — 1 ou 2 caracteres (ex.: "8" ou "08") —, quando o campo
    perde o foco ou o formulário é enviado, então o valor é reescrito para "HH:00" (ex.:
    "08:00") antes da validação de formato rodar, e o input reflete o valor reescrito.
13. Dado o mesmo campo já contendo dois-pontos (parcial ou completo, ex.: "8:3"), então nenhuma
    reescrita automática acontece — a validação de formato `HH:mm` já existente continua se
    aplicando sem mudança.

### Validar hora inicial e hora final no servidor

14. Se `POST /work-hours` ou `PATCH /work-hours/:id` recebe `startTime` ou `endTime` que não casa
    com `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$`, então a API retorna 400 com uma mensagem de
    validação, na mesma forma das mensagens de erro já existentes pra `hours`.
15. Se a requisição contém exatamente um dos dois campos (`startTime` sem `endTime`, ou
    vice-versa), então a API retorna 400 e nenhum registro é criado/atualizado.
16. Se ambos os campos estão presentes e `endTime` não é estritamente posterior a `startTime`,
    então a API retorna 400 e nenhum registro é criado/atualizado — mesma regra do critério 6,
    aplicada no servidor.

## Out of scope

- Exibir hora inicial/hora final como coluna na tabela de listagem de horas
  (`work-hours-table.tsx`) - não foi pedido; a task cobre só a entrada de dados no formulário.
- Recalcular `hours` no servidor a partir de `startTime`/`endTime` - decisão registrada em
  `Decided`; o servidor só valida formato e ordem, não recomputa a duração.
- Corrigir as outras mensagens de erro do formulário que já não são traduzidas hoje (ex.: "Please
  select a date", "Project is required") - fora do pedido; só a mensagem de formato de hora é
  tocada porque passa a ser compartilhada pelos três campos de horário.
- Sessões que cruzam a meia-noite (hora final ≤ hora inicial) - rejeitadas (`Decided`, critério
  6, 16), não suportadas nesta task.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| `WorkHourForm` (modal de criar/editar) | empty state | n/a - o formulário sempre abre com `defaultValues` já resolvidos, padrão existente |
| `WorkHourForm` (modal de criar/editar) | loading state | existing - `activeMutation.isPending` já desabilita o submit e mostra o spinner, cobre o formulário inteiro |
| `WorkHourForm` (modal de criar/editar) | error state | 6, 14, 15, 16 (client) + existing - `Alert` de `errorSaving` já cobre erro de backend |
| `WorkHourForm` (modal de criar/editar) | unauthorised state | existing - guard de autenticação do endpoint inalterado |
| `WorkHourForm` (modal de criar/editar) | destructive action confirma antes | n/a - nenhuma ação destrutiva nesta superfície |
| `WorkHourForm` (modal de criar/editar) | densidade/ordenação | n/a - formulário único, sem lista |
| API `POST /work-hours` | forma de resposta | 5, 7 (corpo estendido com `startTime`/`endTime` opcionais) |
| API `POST /work-hours` | forma de erro e códigos | 14, 15, 16 - mesma forma de exceção de validação já usada por `hours` |
| API `POST /work-hours` | quem pode chamar | existing - guard de autenticação inalterado |
| API `POST /work-hours` | versionamento | n/a - endpoint interno, sem consumidor externo |
| API `POST /work-hours` | comportamento no rate limit | n/a - não implementado em nenhum endpoint do projeto |
| API `PATCH /work-hours/:id` | forma de resposta | 11 |
| API `PATCH /work-hours/:id` | forma de erro e códigos | 14, 15, 16 + existing - bloqueio de work hour faturada inalterado |
| API `PATCH /work-hours/:id` | quem pode chamar | existing - ownership por `userId` inalterado |

## Swept

- validation: 5, 6, 12, 13, 14, 15, 16
- failure modes: 6, 15, 16 - erro 400 sem escrita parcial
- idempotency and retry: n/a - `create`/`update` já não são idempotentes hoje; nada muda
- authorization: existing - `WorkHoursService` já escopa por `userId` em `create`/`update`,
  inalterado pelos novos campos
- concurrency and ordering: n/a - nenhum cenário novo de edição concorrente; o bloqueio por
  faturamento já existente (critério 10) cobre a única corrida já tratada hoje
- data lifecycle: 7 - migração adiciona colunas nullable, linhas existentes recebem `null`, sem
  backfill
- external-dependency failure: n/a - nenhuma dependência externa envolvida
- state transitions: n/a - o modo exibido é derivado a cada render de `startTime`/`endTime`
  armazenados (critérios 8, 9), não é um estado persistido próprio
- observability: n/a - não solicitado; nenhum log ou métrica nova nesta task

## Impact

| Front | What changes |
|---|---|
| domain | new term: `startTime`/`endTime` no `WorkHour` - strings opcionais `HH:mm` (24h) representando o horário de início/fim da sessão, vivem em `apps/backend/prisma/schema.prisma` e nos DTOs de create/update; consumidores: `WorkHourForm`, `WorkHoursService.create`/`update` |
| domain | existing term: a mensagem "Invalid time format (HH:mm)" (hoje hardcoded em inglês em `hoursFieldSchema`, `work-hour-form.tsx:51`) passa a vir de uma chave i18n (`workHours.invalidTimeFormat`, en + pt-BR), porque o mesmo validador passa a ser compartilhado pelos campos de duração, hora inicial e hora final - nenhum outro consumidor depende da string hoje |
| stored data | nothing to migrate - migração adiciona duas colunas nullable (`startTime String?`, `endTime String?`) a uma tabela populada; linhas existentes recebem `null` automaticamente, sem constraint dependente de dado |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| `WorkHour` ganha duas colunas nullable, `startTime String?` e `endTime String?`, guardando texto `HH:mm` 24h (não um tipo `DateTime`/hora) | Migration Prisma adicionando as duas colunas ao model existente | Combinar com `date` em duas colunas `DateTime` - rejeitado porque `date` já só rastreia o dia (não existe convenção de horário-com-timezone no codebase) e um `DateTime` traria complexidade de fuso que esta feature não precisa, já que `hours` continua sendo o único valor que faturamento e estatísticas consomem |
| `hours` continua o único valor de duração que alimenta faturamento e estatísticas (`project.hourlyRate × workHour.hours`); quando o usuário usa hora inicial/final, `hours` é calculado no cliente (`hora final − hora inicial`) e enviado junto com as duas strings brutas - o backend valida formato e ordem mas não recalcula `hours` a partir delas | DTOs de create/update com `startTime`/`endTime` opcionais validados por regex e pela ordem (critérios 14-16), sem lógica de recomputo de `hours` no service | Recalcular `hours` no servidor a partir de `startTime`/`endTime`, ignorando o valor enviado pelo cliente - rejeitado por duplicar lógica de negócio que já vive só no cliente hoje (a própria conversão `HH:mm` → decimal da duração nunca é reconferida no servidor), num app single-tenant onde o usuário só lança as próprias horas |
| Seletor de dois modos ("Duração" / "Hora inicial e hora final") acima da seção de horas do `WorkHourForm`, estado local, decidindo quais campos renderizam e alimentam `hours` antes do submit; em edição o modo é pré-selecionado conforme o registro ter ou não `startTime`/`endTime` não-nulos - padrão novo no codebase, vira precedente | Um `RadioGroup`/toggle de dois valores controlando qual bloco de inputs renderiza, local ao formulário | Mostrar duração e hora inicial/final sempre juntos, sempre editáveis - rejeitado porque contraria "manter a possibilidade de só informar a duração" como alternativa (não adição), e deixaria ambíguo qual valor vale quando os dois estão preenchidos |
| Sessão com hora final ≤ hora inicial (cruzando a meia-noite) é rejeitada com erro de validação, no cliente e no servidor | Critérios 6 e 16 - erro `endTimeBeforeStart`, sem cálculo de duração com virada de dia | Calcular a duração assumindo virada de dia (ex.: 23:00-01:00 = 2h) - rejeitado por decisão do usuário nesta conversa: mais simples e consistente com `date` representar um único dia |

## Sources

- Pedido do usuário nesta conversa - define o escopo base: adicionar hora inicial e hora final
  mantendo o modo de duração existente, e preencher minutos com zero quando só a hora for
  digitada (critérios 1-13).
- Resposta à pergunta de esclarecimento nesta conversa - sessões overnight (hora final ≤ hora
  inicial) são rejeitadas com erro de validação, não calculadas com virada de dia (`Decided`,
  critérios 6, 16).

Esta task é o registro da decisão. Se um documento vinculado divergir, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| — | — | None | — |
