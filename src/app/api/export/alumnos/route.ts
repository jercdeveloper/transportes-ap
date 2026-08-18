import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = [
  "Nombre",
  "Colegio",
  "Grado",
  "Tipo documento",
  "Número documento",
  "Fecha nacimiento",
  "Tipo de sangre",
  "Dirección",
  "Padre/madre",
  "Teléfono padre/madre",
  "Ruta",
];

export async function GET(request: Request) {
  await requireRole("admin");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const { data: students } = await supabase
    .from("students")
    .select(
      "full_name, school_name, grade, document_type, document_id, birth_date, blood_type, address_label, profiles(full_name, phone), student_route_assignment(routes(name))"
    );

  const rows = (students ?? []).map((s) => [
    s.full_name,
    s.school_name,
    s.grade,
    s.document_type,
    s.document_id,
    s.birth_date,
    s.blood_type,
    s.address_label,
    s.profiles?.full_name,
    s.profiles?.phone,
    s.student_route_assignment?.[0]?.routes?.name,
  ]);

  if (format === "pdf") {
    const buffer = await tableToPdfBuffer("Alumnos — Transportes AP", HEADERS, rows);
    return pdfResponse("alumnos.pdf", buffer);
  }

  const csv = toCsv(HEADERS, rows);
  return csvResponse("alumnos.csv", csv);
}
