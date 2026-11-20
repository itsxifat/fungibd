import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/dates";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: { default: "Admin", template: "%s · FungiBd Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const tomorrow = addDays(startOfDay(), 1);
  const [pending, tickets, followUps, products, preorders] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.ticket.count({ where: { status: "OPEN" } }),
    db.lead.count({ where: { nextFollowUp: { lt: tomorrow }, status: { notIn: ["WON", "LOST"] } } }),
    db.product.findMany({ where: { isActive: true }, select: { stockQty: true, lowStockAt: true, preorderEnabled: true, preorderMode: true } }),
    db.order.count({ where: { type: "PREORDER", status: { in: ["PENDING", "CONFIRMED"] } } }),
  ]);
  const lowStock = products.filter((p) => !(p.preorderEnabled && p.preorderMode === "ALWAYS") && p.stockQty <= p.lowStockAt).length;
  return (
    <AdminShell user={{ name: admin.name, email: admin.email, role: admin.role }} counts={{ pending, tickets, followUps, lowStock, preorders }}>
      {children}
    </AdminShell>
  );
}
