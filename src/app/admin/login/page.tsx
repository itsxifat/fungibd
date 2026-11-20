import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { AdminLoginForm } from "./form";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f6f6f4] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/badge.svg" alt="" className="h-9 w-9 rounded-[10px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-green.svg" alt="FungiBd" className="h-[20px]" />
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Farm, sales &amp; customer management</p>
        <div className="mt-6 rounded-2xl border border-line bg-white p-6">
          <AdminLoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
