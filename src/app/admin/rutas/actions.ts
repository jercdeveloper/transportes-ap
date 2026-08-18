"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

function readVehicleFields(formData: FormData) {
  return {
    vehicle_plate: String(formData.get("vehicle_plate") ?? "").trim() || null,
    vehicle_model: String(formData.get("vehicle_model") ?? "").trim() || null,
    vehicle_capacity: formData.get("vehicle_capacity")
      ? Number(formData.get("vehicle_capacity"))
      : null,
    soat_expiry: String(formData.get("soat_expiry") ?? "") || null,
    tech_inspection_expiry:
      String(formData.get("tech_inspection_expiry") ?? "") || null,
  };
}

export async function createRoute(
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const driverId = String(formData.get("driver_id") ?? "") || null;

  if (!name) return { error: "El nombre de la ruta es obligatorio." };

  const { error } = await supabase.from("routes").insert({
    name,
    driver_id: driverId,
    ...readVehicleFields(formData),
  });

  if (error) return { error: error.message };

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "crear",
    entityType: "ruta",
    entityLabel: name,
  });

  revalidatePath("/admin/rutas");
}

export async function updateRouteDriver(routeId: string, formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();

  const driverId = String(formData.get("driver_id") ?? "") || null;

  const { error } = await supabase
    .from("routes")
    .update({ driver_id: driverId })
    .eq("id", routeId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rutas");
}

export async function updateRoute(
  routeId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const driverId = String(formData.get("driver_id") ?? "") || null;

  if (!name) return { error: "El nombre de la ruta es obligatorio." };

  const { error } = await supabase
    .from("routes")
    .update({
      name,
      driver_id: driverId,
      ...readVehicleFields(formData),
    })
    .eq("id", routeId);

  if (error) return { error: error.message };

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "editar",
    entityType: "ruta",
    entityLabel: name,
  });

  revalidatePath("/admin/rutas");
  revalidatePath(`/admin/rutas/${routeId}`);
}

export async function deleteRoute(routeId: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: route } = await supabase
    .from("routes")
    .select("name")
    .eq("id", routeId)
    .single();

  const { error } = await supabase.from("routes").delete().eq("id", routeId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "eliminar",
    entityType: "ruta",
    entityLabel: route?.name,
  });

  revalidatePath("/admin/rutas");
}

export async function addMaintenanceRecord(routeId: string, formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();

  const type = String(formData.get("type") ?? "").trim();
  if (!type) return;

  const { error } = await supabase.from("maintenance_records").insert({
    route_id: routeId,
    type,
    description: String(formData.get("description") ?? "").trim() || null,
    odometer_km: formData.get("odometer_km") ? Number(formData.get("odometer_km")) : null,
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    performed_at:
      String(formData.get("performed_at") ?? "") || new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/rutas/${routeId}`);
}

export async function deleteMaintenanceRecord(routeId: string, recordId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("maintenance_records").delete().eq("id", recordId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/rutas/${routeId}`);
}
