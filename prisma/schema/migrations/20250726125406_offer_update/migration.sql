-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "estimated_hours" TEXT,
    "total_cost" INTEGER,
    "deliverables" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL DEFAULT 'general',
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Offer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("budget", "created_at", "deliverables", "description", "estimated_hours", "id", "name", "status", "timeline", "total_cost", "type", "updated_at", "user_id") SELECT "budget", "created_at", "deliverables", "description", "estimated_hours", "id", "name", "status", "timeline", "total_cost", "type", "updated_at", "user_id" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
