-- CreateEnum
CREATE TYPE "ConvitePendenteStatus" AS ENUM ('PENDING', 'LINKED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DominioAutorizadoStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVOKED');

-- CreateTable
CREATE TABLE "ConvitePendente" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ConvitePendenteStatus" NOT NULL DEFAULT 'PENDING',
    "createdByEmpresaAdminId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConvitePendente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DominioAutorizado" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "DominioAutorizadoStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DominioAutorizado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConvitePendente_empresaId_email_key" ON "ConvitePendente"("empresaId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "DominioAutorizado_empresaId_domain_key" ON "DominioAutorizado"("empresaId", "domain");

-- AddForeignKey
ALTER TABLE "ConvitePendente" ADD CONSTRAINT "ConvitePendente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConvitePendente" ADD CONSTRAINT "ConvitePendente_createdByEmpresaAdminId_fkey" FOREIGN KEY ("createdByEmpresaAdminId") REFERENCES "EmpresaAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DominioAutorizado" ADD CONSTRAINT "DominioAutorizado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
