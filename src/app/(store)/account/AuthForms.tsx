"use client";
import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { forgotAction, loginAction, profileAction, registerAction, resetAction } from "./actions";
import type { FormState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="id">
          মোবাইল বা ইমেইল · Mobile or email
        </label>
        <input id="id" name="id" className="input" autoComplete="username" required />
      </div>
      <div>
        <div className="flex justify-between">
          <label className="label" htmlFor="password">
            পাসওয়ার্ড · Password
          </label>
          <Link href="/account/forgot" className="text-xs font-semibold text-brand hover:underline">
            ভুলে গেছেন?
          </Link>
        </div>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">লগইন · Log in</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          নাম · Name
        </label>
        <input id="name" name="name" className="input" autoComplete="name" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">
            মোবাইল · Mobile
          </label>
          <input id="phone" name="phone" className="input" inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" required />
        </div>
        <div>
          <label className="label" htmlFor="email">
            ইমেইল · Email
          </label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="password">
          পাসওয়ার্ড · Password (min 6)
        </label>
        <input id="password" name="password" type="password" minLength={6} className="input" autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">অ্যাকাউন্ট তৈরি করুন · Create account</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          ইমেইল · Email
        </label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">রিসেট লিংক পাঠান · Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">
          নতুন পাসওয়ার্ড · New password
        </label>
        <input id="password" name="password" type="password" minLength={6} className="input" autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">সেভ করুন · Save</SubmitButton>
    </form>
  );
}

export function ProfileForm({ c }: { c: { name: string; email: string; phone: string; marketingOptIn: boolean } }) {
  const [state, action] = useActionState<FormState, FormData>(profileAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          নাম · Name
        </label>
        <input id="name" name="name" defaultValue={c.name} className="input" required />
      </div>
      {c.phone && (
        <div>
          <label className="label" htmlFor="profile-phone">মোবাইল · Mobile</label>
          <input id="profile-phone" value={c.phone} disabled className="input bg-cream/50 text-muted" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          ইমেইল · Email
        </label>
        <input id="email" name="email" type="email" defaultValue={c.email} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          নতুন পাসওয়ার্ড (ঐচ্ছিক) · New password
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="marketing" defaultChecked={c.marketingOptIn} className="h-4 w-4 accent-[var(--brand)]" /> নতুন হারভেস্ট ও অফারের ইমেইল পেতে চাই
      </label>
      <FormMessage state={state} />
      <SubmitButton>সেভ করুন</SubmitButton>
    </form>
  );
}
