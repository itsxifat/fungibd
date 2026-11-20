import { CheckCircle2 } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { Card } from "./ui";
import { ActionForm, Submit } from "./client";
import { addActivityAction, doneActivityAction } from "@/app/admin/(panel)/customers/actions";
import { cn } from "@/lib/utils";
import { DeleteButton } from "./DeleteButton";

type A = { id: string; type: string; summary: string; followUpAt: Date | null; done: boolean; by: string; createdAt: Date };

export function ActivityLog({ items, customerId, leadId }: { items: A[]; customerId?: string; leadId?: string }) {
  const now = Date.now();
  return (
    <Card title="Interactions & follow-ups">
      <ActionForm action={addActivityAction} resetOnSuccess className="space-y-2">
        {customerId && <input type="hidden" name="customerId" value={customerId} />}
        {leadId && <input type="hidden" name="leadId" value={leadId} />}
        <div className="flex gap-2">
          <select name="type" className="input input-sm w-36" aria-label="Type">
            {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input name="summary" placeholder="What happened? e.g. Called — wants 2 kg every Friday" className="input input-sm flex-1" aria-label="Summary" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500" htmlFor={`fu-${customerId ?? leadId}`}>
            Follow up on
          </label>
          <input id={`fu-${customerId ?? leadId}`} type="datetime-local" name="followUpAt" className="input input-sm w-auto" />
          <Submit>Log</Submit>
        </div>
      </ActionForm>
      <ol className="mt-5 space-y-3">
        {items.map((a) => {
          const due = a.followUpAt && !a.done && a.followUpAt.getTime() < now;
          return (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.done ? "bg-stone-300" : due ? "bg-amber-500" : "bg-[#0a7d5e]")} />
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-medium">{ACTIVITY_TYPES[a.type as keyof typeof ACTIVITY_TYPES] ?? a.type}</span> — {a.summary}
                </p>
                <p className="text-xs text-stone-500">
                  {fmtDateTime(a.createdAt)} · {a.by}
                  {a.followUpAt && (
                    <span className={cn("ml-2", due ? "font-semibold text-amber-700" : "")}>
                      Follow up {fmtDateTime(a.followUpAt)} {a.done && "· done"}
                    </span>
                  )}
                </p>
              </div>
              {a.followUpAt && !a.done && (
                <form action={doneActivityAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-emerald-50 hover:text-emerald-700" title="Mark follow-up done" aria-label="Mark follow-up done">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </form>
              )}
              <DeleteButton type="activity" id={a.id} title="Delete this entry?" />
            </li>
          );
        })}
        {!items.length && <li className="text-sm text-stone-500">No interactions logged yet.</li>}
      </ol>
    </Card>
  );
}
