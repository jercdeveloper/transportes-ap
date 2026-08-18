import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = ["Ruta", "Recaudado", "Pendiente"];

export async function GET(request: Request) {
  await requireRole("admin");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? new Date().toISOString().slice(0, 7);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const [{ data: payments }, { data: assignments }, { data: routes }] =
    await Promise.all([
      supabase.from("payments").select("student_id, amount, status").eq("period", period),
      supabase.from("student_route_assignment").select("student_id, route_id"),
      supabase.from("routes").select("id, name"),
    ]);

  const routeByStudent = new Map((assignments ?? []).map((a) => [a.student_id, a.route_id]));
  const routeNameById = new Map((routes ?? []).map((r) => [r.id, r.name]));
  const byRoute = new Map<string, { pagado: number; pendiente: number }>();

  for (const p of payments ?? []) {
    const routeId = routeByStudent.get(p.student_id) ?? "sin-ruta";
    const entry = byRoute.get(routeId) ?? { pagado: 0, pendiente: 0 };
    if (p.status === "pagado") entry.pagado += p.amount;
    else entry.pendiente += p.amount;
    byRoute.set(routeId, entry);
  }

  const rows = [...byRoute.entries()].map(([routeId, totals]) => [
    routeNameById.get(routeId) ?? "Sin ruta asignada",
    totals.pagado,
    totals.pendiente,
  ]);

  if (format === "pdf") {
    const buffer = await tableToPdfBuffer(
      `Reporte financiero ${period} — Transportes AP`,
      HEADERS,
      rows
    );
    return pdfResponse(`reporte-${period}.pdf`, buffer);
  }

  const csv = toCsv(HEADERS, rows);
  return csvResponse(`reporte-${period}.csv`, csv);
}
