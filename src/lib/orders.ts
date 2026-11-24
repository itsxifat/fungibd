import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { getSettings } from "./settings";
import { availability } from "./catalog";
import { round2, round3, normalizePhone } from "./utils";
import { addDays, dateKey, dhakaParts, parseDateKey, startOfDay } from "./dates";
import { insideDeliveryArea } from "./geo";
import { hashPassword } from "./auth";
import { consumeSupply } from "./stock";
import { NEXT_STATUS, type OrderStatus } from "./constants";
import { background, notifyAdminNewOrders, notifyOrderPlaced, notifyOrderStatus } from "./email/notify";

type Tx = Prisma.TransactionClient;

export type CheckoutLine = { variantId: string; qty: number; expectPreorder?: boolean };
export type CheckoutInput = {
  name: string;
  phone: string;
  email: string;
  zoneId: string;
  addressLine: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  deliveryDate: string; // YYYY-MM-DD (regular items)
  deliverySlot: string;
  note: string;
  couponCode: string;
  lines: CheckoutLine[];
  source: string;
  customerId?: string | null;
  password?: string;
  by?: string;
  isAdmin?: boolean;
  internalNote?: string;
};
export type PlacedOrder = { id: string; orderNo: string; type: string; total: number; deliveryDate: Date | null };
export type PlaceResult = { ok: true; orders: PlacedOrder[]; customerId: string; accountCreated: boolean } | { ok: false; error: string; field?: string; changed?: boolean };

/** Earliest + latest delivery dates customers can pick for in-stock items. */
export function deliveryWindow(d: { sameDayCutoffHour: number; daysAhead: number }, now = new Date()) {
  const today = startOfDay(now);
  const earliest = dhakaParts(now).h < d.sameDayCutoffHour ? today : addDays(today, 1);
  const days: Date[] = [];
  for (let i = 0; i <= d.daysAhead; i++) days.push(addDays(earliest, i));
  return { earliest, days };
}

async function nextOrderNo(tx: Tx) {
  const c = await tx.counter.upsert({ where: { key: "order" }, create: { key: "order", value: 1001 }, update: { value: { increment: 1 } } });
  return `FB${c.value}`;
}

export async function validateCoupon(code: string, subtotal: number, phone: string | null, now = new Date()) {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.isActive) return { ok: false as const, error: "কুপনটি সঠিক নয় · Invalid coupon" };
  if (c.startsAt && c.startsAt > now) return { ok: false as const, error: "কুপনটি এখনো চালু হয়নি · Coupon not active yet" };
  if (c.expiresAt && c.expiresAt < now) return { ok: false as const, error: "কুপনের মেয়াদ শেষ · Coupon expired" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false as const, error: "কুপনের ব্যবহার সীমা শেষ · Coupon limit reached" };
  if (subtotal < c.minOrder) return { ok: false as const, error: `ন্যূনতম ৳${c.minOrder} অর্ডারে প্রযোজ্য · Minimum order ৳${c.minOrder}` };
  if (phone && c.perCustomer > 0) {
    const used = await db.order.findMany({ where: { phone, couponCode: c.code, status: { not: "CANCELLED" } }, select: { checkoutGroup: true, id: true } });
    const uses = new Set(used.map((u) => u.checkoutGroup ?? u.id)).size;
    if (uses >= c.perCustomer) return { ok: false as const, error: "আপনি এই কুপনটি আগেই ব্যবহার করেছেন · Already used" };
  }
  let discount = 0;
  if (c.type === "PERCENT") discount = (subtotal * c.value) / 100;
  if (c.type === "FIXED") discount = c.value;
  if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  discount = round2(Math.min(discount, subtotal));
  return { ok: true as const, coupon: c, discount, freeDelivery: c.type === "FREE_DELIVERY" };
}

export async function placeOrder(input: CheckoutInput): Promise<PlaceResult> {
  const s = await getSettings();
  const now = new Date();

  // ── 1. Basic validation ──
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "নাম লিখুন · Please enter your name", field: "name" };
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX) · Enter a valid mobile number", field: "phone" };
  const email = input.email.trim().toLowerCase();
  if (!input.isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "সঠিক ইমেইল দিন — অর্ডারের আপডেট ইমেইলে পাঠানো হবে · Enter a valid email", field: "email" };
  if (input.addressLine.trim().length < 8) return { ok: false, error: "বিস্তারিত ঠিকানা লিখুন (বাসা, রোড, এলাকা) · Enter your full address", field: "addressLine" };
  const zone = await db.deliveryZone.findFirst({ where: { id: input.zoneId, isActive: true } });
  if (!zone) return { ok: false, error: "ডেলিভারি এলাকা নির্বাচন করুন · Choose your delivery area", field: "zoneId" };
  if (!input.isAdmin && input.lat != null && input.lng != null && !insideDeliveryArea(input.lat, input.lng, s.delivery))
    return { ok: false, error: "দুঃখিত, ম্যাপের লোকেশনটি আমাদের ডেলিভারি এলাকার বাইরে। আমরা শুধু ঢাকার ভিতরে ডেলিভারি দিই। · Sorry, this pin is outside our Dhaka delivery area.", field: "map" };

  // ── 2. Lines ──
  const merged = new Map<string, CheckoutLine>();
  for (const l of input.lines) {
    const qty = Math.floor(Number(l.qty));
    if (!l.variantId || !(qty > 0)) continue;
    const prev = merged.get(l.variantId);
    merged.set(l.variantId, { ...l, qty: Math.min(50, (prev?.qty ?? 0) + qty) });
  }
  if (!merged.size) return { ok: false, error: "আপনার কার্ট খালি · Your cart is empty" };

  const variants = await db.productVariant.findMany({ where: { id: { in: [...merged.keys()] } }, include: { product: true } });
  type Line = { v: (typeof variants)[number]; qty: number; pre: boolean };
  const lines: Line[] = [];
  for (const [vid, l] of merged) {
    const v = variants.find((x) => x.id === vid);
    if (!v || !v.isActive) return { ok: false, error: "কার্টের একটি পণ্য আর পাওয়া যাচ্ছে না · An item is no longer available", changed: true };
    const a = availability(v.product, v.unitAmount, now);
    if (a.mode === "SOLD_OUT") return { ok: false, error: `${v.product.nameBn} (${v.labelBn}) — এখন পাওয়া যাচ্ছে না · now unavailable`, changed: true };
    const pre = a.mode === "PREORDER";
    if (l.expectPreorder != null && l.expectPreorder !== pre && !input.isAdmin)
      return {
        ok: false,
        changed: true,
        error: pre
          ? `${v.product.nameBn}-এর আজকের স্টক শেষ, এখন শুধু প্রি-অর্ডার নেওয়া হচ্ছে। কার্ট আপডেট করা হয়েছে। · Now available as pre-order only.`
          : `${v.product.nameBn} এখন স্টকে আছে। কার্ট আপডেট করা হয়েছে। · Now in stock.`,
      };
    lines.push({ v, qty: l.qty, pre });
  }

  // ── 3. Quantity checks per product ──
  const needByProduct = new Map<string, { stock: number; pre: number }>();
  for (const l of lines) {
    const k = needByProduct.get(l.v.productId) ?? { stock: 0, pre: 0 };
    if (l.pre) k.pre += l.v.unitAmount * l.qty;
    else k.stock += l.v.unitAmount * l.qty;
    needByProduct.set(l.v.productId, k);
  }
  for (const [pid, need] of needByProduct) {
    const p = lines.find((l) => l.v.productId === pid)!.v.product;
    if (need.stock > p.stockQty + 1e-9)
      return { ok: false, changed: true, error: `${p.nameBn}: আজ মাত্র ${round3(p.stockQty)} ${p.stockUnit} আছে · Only ${round3(p.stockQty)} ${p.stockUnit} left today` };
    if (need.pre > 0 && p.preorderCap != null && need.pre > p.preorderCap - p.preorderBooked + 1e-9)
      return { ok: false, changed: true, error: `${p.nameBn}: প্রি-অর্ডারে আর ${round3(Math.max(0, p.preorderCap - p.preorderBooked))} ${p.stockUnit} বুক করা যাবে` };
  }

  // ── 4. Group into deliveries: in-stock items together, pre-orders by harvest date ──
  const win = deliveryWindow(s.delivery, now);
  let regularDate = parseDateKey(input.deliveryDate) ?? win.earliest;
  if (!input.isAdmin && (regularDate < win.earliest || regularDate > win.days[win.days.length - 1])) regularDate = win.earliest;

  const groups = new Map<string, { type: "REGULAR" | "PREORDER"; date: Date | null; lines: Line[] }>();
  for (const l of lines) {
    let key = "REGULAR";
    let date: Date | null = regularDate;
    if (l.pre) {
      date = l.v.product.preorderDate ? startOfDay(l.v.product.preorderDate) : null;
      if (date && date < win.earliest) date = win.earliest;
      key = `PRE:${date ? dateKey(date) : "tbd"}`;
    }
    const g = groups.get(key) ?? { type: l.pre ? "PREORDER" : "REGULAR", date, lines: [] };
    g.lines.push(l);
    groups.set(key, g);
  }

  const lineTotal = (l: Line) => round2(l.v.price * l.qty);
  const combinedSubtotal = round2(lines.reduce((a, l) => a + lineTotal(l), 0));
  if (s.delivery.minOrder > 0 && combinedSubtotal < s.delivery.minOrder && !input.isAdmin)
    return { ok: false, error: `ন্যূনতম অর্ডার ৳${s.delivery.minOrder} · Minimum order is ৳${s.delivery.minOrder}` };

  // ── 5. Coupon ──
  let discountTotal = 0;
  let freeDelivery = false;
  let couponCode = "";
  let couponId: string | null = null;
  if (input.couponCode.trim()) {
    const c = await validateCoupon(input.couponCode, combinedSubtotal, phone, now);
    if (!c.ok) return { ok: false, error: c.error, field: "coupon" };
    discountTotal = c.discount;
    freeDelivery = c.freeDelivery;
    couponCode = c.coupon.code;
    couponId = c.coupon.id;
  }

  // ── 6. Write everything in one transaction ──
  const checkoutGroup = `CG${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const passwordHash = input.password && input.password.length >= 6 ? await hashPassword(input.password) : null;

  try {
    const result = await db.$transaction(async (tx) => {
      // customer
      let customer = input.customerId ? await tx.customer.findUnique({ where: { id: input.customerId } }) : null;
      if (!customer) customer = await tx.customer.findUnique({ where: { phone } });
      const accountCreated = Boolean(passwordHash && !customer?.hasAccount && (!email || !(await tx.customer.findFirst({
        where: { email, hasAccount: true }, select: { id: true },
      }))));
      if (!customer) {
        customer = await tx.customer.create({
          data: { name, phone, email: email || null, source: input.source, passwordHash: accountCreated ? passwordHash : null, hasAccount: accountCreated },
        });
      } else if (!customer.hasAccount) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            email: email || customer.email,
            name: customer.name || name,
            ...(accountCreated ? { passwordHash, hasAccount: true } : {}),
          },
        });
      }

      // re-check stock with fresh data inside the transaction
      for (const [pid, need] of needByProduct) {
        const p = await tx.product.findUniqueOrThrow({ where: { id: pid } });
        if (need.stock > p.stockQty + 1e-9) throw new Error(`STOCK:${p.nameBn}`);
      }

      const placed: PlacedOrder[] = [];
      const groupList = [...groups.values()].sort((a, b) => (a.type === b.type ? 0 : a.type === "REGULAR" ? -1 : 1));
      let discountLeft = discountTotal;
      for (let gi = 0; gi < groupList.length; gi++) {
        const g = groupList[gi];
        const subtotal = round2(g.lines.reduce((a, l) => a + lineTotal(l), 0));
        const discount = gi === groupList.length - 1 ? round2(discountLeft) : round2(combinedSubtotal > 0 ? (discountTotal * subtotal) / combinedSubtotal : 0);
        discountLeft = round2(discountLeft - discount);
        const free = freeDelivery || (s.delivery.freeDeliveryMin > 0 && subtotal >= s.delivery.freeDeliveryMin);
        const deliveryCharge = free ? 0 : zone.charge;
        const total = round2(subtotal - discount + deliveryCharge);
        const itemsCost = round2(g.lines.reduce((a, l) => a + l.v.product.costPerUnit * l.v.unitAmount * l.qty, 0));
        const orderNo = await nextOrderNo(tx);
        const isPre = g.type === "PREORDER";

        const order = await tx.order.create({
          data: {
            orderNo,
            checkoutGroup: groupList.length > 1 ? checkoutGroup : null,
            type: g.type,
            source: input.source,
            customerId: customer.id,
            name,
            phone,
            email,
            zoneId: zone.id,
            zoneName: zone.nameBn ? `${zone.nameBn} · ${zone.nameEn}` : zone.nameEn,
            addressLine: input.addressLine.trim(),
            landmark: input.landmark.trim(),
            lat: input.lat,
            lng: input.lng,
            deliveryDate: g.date,
            deliverySlot: input.deliverySlot,
            customerNote: input.note.trim(),
            internalNote: input.internalNote ?? "",
            subtotal,
            discount,
            couponCode,
            deliveryCharge,
            total,
            itemsCost,
            deliveryCost: zone.riderCost,
            stockDeducted: !isPre,
            items: {
              create: g.lines.map((l) => ({
                productId: l.v.productId,
                variantId: l.v.id,
                nameEn: l.v.product.nameEn,
                nameBn: l.v.product.nameBn,
                variantLabel: `${l.v.labelBn} · ${l.v.labelEn}`,
                unitAmount: l.v.unitAmount,
                qty: l.qty,
                unitPrice: l.v.price,
                unitCost: round2(l.v.product.costPerUnit * l.v.unitAmount),
                lineTotal: lineTotal(l),
                isPreorder: isPre,
              })),
            },
            events: {
              create: {
                status: "PENDING",
                note: `${isPre ? "Pre-order" : "Order"} placed via ${input.source.toLowerCase()}${groupList.length > 1 ? ` (split delivery ${gi + 1}/${groupList.length})` : ""}`,
                by: input.by ?? "customer",
              },
            },
          },
        });

        // stock / pre-order reservations
        const perProduct = new Map<string, number>();
        for (const l of g.lines) perProduct.set(l.v.productId, (perProduct.get(l.v.productId) ?? 0) + l.v.unitAmount * l.qty);
        for (const [pid, qty] of perProduct) {
          if (isPre) {
            await tx.product.update({ where: { id: pid }, data: { preorderBooked: { increment: round3(qty) } } });
          } else {
            const p = await tx.product.update({ where: { id: pid }, data: { stockQty: { decrement: round3(qty) } } });
            await tx.stockMovement.create({ data: { productId: pid, change: -round3(qty), reason: "ORDER", unitCost: p.costPerUnit, refId: order.id, note: orderNo } });
          }
        }
        placed.push({ id: order.id, orderNo, type: g.type, total, deliveryDate: g.date });
      }

      if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });

      // remember address
      const addr = input.addressLine.trim();
      const known = await tx.address.findFirst({ where: { customerId: customer.id, line: addr } });
      if (!known) {
        const count = await tx.address.count({ where: { customerId: customer.id } });
        await tx.address.create({
          data: { customerId: customer.id, line: addr, landmark: input.landmark.trim(), zoneId: zone.id, lat: input.lat, lng: input.lng, isDefault: count === 0 },
        });
      }
      return { placed, customerId: customer.id, accountCreated };
    });

    await refreshCustomerStats(result.customerId);
    for (const o of result.placed) background(notifyOrderPlaced(o.id));
    if (input.source === "WEB") background(notifyAdminNewOrders(result.placed.map((o) => o.id)));
    return { ok: true, orders: result.placed, customerId: result.customerId, accountCreated: result.accountCreated };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("STOCK:")) return { ok: false, changed: true, error: `${msg.slice(6)} — এইমাত্র স্টক শেষ হয়ে গেছে · just sold out` };
    console.error("[placeOrder]", e);
    return { ok: false, error: "অর্ডার নেওয়া যায়নি, আবার চেষ্টা করুন · Could not place order, please try again" };
  }
}

export async function refreshCustomerStats(customerId: string) {
  const [all, delivered] = await Promise.all([
    db.order.aggregate({
      where: { customerId, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _count: { _all: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
    db.order.aggregate({ where: { customerId, status: "DELIVERED" }, _sum: { total: true } }),
  ]);
  await db.customer.update({
    where: { id: customerId },
    data: {
      totalOrders: all._count._all,
      totalSpent: round2(delivered._sum.total ?? 0),
      firstOrderAt: all._min.createdAt,
      lastOrderAt: all._max.createdAt,
    },
  });
}

type FullOrder = Prisma.OrderGetPayload<{ include: { items: { include: { variant: true } } } }>;

/** Takes stock for pre-orders when they are packed (harvest is in by then). Returns the updated cost of goods. */
async function takeStockForOrder(tx: Tx, order: FullOrder, by: string) {
  const perProduct = new Map<string, number>();
  for (const i of order.items) if (i.productId) perProduct.set(i.productId, (perProduct.get(i.productId) ?? 0) + i.unitAmount * i.qty);
  for (const [pid, need] of perProduct) {
    const p = await tx.product.findUniqueOrThrow({ where: { id: pid } });
    if (p.stockQty + 1e-9 < need)
      throw new Error(`Not enough ${p.nameEn} in stock (need ${round3(need)} ${p.stockUnit}, have ${round3(p.stockQty)}). Record the harvest in Farm → Production first.`);
    await tx.product.update({
      where: { id: pid },
      data: { stockQty: { decrement: round3(need) }, preorderBooked: round3(Math.max(0, p.preorderBooked - need)) },
    });
    await tx.stockMovement.create({ data: { productId: pid, change: -round3(need), reason: "PREORDER_FULFIL", unitCost: p.costPerUnit, refId: order.id, note: order.orderNo, by } });
  }
  // re-cost items at today's production cost
  let itemsCost = 0;
  for (const i of order.items) {
    if (!i.productId) continue;
    const p = await tx.product.findUniqueOrThrow({ where: { id: i.productId } });
    const unitCost = round2(p.costPerUnit * i.unitAmount);
    itemsCost += unitCost * i.qty;
    await tx.orderItem.update({ where: { id: i.id }, data: { unitCost } });
  }
  return round2(itemsCost);
}

async function consumePackaging(tx: Tx, order: FullOrder) {
  let cost = 0;
  for (const i of order.items) {
    const v = i.variant;
    if (!v?.packagingItemId) continue;
    cost += await consumeSupply(tx, { supplyItemId: v.packagingItemId, qty: v.packagingQty * i.qty, reason: "PACKAGING", orderId: order.id, note: order.orderNo });
  }
  return round2(cost);
}

export async function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  opts: { by: string; note?: string; cancelReason?: string; restock?: boolean; notify?: boolean } = { by: "admin" },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { include: { variant: true } } } });
  if (!order) return { ok: false, error: "Order not found" };
  const from = order.status as OrderStatus;
  if (from === to) return { ok: true };
  if (!NEXT_STATUS[from]?.includes(to)) return { ok: false, error: `Can't move an order from ${from} to ${to}` };
  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { status: to };
      if (to === "CONFIRMED") data.confirmedAt = now;
      if (to === "PROCESSING" || to === "OUT_FOR_DELIVERY" || to === "DELIVERED") {
        if (!order.confirmedAt) data.confirmedAt = now;
        if (!order.stockDeducted) {
          data.itemsCost = await takeStockForOrder(tx, order, opts.by);
          data.stockDeducted = true;
        }
        if (!order.packed) {
          data.packagingCost = round2(order.packagingCost + (await consumePackaging(tx, order)));
          data.packed = true;
        }
      }
      if (to === "DELIVERED") {
        data.deliveredAt = now;
        data.paymentStatus = "PAID";
        data.paidAt = now;
        data.collectedAmount = order.collectedAmount > 0 ? order.collectedAmount : order.total;
      }
      if (to === "CANCELLED") {
        data.cancelledAt = now;
        data.cancelReason = opts.cancelReason ?? "";
        if (from !== "OUT_FOR_DELIVERY") data.deliveryCost = 0;
        const perProduct = new Map<string, number>();
        for (const i of order.items) if (i.productId) perProduct.set(i.productId, (perProduct.get(i.productId) ?? 0) + i.unitAmount * i.qty);
        for (const [pid, qty] of perProduct) {
          if (order.stockDeducted) {
            const p = await tx.product.update({ where: { id: pid }, data: { stockQty: { increment: round3(qty) } } });
            await tx.stockMovement.create({ data: { productId: pid, change: round3(qty), reason: "ORDER_CANCEL", unitCost: p.costPerUnit, refId: order.id, note: order.orderNo, by: opts.by } });
          } else {
            const p = await tx.product.findUniqueOrThrow({ where: { id: pid } });
            await tx.product.update({ where: { id: pid }, data: { preorderBooked: round3(Math.max(0, p.preorderBooked - qty)) } });
          }
        }
        data.stockDeducted = false;
      }
      if (to === "RETURNED") {
        data.returnedAt = now;
        data.paymentStatus = "UNPAID";
        data.collectedAmount = 0;
        if (opts.restock) {
          for (const i of order.items) {
            if (!i.productId) continue;
            const p = await tx.product.update({ where: { id: i.productId }, data: { stockQty: { increment: round3(i.unitAmount * i.qty) } } });
            await tx.stockMovement.create({
              data: { productId: i.productId, change: round3(i.unitAmount * i.qty), reason: "RETURN", unitCost: p.costPerUnit, refId: order.id, note: order.orderNo, by: opts.by },
            });
          }
          data.itemsCost = 0; // nothing lost — mushrooms went back to stock
        }
      }
      await tx.order.update({ where: { id: order.id }, data });
      await tx.orderEvent.create({
        data: { orderId: order.id, status: to, note: [opts.note, opts.cancelReason, to === "RETURNED" ? (opts.restock ? "Items restocked" : "Items not restocked (counted as loss)") : ""].filter(Boolean).join(" · "), by: opts.by },
      });
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  await refreshCustomerStats(order.customerId);
  if (opts.notify !== false) background(notifyOrderStatus(order.id, to));
  return { ok: true };
}

/**
 * Permanently deletes an order and reverses everything it did:
 * stock taken → put back, pre-order booking → released, packaging used → returned to supplies, coupon use → freed.
 */
export async function deleteOrder(orderId: string, by: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  await db.$transaction(async (tx) => {
    const perProduct = new Map<string, number>();
    for (const i of order.items) if (i.productId) perProduct.set(i.productId, (perProduct.get(i.productId) ?? 0) + i.unitAmount * i.qty);
    const open = order.status !== "CANCELLED" && order.status !== "RETURNED";
    for (const [pid, qty] of perProduct) {
      const p = await tx.product.findUnique({ where: { id: pid } });
      if (!p) continue;
      if (open && order.stockDeducted) {
        await tx.product.update({ where: { id: pid }, data: { stockQty: { increment: round3(qty) } } });
        await tx.stockMovement.create({ data: { productId: pid, change: round3(qty), reason: "ADJUST", unitCost: p.costPerUnit, note: `Order ${order.orderNo} deleted`, by } });
      } else if (open && !order.stockDeducted && order.type === "PREORDER") {
        await tx.product.update({ where: { id: pid }, data: { preorderBooked: round3(Math.max(0, p.preorderBooked - qty)) } });
      }
    }
    const usages = await tx.supplyUsage.findMany({ where: { orderId: order.id } });
    for (const u of usages) await tx.supplyItem.update({ where: { id: u.supplyItemId }, data: { stockQty: { increment: u.qty } } });
    await tx.supplyUsage.deleteMany({ where: { orderId: order.id } });
    if (order.couponCode) {
      const c = await tx.coupon.findUnique({ where: { code: order.couponCode } });
      if (c && c.usedCount > 0) await tx.coupon.update({ where: { id: c.id }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.order.delete({ where: { id: order.id } });
  });
  await refreshCustomerStats(order.customerId).catch(() => {});
}
