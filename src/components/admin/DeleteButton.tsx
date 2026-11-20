"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteAction } from "@/app/admin/(panel)/delete-action";
import { Portal, type ActionState } from "./client";
import { cn } from "@/lib/utils";

function ConfirmDelete() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-danger btn-sm rounded-xl">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
    </button>
  );
}

/**
 * Delete with a confirmation dialog.
 * `type` + `id` select what is deleted (see delete-action.ts). `redirectTo` is used when deleting from a detail page.
 */
export function DeleteButton({
  type,
  id,
  title = "Delete this item?",
  description = "This can't be undone.",
  redirectTo,
  label,
  className,
}: {
  type: string;
  id: string;
  title?: string;
  description?: string;
  redirectTo?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(deleteAction, {});
  const router = useRouter();
  useEffect(() => {
    if (!state.ok) return;
    setOpen(false);
    if (state.redirect) router.push(state.redirect);
    else router.refresh();
  }, [state, router]);
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={label ?? "Delete"}
        aria-label={label ?? "Delete"}
        className={cn(
          label ? "btn btn-sm rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50" : "grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600",
          className,
        )}
      >
        <Trash2 className="h-4 w-4" />
        {label}
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{description}</p>
              {state.error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
              <form action={action} className="mt-6 flex justify-end gap-2">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="id" value={id} />
                {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
                <button type="button" onClick={() => setOpen(false)} className="btn btn-outline btn-sm rounded-xl">
                  Cancel
                </button>
                <ConfirmDelete />
              </form>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
