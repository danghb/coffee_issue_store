-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'MESSAGE',
    "content" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "author" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" INTEGER NOT NULL,
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("author", "authorType", "content", "createdAt", "id", "isInternal", "issueId", "newStatus", "oldStatus", "type") SELECT "author", "authorType", "content", "createdAt", "id", "isInternal", "issueId", "newStatus", "oldStatus", "type" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT,
    "kind" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "issueId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("createdAt", "filename", "id", "issueId", "kind", "mimeType", "path", "sha256", "size") SELECT "createdAt", "filename", "id", "issueId", "kind", "mimeType", "path", "sha256", "size" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE INDEX "Attachment_sha256_idx" ON "Attachment"("sha256");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
