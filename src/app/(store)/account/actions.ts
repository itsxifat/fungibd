"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkPassword, endCustomerSession, getCustomer, hashPassword, startCustomerSession } from "@/lib/auth";
import { safeCustomerNext } from "@/lib/customer-auth";
import { randomToken, rateLimit } from "@/lib/security";
import { normalizePhone, str } from "@/lib/utils";
import { background, sendPasswordReset, sendWelcome } from "@/lib/email/notify";
import type { FormState } from "../actions";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit("register", 5, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const name = str(fd, "name");
  const phone = normalizePhone(str(fd, "phone"));
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (name.length < 2) return { error: "নাম লিখুন · Enter your name" };
  if (!phone) return { error: "সঠিক মোবাইল নম্বর দিন · Enter a valid mobile number" };
  if (!isEmail(email)) return { error: "সঠিক ইমেইল দিন · Enter a valid email" };
  if (password.length < 6) return { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের · Password must be at least 6 characters" };
  const existing = await db.customer.findUnique({ where: { phone } });
  if (existing?.hasAccount) return { error: "এই নম্বরে আগেই অ্যাকাউন্ট আছে — লগইন করুন · Account exists, please log in" };
  const emailTaken = await db.customer.findFirst({ where: { email, hasAccount: true } });
  if (emailTaken) return { error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে · Email already registered" };
  const passwordHash = await hashPassword(password);
  const c = existing
    ? await db.customer.update({ where: { id: existing.id }, data: { name, email, passwordHash, hasAccount: true } })
    : await db.customer.create({ data: { name, phone, email, passwordHash, hasAccount: true, source: "WEB" } });
  await startCustomerSession(c.id);
  background(sendWelcome(c));
  redirect("/account");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const id = str(fd, "id").toLowerCase();
  const password = str(fd, "password");
  const phone = id.includes("@") ? null : normalizePhone(id);
  const c = phone ? await db.customer.findUnique({ where: { phone } }) : await db.customer.findFirst({ where: { email: id, hasAccount: true } });
  if (!c || !c.hasAccount || !c.passwordHash || !(await checkPassword(password, c.passwordHash))) return { error: "মোবাইল/ইমেইল বা পাসওয়ার্ড ভুল · Wrong login details" };
  await startCustomerSession(c.id);
  redirect(safeCustomerNext(str(fd, "next")));
}

export async function logoutAction() {
  await endCustomerSession();
  redirect("/");
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit("forgot", 5, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const email = str(fd, "email").toLowerCase();
  const c = await db.customer.findFirst({ where: { email, hasAccount: true, passwordHash: { not: null } } });
  if (c?.email) {
    const token = randomToken();
    await db.customer.update({ where: { id: c.id }, data: { resetToken: token, resetTokenExp: new Date(Date.now() + 3600_000) } });
    background(sendPasswordReset({ name: c.name, email: c.email }, token));
  }
  return { ok: true, message: "পাসওয়ার্ড সেট করা থাকলে রিসেট লিংক পাঠানো হবে। · A reset link will be sent if you have a password. For a Google-only account, sign in with Google." };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  if (password.length < 6) return { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের" };
  const c = await db.customer.findFirst({ where: { resetToken: token, resetTokenExp: { gt: new Date() }, hasAccount: true, passwordHash: { not: null } } });
  if (!c) return { error: "লিংকের মেয়াদ শেষ — আবার চেষ্টা করুন · Link expired" };
  await db.customer.update({ where: { id: c.id }, data: { passwordHash: await hashPassword(password), resetToken: null, resetTokenExp: null } });
  await startCustomerSession(c.id);
  redirect("/account");
}

export async function profileAction(_: FormState, fd: FormData): Promise<FormState> {
  const c = await getCustomer();
  if (!c) redirect("/account/login");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  if (name.length < 2 || !isEmail(email)) return { error: "নাম ও সঠিক ইমেইল দিন" };
  const pw = str(fd, "password");
  if (pw && pw.length < 6) return { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের" };
  if (email !== c.email && await db.customer.findFirst({ where: { email, hasAccount: true, id: { not: c.id } }, select: { id: true } })) {
    return { error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে · Email already registered" };
  }
  await db.customer.update({
    where: { id: c.id },
    data: {
      name, email, marketingOptIn: fd.get("marketing") === "on",
      ...(pw ? { passwordHash: await hashPassword(pw) } : {}),
      ...(pw || email !== c.email ? { resetToken: null, resetTokenExp: null } : {}),
    },
  });
  revalidatePath("/account");
  return { ok: true, message: "সেভ হয়েছে · Saved" };
}

export async function deleteAddressAction(fd: FormData) {
  const c = await getCustomer();
  if (!c) return;
  await db.address.deleteMany({ where: { id: str(fd, "id"), customerId: c.id } });
  revalidatePath("/account");
}
