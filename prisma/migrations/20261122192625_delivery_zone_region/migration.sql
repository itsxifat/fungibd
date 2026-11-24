-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "charge" REAL NOT NULL,
    "riderCost" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_DeliveryZone" ("charge", "id", "isActive", "nameBn", "nameEn", "riderCost", "sortOrder") SELECT "charge", "id", "isActive", "nameBn", "nameEn", "riderCost", "sortOrder" FROM "DeliveryZone";
DROP TABLE "DeliveryZone";
ALTER TABLE "new_DeliveryZone" RENAME TO "DeliveryZone";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
