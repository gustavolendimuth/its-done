-- RenameColumn: WorkHour
ALTER TABLE "WorkHour" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "WorkHour" RENAME CONSTRAINT "WorkHour_clientId_fkey" TO "WorkHour_companyId_fkey";

-- RenameColumn: Project
ALTER TABLE "Project" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "Project" RENAME CONSTRAINT "Project_clientId_fkey" TO "Project_companyId_fkey";

-- RenameColumn: Task
ALTER TABLE "Task" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "Task" RENAME CONSTRAINT "Task_clientId_fkey" TO "Task_companyId_fkey";

-- RenameColumn: Address
ALTER TABLE "Address" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "Address" RENAME CONSTRAINT "Address_clientId_fkey" TO "Address_companyId_fkey";

-- RenameColumn: Invoice
ALTER TABLE "Invoice" RENAME COLUMN "clientId" TO "companyId";
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_clientId_fkey" TO "Invoice_companyId_fkey";
