"use client";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadFiles } from "./ImageUploader";

/** Single image field: upload → stores the URL in a hidden input with the given name. */
export function UploadField({ name, defaultValue, folder = "site", previewBg = "#fff", accept = "image/*" }: { name: string; defaultValue: string; folder?: string; previewBg?: string; accept?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={url} />
      <div className="grid h-16 w-40 place-items-center overflow-hidden rounded-lg border border-stone-200 p-2" style={{ background: previewBg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-stone-400">none</span>}
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => ref.current?.click()} className="btn btn-outline btn-sm rounded-lg">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
        {url && (
          <button type="button" onClick={() => setUrl("")} className="text-xs text-stone-500 hover:text-red-600">
            Reset to default
          </button>
        )}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr("");
          try {
            const [u] = await uploadFiles([f], folder);
            setUrl(u);
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
