-- AlterTable
ALTER TABLE "StudentKyc" ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userName" TEXT NOT NULL,
ADD COLUMN     "usernameChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- AddForeignKey
ALTER TABLE "StudentKyc" ADD CONSTRAINT "StudentKyc_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;