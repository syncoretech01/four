-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "posAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "posLastError" TEXT,
ADD COLUMN     "posStatus" "PosStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginCode_phone_key" ON "LoginCode"("phone");


-- Backfill: every order that exists predates the retry queue and already
-- reached the POS; without this the boot sweep would cancel them as stuck.
UPDATE "Order" SET "posStatus" = 'SENT';
