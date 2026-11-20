import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/uploads";

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const fd = await req.formData();
  const folder = (fd.get("folder") as string) || "products";
  const files = fd.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No file" }, { status: 400 });
  try {
    const urls = [];
    for (const f of files.slice(0, 10)) urls.push(await saveImage(f, folder === "brand" ? "brand" : folder === "site" ? "site" : "products"));
    return NextResponse.json({ urls });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
