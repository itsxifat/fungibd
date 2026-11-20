import { UnsubscribeForm } from "@/components/store/StoreForms";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ e?: string; k?: string }> }) {
  const { e = "", k = "" } = await searchParams;
  return (
    <div className="container-x max-w-lg py-20 text-center">
      <h1 className="font-display text-3xl">অফার ইমেইল বন্ধ করুন</h1>
      <p className="mt-3 text-muted">
        {e} — you will still receive emails about your own orders.
      </p>
      <div className="mt-8 flex justify-center">
        <UnsubscribeForm e={e} k={k} />
      </div>
    </div>
  );
}
