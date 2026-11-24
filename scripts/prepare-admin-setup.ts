import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashAuthToken, OWNER_SETUP_ID } from "../src/lib/owner-setup";

const db = new PrismaClient();

async function prepare() {
  const code = randomBytes(32).toString("base64url");
  await db.$transaction(async (tx) => {
    await tx.ownerSetup.upsert({ where: { id: OWNER_SETUP_ID }, create: { id: OWNER_SETUP_ID }, update: {} });
    const { count } = await tx.ownerSetup.updateMany({
      where: { id: OWNER_SETUP_ID, claimedAt: null },
      data: { tokenHash: hashAuthToken(code) },
    });
    if (!count) throw new Error("The one-time owner setup has already been completed.");
    await tx.adminUser.deleteMany();
  });
  console.log(code);
}

prepare()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
