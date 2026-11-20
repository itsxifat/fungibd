"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseDateKey, parseLocalDateTime } from "@/lib/dates";
import { boolField, normalizePhone, numField, str } from "@/lib/utils";
import { background, notifyTicketReply } from "@/lib/email/notify";
import type { ActionState } from "@/components/admin/client";

// ───── Activities (calls, WhatsApp, notes, follow-ups) ─────
export async function addActivityAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const summary = str(fd, "summary");
  if (!summary) return { error: "Write what happened" };
  const customerId = str(fd, "customerId") || null;
  const leadId = str(fd, "leadId") || null;
  const followUpAt = parseLocalDateTime(str(fd, "followUpAt")) ?? parseDateKey(str(fd, "followUpAt"));
  await db.activity.create({ data: { customerId, leadId, type: str(fd, "type") || "NOTE", summary, followUpAt, by: a.name } });
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    await db.lead.update({ where: { id: leadId }, data: { nextFollowUp: followUpAt ?? lead?.nextFollowUp ?? null, status: lead?.status === "NEW" ? "CONTACTED" : lead?.status } });
  }
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
  if (leadId) revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true, message: "Logged" };
}

export async function doneActivityAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const act = await db.activity.update({ where: { id }, data: { done: true } });
  if (act.customerId) revalidatePath(`/admin/customers/${act.customerId}`);
  if (act.leadId) revalidatePath(`/admin/leads/${act.leadId}`);
  revalidatePath("/admin/customers");
}

// ───── Customers ─────
export async function updateCustomerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const email = str(fd, "email").toLowerCase();
  await db.customer.update({
    where: { id },
    data: {
      name: str(fd, "name"),
      email: email || null,
      tags: str(fd, "tags")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .join(","),
      notes: str(fd, "notes"),
      marketingOptIn: boolField(fd, "marketingOptIn"),
    },
  });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true, message: "Customer saved" };
}

// ───── Leads ─────
export async function leadAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const data = {
    name,
    phone: normalizePhone(str(fd, "phone")) ?? str(fd, "phone"),
    email: str(fd, "email").toLowerCase(),
    company: str(fd, "company"),
    type: str(fd, "type") || "RETAIL",
    source: str(fd, "source") || "OTHER",
    status: str(fd, "status") || "NEW",
    estValue: numField(fd, "estValue", 0),
    interest: str(fd, "interest"),
    message: str(fd, "message"),
    nextFollowUp: parseDateKey(str(fd, "nextFollowUp")),
    assignedTo: str(fd, "assignedTo") || a.name,
    lostReason: str(fd, "lostReason"),
  };
  if (id) {
    await db.lead.update({ where: { id }, data });
    revalidatePath(`/admin/leads/${id}`);
    revalidatePath("/admin/leads");
    return { ok: true, message: "Lead saved" };
  }
  const lead = await db.lead.create({ data });
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${lead.id}`);
}

export async function leadStatusAction(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  await db.lead.update({ where: { id }, data: { status } });
  await db.activity.create({ data: { leadId: id, type: "NOTE", summary: `Moved to ${status.toLowerCase()}`, by: a.name } });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function convertLeadAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const lead = await db.lead.findUniqueOrThrow({ where: { id } });
  const phone = normalizePhone(lead.phone);
  if (!phone) redirect(`/admin/leads/${id}?error=${encodeURIComponent("Add a valid mobile number first")}`);
  const customer = await db.customer.upsert({
    where: { phone },
    create: { name: lead.company || lead.name, phone, email: lead.email || null, source: "LEAD", tags: lead.type.toLowerCase(), notes: lead.interest },
    update: {},
  });
  await db.lead.update({ where: { id }, data: { customerId: customer.id, status: "WON" } });
  redirect(`/admin/customers/${customer.id}`);
}

// ───── Support ─────
export async function ticketReplyAdminAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const body = str(fd, "body");
  if (!body) return { error: "Write a reply" };
  const internal = boolField(fd, "internal");
  await db.ticketMessage.create({ data: { ticketId: id, from: "STAFF", authorName: a.name, body, isInternal: internal } });
  const status = str(fd, "status");
  await db.ticket.update({ where: { id }, data: { status: status || (internal ? undefined : "PENDING"), assignedTo: a.name } });
  if (!internal) background(notifyTicketReply(id, body, a.name.split(" ")[0]));
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/admin/support");
  return { ok: true, message: internal ? "Internal note added" : "Reply sent to the customer by email" };
}

export async function ticketUpdateAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  await db.ticket.update({ where: { id }, data: { status: str(fd, "status"), priority: str(fd, "priority"), category: str(fd, "category"), assignedTo: str(fd, "assignedTo") } });
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/admin/support");
  return { ok: true, message: "Ticket updated" };
}
