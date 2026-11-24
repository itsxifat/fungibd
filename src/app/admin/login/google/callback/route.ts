import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, getCustomer, startAdminSession, startCustomerSession, verifyToken } from "@/lib/auth";
import { safeAdminNext, validAdminEmail } from "@/lib/admin-auth";
import { safeCustomerNext, signInGoogleCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { CUSTOMER_GOOGLE_COOKIE, getGoogleIdentity, googleConfig, googleCookieOptions, GOOGLE_AUTH_COOKIE, type GoogleLoginAttempt } from "@/lib/google-auth";
import { rateLimit } from "@/lib/security";
import { siteUrl } from "@/lib/utils";

function finish(path: string, cookie: string) {
  const response = NextResponse.redirect(new URL(path, siteUrl()));
  response.cookies.set(cookie, "", { ...googleCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const config = googleConfig();
  const [adminAttempt, customerAttempt] = await Promise.all([
    verifyToken<GoogleLoginAttempt>(request.cookies.get(GOOGLE_AUTH_COOKIE)?.value),
    verifyToken<GoogleLoginAttempt>(request.cookies.get(CUSTOMER_GOOGLE_COOKIE)?.value),
  ]);
  const state = request.nextUrl.searchParams.get("state");
  const isCustomer = customerAttempt?.kind === "customer-google" && (customerAttempt.state === state || !adminAttempt);
  const cookie = isCustomer ? CUSTOMER_GOOGLE_COOKIE : GOOGLE_AUTH_COOKIE;
  const attempt = isCustomer ? customerAttempt : adminAttempt;
  const login = isCustomer ? "/account/login" : "/admin/login";
  const panel = isCustomer ? "/account" : "/admin";
  const error = () => finish(`${attempt?.linkId ? panel : login}?google=error`, cookie);
  const code = request.nextUrl.searchParams.get("code");
  if (!config || !attempt || attempt.kind !== (isCustomer ? "customer-google" : "admin-google") || state !== attempt.state || !code) return error();
  if (!(await rateLimit(`${attempt.kind}-callback`, 12, 10 * 60_000))) return error();

  try {
    const identity = await getGoogleIdentity(config, code, attempt);
    if (!identity || !validAdminEmail(identity.email)) return error();

    if (isCustomer) {
      const signedIn = await getCustomer();
      if (attempt.linkId ? signedIn?.id !== attempt.linkId : signedIn !== null) return error();
      const result = await signInGoogleCustomer(identity, attempt.linkId);
      if ("error" in result) return result.error === "link" ? finish("/account/login?google=link", cookie) : error();
      await startCustomerSession(result.id);
      return finish(attempt.linkId ? "/account?google=linked" : safeCustomerNext(attempt.next), cookie);
    }

    const admin = await db.adminUser.findUnique({ where: { email: identity.email } });
    if (!admin?.isActive || (admin.googleSubject && admin.googleSubject !== identity.subject)) return error();

    if (attempt.linkId) {
      const signedIn = await getAdmin();
      if (signedIn?.id !== admin.id || attempt.linkId !== admin.id || !signedIn.emailVerified) return error();
    } else if (!admin.googleSubject && !identity.authoritativeEmail) {
      return finish("/admin/login?google=link", cookie);
    }

    const [user] = await db.adminUser.updateManyAndReturn({
      where: { id: admin.id, isActive: true, sessionVersion: admin.sessionVersion, googleSubject: admin.googleSubject },
      data: {
        googleSubject: identity.subject, lastLoginAt: new Date(), emailVerifiedAt: admin.emailVerifiedAt ?? new Date(),
        verifyTokenHash: null, verifyTokenExpiresAt: null,
      },
      select: { id: true, sessionVersion: true },
    });
    if (!user) return error();
    await startAdminSession(user);
    return finish(attempt.linkId ? "/admin?google=linked" : safeAdminNext(attempt.next), cookie);
  } catch {
    return error();
  }
}
