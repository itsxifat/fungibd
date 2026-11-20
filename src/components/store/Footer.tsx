import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  const year = new Date().getFullYear();
  const wa = s.store.whatsapp.replace(/[^\d]/g, "");
  const socials = [
    { href: s.store.facebook, label: "Facebook" },
    { href: s.store.instagram, label: "Instagram" },
    { href: s.store.youtube, label: "YouTube" },
    { href: wa ? `https://wa.me/${wa}` : "", label: "WhatsApp" },
  ].filter((x) => x.href);
  const link = "text-ink-soft transition hover:text-brand";

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs font-bangla text-sm leading-relaxed text-ink-soft">{s.store.taglineBn}</p>
          <p className="mt-1 max-w-xs text-sm text-muted">{s.store.taglineEn}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              {socials.map((x) => (
                <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className={link}>
                  {x.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">শপ</h3>
          <ul className="mt-4 space-y-2.5 font-bangla text-sm">
            <li><Link className={link} href="/shop">সব মাশরুম</Link></li>
            <li><Link className={link} href="/shop?filter=preorder">প্রি-অর্ডার</Link></li>
            <li><Link className={link} href="/benefits">মাশরুমের উপকারিতা</Link></li>
            <li><Link className={link} href="/wholesale">পাইকারি অর্ডার</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">সাহায্য</h3>
          <ul className="mt-4 space-y-2.5 font-bangla text-sm">
            <li><Link className={link} href="/track">অর্ডার ট্র্যাক</Link></li>
            <li><Link className={link} href="/support">যোগাযোগ ও সাপোর্ট</Link></li>
            <li><Link className={link} href="/policies">ডেলিভারি নীতি</Link></li>
            <li><Link className={link} href="/account">আমার অ্যাকাউন্ট</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">যোগাযোগ</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li><a className={link} href={`tel:${s.store.phone.replace(/[^\d+]/g, "")}`}>{s.store.phone}</a></li>
            <li><a className={link} href={`mailto:${s.store.email}`}>{s.store.email}</a></li>
            <li>{s.store.address}</li>
            {s.store.hours && <li className="font-bangla">{s.store.hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <p>© {year} {s.store.name}</p>
          <p className="font-bangla">শুধুমাত্র ঢাকার ভিতরে ডেলিভারি · ক্যাশ অন ডেলিভারি</p>
        </div>
      </div>
    </footer>
  );
}
