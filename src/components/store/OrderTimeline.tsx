import { Check, X } from "lucide-react";
import { ORDER_FLOW, ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function OrderTimeline({ status, events }: { status: string; events: { status: string; createdAt: Date }[] }) {
  const st = status as OrderStatus;
  if (st === "CANCELLED" || st === "RETURNED")
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
        <X className="h-5 w-5" />
        <span className="font-bangla font-semibold">{ORDER_STATUS[st].bn}</span>
        <span className="text-sm">· {ORDER_STATUS[st].en}</span>
      </div>
    );
  const current = ORDER_FLOW.indexOf(st);
  return (
    <ol className="grid gap-0 sm:grid-cols-5">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= current;
        const at = events.find((e) => e.status === s)?.createdAt;
        return (
          <li key={s} className="relative flex gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
            {i < ORDER_FLOW.length - 1 && (
              <span aria-hidden className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 sm:left-[calc(50%+18px)] sm:top-[15px] sm:h-0.5 sm:w-[calc(100%-36px)]", i < current ? "bg-brand" : "bg-line-strong")} />
            )}
            <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2", done ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-muted")}>
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-xs">{i + 1}</span>}
            </span>
            <span className="sm:mt-2">
              <span className={cn("block font-bangla text-sm font-semibold", !done && "text-muted")}>{ORDER_STATUS[s].bn}</span>
              <span className="block text-xs text-muted">{at ? fmtDateTime(at) : ORDER_STATUS[s].en}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
