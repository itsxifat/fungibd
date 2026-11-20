import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtDateBn } from "@/lib/dates";
import { directionsLink } from "@/lib/geo";
import { taka } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "Packing slip" };

export default async function PrintSlip({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [o, s] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true, rider: true } }), getSettings()]);
  if (!o) notFound();
  const qr = o.lat != null && o.lng != null ? await QRCode.toString(directionsLink(o.lat, o.lng), { type: "svg", margin: 0 }) : null;
  return (
    <div className="mx-auto max-w-[680px] bg-white p-8 text-[14px] text-black print:p-0">
      <style>{`@page { size: A5; margin: 10mm } aside, .lg\\:pl-60 > main { padding: 0 !important } @media print { aside, .sticky { display: none !important } .lg\\:pl-60 { padding-left: 0 !important } }`}</style>
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>
      <div className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-green.svg" alt="FungiBd" className="h-6" />
          <p className="mt-1 text-xs">
            {s.store.phone} · {s.store.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{o.orderNo}</p>
          <p className="text-xs">{fmtDate(o.createdAt)}</p>
          {o.type === "PREORDER" && <p className="text-xs font-bold">PRE-ORDER</p>}
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="flex-1">
          <p className="text-xs uppercase text-gray-500">Deliver to</p>
          <p className="text-lg font-semibold">{o.name}</p>
          <p className="text-lg font-semibold">{o.phone}</p>
          <p>{o.addressLine}</p>
          {o.landmark && <p>{o.landmark}</p>}
          <p className="text-gray-600">{o.zoneName}</p>
          <p className="mt-2 font-semibold">
            {o.deliveryDate ? fmtDateBn(o.deliveryDate) : ""} {o.deliverySlot && `· ${o.deliverySlot}`}
          </p>
          {o.rider && <p className="mt-1">Rider: {o.rider.name}</p>}
        </div>
        {qr && (
          <div className="text-center">
            <div className="h-24 w-24 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-1 text-[10px]">Scan for map</p>
          </div>
        )}
      </div>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-gray-300">
              <td className="py-1.5">
                {i.nameBn} ({i.nameEn}) — {i.variantLabel}
              </td>
              <td className="py-1.5 text-right">{i.qty}</td>
              <td className="py-1.5 text-right">{taka(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 ml-auto w-60 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{taka(o.subtotal)}</span></div>
        {o.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{taka(o.discount)}</span></div>}
        <div className="flex justify-between"><span>Delivery</span><span>{taka(o.deliveryCharge)}</span></div>
        <div className="flex justify-between border-t-2 border-black pt-1 text-lg font-bold"><span>COLLECT (COD)</span><span>{taka(o.paymentStatus === "PAID" ? 0 : o.total)}</span></div>
      </div>
      {o.customerNote && <p className="mt-4 border border-black p-2 text-sm">Note: {o.customerNote}</p>}
      <p className="mt-6 text-center text-xs text-gray-500">ধন্যবাদ! Thank you for ordering from {s.store.name}.</p>
    </div>
  );
}
