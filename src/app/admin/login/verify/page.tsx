import Link from "next/link";
import { AdminEmailLinkForm } from "../form";
import { AdminAuthFrame } from "../frame";

export const metadata = { title: "Verify admin email", robots: { index: false }, referrer: "no-referrer" as const };

export default function AdminVerifyPage() {
  return (
    <AdminAuthFrame title="Verify your admin email" description="Confirm this email address to sign in to FungiBd admin.">
      <AdminEmailLinkForm mode="verify" />
      <Link href="/admin/login" className="block text-sm font-semibold text-brand hover:underline">Back to sign in</Link>
    </AdminAuthFrame>
  );
}
