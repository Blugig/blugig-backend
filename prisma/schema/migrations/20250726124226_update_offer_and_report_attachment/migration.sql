-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "deliverables" TEXT;
ALTER TABLE "Offer" ADD COLUMN "estimated_hours" INTEGER;
ALTER TABLE "Offer" ADD COLUMN "total_cost" INTEGER;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN "attachment" TEXT;
