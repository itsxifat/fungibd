/**
 * Creates a safe copy of the database in ./backups (keeps the latest 30).
 * Run manually with `npm run backup`, or schedule it daily (see DEPLOYMENT.md).
 */
import path from "path";
import { mkdir, readdir, rm } from "fs/promises";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const dir = path.resolve(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(dir, `fungibd-${stamp}.db`);
  await db.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  console.log(`Backup written: ${file}`);
  const all = (await readdir(dir)).filter((f) => f.startsWith("fungibd-") && f.endsWith(".db")).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 30))) await rm(path.join(dir, old));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
