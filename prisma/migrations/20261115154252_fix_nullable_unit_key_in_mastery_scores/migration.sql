/*
  Warnings:

  - You are about to drop the column `chapterId` on the `MasteryScore` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `MasteryScore` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `MasteryScore` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,scopeType,scopeId]` on the table `MasteryScore` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scopeId` to the `MasteryScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeType` to the `MasteryScore` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MasteryScope" AS ENUM ('SUBJECT', 'CHAPTER', 'LESSON');

-- DropForeignKey
ALTER TABLE "MasteryScore" DROP CONSTRAINT "MasteryScore_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "MasteryScore" DROP CONSTRAINT "MasteryScore_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "MasteryScore" DROP CONSTRAINT "MasteryScore_subjectId_fkey";

-- DropIndex
DROP INDEX "MasteryScore_userId_lessonId_key";

-- DropIndex
DROP INDEX "MasteryScore_userId_score_idx";

-- AlterTable
ALTER TABLE "MasteryScore" DROP COLUMN "chapterId",
DROP COLUMN "lessonId",
DROP COLUMN "subjectId",
ADD COLUMN     "scopeId" TEXT NOT NULL,
ADD COLUMN     "scopeType" "MasteryScope" NOT NULL;

-- CreateIndex
CREATE INDEX "MasteryScore_userId_scopeType_score_idx" ON "MasteryScore"("userId", "scopeType", "score");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryScore_userId_scopeType_scopeId_key" ON "MasteryScore"("userId", "scopeType", "scopeId");
