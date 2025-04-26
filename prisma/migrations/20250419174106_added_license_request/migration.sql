/*
  Warnings:

  - You are about to drop the column `isntruction` on the `PremiumAppSupport` table. All the data in the column will be lost.
  - Added the required column `instruction` to the `PremiumAppSupport` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "LicenseRequest" (
    "name" TEXT NOT NULL,
    "company_email" TEXT NOT NULL,
    "license_type" TEXT NOT NULL,
    "premium_add_ons" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "number_of_licenses" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "LicenseRequest_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PremiumAppSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "add_on_to_configure" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "current_setup_status" TEXT NOT NULL,
    "integration_needs" TEXT NOT NULL,
    "smartsheet_plan" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "instruction" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PremiumAppSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PremiumAppSupport" ("add_on_to_configure", "contact_preference", "current_setup_status", "form_submission_id", "id", "integration_needs", "objective", "smartsheet_plan", "start_date") SELECT "add_on_to_configure", "contact_preference", "current_setup_status", "form_submission_id", "id", "integration_needs", "objective", "smartsheet_plan", "start_date" FROM "PremiumAppSupport";
DROP TABLE "PremiumAppSupport";
ALTER TABLE "new_PremiumAppSupport" RENAME TO "PremiumAppSupport";
CREATE UNIQUE INDEX "PremiumAppSupport_form_submission_id_key" ON "PremiumAppSupport"("form_submission_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LicenseRequest_form_submission_id_key" ON "LicenseRequest"("form_submission_id");
