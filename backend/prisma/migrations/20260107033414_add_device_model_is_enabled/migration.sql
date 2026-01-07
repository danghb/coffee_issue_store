-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeviceModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_DeviceModel" ("id", "name") SELECT "id", "name" FROM "DeviceModel";
DROP TABLE "DeviceModel";
ALTER TABLE "new_DeviceModel" RENAME TO "DeviceModel";
CREATE UNIQUE INDEX "DeviceModel_name_key" ON "DeviceModel"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
