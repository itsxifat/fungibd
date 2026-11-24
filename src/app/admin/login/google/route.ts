import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, signToken } from "@/lib/auth";
import { safeAdminNext } from "@/lib/admin-auth";
import { googleConfig, googleCookieOptions, GOOGLE_AUTH_COOKIE, GOOGLE_AUTH_LIFETIME, startGoogleLogin } from "@/lib/google-auth";
import { rateLimit } from "@/lib/security";
import { siteUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const config = googleConfig();
  if (!config || !(await rateLimit("admin-google-start", 10, 10 * 60_000))) {
    return NextResponse.redirect(new URL("/admin/login?google=unavailable", siteUrl()));
  }

  const linking = request.nextUrl.searchParams.get("link") === "1";
  const user = linking ? await getAdmin() : null;
  if (linking && (!user?.emailVerified || user.googleLinked)) {
    return NextResponse.redirect(new URL("/admin?google=error", siteUrl()));
  }
  const { attempt, url } = startGoogleLogin(config, "admin-google", safeAdminNext(request.nextUrl.searchParams.get("next") ?? undefined), user?.id);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_AUTH_COOKIE, await signToken(attempt, "10m"), { ...googleCookieOptions(), maxAge: GOOGLE_AUTH_LIFETIME });
  return response;
}
