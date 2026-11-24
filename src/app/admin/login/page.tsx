import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdmin } from "@/lib/auth";
import { safeAdminNext, setupIsOpen } from "@/lib/admin-auth";
import { googleConfig, GOOGLE_AUTH_PATH } from "@/lib/google-auth";
import { GooglePrivacyNotice } from "@/components/store/GooglePrivacyNotice";
import { AdminLoginForm } from "./form";
import { AdminAuthFrame } from "./frame";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; google?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next, reset, google } = await searchParams;
  const setupOpen = await setupIsOpen();
  const destination = safeAdminNext(next);
  const googleError = google === "link"
    ? "Sign in with your verified FungiBd email first, then connect Google from the admin dashboard."
    : google === "unavailable"
      ? "Google sign-in is currently unavailable."
      : "Google could not sign you in. Use the Google account associated with your admin email.";

  return (
    <AdminAuthFrame title="Admin sign in" description="Farm, sales & customer management">
      {reset === "1" && <p role="status" className="text-sm text-emerald-800">Your password was changed. Sign in with your new password.</p>}
      {google && <p role="alert" className="text-sm text-red-700">{googleError}</p>}
      {setupOpen ? (
        <Link href="/admin/login/setup" className="btn btn-primary w-full">Set up owner account</Link>
      ) : (
        <>
          <AdminLoginForm next={destination} />
          {googleConfig() && (
            <div>
              <a href={`${GOOGLE_AUTH_PATH}?next=${encodeURIComponent(destination)}`} className="btn btn-outline w-full">Continue with Google</a>
              <GooglePrivacyNotice />
            </div>
          )}
        </>
      )}
    </AdminAuthFrame>
  );
}
