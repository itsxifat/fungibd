"use client";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({ children, className, pendingText, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-primary", className)} {...rest}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; error?: string; message?: string } }) {
  if (!state || (!state.error && !state.message)) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm", state.error ? "bg-red-50 text-red-700" : "bg-brand-tint text-brand-deep")}
    >
      {state.error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{state.error ?? state.message}</span>
    </p>
  );
}

/** Invisible field to catch spam bots. */
export function Honeypot() {
  return <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />;
}
