/*
  Warnings:

  - Made the column `company` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "company" SET NOT NULL;
