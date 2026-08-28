import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = ["Fecha", "Ruta", "Alumno", "Descripción"];

export async function GET(request: Request) {
  await requireRole("admin");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { data: incidents } = await supabase
    .from("incidents")
    .select("created_at, description, routes(name), students(full_name)")
    .order("created_at", { ascending: false });

  const rows = (incidents ?? []).map((i) => [
    new Date(i.created_at).toLocaleString("es-CO"),
    i.routes?.name,
    i.students?.full_name,
    i.description,
  ]);

  if (format === "pdf") {
    const buffer = await tableToPdfBuffer("Incidencias", HEADERS, rows);
    return pdfResponse("incidencias.pdf", buffer);
  }

  const csv = toCsv(HEADERS, rows);
  return csvResponse("incidencias.csv", csv);
}
