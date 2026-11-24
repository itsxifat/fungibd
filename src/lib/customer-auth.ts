import "server-only";
import { db } from "./db";

export function safeCustomerNext(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u0020]/.test(next)) return "/account";
  const url = new URL(next, "https://store.invalid");
  if (/^\/(?:admin|api|account\/google)(?:\/|$)/i.test(url.pathname)) return "/account";
  return `${url.pathname}${url.search}${url.hash}`;
}

type GoogleCustomer = { subject: string; email: string; name: string };
type GoogleCustomerResult = { id: string } | { error: "link" | "error" };

export function signInGoogleCustomer(identity: GoogleCustomer, linkId?: string): Promise<GoogleCustomerResult> {
  return db.$transaction(async (tx) => {
    const linked = await tx.customer.findUnique({
      where: { googleSubject: identity.subject },
      select: { id: true, hasAccount: true },
    });
    if (linked) {
      return linked.hasAccount && (!linkId || linked.id === linkId) ? { id: linked.id } : { error: "error" };
    }

    if (linkId) {
      const customer = await tx.customer.findUnique({ where: { id: linkId }, select: { email: true, hasAccount: true, googleSubject: true } });
      if (!customer?.hasAccount || customer.googleSubject || customer.email?.toLowerCase() !== identity.email) return { error: "error" };
      await tx.customer.update({ where: { id: linkId }, data: { googleSubject: identity.subject } });
      return { id: linkId };
    }

    const existing = await tx.customer.findFirst({ where: { email: identity.email, hasAccount: true }, select: { id: true } });
    if (existing) return { error: "link" };

    // A Google sign-in proves the Google account, so leave guest records and their orders untouched.
    return tx.customer.create({
      data: { name: identity.name, email: identity.email, googleSubject: identity.subject, hasAccount: true, marketingOptIn: false },
      select: { id: true },
    });
  });
}
