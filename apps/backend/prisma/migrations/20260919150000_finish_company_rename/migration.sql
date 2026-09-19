-- Rename the final Company foreign-key-shaped columns without rewriting data.
ALTER TABLE "NotificationLog" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "WorkSession" RENAME COLUMN "clientId" TO "companyId";

-- Keep the physical index name aligned with the renamed NotificationLog field.
ALTER INDEX "NotificationLog_userId_clientId_type_threshold_idx" RENAME TO "NotificationLog_userId_companyId_type_threshold_idx";
