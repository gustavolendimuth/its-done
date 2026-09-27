-- RenameTable
ALTER TABLE "Client" RENAME TO "Empresa";
ALTER TABLE "Empresa" RENAME CONSTRAINT "Client_pkey" TO "Empresa_pkey";

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_userId_empresaId_key" ON "Colaborador"("userId", "empresaId");

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: backfill one Colaborador row per pre-existing Empresa (ex-Client) owner
INSERT INTO "Colaborador" ("id", "userId", "empresaId", "createdAt")
SELECT gen_random_uuid()::text, "userId", "id", CURRENT_TIMESTAMP
FROM "Empresa";

-- DropForeignKey
ALTER TABLE "Empresa" DROP CONSTRAINT "Client_userId_fkey";

-- AlterTable: Empresa no longer has a single owner, ownership moves to Colaborador (N:N)
ALTER TABLE "Empresa" DROP COLUMN "userId";
