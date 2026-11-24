import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-cream">
        মূল অংশে যান
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-brand-night lg:hidden" />
      <CartDrawer freeDeliveryMin={s.delivery.freeDeliveryMin} />
    </>
  );
}
