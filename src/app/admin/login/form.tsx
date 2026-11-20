"use client";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { adminLoginAction } from "./actions";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  );
}
