/*
  Warnings:

  - You are about to drop the column `workHourId` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_workHourId_fkey";

-- DropIndex
DROP INDEX "Invoice_workHourId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "workHourId",
ALTER COLUMN "fileUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InvoiceWorkHour" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "workHourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceWorkHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceWorkHour_invoiceId_workHourId_key" ON "InvoiceWorkHour"("invoiceId", "workHourId");

-- AddForeignKey
ALTER TABLE "InvoiceWorkHour" ADD CONSTRAINT "InvoiceWorkHour_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceWorkHour" ADD CONSTRAINT "InvoiceWorkHour_workHourId_fkey" FOREIGN KEY ("workHourId") REFERENCES "WorkHour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
