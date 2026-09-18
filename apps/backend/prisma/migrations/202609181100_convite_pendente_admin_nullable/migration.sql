-- MW-26 — Desativação de Empresa faz hard-delete dos EmpresaAdmin daquela
-- Empresa. ConvitePendente.createdByEmpresaAdminId era NOT NULL com
-- ON DELETE RESTRICT, o que bloquearia o delete de qualquer EmpresaAdmin
-- que já tivesse criado um convite (mesmo revogado/já efetivado). Como o
-- ConvitePendente em si precisa continuar existindo (histórico), a coluna
-- vira opcional e passa a ON DELETE SET NULL.

-- DropForeignKey
ALTER TABLE "ConvitePendente" DROP CONSTRAINT "ConvitePendente_createdByEmpresaAdminId_fkey";

-- AlterTable
ALTER TABLE "ConvitePendente" ALTER COLUMN "createdByEmpresaAdminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ConvitePendente" ADD CONSTRAINT "ConvitePendente_createdByEmpresaAdminId_fkey" FOREIGN KEY ("createdByEmpresaAdminId") REFERENCES "EmpresaAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
