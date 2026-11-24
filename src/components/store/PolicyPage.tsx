import Link from "next/link";
import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";

export const policyLink = "font-semibold text-brand underline underline-offset-2";

export async function PolicyPage({ title, banglaTitle, children }: { title: string; banglaTitle: string; children: ReactNode }) {
  const { store } = await getSettings();
  return (
    <article className="container-x max-w-3xl py-14">
      <header className="border-b border-line pb-6">
        <h1 lang="en" className="font-display text-4xl sm:text-5xl">{title}</h1>
        <p lang="bn" className="mt-2 font-bangla text-lg text-ink-soft">{banglaTitle}</p>
        <p lang="en" className="mt-3 text-sm text-muted">Last updated <time dateTime="2026-11-20">20 November 2026</time></p>
      </header>
      <div className="mt-8 space-y-8">{children}</div>
      <p className="mt-10 border-t border-line pt-6 text-sm text-ink-soft">
        <span lang="bn">যোগাযোগ</span> · <Link href="/support" className={policyLink}>FungiBd Support</Link> · <a href={`mailto:${store.email}`} className={policyLink}>{store.email}</a>
      </p>
    </article>
  );
}

export function PolicySection({ title, children, bangla }: { title: string; children: ReactNode; bangla: ReactNode }) {
  return (
    <section>
      <h2 lang="en" className="text-xl font-semibold">{title}</h2>
      <div lang="en" className="mt-2 space-y-2 leading-relaxed text-ink-soft">{children}</div>
      <p lang="bn" className="mt-2 font-bangla leading-relaxed text-ink-soft">{bangla}</p>
    </section>
  );
}
