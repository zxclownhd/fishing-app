/*
  Warnings:

  - You are about to drop the column `caption` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the `Inquiry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `publicId` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterUserId_fkey";

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "caption",
ADD COLUMN     "publicId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Inquiry";

-- DropTable
DROP TABLE "Report";

-- DropEnum
DROP TYPE "InquiryStatus";

-- DropEnum
DROP TYPE "ReportReason";

-- DropEnum
DROP TYPE "ReportStatus";

-- CreateIndex
CREATE INDEX "Photo_publicId_idx" ON "Photo"("publicId");
