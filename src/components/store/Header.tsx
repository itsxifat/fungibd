import { getSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { HeaderBar } from "./HeaderBar";
import { MobileTabBar } from "./MobileTabBar";

export async function Header() {
  const [s, customer, cats] = await Promise.all([
    getSettings(),
    getCustomer(),
    // Shop categories that hold at least one product sold from stock (fresh harvest lives under Pre-order).
    db.category.findMany({
      where: { products: { some: { isActive: true, NOT: { preorderEnabled: true, preorderMode: "ALWAYS" } } } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameBn: true, nameEn: true },
    }),
  ]);
  return (
    <>
      {s.home.announcement && (
        <div className="bg-brand-deep text-white">
          <p className="container-x flex h-9 items-center justify-center truncate font-bangla text-[13px]">{s.home.announcement}</p>
        </div>
      )}
      <HeaderBar customerName={customer?.name ?? null} categories={cats} phone={s.store.phone} logoUrl={s.brand.logoUrl} />
      <MobileTabBar customerName={customer?.name ?? null} />
    </>
  );
}
