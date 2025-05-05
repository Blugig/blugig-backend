-- CreateTable
CREATE TABLE "Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Offer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_url" TEXT,
    "media_type" TEXT,
    "message_type" TEXT NOT NULL,
    "offer_id" INTEGER,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" INTEGER,
    "sender_admin_id" TEXT,
    CONSTRAINT "Message_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_admin_id_fkey" FOREIGN KEY ("sender_admin_id") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("body", "conversation_id", "id", "media_type", "media_url", "message_type", "sender_admin_id", "sender_user_id", "time") SELECT "body", "conversation_id", "id", "media_type", "media_url", "message_type", "sender_admin_id", "sender_user_id", "time" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
