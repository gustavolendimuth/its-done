# Rename Client/Empresa to Company Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename every Portuguese identifier in the Client/Empresa/EmpresaAdmin domain to English, closing the gap left by the earlier `Client` → `Empresa` migration that never got a matching code rename.

**Architecture:** Pure mechanical rename, no behavior change. Ten sequential tasks: schema, then backend module by module, then the `clientId`/`client` foreign key sweep, then frontend, then a full-suite verification pass. Existing tests are the proof — if they still pass after a task, that task did not change behavior.

**Tech Stack:** NestJS + Prisma (backend), Next.js 14 + NextAuth (frontend), Jest (both), pnpm workspaces via Turborepo.

**Spec:** `docs/superpowers/specs/2026-09-18-rename-client-empresa-to-company-design.md`

## Global Constraints

- Code, files, routes, and identifiers in English only (project CLAUDE.md rule). No new Portuguese identifier may be introduced by this plan, including in code comments.
- Schema changes use `RENAME TABLE`/`RENAME COLUMN`/`RENAME TYPE`, never `DROP`+`CREATE` — preserves any local dev data.
- No new tests are written for the rename itself. The existing suite is the correctness check: same tests, same pass/fail, after every task.
- The backend will not fully typecheck (`pnpm --filter backend build`) between Task 1 and the end of Task 6 — this is expected. Each intermediate task verifies only its own scope (scoped `grep` for leftover old identifiers + scoped `jest` run for files already renamed). The first point where a full `pnpm --filter backend build` must pass is the end of Task 6. Same logic applies to the frontend between Task 7 and the end of Task 9.
- Every task in this plan uses the same ordered rename command (the "rename command" below) against a different file list. The order matters — do not reorder the `-e` clauses.

### The rename command

```bash
RENAME_CMD=(sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
```

Every task step that says "apply the rename command" means: write out that array as shown, then run `"${RENAME_CMD[@]}" <files>`.

---

### Task 1: Prisma schema rename + migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/<timestamp>_rename_empresa_domain_to_company/migration.sql`

**Interfaces:**
- Produces: Prisma models `Company`, `Collaborator`, `CompanyAdmin`, `PendingInvite`, `AuthorizedDomain`; enums `PendingInviteStatus`, `AuthorizedDomainStatus`, `CollaboratorOrigin` (values `INVITE`, `DOMAIN`); fields `companyId`/`company` wherever `empresaId`/`empresa` existed; `User.collaborators`, `Company.collaborators`, `Company.companyAdmins`, `Company.pendingInvites`, `Company.authorizedDomains`, `CompanyAdmin.pendingInvitesCreated`. `User.collaborators` and `Company.collaborators` share the same field name on purpose — the rename command can't tell which model a `colaboradores` token belongs to, so giving them different English names would need a manual exception in every consuming file. All later tasks depend on these exact names.

- [ ] **Step 1: Apply the rename command to the schema file**

```bash
RENAME_CMD=( # (full array from "The rename command" above)
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboradorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
"${RENAME_CMD[@]}" apps/backend/prisma/schema.prisma
```

Note the one manual fix needed after: the command above turns `ColaboradorOrigin` into
`CollaboradorOrigin` (double `l`, wrong) because the `Colaborador`→`Collaborator` rule
hasn't run yet at that point in the chain. Open the file and fix that one occurrence by
hand: `CollaboradorOrigin` → `CollaboratorOrigin` (search for `CollaboradorOrigin`, there
should be exactly 3 matches: the enum declaration and its two field type references).

- [ ] **Step 2: Confirm no old identifier remains in the schema**

```bash
grep -nE 'Empresa|Colaborador|Convite|Dominio' apps/backend/prisma/schema.prisma
```

Expected: no output.

- [ ] **Step 3: Generate the migration SQL (create-only, don't apply yet)**

```bash
cd apps/backend
npx prisma migrate dev --create-only --name rename_empresa_domain_to_company
```

Prisma's diff engine does not infer table/column renames automatically in non-interactive
mode — it will emit `DROP TABLE "Empresa"` + `CREATE TABLE "Company"` (and similarly for
every renamed column/enum). This would destroy local data. Do not apply it as generated.

- [ ] **Step 4: Rewrite the generated migration.sql to use RENAME**

Open the newly created `apps/backend/prisma/migrations/<timestamp>_rename_empresa_domain_to_company/migration.sql` and replace its contents with:

```sql
-- RenameTable
ALTER TABLE "Empresa" RENAME TO "Company";
ALTER TABLE "Empresa" RENAME CONSTRAINT "Empresa_pkey" TO "Company_pkey";

ALTER TABLE "Colaborador" RENAME TO "Collaborator";
ALTER TABLE "Colaborador" RENAME CONSTRAINT "Colaborador_pkey" TO "Collaborator_pkey";

ALTER TABLE "EmpresaAdmin" RENAME TO "CompanyAdmin";
ALTER TABLE "EmpresaAdmin" RENAME CONSTRAINT "EmpresaAdmin_pkey" TO "CompanyAdmin_pkey";

ALTER TABLE "ConvitePendente" RENAME TO "PendingInvite";
ALTER TABLE "ConvitePendente" RENAME CONSTRAINT "ConvitePendente_pkey" TO "PendingInvite_pkey";

ALTER TABLE "DominioAutorizado" RENAME TO "AuthorizedDomain";
ALTER TABLE "DominioAutorizado" RENAME CONSTRAINT "DominioAutorizado_pkey" TO "AuthorizedDomain_pkey";

-- RenameEnum
ALTER TYPE "ConvitePendenteStatus" RENAME TO "PendingInviteStatus";
ALTER TYPE "DominioAutorizadoStatus" RENAME TO "AuthorizedDomainStatus";
ALTER TYPE "ColaboradorOrigin" RENAME TO "CollaboratorOrigin";
ALTER TYPE "CollaboratorOrigin" RENAME VALUE 'CONVITE' TO 'INVITE';
ALTER TYPE "CollaboratorOrigin" RENAME VALUE 'DOMINIO' TO 'DOMAIN';

-- RenameColumn: Collaborator
ALTER TABLE "Collaborator" RENAME COLUMN "empresaId" TO "companyId";

-- RenameColumn: CompanyAdmin
ALTER TABLE "CompanyAdmin" RENAME COLUMN "empresaId" TO "companyId";

-- RenameColumn: PendingInvite
ALTER TABLE "PendingInvite" RENAME COLUMN "empresaId" TO "companyId";
ALTER TABLE "PendingInvite" RENAME COLUMN "createdByEmpresaAdminId" TO "createdByCompanyAdminId";

-- RenameColumn: AuthorizedDomain
ALTER TABLE "AuthorizedDomain" RENAME COLUMN "empresaId" TO "companyId";

-- RenameForeignKey (Postgres renames FK constraints automatically when the referenced
-- table is renamed; only rename ones whose name embeds the old table/column name)
ALTER TABLE "Collaborator" RENAME CONSTRAINT "Colaborador_empresaId_fkey" TO "Collaborator_companyId_fkey";
ALTER TABLE "Collaborator" RENAME CONSTRAINT "Colaborador_userId_fkey" TO "Collaborator_userId_fkey";
ALTER TABLE "CompanyAdmin" RENAME CONSTRAINT "EmpresaAdmin_empresaId_fkey" TO "CompanyAdmin_companyId_fkey";
ALTER TABLE "PendingInvite" RENAME CONSTRAINT "ConvitePendente_empresaId_fkey" TO "PendingInvite_companyId_fkey";
ALTER TABLE "AuthorizedDomain" RENAME CONSTRAINT "DominioAutorizado_empresaId_fkey" TO "AuthorizedDomain_companyId_fkey";

-- RenameIndex
ALTER INDEX "Colaborador_userId_empresaId_key" RENAME TO "Collaborator_userId_companyId_key";
```

The exact constraint/index names above come from Prisma's default naming convention
(`<Table>_<column>_fkey`, `<Table>_<cols>_key`). Before trusting them, cross-check against
what actually exists:

```bash
psql "$DATABASE_URL" -c "\d \"Colaborador\"" -c "\d \"EmpresaAdmin\"" -c "\d \"ConvitePendente\"" -c "\d \"DominioAutorizado\""
```

Adjust any constraint/index name in the SQL above that doesn't match what `\d` shows.

- [ ] **Step 5: Apply the migration and regenerate the Prisma client**

```bash
npx prisma migrate dev
npx prisma generate
```

- [ ] **Step 6: Verify the migration applied cleanly**

```bash
npx prisma migrate status
```

Expected: "Database schema is up to date!", no drift warning.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations
git commit -m "refactor(db): rename Empresa domain models to Company"
```

---

### Task 2: Backend `clients` module → `companies`

**Files:**
- Rename: `apps/backend/src/clients/` → `apps/backend/src/companies/` (and every file inside: `clients.controller.ts`, `clients.module.ts`, `clients.service.ts`, `clients.service.spec.ts`, `dto/*`)
- Modify: `apps/backend/src/clients/dto/*` (renamed alongside)

**Interfaces:**
- Consumes: `Company`/`Collaborator` Prisma models from Task 1.
- Produces: `CompaniesController`, `CompaniesService`, `CompaniesModule`, route prefix `companies`. Task 5 (`app.module.ts`, `auth/*`) and Task 6 import `CompaniesModule`/`CompaniesService` by this exact name.

- [ ] **Step 1: Rename the directory and its files**

```bash
git mv apps/backend/src/clients apps/backend/src/companies
cd apps/backend/src/companies
for f in clients.controller.ts clients.module.ts clients.service.ts clients.service.spec.ts; do
  git mv "$f" "${f/clients/companies}"
done
```

- [ ] **Step 2: Apply the rename command to every file in the module**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
"${RENAME_CMD[@]}" apps/backend/src/companies/*.ts apps/backend/src/companies/dto/*.ts
```

- [ ] **Step 3: Rename the remaining English-named-but-domain-specific pieces by hand**

Open `companies.controller.ts` and change:
- `@Controller('clients')` → `@Controller('companies')`
- Any route path segment `:id/collaborator` stays as-is (already produced correctly by
  the rename command from `:id/colaborador`).
- Class names `ClientsController` → `CompaniesController`, `ClientsService` →
  `CompaniesService`, `ClientsModule` → `CompaniesModule` (the rename command does not
  touch these because they contain the English word "Client", not the Portuguese
  "Empresa" — do this by hand):

```bash
sed -i -e 's/ClientsController/CompaniesController/g' \
       -e 's/ClientsService/CompaniesService/g' \
       -e 's/ClientsModule/CompaniesModule/g' \
  apps/backend/src/companies/*.ts
```

- [ ] **Step 4: Confirm no old identifier remains in the module**

```bash
grep -rnE 'Empresa|Colaborador|Convite|Dominio|Clients' apps/backend/src/companies
```

Expected: no output.

- [ ] **Step 5: Run the module's tests**

```bash
pnpm --filter backend test -- companies
```

Expected: PASS (same test count as before the rename — this is a rename, not new coverage).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/companies
git commit -m "refactor: rename clients module to companies"
```

---

### Task 3: Backend `empresa-admin` core → `company-admin`

**Files:**
- Rename: `apps/backend/src/empresa-admin/` → `apps/backend/src/company-admin/`
- Rename inside it: `empresa-admin.module.ts` → `company-admin.module.ts`, `empresa-admin-auth.controller.ts` → `company-admin-auth.controller.ts`, `empresa-admin-auth.service.ts`/`.spec.ts` → `company-admin-auth.service.ts`/`.spec.ts`, `empresa-admins.service.ts` → `company-admins.service.ts`, `empresa-linking.service.ts` → `company-linking.service.ts`, `guards/empresa-admin-jwt-auth.guard.ts` → `guards/company-admin-jwt-auth.guard.ts`, `strategies/empresa-admin-jwt.strategy.ts` → `strategies/company-admin-jwt.strategy.ts`, `dto/empresa-admin-auth.dto.ts` → `dto/company-admin-auth.dto.ts`

**Interfaces:**
- Consumes: `Company`, `CompanyAdmin` Prisma models (Task 1).
- Produces: `CompanyAdminModule`, `CompanyAdminAuthController` (route `company-admin/auth`), `CompanyAdminAuthService`, `CompanyAdminsService`, `CompanyLinkingService`, `CompanyAdminJwtAuthGuard`, `CompanyAdminJwtStrategy`, DTO classes `RegisterCompanyAdminDto`, `LoginCompanyAdminDto`, `ForgotPasswordCompanyAdminDto`, `ResetPasswordCompanyAdminDto`, `RequestCompanyActivationDto`, `ConfirmCompanyActivationDto`, `InviteCompanyAdminDto`, `ConfirmCompanyAdminInviteDto`, constant `COMPANY_ADMIN_ACTOR_TYPE`. Task 4 imports `CompanyAdminsService`/`CompanyLinkingService`; Task 5's `auth.module.ts`/`auth.service.ts` import `CompanyAdminModule`/`CompanyLinkingService` by these exact names.

- [ ] **Step 1: Rename the directory**

```bash
git mv apps/backend/src/empresa-admin apps/backend/src/company-admin
```

- [ ] **Step 2: Rename the core files**

```bash
cd apps/backend/src/company-admin
git mv empresa-admin.module.ts company-admin.module.ts
git mv empresa-admin-auth.controller.ts company-admin-auth.controller.ts
git mv empresa-admin-auth.service.ts company-admin-auth.service.ts
git mv empresa-admin-auth.service.spec.ts company-admin-auth.service.spec.ts
git mv empresa-admins.service.ts company-admins.service.ts
git mv empresa-linking.service.ts company-linking.service.ts
git mv guards/empresa-admin-jwt-auth.guard.ts guards/company-admin-jwt-auth.guard.ts
git mv strategies/empresa-admin-jwt.strategy.ts strategies/company-admin-jwt.strategy.ts
git mv dto/empresa-admin-auth.dto.ts dto/company-admin-auth.dto.ts
```

- [ ] **Step 3: Apply the rename command to the renamed core files**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
"${RENAME_CMD[@]}" apps/backend/src/company-admin/company-admin.module.ts \
  apps/backend/src/company-admin/company-admin-auth.controller.ts \
  apps/backend/src/company-admin/company-admin-auth.service.ts \
  apps/backend/src/company-admin/company-admin-auth.service.spec.ts \
  apps/backend/src/company-admin/company-admins.service.ts \
  apps/backend/src/company-admin/company-linking.service.ts \
  apps/backend/src/company-admin/guards/company-admin-jwt-auth.guard.ts \
  apps/backend/src/company-admin/strategies/company-admin-jwt.strategy.ts \
  apps/backend/src/company-admin/dto/company-admin-auth.dto.ts
```

- [ ] **Step 4: Rename import paths still pointing at old filenames inside these files, and DTO class names by hand**

The rename command already fixes relative import strings (e.g. `'./empresa-admin-auth.service'` becomes `'./company-admin-auth.service'` as plain text), so this step is only for DTO class names, which use `EmpresaAdmin`/`Empresa` — already handled by the rename command too (`RegisterEmpresaAdminDto` → `RegisterCompanyAdminDto`, etc). Confirm:

```bash
grep -n "class.*Dto" apps/backend/src/company-admin/dto/company-admin-auth.dto.ts
```

Expected output: `RegisterCompanyAdminDto`, `LoginCompanyAdminDto`, `ForgotPasswordCompanyAdminDto`, `ResetPasswordCompanyAdminDto`, `RequestCompanyActivationDto`, `ConfirmCompanyActivationDto`, `InviteCompanyAdminDto`, `ConfirmCompanyAdminInviteDto`.

- [ ] **Step 5: Confirm no old identifier remains in the renamed core files**

```bash
grep -nE 'Empresa|Colaborador|Convite|Dominio' \
  apps/backend/src/company-admin/company-admin.module.ts \
  apps/backend/src/company-admin/company-admin-auth.controller.ts \
  apps/backend/src/company-admin/company-admin-auth.service.ts \
  apps/backend/src/company-admin/company-admin-auth.service.spec.ts \
  apps/backend/src/company-admin/company-admins.service.ts \
  apps/backend/src/company-admin/company-linking.service.ts \
  apps/backend/src/company-admin/guards/company-admin-jwt-auth.guard.ts \
  apps/backend/src/company-admin/strategies/company-admin-jwt.strategy.ts \
  apps/backend/src/company-admin/dto/company-admin-auth.dto.ts
```

Expected: no output.

- [ ] **Step 6: Commit (module still won't compile — Task 4 renames the sibling files it imports)**

```bash
git add apps/backend/src/company-admin
git commit -m "refactor: rename empresa-admin core files to company-admin"
```

---

### Task 4: Backend `company-admin` sub-resources (collaborators, pending invites, authorized domains, dashboard)

**Files:**
- Rename: `colaboradores.controller.ts`/`.service.ts` → `collaborators.controller.ts`/`.service.ts`
- Rename: `convites-pendentes.controller.ts`/`.service.ts` → `pending-invites.controller.ts`/`.service.ts`
- Rename: `dominios-autorizados.controller.ts`/`.service.ts`/`.spec.ts` → `authorized-domains.controller.ts`/`.service.ts`/`.spec.ts`
- Rename: `empresa-dashboard.controller.ts`/`.service.ts`/`.spec.ts` → `company-dashboard.controller.ts`/`.service.ts`/`.spec.ts`
- Rename: `dto/convite-pendente.dto.ts` → `dto/pending-invite.dto.ts`, `dto/dominio-autorizado.dto.ts` → `dto/authorized-domain.dto.ts`

**Interfaces:**
- Consumes: `CompanyAdminsService`, `CompanyLinkingService` (Task 3).
- Produces: `CollaboratorsController`/`Service`, `PendingInvitesController`/`Service`, `AuthorizedDomainsController`/`Service`, `CompanyDashboardController`/`Service`, routes `company-admin/collaborators`, `company-admin/invites`, `company-admin/domains`, `company-admin/dashboard`. Task 3's `company-admin.module.ts` (already renamed) declares these as providers/controllers by these exact names — after this task, fix its imports.

- [ ] **Step 1: Rename the files**

```bash
cd apps/backend/src/company-admin
git mv colaboradores.controller.ts collaborators.controller.ts
git mv colaboradores.service.ts collaborators.service.ts
git mv convites-pendentes.controller.ts pending-invites.controller.ts
git mv convites-pendentes.service.ts pending-invites.service.ts
git mv dominios-autorizados.controller.ts authorized-domains.controller.ts
git mv dominios-autorizados.service.ts authorized-domains.service.ts
git mv dominios-autorizados.service.spec.ts authorized-domains.service.spec.ts
git mv empresa-dashboard.controller.ts company-dashboard.controller.ts
git mv empresa-dashboard.service.ts company-dashboard.service.ts
git mv empresa-dashboard.service.spec.ts company-dashboard.service.spec.ts
git mv dto/convite-pendente.dto.ts dto/pending-invite.dto.ts
git mv dto/dominio-autorizado.dto.ts dto/authorized-domain.dto.ts
```

- [ ] **Step 2: Apply the rename command to all of them**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
"${RENAME_CMD[@]}" apps/backend/src/company-admin/collaborators.controller.ts \
  apps/backend/src/company-admin/collaborators.service.ts \
  apps/backend/src/company-admin/pending-invites.controller.ts \
  apps/backend/src/company-admin/pending-invites.service.ts \
  apps/backend/src/company-admin/authorized-domains.controller.ts \
  apps/backend/src/company-admin/authorized-domains.service.ts \
  apps/backend/src/company-admin/authorized-domains.service.spec.ts \
  apps/backend/src/company-admin/company-dashboard.controller.ts \
  apps/backend/src/company-admin/company-dashboard.service.ts \
  apps/backend/src/company-admin/company-dashboard.service.spec.ts \
  apps/backend/src/company-admin/dto/pending-invite.dto.ts \
  apps/backend/src/company-admin/dto/authorized-domain.dto.ts
```

- [ ] **Step 3: Rename class names by hand where the rename command doesn't reach (English "Colaboradores"/"Convites" compounds already covered; verify controller decorators)**

```bash
grep -n "@Controller" apps/backend/src/company-admin/collaborators.controller.ts \
  apps/backend/src/company-admin/pending-invites.controller.ts \
  apps/backend/src/company-admin/authorized-domains.controller.ts \
  apps/backend/src/company-admin/company-dashboard.controller.ts
```

Expected: `@Controller('company-admin/collaborators')`, `@Controller('company-admin/invites')`, `@Controller('company-admin/domains')`, `@Controller('company-admin/dashboard')`. If any still reads `empresa-admin/...`, the rename command missed it — apply `s/empresa-admin/company-admin/g` to that file directly.

- [ ] **Step 4: Fix `company-admin.module.ts` imports to point at the renamed files (Task 3 left this pointing at the pre-Task-4 filenames)**

Open `apps/backend/src/company-admin/company-admin.module.ts` and confirm every import matches the new filenames (`./collaborators.controller`, `./pending-invites.service`, etc.) — the rename command already rewrote these import strings when it ran in Task 3, since they used the same Portuguese roots. Verify with:

```bash
grep -n "^import" apps/backend/src/company-admin/company-admin.module.ts
```

Expected: no import path contains `colaboradores`, `convites-pendentes`, `dominios-autorizados`, or `empresa-dashboard`.

- [ ] **Step 5: Confirm no old identifier remains anywhere in the module**

```bash
grep -rnE 'Empresa|Colaborador|Convite|Dominio' apps/backend/src/company-admin
```

Expected: no output.

- [ ] **Step 6: Run the module's tests**

```bash
pnpm --filter backend test -- company-admin
```

Expected: PASS, same test count as before the rename.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/company-admin
git commit -m "refactor: rename empresa-admin sub-resources to company-admin"
```

---

### Task 5: Backend peripheral consumers (non-FK identifiers)

**Files:**
- Modify: `apps/backend/src/app.module.ts`, `apps/backend/src/auth/auth.service.ts`, `apps/backend/src/auth/auth.module.ts`, `apps/backend/src/notifications/notifications.service.ts` (+`.spec.ts`), `apps/backend/src/in-app-notifications/in-app-notifications.service.ts`, `apps/backend/src/work-hours/services/draft-invoice.service.ts`, `apps/backend/src/work-hours/services/hours-threshold-checker.service.ts`, `apps/backend/src/projects/projects.service.ts`, `apps/backend/src/tasks/tasks.service.ts` (+`.spec.ts`), `apps/backend/src/admin/admin.service.ts` (+`.spec.ts`), `apps/backend/src/addresses/addresses.service.ts`, `apps/backend/src/dashboard/dashboard.service.ts`, `apps/backend/src/invoices/invoices.service.ts` (+`.spec.ts`)

**Interfaces:**
- Consumes: `CompaniesModule` (Task 2), `CompanyAdminModule`, `CompanyLinkingService` (Task 3/4).
- Produces: notification methods `generateCollaboratorLinkedEmailTemplate`, `generateCollaboratorUnlinkedEmailTemplate`, `generateCompanyActivationEmailTemplate`, `generateCompanyAdminInviteEmailTemplate`, `generateCompanyAdminPasswordResetEmailTemplate`, `generateCompanyDeactivatedEmailTemplate`, `sendCollaboratorLinkedEmail`, `sendCollaboratorUnlinkedEmail`, `sendCompanyActivationEmail`, `sendCompanyAdminInviteEmail`, `sendCompanyAdminPasswordResetEmail`, `sendCompanyDeactivatedEmail`, `createCollaboratorLinkedNotification`, `createCollaboratorUnlinkedNotification`, `createCompanyDeactivatedNotification`, deep-link tag `view_companies`. Task 6 (draft-invoice, hours-threshold-checker, projects, tasks, addresses, dashboard, admin, invoices) calls these by these exact names wherever it sends a notification tied to a collaborator/company event.

- [ ] **Step 1: Apply the rename command**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
"${RENAME_CMD[@]}" apps/backend/src/app.module.ts \
  apps/backend/src/auth/auth.service.ts \
  apps/backend/src/auth/auth.module.ts \
  apps/backend/src/notifications/notifications.service.ts \
  apps/backend/src/notifications/notifications.service.spec.ts \
  apps/backend/src/in-app-notifications/in-app-notifications.service.ts \
  apps/backend/src/work-hours/services/draft-invoice.service.ts \
  apps/backend/src/work-hours/services/hours-threshold-checker.service.ts \
  apps/backend/src/projects/projects.service.ts \
  apps/backend/src/tasks/tasks.service.ts \
  apps/backend/src/tasks/tasks.service.spec.ts \
  apps/backend/src/admin/admin.service.ts \
  apps/backend/src/admin/admin.service.spec.ts \
  apps/backend/src/addresses/addresses.service.ts \
  apps/backend/src/dashboard/dashboard.service.ts \
  apps/backend/src/invoices/invoices.service.ts \
  apps/backend/src/invoices/invoices.service.spec.ts
```

- [ ] **Step 2: Fix the `view_empresas` deep-link tag by hand (underscore form, not caught by the `empresas`→`companies` rule if it was written with a different literal — verify)**

```bash
grep -n "view_" apps/backend/src/in-app-notifications/in-app-notifications.service.ts
```

Expected: `view_companies`. If it still says `view_empresas`, the substring rule did catch
it (a name check only) — fix by hand:

```bash
sed -i 's/view_empresas/view_companies/g' apps/backend/src/in-app-notifications/in-app-notifications.service.ts
```

- [ ] **Step 3: Confirm no old identifier remains**

```bash
grep -nE 'Empresa|Colaborador|Convite|Dominio' apps/backend/src/app.module.ts \
  apps/backend/src/auth/auth.service.ts \
  apps/backend/src/auth/auth.module.ts \
  apps/backend/src/notifications/notifications.service.ts \
  apps/backend/src/notifications/notifications.service.spec.ts \
  apps/backend/src/in-app-notifications/in-app-notifications.service.ts \
  apps/backend/src/work-hours/services/draft-invoice.service.ts \
  apps/backend/src/work-hours/services/hours-threshold-checker.service.ts \
  apps/backend/src/projects/projects.service.ts \
  apps/backend/src/tasks/tasks.service.ts \
  apps/backend/src/tasks/tasks.service.spec.ts \
  apps/backend/src/admin/admin.service.ts \
  apps/backend/src/admin/admin.service.spec.ts \
  apps/backend/src/addresses/addresses.service.ts \
  apps/backend/src/dashboard/dashboard.service.ts \
  apps/backend/src/invoices/invoices.service.ts \
  apps/backend/src/invoices/invoices.service.spec.ts
```

Expected: no output.

- [ ] **Step 4: Run the affected tests**

```bash
pnpm --filter backend test -- notifications auth work-hours projects tasks admin addresses dashboard invoices
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/app.module.ts apps/backend/src/auth apps/backend/src/notifications \
  apps/backend/src/in-app-notifications apps/backend/src/work-hours apps/backend/src/projects \
  apps/backend/src/tasks apps/backend/src/admin apps/backend/src/addresses \
  apps/backend/src/dashboard apps/backend/src/invoices
git commit -m "refactor: rename empresa references in auth, notifications, and peripheral modules to company"
```

---

### Task 6: Backend `clientId`/`client` FK sweep + full backend verification

**Files:**
- Modify (candidates, confirm with the grep in Step 1): `apps/backend/src/work-hours/**`, `apps/backend/src/projects/**`, `apps/backend/src/tasks/**`, `apps/backend/src/addresses/**`, `apps/backend/src/invoices/**`, `apps/backend/src/dashboard/**`, `apps/backend/src/admin/**`, `apps/backend/src/companies/**` (from Task 2, still has `clientId` in its own DTOs)

**Interfaces:**
- Consumes: `Company` Prisma model and its `companyId` FK naming (Task 1).
- Produces: every backend reference to the pre-existing `clientId`/`client` FK now reads `companyId`/`company`. Later frontend tasks (7–9) match these exact field names in API request/response shapes.

This field is genuinely English already (it's what survived from the original `Client`
model), so the rename command from the earlier tasks does not touch it — a blind sed on
the word "client" is dangerous here: `google.strategy.ts` uses `clientID` (OAuth, capital
ID, different token, do not touch), and the `webhook*`/`audit*` services may have an
unrelated notion of "client". Audit before replacing.

- [ ] **Step 1: Enumerate every candidate occurrence**

```bash
grep -rn '\bclientId\b\|\bclient\b' \
  apps/backend/src/work-hours apps/backend/src/projects apps/backend/src/tasks \
  apps/backend/src/addresses apps/backend/src/invoices apps/backend/src/dashboard \
  apps/backend/src/admin apps/backend/src/companies \
  --include='*.ts'
```

- [ ] **Step 2: Classify each match**

For every line the grep prints, keep it in scope only if it refers to the relation to the
`Company` model (a Prisma `include`/`select` of `client`, a DTO field `clientId: string`
tied to work hours/projects/tasks/addresses/invoices, a function parameter named
`clientId` passed to `resolveHourlyRate` or similar). Drop it from scope if it's an
unrelated use of the English word "client" (an HTTP client, a webhook subscriber, a
generic client-side reference in a comment).

- [ ] **Step 3: Apply the rename to the in-scope files**

For each file kept in scope from Step 2:

```bash
sed -i -e 's/\bclientId\b/companyId/g' -e 's/\bclient\b/company/g' <file>
```

Run this one file at a time, and re-check the file afterward — `\bclient\b` will also
match an unrelated standalone word "client" if one exists in that same file outside the
Company relation. If a file has both an in-scope and an out-of-scope occurrence, open it
and edit the in-scope lines by hand instead of running the blanket sed on that file.

- [ ] **Step 4: Special case — `resolveHourlyRate` util**

```bash
grep -n "client" apps/backend/src/work-hours/utils/resolve-hourly-rate.util.ts
```

Rename its `client` parameter to `company` and update its call sites (this is the
function referenced in the project's CLAUDE.md as "Critical Business Logic" — do not
change its behavior, only the parameter name):

```bash
sed -i -e 's/\bclient\b/company/g' apps/backend/src/work-hours/utils/resolve-hourly-rate.util.ts
grep -rln "resolveHourlyRate" apps/backend/src --include='*.ts' | xargs grep -n "resolveHourlyRate("
```

Check every call site printed by the second command still passes a `company` argument in
the right position (rename does not change argument order, only the name at the
definition — call sites that use positional arguments need no change; call sites that use
a `client:` named property in an object argument need the key renamed to `company:`).

- [ ] **Step 5: Confirm no leftover `clientId`/bare `client` remains in the audited scope**

```bash
grep -rn '\bclientId\b\|\bclient\b' \
  apps/backend/src/work-hours apps/backend/src/projects apps/backend/src/tasks \
  apps/backend/src/addresses apps/backend/src/invoices apps/backend/src/dashboard \
  apps/backend/src/admin apps/backend/src/companies \
  --include='*.ts'
```

Expected: no output, or only lines you deliberately excluded in Step 2 (re-read the
excluded lines one more time to confirm they're genuinely unrelated).

- [ ] **Step 6: Full backend build and test suite**

```bash
pnpm --filter backend build
pnpm --filter backend test
```

Expected: both PASS. This is the first point in the plan where the whole backend must be
green — fix any remaining reference the previous tasks missed before moving on.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src
git commit -m "refactor: rename clientId/client FK to companyId/company across the backend"
```

---

### Task 7: Frontend routes, lib, and API proxy routes

**Files:**
- Rename: `apps/frontend/src/app/[locale]/empresa-admin/` → `apps/frontend/src/app/[locale]/company-admin/`
- Rename: `apps/frontend/src/app/[locale]/(authenticated)/empresas/` → `apps/frontend/src/app/[locale]/(authenticated)/companies/`, and its `[clientId]` dynamic segment → `[companyId]`
- Rename: `apps/frontend/src/app/api/empresa-admin/` → `apps/frontend/src/app/api/company-admin/`
- Rename: `apps/frontend/src/lib/empresa-admin-axios.ts` → `apps/frontend/src/lib/company-admin-axios.ts`, `apps/frontend/src/lib/empresa-admin-session.ts` → `apps/frontend/src/lib/company-admin-session.ts`

**Interfaces:**
- Consumes: `company-admin/*` and `companies` backend routes (Tasks 2–4).
- Produces: route paths `/company-admin/login`, `/company-admin/dashboard`, etc.; `/companies`, `/companies/[companyId]`; `COMPANY_ADMIN_COOKIE_NAME` = `"company_admin_token"`. Task 8's feature files import from `@/lib/company-admin-axios` and `@/lib/company-admin-session` by these exact paths.

Note: if the login-unification project (separate spec, out of scope here) has already run
by the time this task executes, `lib/empresa-admin-axios.ts`, `lib/empresa-admin-session.ts`,
and `app/api/empresa-admin/*` will already be deleted rather than present to rename — skip
the parts of this task that reference files that no longer exist, and rename only what's
still there.

- [ ] **Step 1: Rename the directories**

```bash
git mv "apps/frontend/src/app/[locale]/empresa-admin" "apps/frontend/src/app/[locale]/company-admin"
git mv "apps/frontend/src/app/[locale]/(authenticated)/empresas" "apps/frontend/src/app/[locale]/(authenticated)/companies"
git mv "apps/frontend/src/app/[locale]/(authenticated)/companies/[clientId]" "apps/frontend/src/app/[locale]/(authenticated)/companies/[companyId]"
git mv apps/frontend/src/app/api/empresa-admin apps/frontend/src/app/api/company-admin
git mv apps/frontend/src/lib/empresa-admin-axios.ts apps/frontend/src/lib/company-admin-axios.ts
git mv apps/frontend/src/lib/empresa-admin-session.ts apps/frontend/src/lib/company-admin-session.ts
```

- [ ] **Step 2: Apply the rename command to every file in these trees**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
find "apps/frontend/src/app/[locale]/company-admin" \
     "apps/frontend/src/app/[locale]/(authenticated)/companies" \
     apps/frontend/src/app/api/company-admin \
     apps/frontend/src/lib/company-admin-axios.ts \
     apps/frontend/src/lib/company-admin-session.ts \
     -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 "${RENAME_CMD[@]}"
```

- [ ] **Step 3: Rename the `[clientId]` param references left by the folder rename**

The directory rename in Step 1 already renamed the folder segment; Next.js reads the
param name from the folder name, so `useParams()` callers now receive `companyId`. Fix
the call sites:

```bash
grep -rln "clientId" "apps/frontend/src/app/[locale]/(authenticated)/companies" --include='*.tsx'
```

For every file printed, replace `params.clientId` / destructured `{ clientId }` with
`params.companyId` / `{ companyId }`:

```bash
sed -i 's/\bclientId\b/companyId/g' "apps/frontend/src/app/[locale]/(authenticated)/companies/[companyId]/page.tsx"
```

- [ ] **Step 4: Confirm no old identifier remains**

```bash
grep -rlE 'Empresa|Colaborador|Convite|Dominio|clientId' \
  "apps/frontend/src/app/[locale]/company-admin" \
  "apps/frontend/src/app/[locale]/(authenticated)/companies" \
  apps/frontend/src/app/api/company-admin \
  apps/frontend/src/lib/company-admin-axios.ts \
  apps/frontend/src/lib/company-admin-session.ts
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/src/app/[locale]/company-admin" \
        "apps/frontend/src/app/[locale]/(authenticated)/companies" \
        apps/frontend/src/app/api/company-admin \
        apps/frontend/src/lib/company-admin-axios.ts \
        apps/frontend/src/lib/company-admin-session.ts
git commit -m "refactor: rename empresa-admin and empresas routes to company-admin and companies"
```

---

### Task 8: Frontend features, i18n, and nav links

**Files:**
- Rename: `apps/frontend/src/features/clients/` → `apps/frontend/src/features/companies/`
- Rename: `apps/frontend/src/features/empresa-admin/` → `apps/frontend/src/features/company-admin/`
- Modify: `apps/frontend/messages/en.json`, `apps/frontend/messages/pt-BR.json` (key `empresaAdminLink` → `companyAdminLink`)
- Modify: `apps/frontend/src/components/layout/nav.tsx`, `topbar.tsx`, `mobile-nav.tsx`, `main-layout.tsx` (href `/empresas` → `/companies`)
- Modify: `apps/frontend/src/features/auth/login-form.tsx` (uses the `empresaAdminLink` i18n key)

**Interfaces:**
- Consumes: `/companies`, `/company-admin/*` routes (Task 7).
- Produces: `features/companies/*` exports, `features/company-admin/*` exports, i18n key `companyAdminLink`.

- [ ] **Step 1: Rename the directories**

```bash
git mv apps/frontend/src/features/clients apps/frontend/src/features/companies
git mv apps/frontend/src/features/empresa-admin apps/frontend/src/features/company-admin
cd apps/frontend/src/features/company-admin
git mv empresa-admin-auth.service.ts company-admin-auth.service.ts
git mv empresa-admin-dashboard.service.ts company-admin-dashboard.service.ts
git mv use-empresa-admin-auth.tsx use-company-admin-auth.tsx
```

- [ ] **Step 2: Apply the rename command**

```bash
RENAME_CMD=( # same array as Task 1 Step 1 — copy it verbatim )
  sed -i
  -e 's/ConvitePendenteStatus/PendingInviteStatus/g'
  -e 's/ConvitePendente/PendingInvite/g'
  -e 's/convitesPendentesCriados/pendingInvitesCreated/g'
  -e 's/convitesPendentes/pendingInvites/g'
  -e 's/convitePendente/pendingInvite/g'
  -e 's/convite-pendente/pending-invite/g'
  -e 's/convites-pendentes/pending-invites/g'
  -e 's/createdByEmpresaAdminId/createdByCompanyAdminId/g'
  -e 's/createdByEmpresaAdmin/createdByCompanyAdmin/g'
  -e 's/DominioAutorizadoStatus/AuthorizedDomainStatus/g'
  -e 's/DominioAutorizado/AuthorizedDomain/g'
  -e 's/dominiosAutorizados/authorizedDomains/g'
  -e 's/dominioAutorizado/authorizedDomain/g'
  -e 's/dominio-autorizado/authorized-domain/g'
  -e 's/dominios-autorizados/authorized-domains/g'
  -e 's/ColaboradorOrigin/CollaboratorOrigin/g'
  -e 's/notifyColaboradoresOfDeactivation/notifyCollaboratorsOfDeactivation/g'
  -e 's/Colaboradores/Collaborators/g'
  -e 's/colaboradores/collaborators/g'
  -e 's/Colaborador/Collaborator/g'
  -e 's/colaborador/collaborator/g'
  -e 's/EMPRESA_ADMIN_ACTOR_TYPE/COMPANY_ADMIN_ACTOR_TYPE/g'
  -e 's/EMPRESA_ACTIVATION_TOKEN_TYPE/COMPANY_ACTIVATION_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN_INVITE_TOKEN_TYPE/COMPANY_ADMIN_INVITE_TOKEN_TYPE/g'
  -e 's/EMPRESA_ADMIN/COMPANY_ADMIN/g'
  -e 's/EMPRESA/COMPANY/g'
  -e 's/EmpresaAdmin/CompanyAdmin/g'
  -e 's/empresaAdmins/companyAdmins/g'
  -e 's/empresaAdmin/companyAdmin/g'
  -e 's/empresa-admin/company-admin/g'
  -e 's/Empresa/Company/g'
  -e 's/empresas/companies/g'
  -e 's/empresa/company/g'
  -e 's/CONVITE/INVITE/g'
  -e 's/DOMINIO/DOMAIN/g'
)
find apps/frontend/src/features/companies apps/frontend/src/features/company-admin \
  -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 "${RENAME_CMD[@]}"
"${RENAME_CMD[@]}" apps/frontend/messages/en.json apps/frontend/messages/pt-BR.json \
  apps/frontend/src/features/auth/login-form.tsx
```

- [ ] **Step 3: Rename `clientId`-typed fields inside `features/companies`**

```bash
grep -rln "clientId" apps/frontend/src/features/companies --include='*.ts' --include='*.tsx'
```

For each file printed, apply:

```bash
sed -i 's/\bclientId\b/companyId/g' <file>
```

- [ ] **Step 4: Fix nav links**

```bash
sed -i "s#/empresas#/companies#g" \
  apps/frontend/src/components/layout/nav.tsx \
  apps/frontend/src/components/layout/topbar.tsx \
  apps/frontend/src/components/layout/mobile-nav.tsx \
  apps/frontend/src/components/layout/main-layout.tsx
```

- [ ] **Step 5: Confirm no old identifier remains**

```bash
grep -rlE 'Empresa|Colaborador|Convite|Dominio|clientId|/empresas' \
  apps/frontend/src/features/companies apps/frontend/src/features/company-admin \
  apps/frontend/messages/en.json apps/frontend/messages/pt-BR.json \
  apps/frontend/src/features/auth/login-form.tsx \
  apps/frontend/src/components/layout/nav.tsx \
  apps/frontend/src/components/layout/topbar.tsx \
  apps/frontend/src/components/layout/mobile-nav.tsx \
  apps/frontend/src/components/layout/main-layout.tsx
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/companies apps/frontend/src/features/company-admin \
  apps/frontend/messages apps/frontend/src/features/auth/login-form.tsx \
  apps/frontend/src/components/layout
git commit -m "refactor: rename clients and empresa-admin features to companies and company-admin"
```

---

### Task 9: Remaining frontend `clientId` sweep + full frontend verification

**Files:**
- Modify (candidates, confirm with the grep in Step 1): every remaining frontend file with `clientId` — expect hits in `features/work-hours`, `features/projects`, `features/tasks`(if present), `features/analytics`/reports, `features/dashboard`, `features/admin`, and their corresponding page/component files.

**Interfaces:**
- Consumes: backend `companyId` field names (Task 6).
- Produces: every frontend `clientId` reference now reads `companyId`, matching the backend response shape from Task 6.

- [ ] **Step 1: Enumerate every remaining occurrence**

```bash
grep -rln '\bclientId\b' apps/frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
```

- [ ] **Step 2: Classify and rename each file**

For each file, confirm the `clientId` reference is the Company relation (a work-hour,
project, task, address, or invoice's company field) and not something unrelated (there's
no OAuth client-id equivalent on the frontend, so this sweep is lower-risk than Task 6,
but still check each hit before replacing):

```bash
sed -i 's/\bclientId\b/companyId/g' <file>
```

- [ ] **Step 3: Confirm no leftover reference**

```bash
grep -rln '\bclientId\b' apps/frontend/src --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: no output.

- [ ] **Step 4: Full frontend build and test suite**

```bash
pnpm --filter frontend build
pnpm --filter frontend test:ci
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src
git commit -m "refactor: rename remaining clientId references to companyId across the frontend"
```

---

### Task 10: Repo-wide verification and manual smoke test

**Files:** none created or modified — verification only.

- [ ] **Step 1: Repo-wide grep for leftover Portuguese identifiers in code**

```bash
grep -rlE 'Empresa|Colaborador|Convite|Dominio' apps/backend/src apps/backend/prisma/schema.prisma \
  apps/frontend/src apps/frontend/messages --include='*.ts' --include='*.tsx' --include='*.json' --include='*.prisma'
```

Expected: no output, except `pt-BR.json` lines that are translated UI text (values, not
keys) — open any hit in that file and confirm it's a value, not a key, before treating it
as passing.

- [ ] **Step 2: Full monorepo build and test**

```bash
pnpm build
pnpm test
```

Expected: both PASS across every workspace.

- [ ] **Step 3: Manual smoke test**

```bash
pnpm preview:start
```

Using the printed URL:
1. Log in as an existing regular user, confirm `/work-hours` loads.
2. Go to `/companies`, open a company detail page, confirm data loads (this is the
   renamed `/empresas/[clientId]` route).
3. Register a new company admin at `/company-admin/register`, confirm the flow reaches
   `/company-admin/dashboard`.
4. From the dashboard, open the collaborators tab and the invites tab, confirm both load
   without a 404 or 500 (this exercises the renamed `company-admin/collaborators` and
   `company-admin/invites` backend routes end to end).

```bash
pnpm preview:stop
```

- [ ] **Step 4: Commit any stragglers found during the smoke test, otherwise this task is done with no commit**

If Step 1 or Step 3 turned up something, fix it, re-run the relevant grep/test, then:

```bash
git add -A
git commit -m "refactor: fix leftover empresa references found in verification pass"
```
