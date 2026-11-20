"use client";
import { createContext, useActionState, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionState = { ok?: boolean; error?: string; message?: string; redirect?: string };

const DrawerCtx = createContext<{ close: () => void } | null>(null);

/** Button that needs a second click to confirm (no browser pop-ups). */
export function ConfirmButton({ children, confirmText = "Click again to confirm", className, formAction, name, value }: { children: React.ReactNode; confirmText?: string; className?: string; formAction?: (fd: FormData) => void; name?: string; value?: string }) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type={armed ? "submit" : "button"}
      name={name}
      value={value}
      formAction={armed ? formAction : undefined}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      disabled={pending}
      className={cn("btn btn-sm rounded-xl", armed ? "btn-danger" : "btn-outline", className)}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {armed ? confirmText : children}
    </button>
  );
}

export function Submit({ children, className, variant = "primary" }: { children: React.ReactNode; className?: string; variant?: "primary" | "outline" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-sm rounded-xl", variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-outline bg-white", className)}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** A form wired to a server action that returns {ok,error,message}; shows the result inline and closes its drawer on success. */
export function ActionForm({ action, children, className, resetOnSuccess = false }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; children: React.ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [state, run] = useActionState(action, {});
  const [n, setN] = useState(0);
  const drawer = useContext(DrawerCtx);
  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) setN((x) => x + 1);
    if (drawer) {
      const t = setTimeout(drawer.close, 650);
      return () => clearTimeout(t);
    }
  }, [state, resetOnSuccess, drawer]);
  return (
    <form key={n} action={run} className={className}>
      {children}
      {(state.error || state.message) && (
        <p role={state.error ? "alert" : "status"} className={cn("mt-3 rounded-xl px-3 py-2 text-sm", state.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  return el ? createPortal(children, el) : null;
}

/** Slide-over panel opened by a button — used for "add / record" forms so pages stay clean. */
export function Drawer({ label, title, description, children, variant = "primary", width = "max-w-lg" }: { label: React.ReactNode; title?: string; description?: string; children: React.ReactNode; variant?: "primary" | "outline"; width?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", on);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", on);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("btn btn-sm rounded-xl", variant === "primary" ? "btn-primary" : "btn-outline bg-white")}>
        {variant === "primary" && <Plus className="h-4 w-4" />}
        {label}
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title ?? (typeof label === "string" ? label : "Form")}>
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <div className={cn("absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl", width)}>
              <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold">{title ?? label}</h2>
                  {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <DrawerCtx.Provider value={{ close: () => setOpen(false) }}>{children}</DrawerCtx.Provider>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

/** @deprecated kept for older pages — same as Drawer */
export const Disclosure = ({ label, children }: { label: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; className?: string }) => <Drawer label={label}>{children}</Drawer>;

export { Portal };
