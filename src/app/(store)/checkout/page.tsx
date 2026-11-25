import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth";
import { deliveryWindow } from "@/lib/orders";
import { addDays, dateKey, fmtDateBn, startOfDay } from "@/lib/dates";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata: Metadata = { title: "চেকআউট · Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [s, zones, customer] = await Promise.all([
    getSettings(),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getCustomer(),
  ]);
  const addresses = customer ? await db.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  const win = deliveryWindow(s.delivery);
  const today = startOfDay();
  const days = win.days.map((d) => ({
    value: dateKey(d),
    label: fmtDateBn(d, { weekday: "short", day: "numeric", month: "short" }),
    tag: d.getTime() === today.getTime() ? "আজ · Today" : d.getTime() === addDays(today, 1).getTime() ? "আগামীকাল" : "",
  }));

  return (
    <div className="container-x pb-10 pt-8">
      <h1 className="font-display text-4xl sm:text-5xl">চেকআউট</h1>
      <p className="text-muted">Checkout · 2 minutes · Cash on delivery</p>
      <div className="mt-8">
        <CheckoutForm
          zones={zones.map((z) => ({ id: z.id, nameEn: z.nameEn, nameBn: z.nameBn, charge: z.charge }))}
          days={days}
          slots={s.delivery.slots}
          freeDeliveryMin={s.delivery.freeDeliveryMin}
          center={{ lat: s.delivery.centerLat, lng: s.delivery.centerLng }}
          radiusKm={s.delivery.radiusKm}
          areas={s.delivery.areas}
          googleMapsKey={s.delivery.googleMapsKey}
          customer={
            customer
              ? {
                  name: customer.name,
                  phone: customer.phone ?? "",
                  email: customer.email ?? "",
                  addresses: addresses.map((a) => ({ id: a.id, label: a.label, line: a.line, landmark: a.landmark, zoneId: a.zoneId, lat: a.lat, lng: a.lng, isDefault: a.isDefault })),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
