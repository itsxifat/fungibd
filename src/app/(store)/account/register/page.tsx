import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { CUSTOMER_GOOGLE_PATH, googleConfig } from "@/lib/google-auth";
import { GooglePrivacyNotice } from "@/components/store/GooglePrivacyNotice";
import { RegisterForm } from "../AuthForms";

export const metadata = { title: "অ্যাকাউন্ট খুলুন · Register" };

export default async function RegisterPage() {
  if (await getCustomer()) redirect("/account");
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="font-display text-3xl">নতুন অ্যাকাউন্ট</h1>
      <p className="mt-1 text-muted">Create an account to track orders and order faster.</p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <RegisterForm />
        {googleConfig() && (
          <>
            <a href={CUSTOMER_GOOGLE_PATH} className="btn btn-outline mt-4 w-full">Google দিয়ে চালিয়ে যান · Continue with Google</a>
            <GooglePrivacyNotice />
          </>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        আগেই অ্যাকাউন্ট আছে?{" "}
        <Link href="/account/login" className="font-semibold text-brand hover:underline">
          লগইন করুন
        </Link>
      </p>
    </div>
  );
}
