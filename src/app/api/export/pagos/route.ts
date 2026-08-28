import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = ["Alumno", "Periodo", "Monto", "Recargo", "Estado", "Fecha de pago"];

export async function GET(request: Request) {
  await requireRole("admin");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? new Date().toISOString().slice(0, 7);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { data: payments } = await supabase
    .from("payments")
    .select("period, amount, late_fee, status, paid_at, students(full_name)")
    .eq("period", period);

  const rows = (payments ?? []).map((p) => [
    p.students?.full_name,
    p.period,
    p.amount,
    p.late_fee,
    p.status,
    p.paid_at,
  ]);

  if (format === "pdf") {
    const buffer = await tableToPdfBuffer(
      `Pagos ${period}`,
      HEADERS,
      rows
    );
    return pdfResponse(`pagos-${period}.pdf`, buffer);
  }

  const csv = toCsv(HEADERS, rows);
  return csvResponse(`pagos-${period}.csv`, csv);
}
