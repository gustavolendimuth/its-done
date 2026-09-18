-- AlterTable
ALTER TABLE "EmpresaAdmin" ADD COLUMN     "invitedById" TEXT;

-- AddForeignKey
ALTER TABLE "EmpresaAdmin" ADD CONSTRAINT "EmpresaAdmin_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "EmpresaAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
