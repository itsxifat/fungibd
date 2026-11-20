import path from "path";
import { mkdir, readFile, rm } from "fs/promises";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// Owner-only: downloads a consistent copy of the whole database (SQLite VACUUM INTO).
export async function GET() {
  const admin = await getAdmin();
  if (!admin || admin.role !== "OWNER") return new Response("Forbidden", { status: 403 });
  const dir = path.resolve(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(dir, `fungibd-${stamp}.db`);
  await db.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const data = await readFile(file);
  await rm(file).catch(() => {});
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="fungibd-backup-${stamp}.db"` },
  });
}
