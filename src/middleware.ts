import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Blocks every /admin page unless a valid admin session cookie is present.
// (Each admin page and action also re-checks the user in the database.)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return NextResponse.next();
  const token = req.cookies.get("fb_admin")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret"));
      if (payload.kind === "admin") return NextResponse.next();
    } catch {
      /* fall through */
    }
  }
  // Build the redirect from the public address (behind nginx the app itself only knows 127.0.0.1:port)
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const base = process.env.SITE_URL || `${proto}://${host}`;
  return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(pathname)}`, base));
}

export const config = { matcher: ["/admin/:path*"] };
