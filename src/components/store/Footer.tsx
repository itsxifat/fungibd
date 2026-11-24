import Link from "next/link";
import { Banknote, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getSettings } from "@/lib/settings";
import { bnDigits } from "@/lib/utils";

export async function Footer() {
  const s = await getSettings();
  const year = bnDigits(new Date().getFullYear());
  const wa = s.store.whatsapp.replace(/[^\d]/g, "");
  const tel = s.store.phone.replace(/[^\d+]/g, "");
  const socials = [
    { href: s.store.facebook, label: "Facebook" },
    { href: s.store.instagram, label: "Instagram" },
    { href: s.store.youtube, label: "YouTube" },
    { href: wa ? `https://wa.me/${wa}` : "", label: "WhatsApp" },
  ].filter((x) => /^https?:\/\//.test(x.href));
  const link = "text-white/70 transition-colors duration-150 hover:text-white";
  const cols: { title: string; links: [string, string][] }[] = [
    {
      title: "কেনাকাটা",
      links: [
        ["/preorder", "তাজা মাশরুম · প্রি-অর্ডার"],
        ["/shop", "মাশরুমের তৈরি পণ্য"],
        ["/benefits", "মাশরুমের উপকারিতা"],
        ["/wholesale", "পাইকারি অর্ডার"],
      ],
    },
    {
      title: "সাহায্য",
      links: [
        ["/track", "অর্ডার ট্র্যাক"],
        ["/delivery", "ডেলিভারি এলাকা ও চার্জ"],
        ["/policies", "ডেলিভারি ও রিটার্ন নীতি"],
        ["/support", "যোগাযোগ ও সাপোর্ট"],
        ["/account", "আমার অ্যাকাউন্ট"],
      ],
    },
  ];

  return (
    <footer className="mt-20 bg-brand-night text-white">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">
        <div>
          <Logo variant="cream" logoUrl={s.brand.logoDarkUrl} />
          <p className="mt-5 max-w-xs font-bangla text-[15px] leading-relaxed text-white/75">{s.store.taglineBn}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((x) => (
                <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 transition-colors duration-150 hover:border-white/40 hover:text-white">
                  {x.label}
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-base font-semibold text-white">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 font-bangla text-[15px]">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link className={link} href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="font-display text-base font-semibold text-white">যোগাযোগ</h3>
          <ul className="mt-4 space-y-3 text-[15px] text-white/75">
            {tel && (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-white/50" aria-hidden />
                <a className={`${link} tabular-nums`} href={`tel:${tel}`}>
                  {s.store.phone}
                </a>
              </li>
            )}
            {s.store.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-white/50" aria-hidden />
                <a className={link} href={`mailto:${s.store.email}`}>
                  {s.store.email}
                </a>
              </li>
            )}
            {s.store.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-1 size-4 shrink-0 text-white/50" aria-hidden />
                <span>{s.store.address}</span>
              </li>
            )}
            {s.store.hours && (
              <li className="flex items-start gap-2.5 font-bangla">
                <Clock className="mt-1 size-4 shrink-0 text-white/50" aria-hidden />
                <span>{s.store.hours}</span>
              </li>
            )}
            <li className="flex items-start gap-2.5 font-bangla">
              <Banknote className="mt-1 size-4 shrink-0 text-white/50" aria-hidden />
              <span>ক্যাশ অন ডেলিভারি — হাতে পেয়ে টাকা দিন</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 text-[13px] text-white/55">
          <p className="tabular-nums">
            © {year} {s.store.name}
            {s.delivery.coverageNote ? <span className="font-bangla"> · {s.delivery.coverageNote}</span> : null}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className={link} href="/privacy">
              Privacy Policy
            </Link>
            <Link className={link} href="/terms">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
