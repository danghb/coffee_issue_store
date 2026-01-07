-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "priority" TEXT;
ALTER TABLE "Issue" ADD COLUMN "severity" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'MESSAGE',
    "content" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "author" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" INTEGER NOT NULL,
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("author", "content", "createdAt", "id", "isInternal", "issueId", "newStatus", "oldStatus", "type") SELECT "author", "content", "createdAt", "id", "isInternal", "issueId", "newStatus", "oldStatus", "type" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
