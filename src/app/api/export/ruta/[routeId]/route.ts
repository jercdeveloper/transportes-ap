import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tableToPdfBuffer, pdfResponse } from "@/lib/pdf";

const HEADERS = ["#", "Alumno", "Dirección", "Teléfono padre/madre"];

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/export/ruta/[routeId]">
) {
  await getSessionProfile();
  const { routeId } = await ctx.params;
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("name")
    .eq("id", routeId)
    .maybeSingle();

  if (!route) notFound();

  const { data: assignments } = await supabase
    .from("student_route_assignment")
    .select("stop_order, students(full_name, address_label, profiles(phone))")
    .eq("route_id", routeId)
    .order("stop_order");

  const rows = (assignments ?? []).map((a) => [
    a.stop_order,
    a.students?.full_name,
    a.students?.address_label,
    a.students?.profiles?.phone,
  ]);

  const buffer = await tableToPdfBuffer(`Hoja de ruta — ${route.name}`, HEADERS, rows);
  return pdfResponse(`ruta-${route.name}.pdf`, buffer);
}
