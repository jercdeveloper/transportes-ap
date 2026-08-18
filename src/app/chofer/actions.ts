"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser, notifyAdmins } from "@/lib/push";
import type { TripEventType } from "@/lib/supabase/types";

async function assertOwnsRoute(routeId: string) {
  const profile = await requireRole("chofer");
  const supabase = await createClient();
  const { data: route } = await supabase
    .from("routes")
    .select("id, name, driver_id")
    .eq("id", routeId)
    .single();

  if (!route || route.driver_id !== profile.id) {
    throw new Error("No autorizado para esta ruta.");
  }
  return { supabase, route, profile };
}

export async function startTrip(routeId: string, formData: FormData) {
  const { supabase, route } = await assertOwnsRoute(routeId);

  const { error } = await supabase.from("trips").insert({
    route_id: routeId,
    status: "active",
    started_at: new Date().toISOString(),
    checklist_tires: formData.get("checklist_tires") === "on",
    checklist_brakes: formData.get("checklist_brakes") === "on",
    checklist_lights: formData.get("checklist_lights") === "on",
    checklist_seatbelts: formData.get("checklist_seatbelts") === "on",
    checklist_notes: String(formData.get("checklist_notes") ?? "").trim() || null,
  });
  if (error) throw new Error("No se pudo iniciar el viaje: " + error.message);

  const { data: assignments } = await supabase
    .from("student_route_assignment")
    .select("students(parent_id)")
    .eq("route_id", routeId);

  const parentIds = [
    ...new Set(
      (assignments ?? [])
        .map((a) => a.students?.parent_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  await Promise.all(
    parentIds.map((parentId) =>
      sendPushToUser(
        parentId,
        {
          title: "🚐 El bus está en camino",
          body: `La ruta "${route.name}" inició su recorrido.`,
          url: "/padre",
        },
        "trip_start"
      )
    )
  );

  revalidatePath("/chofer");
}

export async function endTrip(tripId: string, routeId: string) {
  const { supabase } = await assertOwnsRoute(routeId);

  const { error } = await supabase
    .from("trips")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", tripId);
  if (error) throw new Error("No se pudo finalizar el viaje: " + error.message);

  revalidatePath("/chofer");
}

export async function reportIncident(
  routeId: string,
  tripId: string | null,
  formData: FormData
) {
  const { supabase, route, profile } = await assertOwnsRoute(routeId);

  const description = String(formData.get("description") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "") || null;
  const photoUrl = String(formData.get("photo_url") ?? "") || null;

  if (!description) return;

  const { error } = await supabase.from("incidents").insert({
    route_id: routeId,
    trip_id: tripId,
    student_id: studentId,
    reported_by: profile.id,
    description,
    photo_url: photoUrl,
  });
  if (error) throw new Error("No se pudo reportar la incidencia: " + error.message);

  await notifyAdmins({
    title: "⚠️ Nueva incidencia reportada",
    body: `Ruta "${route.name}": ${description}`,
    url: "/admin/incidencias",
  });

  revalidatePath("/chofer");
}

export async function notifyNearStop(routeId: string, studentId: string) {
  const { supabase } = await assertOwnsRoute(routeId);

  const { data: student } = await supabase
    .from("students")
    .select("full_name, parent_id")
    .eq("id", studentId)
    .single();

  if (!student) return;

  await sendPushToUser(
    student.parent_id,
    {
      title: "🚌 El bus está cerca",
      body: `El bus está llegando a la parada de ${student.full_name}.`,
      url: "/padre",
    },
    "trip_start"
  );
}

export async function recordTripEvent(
  tripId: string,
  routeId: string,
  studentId: string,
  eventType: TripEventType
) {
  const { supabase } = await assertOwnsRoute(routeId);

  const { error } = await supabase.from("trip_events").insert({
    trip_id: tripId,
    student_id: studentId,
    event_type: eventType,
  });
  if (error) {
    throw new Error(
      `No se pudo registrar "${eventType === "recogido" ? "recogido" : "entregado"}": ${error.message}`
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("full_name, parent_id")
    .eq("id", studentId)
    .single();

  if (student) {
    await sendPushToUser(
      student.parent_id,
      {
        title: eventType === "recogido" ? "✅ Recogido" : "🏠 Entregado",
        body: `${student.full_name} fue ${eventType} por el chofer.`,
        url: "/padre",
      },
      "pickup_dropoff"
    );
  }

  revalidatePath("/chofer");
}

export async function triggerEmergencyAlert(
  routeId: string,
  tripId: string | null,
  formData: FormData
): Promise<{ error?: string }> {
  const { supabase, route, profile } = await assertOwnsRoute(routeId);

  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;

  const { error } = await supabase.from("emergency_alerts").insert({
    route_id: routeId,
    trip_id: tripId,
    driver_id: profile.id,
    lat: lat != null && !Number.isNaN(lat) ? lat : null,
    lng: lng != null && !Number.isNaN(lng) ? lng : null,
  });

  if (error) {
    // Aun si no se pudo guardar el registro, se intenta avisar de todas
    // formas — en una emergencia real es preferible notificar sin la
    // ubicación exacta que no notificar nada.
    await notifyAdmins({
      title: "🆘 EMERGENCIA — " + route.name,
      body: `${profile.full_name} activó el botón de emergencia (no se pudo guardar el registro).`,
      url: "/admin",
    });
    return { error: "No se pudo guardar la alerta, pero se avisó a administración igualmente." };
  }

  const mapsLink =
    lat != null && lng != null ? ` https://maps.google.com/?q=${lat},${lng}` : "";

  await notifyAdmins({
    title: "🆘 EMERGENCIA — " + route.name,
    body: `${profile.full_name} activó el botón de emergencia.${mapsLink}`,
    url: "/admin",
  });

  return {};
}
