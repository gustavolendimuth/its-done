-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "NotificationLog_userId_clientId_type_threshold_idx" ON "NotificationLog"("userId", "clientId", "type", "threshold");
