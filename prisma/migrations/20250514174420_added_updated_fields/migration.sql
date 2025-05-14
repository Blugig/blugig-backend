/*
  Warnings:

  - You are about to drop the column `smartsheet_plan` on the `PremiumAppSupport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BookOneOnOne" ADD COLUMN "preferred_date" DATETIME;

-- AlterTable
ALTER TABLE "LicenseRequest" ADD COLUMN "plan_duration" TEXT;
ALTER TABLE "LicenseRequest" ADD COLUMN "selected_plan" TEXT;

-- AlterTable
ALTER TABLE "ReportsDashboard" ADD COLUMN "budget" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PremiumAppSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "add_on_to_configure" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "current_setup_status" TEXT NOT NULL,
    "integration_needs" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "instruction" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "attachment" TEXT,
    "attachmentType" TEXT,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PremiumAppSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PremiumAppSupport" ("add_on_to_configure", "attachment", "attachmentType", "contact_preference", "current_setup_status", "form_submission_id", "id", "instruction", "integration_needs", "objective", "start_date") SELECT "add_on_to_configure", "attachment", "attachmentType", "contact_preference", "current_setup_status", "form_submission_id", "id", "instruction", "integration_needs", "objective", "start_date" FROM "PremiumAppSupport";
DROP TABLE "PremiumAppSupport";
ALTER TABLE "new_PremiumAppSupport" RENAME TO "PremiumAppSupport";
CREATE UNIQUE INDEX "PremiumAppSupport_form_submission_id_key" ON "PremiumAppSupport"("form_submission_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
