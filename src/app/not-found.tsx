import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/badge.svg" alt="" className="mx-auto h-14 w-14 rounded-xl" />
        <h1 className="mt-6 font-display text-3xl">পেজটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-muted">Page not found.</p>
        <Link href="/" className="btn btn-primary mt-8">
          হোমে ফিরুন
        </Link>
      </div>
    </div>
  );
}
