import { NextResponse } from "next/server";
import { getCartVariants } from "@/lib/store-data";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  const items = await getCartVariants(ids);
  return NextResponse.json({ items });
}
