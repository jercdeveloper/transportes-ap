import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = ["Fecha", "Usuario", "Acción", "Entidad", "Detalle"];

export async function GET(request: Request) {
  await requireRole("admin");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { data: entries } = await supabase
    .from("audit_log")
    .select("created_at, actor_name, action, entity_type, entity_label")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (entries ?? []).map((e) => [
    new Date(e.created_at).toLocaleString("es-CO"),
    e.actor_name,
    e.action,
    e.entity_type,
    e.entity_label,
  ]);

  if (format === "pdf") {
    const buffer = await tableToPdfBuffer("Bitácora de auditoría — Transportes AP", HEADERS, rows);
    return pdfResponse("auditoria.pdf", buffer);
  }

  const csv = toCsv(HEADERS, rows);
  return csvResponse("auditoria.csv", csv);
}
