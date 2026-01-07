-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nanoId" TEXT NOT NULL DEFAULT '',
    "submitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporterName" TEXT NOT NULL,
    "contact" TEXT,
    "modelId" INTEGER NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" DATETIME,
    "customerName" TEXT,
    "firmware" TEXT,
    "softwareVer" TEXT,
    "title" TEXT NOT NULL,
    "occurredAt" DATETIME,
    "frequency" TEXT,
    "phenomenon" TEXT,
    "errorCode" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "priority" TEXT,
    "environment" TEXT,
    "location" TEXT,
    "waterType" TEXT,
    "voltage" TEXT,
    "usageFrequency" TEXT,
    "restarted" BOOLEAN,
    "cleaned" BOOLEAN,
    "replacedPart" TEXT,
    "troubleshooting" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" INTEGER,
    "customData" TEXT,
    CONSTRAINT "Issue_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("cleaned", "contact", "createdAt", "customData", "customerName", "description", "environment", "errorCode", "firmware", "frequency", "id", "location", "modelId", "nanoId", "occurredAt", "phenomenon", "priority", "purchaseDate", "replacedPart", "reporterName", "restarted", "serialNumber", "severity", "softwareVer", "status", "submitDate", "title", "troubleshooting", "updatedAt", "usageFrequency", "voltage", "waterType") SELECT "cleaned", "contact", "createdAt", "customData", "customerName", "description", "environment", "errorCode", "firmware", "frequency", "id", "location", "modelId", "nanoId", "occurredAt", "phenomenon", "priority", "purchaseDate", "replacedPart", "reporterName", "restarted", "serialNumber", "severity", "softwareVer", "status", "submitDate", "title", "troubleshooting", "updatedAt", "usageFrequency", "voltage", "waterType" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE UNIQUE INDEX "Issue_nanoId_key" ON "Issue"("nanoId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
