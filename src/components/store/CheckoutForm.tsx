"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertCircle, Banknote, CalendarClock, Check, Loader2, Lock, MapPin, ShoppingBag, Tag, X } from "lucide-react";
import { useCart, useHydrated, cartTotals } from "./cart-store";
import { CartLine, refreshCart } from "./CartDrawer";
import { placeOrderAction, checkCouponAction } from "@/app/(store)/actions";
import { cn, round2, takaBn } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import type { Pin } from "./MapPicker";
import type { DeliveryArea } from "@/lib/geo";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="grid h-[340px] place-items-center rounded-xl bg-cream text-sm text-muted">ম্যাপ লোড হচ্ছে… Loading map</div>,
});

type Zone = { id: string; nameEn: string; nameBn: string; charge: number };
type DayOpt = { value: string; label: string; tag: string };
type Address = { id: string; label: string; line: string; landmark: string; zoneId: string | null; lat: number | null; lng: number | null; isDefault: boolean };

export function CheckoutForm(props: {
  zones: Zone[];
  days: DayOpt[];
  slots: string[];
  freeDeliveryMin: number;
  center: Pin;
  radiusKm: number;
  areas?: DeliveryArea[];
  googleMapsKey?: string;
  customer: { name: string; phone: string; email: string; addresses: Address[] } | null;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear, sync } = useCart();
  const t = cartTotals(items);
  const def = props.customer?.addresses.find((a) => a.isDefault) ?? props.customer?.addresses[0];

  const [f, setF] = useState({
    name: props.customer?.name ?? "",
    phone: props.customer?.phone ?? "",
    email: props.customer?.email ?? "",
    zoneId: def?.zoneId ?? "",
    addressLine: def?.line ?? "",
    landmark: def?.landmark ?? "",
    deliveryDate: props.days[0]?.value ?? "",
    deliverySlot: props.slots[0] ?? "",
    note: "",
    createAccount: false,
    password: "",
  });
  const [pin, setPin] = useState<Pin | null>(def?.lat != null && def?.lng != null ? { lat: def.lat, lng: def.lng } : null);
  const [mapLabel, setMapLabel] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; freeDelivery: boolean; note: string } | null>(null);
  const [couponErr, setCouponErr] = useState("");
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [couponPending, startCoupon] = useTransition();

  useEffect(() => {
    if (hydrated) refreshCart(useCart.getState().items, sync as never).then(setNotes);
  }, [hydrated, sync]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const zone = props.zones.find((z) => z.id === f.zoneId);

  const deliveries = useMemo(() => {
    const out: { label: string; subtotal: number; charge: number }[] = [];
    const live = items.filter((i) => !i.unavailable);
    const reg = live.filter((i) => !i.preorder);
    const groups = new Map<string, number>();
    for (const i of live.filter((x) => x.preorder)) groups.set((i.preorderDate ?? "tbd").slice(0, 10), (groups.get((i.preorderDate ?? "tbd").slice(0, 10)) ?? 0) + i.price * i.qty);
    const charge = (sub: number) => (!zone ? 0 : coupon?.freeDelivery || (props.freeDeliveryMin > 0 && sub >= props.freeDeliveryMin) ? 0 : zone.charge);
    if (reg.length) {
      const sub = round2(reg.reduce((a, i) => a + i.price * i.qty, 0));
      out.push({ label: "এখনকার অর্ডার", subtotal: sub, charge: charge(sub) });
    }
    for (const [d, sub] of groups) out.push({ label: d === "tbd" ? "প্রি-অর্ডার" : `প্রি-অর্ডার · ${fmtDateBn(new Date(d + "T06:00:00+06:00"), { day: "numeric", month: "short" })}`, subtotal: round2(sub), charge: charge(sub) });
    return out;
  }, [items, zone, coupon, props.freeDeliveryMin]);
  const deliveryTotal = deliveries.reduce((a, d) => a + d.charge, 0);
  const discount = coupon?.discount ?? 0;
  const total = round2(t.subtotal - discount + deliveryTotal);

  const applyCoupon = () => {
    setCouponErr("");
    startCoupon(async () => {
      const r = await checkCouponAction(couponInput, t.subtotal, f.phone);
      if (!r.ok) setCouponErr(r.error);
      else setCoupon({ code: r.code, discount: r.discount, freeDelivery: r.freeDelivery, note: r.note });
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin) {
      setError({ msg: "ম্যাপে আপনার বাসার লোকেশন পিন করুন — ডেলিভারি ম্যান সহজে খুঁজে পাবে · Please pin your location on the map", field: "map" });
      document.getElementById("sec-address")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    start(async () => {
      const res = await placeOrderAction({
        name: f.name,
        phone: f.phone,
        email: f.email,
        zoneId: f.zoneId,
        addressLine: f.addressLine,
        landmark: f.landmark,
        lat: pin.lat,
        lng: pin.lng,
        deliveryDate: f.deliveryDate,
        deliverySlot: f.deliverySlot,
        note: f.note,
        couponCode: coupon?.code ?? "",
        password: f.createAccount ? f.password : undefined,
        lines: items.filter((i) => !i.unavailable).map((i) => ({ variantId: i.variantId, qty: i.qty, expectPreorder: i.preorder })),
      });
      if (res.ok) {
        clear();
        router.push(res.redirect);
        return;
      }
      setError({ msg: res.error, field: "field" in res ? res.field : undefined });
      if ("changed" in res && res.changed) setNotes(await refreshCart(useCart.getState().items, sync as never));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (!hydrated) return <div className="h-96" />;
  if (!items.length)
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShoppingBag className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-3xl">আপনার কার্ট খালি</h1>
        <p className="font-bangla text-muted">পরের হারভেস্ট থেকে বুক করুন, অথবা শপ থেকে কিছু বেছে নিন।</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/preorder" className="btn btn-primary">
            প্রি-অর্ডার দেখুন
          </Link>
          <Link href="/shop" className="btn btn-outline">
            শপ
          </Link>
        </div>
      </div>
    );

  const err = (field: string) => error?.field === field;
  const Section = ({ n, bn, en, id, children }: { n: string; bn: string; en: string; id?: string; children: React.ReactNode }) => (
    <section id={id} className="scroll-mt-28 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg border border-line-strong font-display text-ink-soft tabular-nums">{n}</span>
        <span>
          <span className="block font-bangla text-xl font-semibold leading-tight">{bn}</span>
          <span className="block text-xs text-muted">{en}</span>
        </span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.35fr_1fr]" noValidate>
      <div className="space-y-5">
        {error && (
          <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error.msg}
          </div>
        )}
        {notes.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {notes.map((n) => (
              <p key={n}>• {n}</p>
            ))}
          </div>
        )}

        {Section({
          n: "১",
          bn: "আপনার তথ্য",
          en: "Your details",
          children: (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name">
                  নাম · Full name *
                </label>
                <input id="name" className="input" autoComplete="name" required value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={err("name")} />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  মোবাইল · Mobile *
                </label>
                <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" required value={f.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={err("phone")} />
                <p className="hint">ডেলিভারির আগে এই নম্বরে কল করা হবে</p>
              </div>
              <div>
                <label className="label" htmlFor="email">
                  ইমেইল · Email *
                </label>
                <input id="email" className="input" type="email" autoComplete="email" placeholder="you@example.com" required value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={err("email")} />
                <p className="hint">অর্ডার কনফার্মেশন ও আপডেট ইমেইলে পাবেন</p>
              </div>
            </div>
          ),
        })}

        {Section({
          n: "২",
          bn: "ডেলিভারি ঠিকানা",
          en: "Delivery address",
          id: "sec-address",
          children: (
            <div className="space-y-4">
              {props.customer && props.customer.addresses.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {props.customer.addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setF((s) => ({ ...s, addressLine: a.line, landmark: a.landmark, zoneId: a.zoneId ?? s.zoneId }));
                        if (a.lat != null && a.lng != null) setPin({ lat: a.lat, lng: a.lng });
                      }}
                      className={cn("chip rounded-lg border px-3 py-1.5", f.addressLine === a.line ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}
                    >
                      <MapPin className="h-3.5 w-3.5" /> {a.label}: {a.line.slice(0, 28)}…
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="label" htmlFor="zone">
                  এলাকা · Area *
                </label>
                <select id="zone" className="input" required value={f.zoneId} onChange={(e) => set("zoneId", e.target.value)} aria-invalid={err("zoneId")}>
                  <option value="">— আপনার এলাকা বেছে নিন · Choose your area —</option>
                  {props.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nameBn} · {z.nameEn} — ৳{z.charge}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">ম্যাপে বাসা পিন করুন · Pin your home on the map *</span>
                <div className={cn(err("map") && "rounded-xl ring-2 ring-red-400 ring-offset-2")}>
                  <MapPicker value={pin} onChange={setPin} center={props.center} radiusKm={props.radiusKm} areas={props.areas} onAddress={(l) => setMapLabel(l)} googleKey={props.googleMapsKey} />
                </div>
              </div>
              <div>
                <div className="flex items-end justify-between gap-2">
                  <label className="label" htmlFor="addressLine">
                    বিস্তারিত ঠিকানা · Full address *
                  </label>
                  {mapLabel && !f.addressLine && (
                    <button type="button" onClick={() => set("addressLine", mapLabel.split(",").slice(0, 4).join(","))} className="mb-1 text-xs font-semibold text-brand hover:underline">
                      ম্যাপের ঠিকানা বসান
                    </button>
                  )}
                </div>
                <textarea
                  id="addressLine"
                  className="input min-h-24"
                  required
                  placeholder="বাসা নং, রোড নং, ব্লক/সেক্টর, এলাকা — যেমন: বাসা ১২, রোড ৫, ব্লক সি, বনানী"
                  value={f.addressLine}
                  onChange={(e) => set("addressLine", e.target.value)}
                  aria-invalid={err("addressLine")}
                />
              </div>
              <div>
                <label className="label" htmlFor="landmark">
                  ল্যান্ডমার্ক / ফ্ল্যাট · Landmark, floor (optional)
                </label>
                <input id="landmark" className="input" placeholder="যেমন: মসজিদের পাশে, ৪র্থ তলা, লিফট আছে" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} />
              </div>
            </div>
          ),
        })}

        {Section({
          n: "৩",
          bn: "ডেলিভারির সময়",
          en: "Delivery time",
          children: (
            <div className="space-y-5">
              {t.hasRegular && (
                <div>
                  <span className="label">দিন · Day</span>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {props.days.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => set("deliveryDate", d.value)}
                        className={cn("min-w-[92px] shrink-0 rounded-xl border px-3 py-2.5 text-center transition", f.deliveryDate === d.value ? "border-brand bg-brand text-cream" : "border-line-strong bg-white hover:border-brand")}
                      >
                        <span className="block font-bangla text-sm font-semibold">{d.label}</span>
                        {d.tag && <span className={cn("block text-[11px]", f.deliveryDate === d.value ? "text-cream/80" : "text-muted")}>{d.tag}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="label">সময় · Time slot</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {props.slots.map((sl) => (
                    <button
                      key={sl}
                      type="button"
                      onClick={() => set("deliverySlot", sl)}
                      className={cn("rounded-[10px] border px-3 py-3 text-left font-bangla text-sm transition-colors duration-150", f.deliverySlot === sl ? "border-ink bg-ink font-medium text-white" : "border-line-strong bg-white hover:border-ink")}
                    >
                      {sl}
                    </button>
                  ))}
                </div>
              </div>
              {t.hasPre && (
                <p className="flex gap-2 rounded-lg bg-cream/60 p-3 font-bangla text-sm text-ink-soft">
                  <CalendarClock className="size-[18px] shrink-0 text-muted" aria-hidden /> প্রি-অর্ডারের পণ্য হারভেস্টের পর (কার্টে দেখানো তারিখে) এই সময়ে ডেলিভারি হবে।
                </p>
              )}
              <div>
                <label className="label" htmlFor="note">
                  ডেলিভারি নোট · Note for us (optional)
                </label>
                <input id="note" className="input" placeholder="যেমন: গেটে দারোয়ানের কাছে রাখবেন" value={f.note} onChange={(e) => set("note", e.target.value)} />
              </div>
            </div>
          ),
        })}

        {Section({
          n: "৪",
          bn: "পেমেন্ট",
          en: "Payment",
          children: (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-ink p-4">
                <Banknote className="size-5 shrink-0 text-ink-soft" aria-hidden />
                <span className="flex-1">
                  <span className="block font-bangla font-semibold">ক্যাশ অন ডেলিভারি</span>
                  <span className="block font-bangla text-xs text-muted">পণ্য হাতে পেয়ে, দেখে তারপর টাকা দিন</span>
                </span>
                <Check className="size-5 text-ink" aria-hidden />
              </div>
              {!props.customer && (
                <div className="rounded-xl border border-line p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" checked={f.createAccount} onChange={(e) => set("createAccount", e.target.checked)} />
                    <span>
                      <span className="block font-bangla text-sm font-semibold">একটি অ্যাকাউন্ট তৈরি করুন (ঐচ্ছিক)</span>
                      <span className="block text-xs text-muted">Track orders & reorder faster next time</span>
                    </span>
                  </label>
                  {f.createAccount && (
                    <div className="mt-3">
                      <label className="label" htmlFor="password">
                        পাসওয়ার্ড · Password (min 6)
                      </label>
                      <input id="password" type="password" minLength={6} autoComplete="new-password" className="input" value={f.password} onChange={(e) => set("password", e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ),
        })}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl">অর্ডার সারাংশ</h2>
          <p className="text-xs text-muted">Order summary</p>
          <ul className="mt-5 flex max-h-[340px] flex-col gap-4 overflow-y-auto pr-1">
            {items.map((i) => (
              <CartLine key={i.variantId} item={i} compact />
            ))}
          </ul>

          <div className="mt-5 border-t border-line pt-5">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-brand-tint px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-semibold text-brand-deep">
                  <Tag className="h-4 w-4" /> {coupon.code} {coupon.note && <span className="font-normal text-muted">· {coupon.note}</span>}
                </span>
                <button type="button" onClick={() => setCoupon(null)} aria-label="Remove coupon" className="rounded-md p-1 transition-colors duration-150 hover:bg-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <label htmlFor="coupon" className="sr-only">
                    Coupon
                  </label>
                  <input id="coupon" className="input input-sm uppercase" placeholder="কুপন কোড · Coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
                  <button type="button" onClick={applyCoupon} disabled={!couponInput || couponPending} className="btn btn-outline btn-sm">
                    {couponPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponErr && <p className="mt-1.5 text-xs text-red-600">{couponErr}</p>}
              </div>
            )}
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">সাবটোটাল · Subtotal</dt>
              <dd className="tabular-nums">{takaBn(t.subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>ডিসকাউন্ট · Discount</dt>
                <dd className="tabular-nums">−{takaBn(discount)}</dd>
              </div>
            )}
            {deliveries.map((d) => (
              <div key={d.label} className="flex justify-between">
                <dt className="text-ink-soft">ডেলিভারি · {d.label}</dt>
                <dd className="tabular-nums">{!zone ? "—" : d.charge === 0 ? <span className="font-semibold text-brand">ফ্রি</span> : takaBn(d.charge)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">মোট · Total</dt>
              <dd className="font-display text-3xl font-semibold text-brand-deep tabular-nums">{takaBn(total)}</dd>
            </div>
          </dl>
          {!zone && <p className="mt-1 text-xs text-muted">এলাকা বেছে নিলে ডেলিভারি চার্জ যোগ হবে</p>}

          <button type="submit" disabled={pending || !t.count} className="btn btn-primary btn-lg mt-6 w-full">
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {pending ? "অর্ডার হচ্ছে…" : `অর্ডার কনফার্ম করুন · ${takaBn(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">অর্ডার করে আপনি আমাদের <Link href="/policies" className="underline">ডেলিভারি নীতি</Link> মেনে নিচ্ছেন।</p>
        </div>
      </aside>
    </form>
  );
}
