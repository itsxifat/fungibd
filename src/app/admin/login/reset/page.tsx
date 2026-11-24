import Link from "next/link";
import { AdminEmailLinkForm } from "../form";
import { AdminAuthFrame } from "../frame";

export const metadata = { title: "Reset admin password", robots: { index: false }, referrer: "no-referrer" as const };

export default function AdminResetPage() {
  return (
    <AdminAuthFrame title="Reset your admin password">
      <AdminEmailLinkForm mode="reset" />
      <Link href="/admin/login/forgot" className="block text-sm font-semibold text-brand hover:underline">Request another reset link</Link>
    </AdminAuthFrame>
  );
}
