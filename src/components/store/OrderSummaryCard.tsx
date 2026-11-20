import { CalendarClock, MapPin } from "lucide-react";
import { taka } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { OrderTimeline } from "./OrderTimeline";

type O = {
  orderNo: string;
  type: string;
  status: string;
  name: string;
  phone: string;
  addressLine: string;
  landmark: string;
  zoneName: string;
  deliveryDate: Date | null;
  deliverySlot: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  items: { id: string; nameBn: string; nameEn: string; variantLabel: string; qty: number; lineTotal: number }[];
  events: { status: string; createdAt: Date }[];
};

export function OrderSummaryCard({ o, showTimeline = true }: { o: O; showTimeline?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs text-muted">অর্ডার নম্বর · Order no.</p>
          <p className="text-xl font-semibold tracking-wide">{o.orderNo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.type === "PREORDER" && <span className="chip bg-tan/40 text-tan-deep">প্রি-অর্ডার</span>}
          <span className="chip bg-brand-tint text-brand">{ORDER_STATUS[o.status as OrderStatus]?.bn ?? o.status}</span>
        </div>
      </div>
      {showTimeline && (
        <div className="border-b border-line px-5 py-6 sm:px-6">
          <OrderTimeline status={o.status} events={o.events} />
        </div>
      )}
      <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 sm:px-6">
        <ul className="space-y-2 text-sm">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                <span className="font-bangla font-medium">{i.nameBn}</span> <span className="text-muted">· {i.variantLabel.split(" · ")[0]} × {i.qty}</span>
              </span>
              <span className="tabular-nums">{taka(i.lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-line pt-2 text-muted">
            <span>সাবটোটাল</span>
            <span className="tabular-nums">{taka(o.subtotal)}</span>
          </li>
          {o.discount > 0 && (
            <li className="flex justify-between text-brand">
              <span>ডিসকাউন্ট</span>
              <span className="tabular-nums">−{taka(o.discount)}</span>
            </li>
          )}
          <li className="flex justify-between text-muted">
            <span>ডেলিভারি</span>
            <span className="tabular-nums">{o.deliveryCharge ? taka(o.deliveryCharge) : "ফ্রি"}</span>
          </li>
          <li className="flex justify-between text-base font-semibold">
            <span>মোট (ক্যাশ অন ডেলিভারি)</span>
            <span className="tabular-nums">{taka(o.total)}</span>
          </li>
        </ul>
        <div className="space-y-3 text-sm">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              {o.name} · {o.phone}
              <br />
              <span className="text-ink-soft">
                {o.addressLine}
                {o.landmark ? `, ${o.landmark}` : ""}
              </span>
              <br />
              <span className="text-muted">{o.zoneName}</span>
            </span>
          </p>
          {o.deliveryDate && (
            <p className="flex gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="font-bangla">
                {fmtDateBn(o.deliveryDate)}
                {o.deliverySlot && <span className="block text-muted">{o.deliverySlot}</span>}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
