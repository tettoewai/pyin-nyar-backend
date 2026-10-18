-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "KycDocType" AS ENUM ('STUDENT_CARD', 'NRC');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "StudentKyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "docType" "KycDocType" NOT NULL,
    "docNumber" TEXT NOT NULL,
    "docNumberIndex" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PreferredSubjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreferredSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentKyc_userId_key" ON "StudentKyc"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentKyc_docNumberIndex_key" ON "StudentKyc"("docNumberIndex");

-- CreateIndex
CREATE INDEX "_PreferredSubjects_B_index" ON "_PreferredSubjects"("B");

-- AddForeignKey
ALTER TABLE "StudentKyc" ADD CONSTRAINT "StudentKyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferredSubjects" ADD CONSTRAINT "_PreferredSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentKyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferredSubjects" ADD CONSTRAINT "_PreferredSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
