import "server-only";
import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomToken } from "./security";
import { siteUrl } from "./utils";

export const GOOGLE_AUTH_COOKIE = "fb_admin_google";
export const CUSTOMER_GOOGLE_COOKIE = "fb_customer_google";
export const GOOGLE_AUTH_LIFETIME = 600;
export const GOOGLE_AUTH_PATH = "/admin/login/google";
export const CUSTOMER_GOOGLE_PATH = "/account/google";
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri: `${siteUrl()}${GOOGLE_AUTH_PATH}/callback` };
}

export const googleCookieOptions = () => ({
  httpOnly: true,
  secure: siteUrl().startsWith("https://"),
  sameSite: "lax" as const,
  path: GOOGLE_AUTH_PATH,
});

export type GoogleLoginAttempt = {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  linkId?: string;
  kind: "admin-google" | "customer-google";
};

export function startGoogleLogin(config: NonNullable<ReturnType<typeof googleConfig>>, kind: GoogleLoginAttempt["kind"], next: string, linkId?: string) {
  const attempt: GoogleLoginAttempt = { kind, state: randomToken(32), nonce: randomToken(32), verifier: randomToken(32), next, linkId };
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: kind === "customer-google" ? "openid email profile" : "openid email",
    prompt: "select_account",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(attempt.verifier).digest("base64url"),
  }).toString();
  return { attempt, url };
}

export async function getGoogleIdentity(config: NonNullable<ReturnType<typeof googleConfig>>, code: string, attempt: GoogleLoginAttempt) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: attempt.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const { id_token: token } = await response.json();
  if (typeof token !== "string") return null;
  const { payload } = await jwtVerify(token, googleKeys, {
    algorithms: ["RS256"],
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: config.clientId,
    requiredClaims: ["sub", "email", "email_verified", "nonce", "exp", "iat"],
    maxTokenAge: "10m",
  });
  if (payload.nonce !== attempt.nonce || payload.email_verified !== true || typeof payload.email !== "string" || !payload.sub) return null;
  const email = payload.email.toLowerCase();
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 100) : email.split("@")[0];
  return { subject: payload.sub, email, name, authoritativeEmail: email.endsWith("@gmail.com") || Boolean(payload.hd) };
}
