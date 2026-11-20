import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { Badge, Card, Empty, PageHeader, TableWrap } from "@/components/admin/ui";
import { reviewModerateAction } from "../marketing/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  await requireAdmin(["OWNER", "MANAGER"]);
  const reviews = await db.review.findMany({ orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }], include: { product: true }, take: 200 });
  const Btn = ({ id, op, label }: { id: string; op: string; label: string }) => (
    <form action={reviewModerateAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button className={`btn btn-sm rounded-lg ${op === "approve" ? "btn-primary" : "btn-outline"}`}>{label}</button>
    </form>
  );
  return (
    <>
      <PageHeader title="Reviews" description="Customers get a review link by email after delivery. Approve reviews to show them on the website." />
      <Card pad={false}>
        {reviews.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Review</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-md">
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={i < r.rating ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-stone-300"} />
                        ))}
                      </span>
                      <p className="mt-1">{r.comment || <span className="text-stone-400">No comment</span>}</p>
                      <p className="text-xs text-stone-500">
                        {r.name} · {r.orderNo || "—"} · {fmtDate(r.createdAt)}
                      </p>
                    </td>
                    <td>{r.product.nameEn}</td>
                    <td>{r.isApproved ? <Badge tone="green">On website</Badge> : <Badge tone="amber">Waiting</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {r.isApproved ? <Btn id={r.id} op="hide" label="Hide" /> : <Btn id={r.id} op="approve" label="Approve" />}
                        <DeleteButton type="review" id={r.id} title="Delete this review?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No reviews yet">After an order is delivered the customer receives an email with a review link.</Empty>
        )}
      </Card>
    </>
  );
}
