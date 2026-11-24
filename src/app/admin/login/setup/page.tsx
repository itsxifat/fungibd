import { redirect } from "next/navigation";
import { setupIsOpen } from "@/lib/admin-auth";
import { OwnerSetupForm } from "../form";
import { AdminAuthFrame } from "../frame";

export const metadata = { title: "Owner setup", robots: { index: false }, referrer: "no-referrer" as const };
export const dynamic = "force-dynamic";

export default async function OwnerSetupPage() {
  if (!(await setupIsOpen())) redirect("/admin/login");
  return (
    <AdminAuthFrame title="Set up your owner account" description="Use the private setup code and an email you can access. This page closes after the owner account is created.">
      <OwnerSetupForm />
    </AdminAuthFrame>
  );
}
