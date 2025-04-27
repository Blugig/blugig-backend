-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PmoControlCenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "service_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "project_details" TEXT NOT NULL,
    "expected_projects" INTEGER NOT NULL,
    "smartsheet_admin_access" TEXT NOT NULL,
    "current_setup" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "additional_notes" TEXT,
    "contact_preference" TEXT NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    CONSTRAINT "PmoControlCenter_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PmoControlCenter" ("additional_notes", "contact_preference", "current_setup", "expected_projects", "form_submission_id", "id", "industry", "project_details", "service_type", "smartsheet_admin_access", "timeline") SELECT "additional_notes", "contact_preference", "current_setup", "expected_projects", "form_submission_id", "id", "industry", "project_details", "service_type", "smartsheet_admin_access", "timeline" FROM "PmoControlCenter";
DROP TABLE "PmoControlCenter";
ALTER TABLE "new_PmoControlCenter" RENAME TO "PmoControlCenter";
CREATE UNIQUE INDEX "PmoControlCenter_form_submission_id_key" ON "PmoControlCenter"("form_submission_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
