PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
BEGIN;

CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "googleSubject" TEXT,
    "passwordHash" TEXT,
    "hasAccount" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "firstOrderAt" DATETIME,
    "lastOrderAt" DATETIME,
    "resetToken" TEXT,
    "resetTokenExp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Customer" ("createdAt", "email", "firstOrderAt", "hasAccount", "id", "lastOrderAt", "marketingOptIn", "name", "notes", "passwordHash", "phone", "resetToken", "resetTokenExp", "source", "tags", "totalOrders", "totalSpent", "updatedAt")
SELECT "createdAt", "email", "firstOrderAt", "hasAccount", "id", "lastOrderAt", "marketingOptIn", "name", "notes", "passwordHash", "phone", "resetToken", "resetTokenExp", "source", "tags", "totalOrders", "totalSpent", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "Customer_googleSubject_key" ON "Customer"("googleSubject");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_lastOrderAt_idx" ON "Customer"("lastOrderAt");

COMMIT;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
