import { Mail, MapPin, Phone, Plus } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth";
import { FAQS } from "@/lib/content";
import { SupportForm } from "@/components/store/StoreForms";

export const metadata = { title: "যোগাযোগ ও সাপোর্ট · Contact & support" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const [s, c, sp] = await Promise.all([getSettings(), getCustomer(), searchParams]);
  const wa = s.store.whatsapp.replace(/[^\d]/g, "");
  return (
    <div className="container-x py-14">
      <h1 className="font-display text-4xl">যোগাযোগ ও সাপোর্ট</h1>
      <p className="mt-2 text-muted">Questions about an order, delivery or our mushrooms? Send us a message — we reply by email.</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <SupportForm defaults={{ name: c?.name, email: c?.email ?? "", phone: c?.phone, orderNo: sp.order }} />
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-6 text-sm">
            <p className="flex gap-3">
              <Phone className="h-4 w-4 text-brand" /> <a href={`tel:${s.store.phone.replace(/[^\d+]/g, "")}`}>{s.store.phone}</a>
            </p>
            {wa && (
              <p className="mt-3 flex gap-3">
                <span className="w-4 text-center text-brand">✆</span>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                  WhatsApp {s.store.whatsapp}
                </a>
              </p>
            )}
            <p className="mt-3 flex gap-3">
              <Mail className="h-4 w-4 text-brand" /> <a href={`mailto:${s.store.email}`}>{s.store.email}</a>
            </p>
            <p className="mt-3 flex gap-3">
              <MapPin className="h-4 w-4 text-brand" /> {s.store.address}
            </p>
            {s.store.hours && <p className="mt-3 font-bangla text-muted">{s.store.hours}</p>}
          </div>
        </aside>
      </div>
      <section id="faq" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl">সাধারণ প্রশ্ন · FAQ</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 font-bangla font-semibold">
                {f.q}
                <Plus className="mt-1 h-4 w-4 shrink-0 text-muted transition group-open:rotate-45" />
              </summary>
              <p className="mt-3 font-bangla text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
