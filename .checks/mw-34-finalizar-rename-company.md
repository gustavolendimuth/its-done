# MW-34 - Finalizar limpeza e validação do rename para Company

Sources:

- https://gustavolendimuth.atlassian.net/browse/MW-34 - escopo residual, critérios de aceite, exceções e comandos obrigatórios de validação
- `docs/superpowers/specs/2026-09-18-rename-client-empresa-to-company-design.md` - nomenclatura de schema, contratos e código para `Company`
- `docs/superpowers/plans/2026-09-18-rename-client-empresa-to-company.md` - superfícies do rename e regra de classificar cada ocorrência antes de alterá-la

Verification profile: `light` (o projeto não declara outro perfil); handoff `on`, orçamento padrão de 150k tokens.

Feature base: `2d706c1` (último commit anterior à abertura da MW-34).

## Out of scope

- Alterar comportamento dos fluxos de Empresa - esta tarefa é um rename residual e uma validação, sem regra de negócio nova.
- Renomear `/client-dashboard/[clientId]` - a URL pública e o parâmetro permanecem estáveis por compatibilidade.
- Renomear OAuth `clientId`/`clientID`, imports `@prisma/client`, clientes HTTP, diretivas React `"use client"`, `QueryClient` ou texto traduzido - não representam a relação persistida com `Company`.
- Reescrever migrations históricas - elas documentam o schema no instante em que foram aplicadas; a correção é uma migration aditiva de `RENAME`.
- Deploy, merge, push ou dados de produção - somente edição, commits e validação locais estão autorizados.

## Landing

O schema e os contratos residuais passam a usar `companyId`/`company` sem mudar rotas públicas nem regras de negócio. A migration nova preserva os dados com `RENAME COLUMN` e `RENAME INDEX`; DTOs e clientes frontend reaproveitam os contratos existentes, mudando somente a nomenclatura.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Campos persistidos residuais passam a `companyId` | `NotificationLog.companyId` e `WorkSession.companyId`, com migration aditiva que renomeia colunas e o índice composto de `NotificationLog` | apagar/recriar coluna ou índice - arrisca perder dados locais e viola a decisão vinculante de migration por rename |
| Contrato de breakdown de relatórios passa a Company | `companyBreakdown[]` com `{ companyId, companyName, ... }` no backend e frontend | manter `clientBreakdown`/`clientName` como alias - perpetua dois vocabulários para a mesma entidade e não fecha o critério de consistência |

- Nada mais nesta mudança é difícil de reverter.

## Checks

### S1 - Schema e migration preservam dados · 2 arquivos · 11 KB · ~3k

**C1** - `NotificationLog` e `WorkSession` expõem somente `companyId` para a relação empresarial no schema Prisma.
Proof: `pnpm --filter @its-done/backend exec prisma validate && ! rg -n '\\bclientId\\b' apps/backend/prisma/schema.prisma`

**C2** - A migration residual renomeia as duas colunas e o índice composto de `NotificationLog`, sem `DROP`, `DELETE` ou recriação de tabela.
Proof: `bash -c 'migration=$(find apps/backend/prisma/migrations -maxdepth 2 -path "*finish_company_rename/migration.sql" -print -quit); test -n "$migration"; rg -q "NotificationLog.*clientId.*companyId|RENAME COLUMN.*clientId.*companyId" "$migration"; test "$(rg -c "RENAME COLUMN.*clientId.*companyId" "$migration")" -eq 2; rg -q "RENAME INDEX.*NotificationLog" "$migration"; ! rg -n "DROP|DELETE|CREATE TABLE" "$migration"'`

**C3** - A cadeia completa de migrations aplica no banco local e termina sem drift pendente.
Proof: `pnpm --filter @its-done/backend exec prisma migrate status`

### S2 - Backend usa Company de ponta a ponta · 37 arquivos · 177 KB · ~45k

**C4** - Um evento `START` com detalhes persiste `companyId` na `WorkSession` e o replay do mesmo `eventId` continua idempotente.
Proof: `pnpm --filter @its-done/backend test -- work-sessions.service.spec.ts -t "persists companyId|already-applied eventId" --runInBand`

**C5** - Finalizar uma sessão aceita `companyId`, cria a `WorkHour` para a mesma Company e rejeita projeto pertencente a outra Company com HTTP 400.
Proof: `pnpm --filter @its-done/backend test:e2e -- work-sessions-finish.e2e-spec.ts -t "right fields|does not belong" --runInBand --forceExit`

**C6** - `NotificationLog` consulta e grava a deduplicação de limite de horas com `companyId`.
Proof: `pnpm --filter @its-done/backend test -- hours-threshold-checker.service.spec.ts -t "companyId" --runInBand`

**C7** - Tipos compartilhados expõem `Company`, `companyId` e `company` para Project, WorkHour, Address, Invoice, TimeEntry e filtros de relatório.
Proof: `bash -c '! rg -n "export interface Client|\\bclientId\\b|\\bclient\\?: Client" packages/types/src apps/backend/src/types'`

**C8** - Invoices nomeia como `companyIds` a verificação de que todas as horas pertencem à mesma Company.
Proof: `bash -c 'rg -q "const companyIds" apps/backend/src/invoices/invoices.service.ts; ! rg -n "const clientIds" apps/backend/src/invoices/invoices.service.ts'`

**C9** - Relatórios filtram por `companyId` e retornam `companyBreakdown` com `companyName` nos relatórios de horas e invoices.
Proof: `pnpm --filter @its-done/backend test -- reports.service.spec.ts -t "companyId|companyBreakdown" --runInBand`

**C10** - Todos os testes e2e afetados compilam e executam contra os models, campos, rotas e serviços renomeados.
Proof: `pnpm --filter @its-done/backend test:e2e --runInBand --forceExit`

### S3 - Frontend envia e consome contratos de Company · 7 arquivos · 26 KB · ~7k

**C11** - Hooks de relatórios enviam o filtro `companyId` para horas e invoices e tipam o breakdown como `companyBreakdown`/`companyName`.
Proof: `pnpm --filter frontend exec jest --ci --runInBand src/features/analytics/reports.service.test.tsx -t "companyId|companyBreakdown"`

**C12** - Contratos genéricos de relatório e export usam `CompanyReportFilters`, `companyIds` e tipo `company`.
Proof: `bash -c '! rg -n "ClientReportFilters|\\bclientIds\\b|type: \\"client\\"|\\"client\\" \\|" apps/frontend/src/features/analytics/reports.service.ts apps/frontend/src/services/export.ts apps/frontend/src/services/import.ts'`

### S4 - Sweep e validação final · 1 script + superfícies existentes · ~4k

**C13** - Toda ocorrência exata restante de `Client`, `clientId`, `clientIds` ou `client` em código ativo está em uma categoria deliberada: compatibilidade da rota pública, OAuth, biblioteca/cliente técnico, diretiva React, identificador de fixture ou texto traduzido.
Proof: `scripts/check-company-rename.sh`

**C14** - Todos os workspaces compilam sem cache e as suítes unitárias do backend e frontend passam.
Proof: `pnpm turbo run build --force`
Proof: `pnpm --filter @its-done/backend test -- --runInBand`
Proof: `pnpm --filter frontend test:ci`

**C15** - O smoke local confirma login comum, listagem e detalhe de Company, cadastro de CompanyAdmin e acesso a colaboradores e convites sem resposta 404 ou 500; o preview é encerrado no fim.
Proof: `pnpm preview:start && scripts/smoke-mw34.sh; status=$?; pnpm preview:stop; exit $status`

## Swept

- validation: C1, C5, C9, C11 - decorators e formatos permanecem iguais; apenas o campo passa a `companyId`.
- failure modes: C5, C15 - mismatch de projeto continua 400 e as rotas críticas não podem responder 404/500.
- idempotency and retry: C4 - replay de `eventId` segue no-op; a migration aditiva só é aplicada uma vez pelo Prisma.
- authorization: existente - `JwtAuthGuard` e `CompanyAdminJwtAuthGuard` permanecem nas mesmas fronteiras; nenhum guard é removido ou relaxado.
- concurrency and ordering: existente - ledger de sync e índice de sessão ativa permanecem inalterados; a migration residual vem depois das migrations de rename já aplicadas.
- data lifecycle: C2, C3 - colunas e índice são renomeados, nunca apagados/recriados.
- external-dependency failure: C3, C15 - PostgreSQL local e preview precisam responder; falha encerra o proof com status não zero.
- state transitions: C4, C5 - estados de `WorkSession` (`RUNNING`, `STOPPING`, `ENDED`) e suas transições não mudam.
- observability: C6, C13 - logs empresariais passam a Company; logs técnicos de HTTP/OAuth preservam `client`.

## Classified exceptions

| Category | Allowed surface | Justification |
| --- | --- | --- |
| Public compatibility | `apps/frontend/src/app/[locale]/client-dashboard/[clientId]/**` and public-dashboard method/query names tied to that URL | MW-34 explicitly keeps the legacy URL and existing links stable |
| OAuth | Google/NextAuth configuration fields named `clientId`/`clientID` | third-party protocol terminology, unrelated to Company |
| Libraries and technical clients | `@prisma/client`, `@aws-sdk/client-s3`, Axios/HTTP client, React Query `QueryClient` | library/API terminology, unrelated to the domain relation |
| React execution boundary | exact directive `"use client"` and comments that distinguish browser/client from server | framework terminology |
| Fixtures | string values such as `client-1`, emails and human test labels | opaque sample values; property and variable names around them must still use Company |
| Translated copy | values in `messages/*.json` and assertions of those values | product translation is not a code identifier; Portuguese values remain Portuguese by explicit decision |
| History | old Prisma migrations and accepted ADR/spec history | immutable record of earlier schema and decisions; corrected by additive migration |

## Handoff

S1-S4 total approximately 59k tokens (3k + 45k + 7k + 4k), below the default 150k budget. All slices stay in one build batch; no surface boundary justifies paying a second read.
