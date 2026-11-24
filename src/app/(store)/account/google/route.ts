import { NextResponse, type NextRequest } from "next/server";
import { getCustomer, signToken } from "@/lib/auth";
import { safeCustomerNext } from "@/lib/customer-auth";
import { CUSTOMER_GOOGLE_COOKIE, googleConfig, googleCookieOptions, GOOGLE_AUTH_LIFETIME, startGoogleLogin } from "@/lib/google-auth";
import { rateLimit } from "@/lib/security";
import { siteUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const config = googleConfig();
  const linking = request.nextUrl.searchParams.get("link") === "1";
  const destination = safeCustomerNext(request.nextUrl.searchParams.get("next") ?? undefined);
  if (!config || !(await rateLimit("customer-google-start", 12, 10 * 60_000))) {
    const page = linking ? "/account" : "/account/login";
    return NextResponse.redirect(new URL(`${page}?google=unavailable`, siteUrl()));
  }

  const customer = await getCustomer();
  if (linking && (!customer?.email || customer.googleSubject)) {
    return NextResponse.redirect(new URL(customer ? "/account?google=error" : "/account/login", siteUrl()));
  }
  if (customer && !linking) return NextResponse.redirect(new URL(destination, siteUrl()));

  const { attempt, url } = startGoogleLogin(config, "customer-google", linking ? "/account" : destination, customer?.id);
  const response = NextResponse.redirect(url);
  response.cookies.set(CUSTOMER_GOOGLE_COOKIE, await signToken(attempt, "10m"), { ...googleCookieOptions(), maxAge: GOOGLE_AUTH_LIFETIME });
  return response;
}
