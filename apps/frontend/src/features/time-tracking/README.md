# Time Tracking

Registro manual de horas (work-hours) e o timer local-first (work-timer) que roda em cima delas — unidos numa só feature porque o timer é uma camada opcional sobre o mesmo domínio: mesma página (`work-hours`), mesmas entidades (`WorkHour`), e a lib local-first (`lib/`, decisão `AD-001`) só existe pra sustentar o timer.

## Pontos de entrada

- `WorkHoursTable`, `WorkHoursBigStats`, `TotalHoursDisplay`, `WorkHourForm` — UI de registro manual de horas (`app/[locale]/(authenticated)/work-hours/page.tsx`)
- `WorkSessionStartForm`, `WorkSessionFinishForm`, `WorkTimerWidget` — UI do timer local-first, embutido no layout autenticado
- `useTimeEntries`, `useAvailableTimeEntries`, `useTimeEntry`, `useCreateTimeEntry`, `useUpdateTimeEntry`, `useDeleteTimeEntry`, `useTotalHours` — hooks TanStack Query pra `WorkHour`/`TimeEntry`
- `useWorkHoursStats` — estatísticas agregadas de horas
- `useWorkTimerEngine`, `useFinishWorkSession` — hooks do motor local-first (consomem `lib/`)
- Tipos `WorkHour`, `InvoiceWorkHour`, `WorkHourRow`

Consumidores fora desta feature (`dashboard`, `invoices`, `analytics`) devem importar de `@/features/time-tracking`, nunca de um arquivo interno. `lib/` (IndexedDB, outbox — `AD-001`) é implementação interna, não faz parte da API pública.

## Notas de split

- `work-hours-table.tsx` (originalmente 440 linhas) foi dividido: a lógica pura de agrupamento por mês/semana (`groupByMonthAndWeek`, tipos `WeekGroup`/`MonthGroup`/`WorkHourRow`) saiu pra `work-hours-grouping.ts`, sem nenhuma dependência de i18n/React. O componente `WorkHoursTable` ficou só com renderização (busca, tabela, diálogo de exclusão).

## Achado durante a migração

- `total-hours-display.tsx` (`TotalHoursDisplay`) não tem nenhum consumidor no frontend hoje — órfão, migrado por afinidade de domínio (mesma situação dos services órfãos documentados em `design.md`). Não removido (fora de escopo deste refactor).
