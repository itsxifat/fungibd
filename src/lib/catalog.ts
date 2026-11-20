// Pure helpers shared by server and browser code.

export type AvailabilityInput = {
  isActive: boolean;
  stockQty: number;
  preorderEnabled: boolean;
  preorderMode: string;
  preorderDate: Date | string | null;
  preorderCutoff: Date | string | null;
  preorderCap: number | null;
  preorderBooked: number;
};

export type Availability =
  | { mode: "IN_STOCK"; stockLeft: number }
  | { mode: "PREORDER"; date: Date | null; capLeft: number | null }
  | { mode: "SOLD_OUT"; reason: "OUT_OF_STOCK" | "PREORDER_FULL" | "PREORDER_CLOSED" | "INACTIVE" };

const toDate = (d: Date | string | null) => (d ? new Date(d) : null);

/**
 * Decides how a product variant can be bought right now.
 * - Pre-order "ALWAYS": product is only sold as pre-order (e.g. next harvest).
 * - Pre-order "OUT_OF_STOCK": sells from stock; switches to pre-order automatically when stock runs out.
 */
export function availability(p: AvailabilityInput, unitAmount: number, now = new Date()): Availability {
  if (!p.isActive) return { mode: "SOLD_OUT", reason: "INACTIVE" };
  const cutoff = toDate(p.preorderCutoff);
  const capLeft = p.preorderCap == null ? null : Math.max(0, p.preorderCap - p.preorderBooked);
  const preorderState = (): Availability => {
    if (cutoff && cutoff.getTime() < now.getTime()) return { mode: "SOLD_OUT", reason: "PREORDER_CLOSED" };
    if (capLeft != null && capLeft + 1e-9 < unitAmount) return { mode: "SOLD_OUT", reason: "PREORDER_FULL" };
    return { mode: "PREORDER", date: toDate(p.preorderDate), capLeft };
  };
  if (p.preorderEnabled && p.preorderMode === "ALWAYS") return preorderState();
  if (p.stockQty + 1e-9 >= unitAmount) return { mode: "IN_STOCK", stockLeft: p.stockQty };
  if (p.preorderEnabled) return preorderState();
  return { mode: "SOLD_OUT", reason: "OUT_OF_STOCK" };
}

export const SOLD_OUT_TEXT: Record<string, { bn: string; en: string }> = {
  OUT_OF_STOCK: { bn: "আজকের স্টক শেষ", en: "Sold out today" },
  PREORDER_FULL: { bn: "প্রি-অর্ডার স্লট পূর্ণ", en: "Pre-order slots full" },
  PREORDER_CLOSED: { bn: "প্রি-অর্ডার বন্ধ", en: "Pre-order closed" },
  INACTIVE: { bn: "পাওয়া যাচ্ছে না", en: "Unavailable" },
};

/** Image entries can be uploaded URLs or "art:<kind>" for built-in illustrations. */
export function productImages(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function unitLabel(unit: string, amount: number) {
  if (unit === "kg") return amount < 1 ? `${Math.round(amount * 1000)} g` : `${amount} kg`;
  return `${amount} pcs`;
}
