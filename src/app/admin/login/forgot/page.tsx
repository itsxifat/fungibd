import Link from "next/link";
import { AdminForgotForm } from "../form";
import { AdminAuthFrame } from "../frame";

export const metadata = { title: "Forgot admin password", robots: { index: false } };

export default function AdminForgotPage() {
  return (
    <AdminAuthFrame title="Forgot your password?" description="Enter your admin email to request a password reset link.">
      <AdminForgotForm />
      <Link href="/admin/login" className="block text-sm font-semibold text-brand hover:underline">Back to sign in</Link>
    </AdminAuthFrame>
  );
}
