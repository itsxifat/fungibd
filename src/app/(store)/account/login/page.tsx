import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { LoginForm } from "../AuthForms";

export const metadata = { title: "লগইন · Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCustomer()) redirect("/account");
  const { next } = await searchParams;
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="font-display text-3xl">লগইন</h1>
      <p className="mt-1 text-muted">Log in to see your orders.</p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        অ্যাকাউন্ট নেই?{" "}
        <Link href="/account/register" className="font-semibold text-brand hover:underline">
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">অ্যাকাউন্ট ছাড়াও অর্ডার করা যায় · You can also order as a guest.</p>
    </div>
  );
}
