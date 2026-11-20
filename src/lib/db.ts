import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient; sqliteTuned?: boolean };

export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;

// WAL mode lets the website read while the admin panel writes (better for an office server).
if (!g.sqliteTuned) {
  g.sqliteTuned = true;
  db.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
}
