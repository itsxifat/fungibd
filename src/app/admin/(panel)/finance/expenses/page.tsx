import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EXPENSE_CATEGORIES, PAY_METHODS } from "@/lib/constants";
import { addDays, dateKey, fmtDate, parseDateKey, resolveRange } from "@/lib/dates";
import { numField, round2, str, taka } from "@/lib/utils";
import { Card, PageHeader, RangeTabs, TableWrap } from "@/components/admin/ui";
import { ActionForm, Drawer, Submit, type ActionState } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { RankBars } from "@/components/admin/charts";

export const metadata = { title: "Expenses" };

async function addExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  "use server";
  await requireAdmin(["OWNER", "MANAGER"]);
  const amount = numField(fd, "amount", 0);
  if (amount <= 0) return { error: "Enter an amount" };
  await db.expense.create({
    data: { category: str(fd, "category") || "OTHER", amount: round2(amount), date: parseDateKey(str(fd, "date")) ?? new Date(), paidTo: str(fd, "paidTo"), method: str(fd, "method") || "CASH", note: str(fd, "note") },
  });
  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/finance");
  return { ok: true, message: "Expense added" };
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string; cat?: string }> }) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const sp = await searchParams;
  const r = resolveRange(sp, "month");
  const where: Prisma.ExpenseWhereInput = { date: { gte: r.from, lt: r.to }, ...(sp.cat ? { category: sp.cat } : {}) };
  const [list, byCat] = await Promise.all([
    db.expense.findMany({ where, orderBy: { date: "desc" } }),
    db.expense.groupBy({ by: ["category"], where: { date: { gte: r.from, lt: r.to } }, _sum: { amount: true } }),
  ]);
  const total = list.reduce((a, e) => a + e.amount, 0);
  const q = new URLSearchParams(Object.entries({ ...sp, type: "expenses" }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Expenses"
        description={`Running costs: rent, salaries, utilities, marketing… · ${r.label}: ${taka(total)}`}
        actions={
          <>
            <RangeTabs base="/admin/finance/expenses" current={r.key} params={{ cat: sp.cat }} from={sp.from} to={sp.to} />
            <a href={`/api/admin/export?${q}`} className="btn btn-outline btn-sm rounded-lg">
              <Download className="h-4 w-4" /> CSV
            </a>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Drawer label="Add expense" title="Add an expense" description="Rent, salaries, electricity, transport, marketing…">
            <ActionForm action={addExpense} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Category</span>
                <select name="category" className="input input-sm">
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Amount (৳)</span>
                <input name="amount" type="number" step="0.01" className="input input-sm" required />
              </label>
              <label className="block">
                <span className="label">Date</span>
                <input name="date" type="date" defaultValue={dateKey(new Date())} className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Paid to</span>
                <input name="paidTo" className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Paid by</span>
                <select name="method" className="input input-sm">
                  {Object.entries(PAY_METHODS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Note</span>
                <input name="note" className="input input-sm" />
              </label>
              <div className="sm:col-span-2">
                <Submit>Add expense</Submit>
              </div>
            </ActionForm>
          </Drawer>
          <Card title={`Expenses · ${list.length}`} pad={false}>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Paid to</th>
                    <th>Note</th>
                    <th className="num">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id}>
                      <td>{fmtDate(e.date)}</td>
                      <td>{EXPENSE_CATEGORIES[e.category as keyof typeof EXPENSE_CATEGORIES] ?? e.category}</td>
                      <td>
                        {e.paidTo}
                        <span className="block text-xs text-stone-500">{PAY_METHODS[e.method as keyof typeof PAY_METHODS] ?? e.method}</span>
                      </td>
                      <td className="text-xs text-stone-500">{e.note}</td>
                      <td className="num font-medium">{taka(e.amount)}</td>
                      <td>
                        <DeleteButton type="expense" id={e.id} title="Delete this expense?" description={`${taka(e.amount)} · ${EXPENSE_CATEGORIES[e.category as keyof typeof EXPENSE_CATEGORIES] ?? e.category}`} />
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr>
                      <td colSpan={6} className="text-center text-stone-500">
                        No expenses in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
        <Card title="By category">
          <RankBars rows={byCat.map((c) => ({ label: EXPENSE_CATEGORIES[c.category as keyof typeof EXPENSE_CATEGORIES] ?? c.category, value: c._sum.amount ?? 0 })).sort((a, b) => b.value - a.value)} />
          <p className="mt-4 border-t border-stone-100 pt-3 text-sm font-semibold">Total {taka(byCat.reduce((a, c) => a + (c._sum.amount ?? 0), 0))}</p>
          <p className="mt-1 text-xs text-stone-500">{fmtDate(r.from)} – {fmtDate(addDays(r.to, -1))}</p>
        </Card>
      </div>
    </>
  );
}
