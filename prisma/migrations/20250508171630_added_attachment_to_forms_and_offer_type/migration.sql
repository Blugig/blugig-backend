-- AlterTable
ALTER TABLE "ApiIntegration" ADD COLUMN "attachment" TEXT;
ALTER TABLE "ApiIntegration" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "BookOneOnOne" ADD COLUMN "attachment" TEXT;
ALTER TABLE "BookOneOnOne" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "HireSmartsheetExpert" ADD COLUMN "attachment" TEXT;
ALTER TABLE "HireSmartsheetExpert" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "LicenseRequest" ADD COLUMN "attachment" TEXT;
ALTER TABLE "LicenseRequest" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "PmoControlCenter" ADD COLUMN "attachment" TEXT;
ALTER TABLE "PmoControlCenter" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "PremiumAppSupport" ADD COLUMN "attachment" TEXT;
ALTER TABLE "PremiumAppSupport" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "ReportsDashboard" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "SolutionImplementation" ADD COLUMN "attachment" TEXT;
ALTER TABLE "SolutionImplementation" ADD COLUMN "attachmentType" TEXT;

-- AlterTable
ALTER TABLE "SystemAdminSupport" ADD COLUMN "attachment" TEXT;
ALTER TABLE "SystemAdminSupport" ADD COLUMN "attachmentType" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "user_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Offer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("budget", "created_at", "description", "id", "name", "status", "timeline", "updated_at", "user_id") SELECT "budget", "created_at", "description", "id", "name", "status", "timeline", "updated_at", "user_id" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
