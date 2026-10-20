-- RenameTable
ALTER TABLE "Empresa" RENAME TO "Company";
ALTER TABLE "Company" RENAME CONSTRAINT "Empresa_pkey" TO "Company_pkey";

ALTER TABLE "Colaborador" RENAME TO "Collaborator";
ALTER TABLE "Collaborator" RENAME CONSTRAINT "Colaborador_pkey" TO "Collaborator_pkey";

ALTER TABLE "EmpresaAdmin" RENAME TO "CompanyAdmin";
ALTER TABLE "CompanyAdmin" RENAME CONSTRAINT "EmpresaAdmin_pkey" TO "CompanyAdmin_pkey";

ALTER TABLE "ConvitePendente" RENAME TO "PendingInvite";
ALTER TABLE "PendingInvite" RENAME CONSTRAINT "ConvitePendente_pkey" TO "PendingInvite_pkey";

ALTER TABLE "DominioAutorizado" RENAME TO "AuthorizedDomain";
ALTER TABLE "AuthorizedDomain" RENAME CONSTRAINT "DominioAutorizado_pkey" TO "AuthorizedDomain_pkey";

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
ALTER TABLE "CompanyAdmin" RENAME CONSTRAINT "EmpresaAdmin_invitedById_fkey" TO "CompanyAdmin_invitedById_fkey";
ALTER TABLE "PendingInvite" RENAME CONSTRAINT "ConvitePendente_empresaId_fkey" TO "PendingInvite_companyId_fkey";
ALTER TABLE "PendingInvite" RENAME CONSTRAINT "ConvitePendente_createdByEmpresaAdminId_fkey" TO "PendingInvite_createdByCompanyAdminId_fkey";
ALTER TABLE "AuthorizedDomain" RENAME CONSTRAINT "DominioAutorizado_empresaId_fkey" TO "AuthorizedDomain_companyId_fkey";

-- RenameIndex
ALTER INDEX "Colaborador_userId_empresaId_key" RENAME TO "Collaborator_userId_companyId_key";
ALTER INDEX "EmpresaAdmin_email_key" RENAME TO "CompanyAdmin_email_key";
ALTER INDEX "ConvitePendente_empresaId_email_key" RENAME TO "PendingInvite_companyId_email_key";
ALTER INDEX "DominioAutorizado_empresaId_domain_key" RENAME TO "AuthorizedDomain_companyId_domain_key";
