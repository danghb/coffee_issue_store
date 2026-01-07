-- CreateTable
CREATE TABLE "DeviceModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "Issue_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT,
    "kind" TEXT NOT NULL,
    "issueId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'MESSAGE',
    "content" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" INTEGER NOT NULL,
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModel_name_key" ON "DeviceModel"("name");

-- CreateIndex
CREATE INDEX "Attachment_sha256_idx" ON "Attachment"("sha256");
