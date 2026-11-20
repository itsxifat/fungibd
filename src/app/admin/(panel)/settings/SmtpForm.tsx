"use client";
import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";
import { clearSmtpAction, saveSmtpAction } from "./actions";

type Smtp = { host: string; port: number; secure: boolean; user: string; hasPassword: boolean; fromName: string; fromEmail: string; replyTo: string; source: "admin" | "env" } | null;

const PRESETS = [
  { name: "Zoho Mail", host: "smtp.zoho.com", port: 465, security: "ssl", hint: "Use your full Zoho email as username. If 2-factor is on, create an app password." },
  { name: "Gmail / Google Workspace", host: "smtp.gmail.com", port: 465, security: "ssl", hint: "Turn on 2-step verification, then create an App Password (myaccount.google.com → Security → App passwords)." },
  { name: "Brevo", host: "smtp-relay.brevo.com", port: 587, security: "starttls", hint: "Username and SMTP key are under Brevo → SMTP & API." },
  { name: "cPanel / hosting mail", host: "mail.fungibd.com", port: 465, security: "ssl", hint: "Use the full mailbox address and its password." },
];

function Btn({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "outline" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-sm rounded-xl", variant === "primary" ? "btn-primary" : "btn-outline bg-white")}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function SmtpForm({ smtp }: { smtp: Smtp }) {
  const [state, save] = useActionState<ActionState, FormData>(saveSmtpAction, {});
  const [clearState, clear] = useActionState<ActionState>(clearSmtpAction, {});
  const [f, setF] = useState({
    host: smtp?.host ?? "",
    port: String(smtp?.port ?? 465),
    security: smtp ? (smtp.secure ? "ssl" : "starttls") : "ssl",
    user: smtp?.user ?? "",
    fromName: smtp?.fromName ?? "FungiBd",
    fromEmail: smtp?.fromEmail ?? "",
    replyTo: smtp?.replyTo ?? "",
  });
  const [hint, setHint] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-stone-500">Quick setup</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setF((s) => ({ ...s, host: p.host, port: String(p.port), security: p.security }));
              setHint(p.hint);
            }}
            className={cn("rounded-xl border px-3 py-1.5 text-xs font-medium transition", f.host === p.host ? "border-brand bg-brand-tint text-brand" : "border-stone-200 bg-white hover:border-stone-300")}
          >
            {p.name}
          </button>
        ))}
      </div>
      {hint && <p className="mb-4 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">{hint}</p>}

      <form action={save} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="label">SMTP server (host)</span>
          <input name="host" value={f.host} onChange={(e) => set("host", e.target.value)} className="input" placeholder="smtp.zoho.com" />
        </label>
        <label className="block">
          <span className="label">Security</span>
          <select name="security" value={f.security} onChange={(e) => set("security", e.target.value)} className="input">
            <option value="ssl">SSL / TLS (usually port 465)</option>
            <option value="starttls">STARTTLS (usually port 587)</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Port</span>
          <input name="port" type="number" value={f.port} onChange={(e) => set("port", e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="label">Username</span>
          <input name="user" value={f.user} onChange={(e) => set("user", e.target.value)} className="input" placeholder="orders@fungibd.com" autoComplete="off" />
        </label>
        <label className="block">
          <span className="label">Password / app password</span>
          <input name="pass" type="password" className="input" placeholder={smtp?.hasPassword ? "•••••••• saved — leave empty to keep" : ""} autoComplete="new-password" />
          <span className="hint flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Stored encrypted
          </span>
        </label>
        <label className="block">
          <span className="label">Send from — name</span>
          <input name="fromName" value={f.fromName} onChange={(e) => set("fromName", e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="label">Send from — email</span>
          <input name="fromEmail" type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} className="input" placeholder="orders@fungibd.com" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Replies go to (optional)</span>
          <input name="replyTo" type="email" value={f.replyTo} onChange={(e) => set("replyTo", e.target.value)} className="input" placeholder="hello@fungibd.com" />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Btn>Save & test connection</Btn>
          {smtp?.source === "admin" && (
            <button type="submit" formAction={clear} className="text-xs font-medium text-red-600 hover:underline">
              Remove these settings
            </button>
          )}
        </div>
        {(state.error || state.message || clearState.message) && (
          <p className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm sm:col-span-2", state.error ? "bg-red-50 text-red-700" : state.message?.includes("failed") ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800")}>
            {!state.error && !state.message?.includes("failed") && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {state.error ?? state.message ?? clearState.message}
          </p>
        )}
      </form>
    </div>
  );
}
