-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('requested', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('client_payment_escrow', 'freelancer_earning', 'freelancer_withdrawal', 'refund_to_client');

-- CreateTable
CREATE TABLE "FreelancerWallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "total_earned" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelancerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLedger" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "freelancer_id" INTEGER,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_id" INTEGER,
    "refund_id" INTEGER,
    "withdrawal_id" INTEGER,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "external_ref" TEXT,

    CONSTRAINT "TransactionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreelancerWallet_user_id_key" ON "FreelancerWallet"("user_id");

-- AddForeignKey
ALTER TABLE "FreelancerWallet" ADD CONSTRAINT "FreelancerWallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "freelancers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "freelancers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "freelancers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
