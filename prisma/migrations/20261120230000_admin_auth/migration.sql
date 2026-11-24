ALTER TABLE "AdminUser" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "AdminUser" ADD COLUMN "googleSubject" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN "verifyTokenHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "verifyTokenExpiresAt" DATETIME;
ALTER TABLE "AdminUser" ADD COLUMN "resetTokenHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "resetTokenExpiresAt" DATETIME;

CREATE UNIQUE INDEX "AdminUser_googleSubject_key" ON "AdminUser"("googleSubject");
CREATE UNIQUE INDEX "AdminUser_verifyTokenHash_key" ON "AdminUser"("verifyTokenHash");
CREATE UNIQUE INDEX "AdminUser_resetTokenHash_key" ON "AdminUser"("resetTokenHash");

CREATE TABLE "OwnerSetup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT,
    "claimedAt" DATETIME
);
