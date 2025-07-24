-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "form_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "FormSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FormSubmission" ("created_at", "form_type", "id", "payment_status", "status", "updated_at", "user_id") SELECT "created_at", "form_type", "id", "payment_status", "status", "updated_at", "user_id" FROM "FormSubmission";
DROP TABLE "FormSubmission";
ALTER TABLE "new_FormSubmission" RENAME TO "FormSubmission";
CREATE TABLE "new_Refund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "user_id" INTEGER NOT NULL,
    "form_submission_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Refund_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Refund_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "FormSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Refund" ("amount", "created_at", "form_submission_id", "id", "status", "updated_at", "user_id") SELECT "amount", "created_at", "form_submission_id", "id", "status", "updated_at", "user_id" FROM "Refund";
DROP TABLE "Refund";
ALTER TABLE "new_Refund" RENAME TO "Refund";
CREATE UNIQUE INDEX "Refund_user_id_key" ON "Refund"("user_id");
CREATE UNIQUE INDEX "Refund_form_submission_id_key" ON "Refund"("form_submission_id");
CREATE UNIQUE INDEX "Refund_user_id_form_submission_id_key" ON "Refund"("user_id", "form_submission_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
