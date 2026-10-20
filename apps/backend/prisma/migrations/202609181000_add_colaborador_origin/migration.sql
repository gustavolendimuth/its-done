-- CreateEnum
CREATE TYPE "ColaboradorOrigin" AS ENUM ('CONVITE', 'DOMINIO');

-- AlterTable
ALTER TABLE "Colaborador" ADD COLUMN "origin" "ColaboradorOrigin";
