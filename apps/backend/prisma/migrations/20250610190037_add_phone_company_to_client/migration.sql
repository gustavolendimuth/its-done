-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('HOURS_THRESHOLD', 'INVOICE_UPLOADED', 'WELCOME');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "company" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_userId_type_threshold_idx" ON "NotificationLog"("userId", "type", "threshold");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
