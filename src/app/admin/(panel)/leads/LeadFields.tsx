import { LEAD_PIPELINE, LEAD_SOURCES, LEAD_STATUS, LEAD_TYPES } from "@/lib/constants";
import { dateKey } from "@/lib/dates";

type L = { name: string; phone: string; email: string; company: string; type: string; source: string; status: string; estValue: number; interest: string; message: string; nextFollowUp: Date | null; assignedTo: string; lostReason: string };

export function LeadFields({ l }: { l?: Partial<L> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="label">Name *</span>
        <input name="name" defaultValue={l?.name} className="input input-sm" required />
      </label>
      <label className="block">
        <span className="label">Business</span>
        <input name="company" defaultValue={l?.company} className="input input-sm" />
      </label>
      <label className="block">
        <span className="label">Mobile</span>
        <input name="phone" defaultValue={l?.phone} className="input input-sm" />
      </label>
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" defaultValue={l?.email} className="input input-sm" />
      </label>
      <label className="block">
        <span className="label">Type</span>
        <select name="type" defaultValue={l?.type ?? "RETAIL"} className="input input-sm">
          {Object.entries(LEAD_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Source</span>
        <select name="source" defaultValue={l?.source ?? "PHONE"} className="input input-sm">
          {Object.entries(LEAD_SOURCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Stage</span>
        <select name="status" defaultValue={l?.status ?? "NEW"} className="input input-sm">
          {LEAD_PIPELINE.map((k) => (
            <option key={k} value={k}>
              {LEAD_STATUS[k].en}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Est. monthly value (৳)</span>
        <input name="estValue" type="number" defaultValue={l?.estValue ?? 0} className="input input-sm" />
      </label>
      <label className="block">
        <span className="label">Next follow-up</span>
        <input name="nextFollowUp" type="date" defaultValue={l?.nextFollowUp ? dateKey(l.nextFollowUp) : ""} className="input input-sm" />
      </label>
      <label className="block">
        <span className="label">Owner</span>
        <input name="assignedTo" defaultValue={l?.assignedTo} className="input input-sm" />
      </label>
      <label className="block sm:col-span-2">
        <span className="label">Interested in</span>
        <input name="interest" defaultValue={l?.interest} className="input input-sm" />
      </label>
      <label className="block sm:col-span-2">
        <span className="label">Notes / message</span>
        <textarea name="message" defaultValue={l?.message} className="input input-sm min-h-16" />
      </label>
      <label className="block sm:col-span-2">
        <span className="label">Lost reason (if lost)</span>
        <input name="lostReason" defaultValue={l?.lostReason} className="input input-sm" />
      </label>
    </div>
  );
}
