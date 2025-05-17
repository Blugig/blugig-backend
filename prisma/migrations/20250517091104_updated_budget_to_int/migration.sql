/*
  Warnings:

  - You are about to alter the column `budget` on the `ApiIntegration` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `budget` on the `SolutionImplementation` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `budget` on the `SystemAdminSupport` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiIntegration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "integration_type" TEXT NOT NULL,
    "target_application" TEXT NOT NULL,
    "integration_objective" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER,
    "instructions" TEXT,
    "attachment" TEXT,
    "attachmentType" TEXT,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "ApiIntegration_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ApiIntegration" ("attachment", "attachmentType", "budget", "form_submission_id", "id", "instructions", "integration_objective", "integration_type", "target_application", "timeline") SELECT "attachment", "attachmentType", "budget", "form_submission_id", "id", "instructions", "integration_objective", "integration_type", "target_application", "timeline" FROM "ApiIntegration";
DROP TABLE "ApiIntegration";
ALTER TABLE "new_ApiIntegration" RENAME TO "ApiIntegration";
CREATE UNIQUE INDEX "ApiIntegration_form_submission_id_key" ON "ApiIntegration"("form_submission_id");
CREATE TABLE "new_SolutionImplementation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project_name" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "project_goals" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "requirements" TEXT,
    "budget" INTEGER NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "attachment" TEXT,
    "attachmentType" TEXT,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SolutionImplementation_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SolutionImplementation" ("attachment", "attachmentType", "budget", "contact_preference", "form_submission_id", "id", "industry", "project_goals", "project_name", "project_type", "requirements", "timeline") SELECT "attachment", "attachmentType", "budget", "contact_preference", "form_submission_id", "id", "industry", "project_goals", "project_name", "project_type", "requirements", "timeline" FROM "SolutionImplementation";
DROP TABLE "SolutionImplementation";
ALTER TABLE "new_SolutionImplementation" RENAME TO "SolutionImplementation";
CREATE UNIQUE INDEX "SolutionImplementation_form_submission_id_key" ON "SolutionImplementation"("form_submission_id");
CREATE TABLE "new_SystemAdminSupport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "number_of_users" INTEGER NOT NULL,
    "type_of_support" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "budget" INTEGER,
    "support_needs" TEXT NOT NULL,
    "contact_preference" TEXT NOT NULL,
    "attachment" TEXT,
    "attachmentType" TEXT,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "SystemAdminSupport_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SystemAdminSupport" ("attachment", "attachmentType", "budget", "company_name", "contact_preference", "form_submission_id", "id", "number_of_users", "start_date", "support_needs", "type_of_support") SELECT "attachment", "attachmentType", "budget", "company_name", "contact_preference", "form_submission_id", "id", "number_of_users", "start_date", "support_needs", "type_of_support" FROM "SystemAdminSupport";
DROP TABLE "SystemAdminSupport";
ALTER TABLE "new_SystemAdminSupport" RENAME TO "SystemAdminSupport";
CREATE UNIQUE INDEX "SystemAdminSupport_form_submission_id_key" ON "SystemAdminSupport"("form_submission_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
