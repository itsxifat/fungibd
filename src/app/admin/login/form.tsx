"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { adminForgotAction, adminLoginAction, adminResetAction, adminVerifyAction, claimOwnerAction, resendAdminVerificationAction } from "./actions";

function EmailInput({ autoComplete = "email" }: { autoComplete?: string }) {
  return (
    <div>
      <label className="label" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" maxLength={254} autoComplete={autoComplete} className="input" required />
    </div>
  );
}

function NewPasswordInputs() {
  return (
    <>
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" className="input" required />
        <p className="mt-1 text-xs text-muted">At least 12 characters</p>
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minLength={12} maxLength={72} autoComplete="new-password" className="input" required />
      </div>
    </>
  );
}

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <EmailInput autoComplete="username" />
      <div>
        <div className="flex justify-between gap-2">
          <label className="label" htmlFor="password">Password</label>
          <Link href="/admin/login/forgot" className="text-xs font-semibold text-brand hover:underline">Forgot password?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  );
}

export function OwnerSetupForm() {
  const [state, action] = useActionState(claimOwnerAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">Private setup code</label>
        <input id="code" name="code" type="password" autoComplete="off" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" minLength={2} maxLength={100} autoComplete="name" className="input" required />
      </div>
      <EmailInput />
      <NewPasswordInputs />
      <FormMessage state={state} />
      <SubmitButton className="w-full">Create owner account</SubmitButton>
    </form>
  );
}

export function AdminForgotForm() {
  const [state, action] = useActionState(adminForgotAction, {});
  return (
    <form action={action} className="space-y-4">
      <EmailInput />
      <FormMessage state={state} />
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}

export function AdminEmailLinkForm({ mode }: { mode: "reset" | "verify" }) {
  const [state, action] = useActionState(mode === "reset" ? adminResetAction : adminVerifyAction, {});
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(window.location.hash.slice(1)); }, []);

  if (token === null) return <p className="text-sm text-muted">Loading link…</p>;
  if (!/^[\w-]{43}$/.test(token)) return <p role="alert" className="text-sm text-red-700">Open the full link from your email.</p>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {mode === "reset" && <NewPasswordInputs />}
      <FormMessage state={state} />
      <SubmitButton className="w-full">{mode === "reset" ? "Set new password" : "Verify email"}</SubmitButton>
    </form>
  );
}

export function ResendAdminVerificationForm() {
  const [state, action] = useActionState(resendAdminVerificationAction, {});
  return (
    <form action={action} className="mt-2">
      <SubmitButton className="btn-outline btn-sm">Send verification email</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
