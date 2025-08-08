/*
  Warnings:

  - You are about to drop the column `reviewed_admin_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `reviewed_freelancer_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `reviewed_user_type` on the `Review` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewed_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewed_freelancer_id_fkey";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "reviewed_admin_id",
DROP COLUMN "reviewed_freelancer_id",
DROP COLUMN "reviewed_user_type";
