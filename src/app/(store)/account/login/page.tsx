import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { safeCustomerNext } from "@/lib/customer-auth";
import { CUSTOMER_GOOGLE_PATH, googleConfig } from "@/lib/google-auth";
import { GooglePrivacyNotice } from "@/components/store/GooglePrivacyNotice";
import { LoginForm } from "../AuthForms";

export const metadata = { title: "লগইন · Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; google?: string }> }) {
  if (await getCustomer()) redirect("/account");
  const { next, google } = await searchParams;
  const destination = safeCustomerNext(next);
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="font-display text-3xl">লগইন</h1>
      <p className="mt-1 text-muted">Log in to see your orders.</p>
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        {google && (
          <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {google === "link"
              ? "এই ইমেইলে অ্যাকাউন্ট আছে। পাসওয়ার্ড দিয়ে লগইন করে Google যুক্ত করুন। · Sign in with your password, then connect Google from your profile."
              : "Google দিয়ে লগইন করা যায়নি। আবার চেষ্টা করুন। · Google sign-in could not finish. Please try again."}
          </p>
        )}
        <LoginForm next={destination} />
        {googleConfig() && (
          <>
            <a href={`${CUSTOMER_GOOGLE_PATH}?next=${encodeURIComponent(destination)}`} className="btn btn-outline mt-4 w-full">Google দিয়ে চালিয়ে যান · Continue with Google</a>
            <GooglePrivacyNotice />
          </>
        )}
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
