export function AdminAuthFrame({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f6f6f4] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/badge.svg" alt="" className="h-9 w-9 rounded-[10px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-green.svg" alt="FungiBd" className="h-[20px]" />
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6">{children}</div>
      </div>
    </div>
  );
}
