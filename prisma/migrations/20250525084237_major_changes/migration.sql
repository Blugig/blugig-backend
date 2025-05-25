-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "profile_photo" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "profile_photo" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_id" TEXT,
    "form_id" INTEGER NOT NULL,
    "latest_message_id" INTEGER,
    CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_latest_message_id_fkey" FOREIGN KEY ("latest_message_id") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("created_at", "form_id", "id", "updated_at", "user_id") SELECT "created_at", "form_id", "id", "updated_at", "user_id" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE UNIQUE INDEX "Conversation_form_id_key" ON "Conversation"("form_id");
CREATE UNIQUE INDEX "Conversation_latest_message_id_key" ON "Conversation"("latest_message_id");
CREATE UNIQUE INDEX "Conversation_user_id_admin_id_form_id_key" ON "Conversation"("user_id", "admin_id", "form_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
