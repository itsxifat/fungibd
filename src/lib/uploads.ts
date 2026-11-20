import "server-only";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import sharp from "sharp";

export const uploadRoot = () => path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");

/** Saves an uploaded image as an optimised WebP and returns its public URL (/media/...). */
export async function saveImage(file: File, folder: "products" | "brand" | "site", maxWidth = 1600) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > 12 * 1024 * 1024) throw new Error("Image is larger than 12 MB");
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  const isSvg = file.type === "image/svg+xml";
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${isSvg ? "svg" : "webp"}`;
  if (isSvg) {
    const text = buf.toString("utf8");
    if (/<script|on\w+=|javascript:/i.test(text)) throw new Error("This SVG contains scripts and was rejected");
    await writeFile(path.join(dir, name), text);
  } else {
    const out = await sharp(buf).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await writeFile(path.join(dir, name), out);
  }
  return `/media/${folder}/${name}`;
}
