import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getProducts } from "@/lib/store-data";
import { dateKey } from "@/lib/dates";
import { deliveryWindow } from "@/lib/orders";
import { PageHeader } from "@/components/admin/ui";
import { ManualOrderForm } from "./form";

export const metadata = { title: "New order" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [s, products, zones, customer] = await Promise.all([
    getSettings(),
    getProducts(),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    sp.customer ? db.customer.findUnique({ where: { id: sp.customer }, include: { addresses: { orderBy: { isDefault: "desc" }, take: 1 } } }) : null,
  ]);
  return (
    <>
      <PageHeader back={{ href: "/admin/orders", label: "Orders" }} title="New order" description="For orders taken by phone, Facebook, WhatsApp or in person. Stock and pre-order rules apply automatically." />
      <ManualOrderForm
        products={products.map((p) => ({ id: p.id, name: `${p.nameEn} · ${p.nameBn}`, variants: p.variants.map((v) => ({ id: v.id, label: `${v.labelEn}`, price: v.price, mode: v.mode })) }))}
        zones={zones.map((z) => ({ id: z.id, name: `${z.nameEn} · ৳${z.charge}` }))}
        slots={s.delivery.slots}
        defaultDate={dateKey(deliveryWindow(s.delivery).earliest)}
        customer={
          customer
            ? { id: customer.id, name: customer.name, phone: customer.phone ?? "", email: customer.email ?? "", addressLine: customer.addresses[0]?.line ?? "", landmark: customer.addresses[0]?.landmark ?? "", zoneId: customer.addresses[0]?.zoneId ?? "" }
            : null
        }
      />
    </>
  );
}
