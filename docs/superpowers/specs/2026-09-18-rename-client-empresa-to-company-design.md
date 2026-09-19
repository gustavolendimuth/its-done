# Rename do domínio Client/Empresa para Company

## Contexto

O model original do produto, `Client`, foi renomeado para `Empresa` numa migration desta
branch (`20260917120000_rename_client_to_empresa_add_colaborador`) para suportar a área
empresarial: uma empresa passa a ter administradores próprios (`EmpresaAdmin`),
colaboradores vinculados (`Colaborador`), convites (`ConvitePendente`) e domínios
autorizados (`DominioAutorizado`).

O rename ficou pela metade. O model Prisma é `Empresa`, mas o módulo, a pasta e a rota
HTTP continuam `clients`. Todo o resto do domínio novo (empresa-admin, colaboradores,
convites, domínios) foi escrito em português, o que viola a convenção do projeto: código
sempre em inglês (identificadores, arquivos, rotas).

Este documento cobre só o rename. A unificação do login geral com o login de
administrador de empresa é um projeto separado, que consome os nomes já renomeados aqui
(especificação própria, a escrever depois deste).

Branch atual (`feat/empresarial`) tem 27 commits à frente de `main` e nenhum dos models
deste domínio existe em `main`. Não há dado de produção nem migration já aplicada fora
do ambiente de desenvolvimento local. Isso baixa o risco do rename: dá pra fazer via
migration de `RENAME` (preserva dado local de quem já rodou as migrations), sem precisar
de estratégia de zero-downtime.

## Decisões

- `Empresa` → `Company`. `EmpresaAdmin` → `CompanyAdmin`. `Colaborador` →
  `Collaborator`. `ConvitePendente` → `PendingInvite`. `DominioAutorizado` →
  `AuthorizedDomain`.
- Módulo/pasta/rota `clients` → `companies` (backend e frontend), acompanhando o model
  virar `Company`.
- Módulo/pasta/rota `empresa-admin` → `company-admin`.
- FKs que sobraram do antigo `Client` (`clientId`/`client` em `WorkHour`, `Project`,
  `Task`, `Address`, `Invoice`, `NotificationLog`, `WorkSession`) viram `companyId`/
  `company`, por consistência com o model renomeado.
- Migration de schema via `RENAME TABLE`/`RENAME COLUMN`/`RENAME TYPE`, nunca
  `DROP`+`CREATE`, para não perder dado local existente.

## Nomenclatura

### Prisma schema

| Atual | Tipo | Proposto |
|---|---|---|
| `Empresa` | model | `Company` |
| `Colaborador` | model | `Collaborator` |
| `EmpresaAdmin` | model | `CompanyAdmin` |
| `ConvitePendente` | model | `PendingInvite` |
| `DominioAutorizado` | model | `AuthorizedDomain` |
| `ConvitePendenteStatus` | enum | `PendingInviteStatus` |
| `DominioAutorizadoStatus` | enum | `AuthorizedDomainStatus` |
| `ColaboradorOrigin` | enum | `CollaboratorOrigin` |
| `ColaboradorOrigin.CONVITE` | enum value | `INVITE` |
| `ColaboradorOrigin.DOMINIO` | enum value | `DOMAIN` |
| `User.colaboradores` | field | `collaboratorMemberships` |
| `Empresa.colaboradores` | field | `collaborators` |
| `Empresa.empresaAdmins` | field | `companyAdmins` |
| `Empresa.convitesPendentes` | field | `pendingInvites` |
| `Empresa.dominiosAutorizados` | field | `authorizedDomains` |
| `Colaborador.empresaId`/`empresa` | field | `companyId`/`company` |
| `EmpresaAdmin.empresaId`/`empresa` | field | `companyId`/`company` |
| `EmpresaAdmin.convitesPendentesCriados` | field | `pendingInvitesCreated` |
| `ConvitePendente.empresaId`/`empresa` | field | `companyId`/`company` |
| `ConvitePendente.createdByEmpresaAdminId`/`createdByEmpresaAdmin` | field | `createdByCompanyAdminId`/`createdByCompanyAdmin` |
| `DominioAutorizado.empresaId`/`empresa` | field | `companyId`/`company` |
| `clientId`/`client` em `WorkHour`, `Project`, `Task`, `Address`, `Invoice`, `NotificationLog`, `WorkSession` | field | `companyId`/`company` |

### Backend — módulo `clients/` → `companies/`

| Atual | Proposto |
|---|---|
| pasta `clients/`, arquivos `clients.controller.ts`/`.module.ts`/`.service.ts`/`.service.spec.ts` | `companies/`, `companies.controller.ts` etc. |
| `@Controller('clients')`, classes `ClientsController`/`Service`/`Module` | `@Controller('companies')`, `CompaniesController`/`Service`/`Module` |
| `prisma.empresa.*` | `prisma.company.*` |
| rota `:id/colaborador` | `:id/collaborator` |
| dto em `clients/dto/` | revisar campo a campo na implementação |

### Backend — módulo `empresa-admin/` → `company-admin/`

| Atual | Proposto |
|---|---|
| pasta `empresa-admin/` | `company-admin/` |
| `empresa-admin.module.ts` / `EmpresaAdminModule` | `company-admin.module.ts` / `CompanyAdminModule` |
| `empresa-admin-auth.controller.ts` / `EmpresaAdminAuthController`, rota `@Controller('empresa-admin/auth')` | `company-admin-auth.controller.ts` / `CompanyAdminAuthController`, `@Controller('company-admin/auth')` |
| rota `activate/:empresaId/request` | `activate/:companyId/request` |
| `empresa-admin-auth.service.ts` / `EmpresaAdminAuthService` | `company-admin-auth.service.ts` / `CompanyAdminAuthService` |
| `EMPRESA_ADMIN_ACTOR_TYPE` (valor `'EMPRESA_ADMIN'`) | `COMPANY_ADMIN_ACTOR_TYPE` (valor `'COMPANY_ADMIN'`) |
| `EMPRESA_ACTIVATION_TOKEN_TYPE`, `EMPRESA_ADMIN_INVITE_TOKEN_TYPE` | `COMPANY_ACTIVATION_TOKEN_TYPE`, `COMPANY_ADMIN_INVITE_TOKEN_TYPE` |
| métodos `requestEmpresaActivation`, `confirmEmpresaActivation`, `inviteEmpresaAdmin`, `confirmEmpresaAdminInvite`, `deactivateEmpresa`, `notifyColaboradoresOfDeactivation`, `assertEmpresaNotActivated` | `requestCompanyActivation`, `confirmCompanyActivation`, `inviteCompanyAdmin`, `confirmCompanyAdminInvite`, `deactivateCompany`, `notifyCollaboratorsOfDeactivation`, `assertCompanyNotActivated` |
| `empresa-admins.service.ts` / `EmpresaAdminsService` | `company-admins.service.ts` / `CompanyAdminsService` |
| `colaboradores.controller.ts`/`.service.ts`, rota `@Controller('empresa-admin/colaboradores')` | `collaborators.controller.ts`/`.service.ts`, `@Controller('company-admin/collaborators')` |
| `convites-pendentes.controller.ts`/`.service.ts`, rota `@Controller('empresa-admin/invites')` | `pending-invites.controller.ts`/`.service.ts`, `@Controller('company-admin/invites')` |
| `dominios-autorizados.controller.ts`/`.service.ts`/`.spec.ts`, rota `@Controller('empresa-admin/domains')` | `authorized-domains.controller.ts`/`.service.ts`/`.spec.ts`, `@Controller('company-admin/domains')` |
| `empresa-dashboard.controller.ts`/`.service.ts`/`.spec.ts`, rota `@Controller('empresa-admin/dashboard')`, `@Get('colaboradores')` | `company-dashboard.controller.ts`/`.service.ts`/`.spec.ts`, `@Controller('company-admin/dashboard')`, `@Get('collaborators')` |
| `empresa-linking.service.ts` / `EmpresaLinkingService` | `company-linking.service.ts` / `CompanyLinkingService` |
| `guards/empresa-admin-jwt-auth.guard.ts` / `EmpresaAdminJwtAuthGuard` | `guards/company-admin-jwt-auth.guard.ts` / `CompanyAdminJwtAuthGuard` |
| `strategies/empresa-admin-jwt.strategy.ts` / `EmpresaAdminJwtStrategy` | `strategies/company-admin-jwt.strategy.ts` / `CompanyAdminJwtStrategy` |
| `dto/empresa-admin-auth.dto.ts` (classes `RegisterEmpresaAdminDto` etc.) | `dto/company-admin-auth.dto.ts`, classes com prefixo `CompanyAdmin`/`Company` |
| `dto/convite-pendente.dto.ts` | `dto/pending-invite.dto.ts` |
| `dto/dominio-autorizado.dto.ts` | `dto/authorized-domain.dto.ts` |
| `dto/dashboard-period.dto.ts`, `utils/domain-blocklist.util.ts` | já em inglês, mantém |

### Backend — outros arquivos afetados

`app.module.ts`, `auth/auth.service.ts`, `auth/auth.module.ts`,
`work-hours/services/draft-invoice.service.ts`, `projects/projects.service.ts`,
`admin/admin.service.ts` (+spec), `tasks/tasks.service.ts` (+spec),
`work-hours/services/hours-threshold-checker.service.ts`, `addresses/addresses.service.ts`,
`dashboard/dashboard.service.ts`, `invoices/invoices.service.ts` (+spec) — trocar imports,
tipos e nomes de variável (`empresa`, `colaboradores`) pelos equivalentes em inglês.

`notifications/notifications.service.ts` (+spec) e
`in-app-notifications/in-app-notifications.service.ts`: renomear os métodos
`generateColaboradorLinkedEmailTemplate`, `generateColaboradorUnlinkedEmailTemplate`,
`generateEmpresaActivationEmailTemplate`, `generateEmpresaAdminInviteEmailTemplate`,
`generateEmpresaAdminPasswordResetEmailTemplate`, `generateEmpresaDeactivatedEmailTemplate`,
`sendColaboradorLinkedEmail`, `sendColaboradorUnlinkedEmail`, `sendEmpresaActivationEmail`,
`sendEmpresaAdminInviteEmail`, `sendEmpresaAdminPasswordResetEmail`,
`sendEmpresaDeactivatedEmail`, `createColaboradorLinkedNotification`,
`createColaboradorUnlinkedNotification`, `createEmpresaDeactivatedNotification` para os
equivalentes `Company`/`Collaborator`. A tag `view_empresas` (deep-link de notificação)
vira `view_companies`.

### Frontend — rotas

| Atual | Proposto |
|---|---|
| `app/[locale]/empresa-admin/` (login, register, forgot-password, reset-password, dashboard, layout.tsx) | `app/[locale]/company-admin/` |
| `app/[locale]/(authenticated)/empresas/page.tsx` | `app/[locale]/(authenticated)/companies/page.tsx` |
| `app/[locale]/(authenticated)/empresas/[clientId]/page.tsx` | `app/[locale]/(authenticated)/companies/[companyId]/page.tsx` |
| `app/[locale]/(authenticated)/empresas/__tests__/page.test.tsx` | `.../companies/__tests__/page.test.tsx` |
| link/rota `/empresas` em nav/topbar/mobile-nav/main-layout | `/companies` |

### Frontend — features, lib, API routes

| Atual | Proposto |
|---|---|
| `features/clients/` (README, addresses.ts, client-stats.ts, clients.ts, index.ts, types.ts, components/*) | `features/companies/`, prefixo `company` nos identificadores internos |
| `features/empresa-admin/` (empresa-admin-auth.service.ts, empresa-admin-dashboard.service.ts, index.ts, use-empresa-admin-auth.tsx) | `features/company-admin/` |
| `lib/empresa-admin-axios.ts`, `lib/empresa-admin-session.ts` | ambos somem no spec de login unificado (substituídos pelo proxy genérico); se este rename rodar antes daquele, viram `lib/company-admin-*` como passo intermediário |
| `app/api/empresa-admin/[...path]/route.ts`, `app/api/empresa-admin/logout/route.ts` | mesma observação acima: `app/api/company-admin/...` como passo intermediário, ou já eliminados se a ordem de execução inverter |
| `EMPRESA_ADMIN_COOKIE_NAME` (valor `"empresa_admin_token"`) | `COMPANY_ADMIN_COOKIE_NAME` (valor `"company_admin_token"`) |

### i18n

| Chave atual | Proposta |
|---|---|
| `empresaAdminLink` (`messages/en.json`, `messages/pt-BR.json`) | `companyAdminLink` |

Valores em português no `pt-BR.json` (ex. "Empresa", "Empresas" como texto de UI) não
entram nesta regra: são conteúdo traduzido, não identificador de código.

## Estratégia de migration

Uma migration nova por cima da cadeia existente, usando `RENAME`:

```sql
ALTER TABLE "Empresa" RENAME TO "Company";
ALTER TABLE "Colaborador" RENAME TO "Collaborator";
ALTER TABLE "EmpresaAdmin" RENAME TO "CompanyAdmin";
ALTER TABLE "ConvitePendente" RENAME TO "PendingInvite";
ALTER TABLE "DominioAutorizado" RENAME TO "AuthorizedDomain";
ALTER TYPE "ConvitePendenteStatus" RENAME TO "PendingInviteStatus";
ALTER TYPE "DominioAutorizadoStatus" RENAME TO "AuthorizedDomainStatus";
ALTER TYPE "ColaboradorOrigin" RENAME TO "CollaboratorOrigin";
ALTER TYPE "CollaboratorOrigin" RENAME VALUE 'CONVITE' TO 'INVITE';
ALTER TYPE "CollaboratorOrigin" RENAME VALUE 'DOMINIO' TO 'DOMAIN';
-- + RENAME COLUMN para cada empresaId/clientId/colaboradores listado acima
-- + RENAME CONSTRAINT / RENAME INDEX para manter os nomes de constraint coerentes
```

`prisma migrate dev --create-only` tende a propor `DROP`+`CREATE` para renomes de tabela
(o motor de diff não infere rename automaticamente fora do modo interativo). O SQL gerado
precisa ser revisado à mão e trocado por `RENAME` antes de aplicar. Rodar
`npx prisma migrate diff` contra o schema anterior ajuda a conferir que não sobrou nenhum
`DROP COLUMN`/`DROP TABLE` disfarçando um rename.

## Sequenciamento

1. Schema Prisma + migration de rename + `prisma generate`.
2. Backend: módulo `clients` → `companies` (arquivos, classe, rota, `prisma.company.*`).
3. Backend: módulo `empresa-admin` → `company-admin` inteiro (todos os sub-arquivos da
   tabela acima).
4. Backend: os demais arquivos que referenciam o domínio (`app.module.ts`, `auth/*`,
   `notifications/*`, `in-app-notifications/*`, `work-hours/*`, `projects/*`, `tasks/*`,
   `addresses/*`, `dashboard/*`, `invoices/*`, `admin/*`).
5. Frontend: pastas de rota, features, lib, API routes, i18n key.
6. Rodar suíte completa de testes (backend e frontend) e corrigir o que quebrar por
   referência solta a algum nome antigo.

Cada passo fecha compilando e com os testes daquele módulo passando, antes de seguir pro
próximo — évita um commit gigante difícil de revisar.

## Testes

Rename não muda comportamento, então a suíte existente é a prova: se os testes (unit +
integração do backend, componentes do frontend) passam com os nomes novos, o
comportamento não regrediu. Não é necessário escrever teste novo especificamente para o
rename. Vale rodar manualmente uma vez (`pnpm preview:start`): criar uma company,
convidar um administrador, logar como colaborador e como CompanyAdmin, confirmar que
nada quebrou na jornada ponta a ponta antes de considerar o rename concluído.

## Riscos

- Volume de arquivos tocados é grande (schema, ~20 arquivos do módulo `empresa-admin`,
  ~10 arquivos do módulo `clients`, mais os arquivos periféricos, mais rotas e i18n do
  frontend). Risco é de esquecer uma referência solta, não de complexidade por item — o
  sequenciamento por módulo com testes passando a cada passo cobre isso.
- Migration mal escrita (um `DROP`+`CREATE` disfarçado de rename) perde dado local. Mitigado
  revisando o SQL gerado à mão antes de aplicar, como descrito acima.
- Nenhum risco de produção: branch não mergeada, sem dado real, sem link já enviado por
  e-mail para usuário de verdade.

## Fora de escopo

Login unificado (NextAuth + proxy sem expor token no client, redirect de CompanyAdmin
pro dashboard certo): spec própria, a escrever depois deste rename estar pronto, já
usando os nomes definidos aqui.
