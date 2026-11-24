"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { reviewAction, supportAction, ticketReplyAction, unsubscribeAction, wholesaleAction, type FormState } from "@/app/(store)/actions";
import { FormMessage, Honeypot, SubmitButton } from "@/components/ui/form";
import { TICKET_CATEGORY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SupportForm({ defaults }: { defaults?: { name?: string; email?: string; phone?: string; orderNo?: string } }) {
  const [state, action] = useActionState<FormState, FormData>(supportAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="s-name">নাম · Name *</label>
          <input id="s-name" name="name" defaultValue={defaults?.name} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="s-email">ইমেইল · Email *</label>
          <input id="s-email" name="email" type="email" defaultValue={defaults?.email} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="s-phone">মোবাইল · Mobile</label>
          <input id="s-phone" name="phone" defaultValue={defaults?.phone} inputMode="tel" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="s-order">অর্ডার নম্বর (যদি থাকে) · Order no.</label>
          <input id="s-order" name="orderNo" defaultValue={defaults?.orderNo} className="input uppercase" placeholder="FB1234" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="s-cat">বিষয়ের ধরন · Topic</label>
        <select id="s-cat" name="category" className="input">
          {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
            <option key={k} value={k}>
              {v.bn} · {v.en}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="s-subject">বিষয় · Subject *</label>
        <input id="s-subject" name="subject" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="s-msg">বার্তা · Message *</label>
        <textarea id="s-msg" name="message" className="input min-h-32" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton>পাঠান · Send</SubmitButton>
    </form>
  );
}

export function TicketReplyForm({ ticketNo, k }: { ticketNo: string; k: string }) {
  const [state, action] = useActionState<FormState, FormData>(ticketReplyAction, {});
  return (
    <form action={action} className="space-y-3" key={state.ok ? Date.now() : "f"}>
      <input type="hidden" name="ticketNo" value={ticketNo} />
      <input type="hidden" name="k" value={k} />
      <label className="label" htmlFor="body">উত্তর লিখুন · Reply</label>
      <textarea id="body" name="body" className="input min-h-28" required />
      <FormMessage state={state} />
      <SubmitButton>পাঠান</SubmitButton>
    </form>
  );
}

export function WholesaleForm() {
  const [state, action] = useActionState<FormState, FormData>(wholesaleAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="w-name">নাম · Name *</label>
          <input id="w-name" name="name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="w-company">প্রতিষ্ঠান · Business name</label>
          <input id="w-company" name="company" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="w-phone">মোবাইল · Mobile *</label>
          <input id="w-phone" name="phone" inputMode="tel" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="w-email">ইমেইল · Email</label>
          <input id="w-email" name="email" type="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="w-type">ধরন · Business type</label>
          <select id="w-type" name="type" className="input">
            <option value="RESTAURANT">রেস্টুরেন্ট / হোটেল · Restaurant / Hotel</option>
            <option value="DISTRIBUTOR">দোকান / সুপারশপ · Shop / Retailer</option>
            <option value="WHOLESALE">পাইকার · Wholesaler</option>
            <option value="OTHER">অন্যান্য · Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w-volume">আনুমানিক পরিমাণ · Approx. quantity</label>
          <input id="w-volume" name="volume" className="input" placeholder="যেমন: সপ্তাহে ১০ কেজি" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="w-products">কোন মাশরুম · Which mushrooms</label>
        <input id="w-products" name="products" className="input" placeholder="ঝিনুক, দুধ মাশরুম…" />
      </div>
      <div>
        <label className="label" htmlFor="w-msg">বিস্তারিত · Details</label>
        <textarea id="w-msg" name="message" className="input min-h-28" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>পাঠান · Send inquiry</SubmitButton>
    </form>
  );
}

export function ReviewForm({ orderNo, k, products }: { orderNo: string; k: string; products: { id: string; nameBn: string; nameEn: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(reviewAction, {});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="orderNo" value={orderNo} />
      <input type="hidden" name="k" value={k} />
      {products.map((p) => (
        <fieldset key={p.id} className="rounded-xl border border-line bg-white p-5">
          <legend className="px-1 font-bangla font-semibold">
            {p.nameBn} <span className="font-normal text-muted">· {p.nameEn}</span>
          </legend>
          <input type="hidden" name={`rating_${p.id}`} value={ratings[p.id] ?? ""} />
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={ratings[p.id] === n} aria-label={`${n} stars`} onClick={() => setRatings((r) => ({ ...r, [p.id]: n }))} className="p-1">
                <Star className={cn("h-7 w-7", (ratings[p.id] ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
              </button>
            ))}
          </div>
          <textarea name={`comment_${p.id}`} className="input mt-3 min-h-20" placeholder="আপনার অভিজ্ঞতা লিখুন (ঐচ্ছিক) · Your thoughts (optional)" />
        </fieldset>
      ))}
      <FormMessage state={state} />
      <SubmitButton>রিভিউ পাঠান · Submit review</SubmitButton>
    </form>
  );
}

export function UnsubscribeForm({ e, k }: { e: string; k: string }) {
  const [state, action] = useActionState<FormState, FormData>(unsubscribeAction, {});
  if (state.ok || state.error) return <FormMessage state={state} />;
  return (
    <form action={action}>
      <input type="hidden" name="e" value={e} />
      <input type="hidden" name="k" value={k} />
      <SubmitButton>আনসাবস্ক্রাইব নিশ্চিত করুন · Confirm unsubscribe</SubmitButton>
    </form>
  );
}
