import path from "path";
import { readFile, stat } from "fs/promises";
import { uploadRoot } from "@/lib/uploads";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4" };

// Serves files uploaded from the admin panel (stored outside /public so they survive rebuilds).
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const root = uploadRoot();
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const st = await stat(file);
    if (!st.isFile()) throw new Error();
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ...(file.endsWith(".svg") ? { "Content-Security-Policy": "script-src 'none'" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
