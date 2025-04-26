/*
  Warnings:

  - You are about to drop the `AdminPermission` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `permissions` to the `Admin` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AdminPermission";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "access_token" TEXT,
    "last_login" DATETIME,
    "generated_otp" INTEGER,
    "otp_generated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "permissions" TEXT NOT NULL
);
INSERT INTO "new_Admin" ("access_token", "created_at", "email", "generated_otp", "id", "is_active", "is_super_admin", "last_login", "name", "otp_generated_at", "password", "updated_at") SELECT "access_token", "created_at", "email", "generated_otp", "id", "is_active", "is_super_admin", "last_login", "name", "otp_generated_at", "password", "updated_at" FROM "Admin";
DROP TABLE "Admin";
ALTER TABLE "new_Admin" RENAME TO "Admin";
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
