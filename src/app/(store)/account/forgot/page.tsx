import { ForgotForm } from "../AuthForms";

export const metadata = { title: "পাসওয়ার্ড ভুলে গেছেন · Forgot password" };

export default function ForgotPage() {
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="font-display text-3xl">পাসওয়ার্ড রিসেট</h1>
      <p className="mt-1 text-muted">We&apos;ll email you a link to set a new password.</p>
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <ForgotForm />
      </div>
    </div>
  );
}
