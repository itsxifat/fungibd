import type { Prisma } from "@prisma/client";
import type { Segment } from "./constants";
import { DAY } from "./dates";

type CrmSettings = { atRiskDays: number; lostDays: number; loyalOrders: number };

/**
 * Retention segments (mutually exclusive):
 *  PROSPECT  no orders yet
 *  NEW       1 order, ordered within "at-risk" days
 *  ACTIVE    2+ orders, ordered recently
 *  LOYAL     ≥ loyalOrders orders, ordered recently
 *  AT_RISK   last order between at-risk and lost days ago
 *  LOST      last order more than lost days ago
 */
export function segmentOf(c: { totalOrders: number; lastOrderAt: Date | null }, s: CrmSettings, now = new Date()): Segment {
  if (!c.lastOrderAt || c.totalOrders === 0) return "PROSPECT";
  const days = (now.getTime() - c.lastOrderAt.getTime()) / DAY;
  if (days > s.lostDays) return "LOST";
  if (days > s.atRiskDays) return "AT_RISK";
  if (c.totalOrders >= s.loyalOrders) return "LOYAL";
  if (c.totalOrders >= 2) return "ACTIVE";
  return "NEW";
}

export function segmentWhere(seg: Segment, s: CrmSettings, now = new Date()): Prisma.CustomerWhereInput {
  const riskCut = new Date(now.getTime() - s.atRiskDays * DAY);
  const lostCut = new Date(now.getTime() - s.lostDays * DAY);
  switch (seg) {
    case "PROSPECT":
      return { OR: [{ totalOrders: 0 }, { lastOrderAt: null }] };
    case "LOST":
      return { totalOrders: { gt: 0 }, lastOrderAt: { lt: lostCut } };
    case "AT_RISK":
      return { totalOrders: { gt: 0 }, lastOrderAt: { gte: lostCut, lt: riskCut } };
    case "LOYAL":
      return { lastOrderAt: { gte: riskCut }, totalOrders: { gte: s.loyalOrders } };
    case "ACTIVE":
      return { lastOrderAt: { gte: riskCut }, totalOrders: { gte: 2, lt: s.loyalOrders } };
    case "NEW":
      return { lastOrderAt: { gte: riskCut }, totalOrders: 1 };
  }
}
