import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { receiptToPdfBuffer, pdfResponse } from "@/lib/pdf";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/export/recibo/[paymentId]">
) {
  await getSessionProfile();
  const { paymentId } = await ctx.params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "period, amount, late_fee, status, paid_at, students(full_name, profiles(full_name))"
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.status !== "pagado") notFound();

  const buffer = await receiptToPdfBuffer({
    studentName: payment.students?.full_name ?? "—",
    parentName: payment.students?.profiles?.full_name ?? "—",
    period: payment.period,
    amount: payment.amount,
    lateFee: payment.late_fee,
    paidAt: payment.paid_at,
  });

  return pdfResponse(`recibo-${payment.period}.pdf`, buffer);
}
