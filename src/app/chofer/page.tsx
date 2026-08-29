import Image from "next/image";
import {
  Square,
  CircleCheck,
  House,
  HeartPulse,
  UserX,
  TriangleAlert,
  FileDown,
} from "lucide-react";
import { requireChoferAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  startTrip,
  endTrip,
  recordTripEvent,
  reportIncident,
  notifyNearStop,
  triggerEmergencyAlert,
} from "./actions";
import { LiveLocationBroadcaster } from "@/components/live-location-broadcaster";
import { WhatsappLink } from "@/components/whatsapp-link";
import { IncidentForm } from "./incident-form";
import { StartTripForm } from "./start-trip-form";
import { EmergencyButton } from "./emergency-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

const TRIP_STATUS_LABEL: Record<string, string> = {
  scheduled: "programado",
  active: "en curso",
  completed: "finalizado",
};

export default async function ChoferPage() {
  const profile = await requireChoferAccess();
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("id, name")
    .eq("driver_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!route) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no tienes una ruta asignada. Pide al administrador que te
        asigne una.
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: todaysTrips }, { data: assignments }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, status, started_at, ended_at")
      .eq("route_id", route.id)
      .eq("trip_date", today)
      .order("started_at", { ascending: true }),
    supabase
      .from("student_route_assignment")
      .select(
        "student_id, stop_order, students(full_name, address_label, lat, lng, blood_type, medical_notes, emergency_contact_name, emergency_contact_phone, photo_url, profiles(phone))"
      )
      .eq("route_id", route.id),
  ]);

  const trip = todaysTrips?.[todaysTrips.length - 1] ?? null;

  const studentIds = (assignments ?? []).map((a) => a.student_id);

  const [{ data: events }, { data: absencesToday }] = await Promise.all([
    trip
      ? supabase
          .from("trip_events")
          .select("student_id, event_type")
          .eq("trip_id", trip.id)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? supabase
          .from("absences")
          .select("student_id")
          .eq("absence_date", today)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const lastEventByStudent = new Map<string, string>();
  for (const e of events ?? []) lastEventByStudent.set(e.student_id, e.event_type);

  const absentStudentIds = new Set((absencesToday ?? []).map((a) => a.student_id));

  const sortedAssignments = [...(assignments ?? [])]
    .filter((a) => !absentStudentIds.has(a.student_id))
    .sort((a, b) => a.stop_order - b.stop_order);

  const absentAssignments = (assignments ?? []).filter((a) =>
    absentStudentIds.has(a.student_id)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-semibold">{route.name}</h1>
            {trip && (
              <StatusBadge tone={trip.status === "active" ? "success" : "neutral"}>
                {TRIP_STATUS_LABEL[trip.status]}
              </StatusBadge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<a href={`/api/export/ruta/${route.id}`} />}
          >
            <FileDown /> Hoja de ruta (PDF) — respaldo sin conexión
          </Button>

          {todaysTrips && todaysTrips.length > 0 && (
            <ul className="space-y-0.5">
              {todaysTrips.map((t, i) => (
                <li key={t.id} className="text-xs text-muted-foreground">
                  Viaje {i + 1}
                  {t.started_at
                    ? ` · ${new Date(t.started_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
                    : ""}{" "}
                  · {TRIP_STATUS_LABEL[t.status]}
                </li>
              ))}
            </ul>
          )}

          {!trip || trip.status === "completed" ? (
            <StartTripForm action={startTrip.bind(null, route.id)} />
          ) : (
            <form action={endTrip.bind(null, trip.id, route.id)}>
              <Button type="submit" variant="outline" size="lg" className="w-full">
                <Square /> Finalizar viaje
              </Button>
            </form>
          )}

          <EmergencyButton
            action={triggerEmergencyAlert.bind(null, route.id, trip?.id ?? null)}
          />

          {trip && (
            <LiveLocationBroadcaster
              tripId={trip.id}
              active={trip.status === "active"}
              stops={sortedAssignments
                .filter((a) => a.students?.lat != null && a.students?.lng != null)
                .map((a) => ({
                  studentId: a.student_id,
                  lat: a.students!.lat!,
                  lng: a.students!.lng!,
                }))}
              onNearStop={notifyNearStop.bind(null, route.id)}
            />
          )}
        </CardContent>
      </Card>

      {absentAssignments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-800">
              <UserX className="size-4" />
              Ausentes hoy
            </p>
            <ul className="space-y-0.5">
              {absentAssignments.map((a) => (
                <li key={a.student_id} className="text-sm text-amber-700">
                  {a.students?.full_name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sortedAssignments.map((a) => {
          const status = lastEventByStudent.get(a.student_id);
          const disabled = !trip || trip.status !== "active";

          return (
            <Card key={a.student_id}>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    {a.students?.photo_url ? (
                      <Image
                        src={a.students.photo_url}
                        alt={a.students.full_name}
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : null}
                    <p className="font-medium">{a.students?.full_name}</p>
                    {status && (
                      <StatusBadge tone="success">{status}</StatusBadge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Parada {a.stop_order}: {a.students?.address_label}
                  </p>
                  {(a.students?.blood_type || a.students?.medical_notes) && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-amber-700">
                      <HeartPulse className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {a.students?.blood_type ? `Sangre: ${a.students.blood_type}` : ""}
                        {a.students?.blood_type && a.students?.medical_notes ? " · " : ""}
                        {a.students?.medical_notes ?? ""}
                      </span>
                    </p>
                  )}
                  {(a.students?.emergency_contact_name ||
                    a.students?.emergency_contact_phone) && (
                    <p className="text-sm text-muted-foreground">
                      Emergencia: {a.students?.emergency_contact_name ?? "—"}
                      {a.students?.emergency_contact_phone
                        ? ` · ${a.students.emergency_contact_phone}`
                        : ""}
                    </p>
                  )}
                  <div className="mt-1.5 flex gap-3 text-xs">
                    <WhatsappLink
                      phone={a.students?.profiles?.phone}
                      label="Padre/madre"
                    />
                    <WhatsappLink
                      phone={a.students?.emergency_contact_phone}
                      label="Emergencia"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <form
                    className="flex-1"
                    action={recordTripEvent.bind(
                      null,
                      trip?.id ?? "",
                      route.id,
                      a.student_id,
                      "recogido"
                    )}
                  >
                    <Button
                      type="submit"
                      disabled={disabled}
                      className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                    >
                      <CircleCheck /> Recogido
                    </Button>
                  </form>
                  <form
                    className="flex-1"
                    action={recordTripEvent.bind(
                      null,
                      trip?.id ?? "",
                      route.id,
                      a.student_id,
                      "entregado"
                    )}
                  >
                    <Button
                      type="submit"
                      disabled={disabled}
                      variant="outline"
                      className="h-11 w-full"
                    >
                      <House /> Entregado
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-primary" />
            Reportar incidencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentForm
            action={reportIncident.bind(null, route.id, trip?.id ?? null)}
            students={assignments ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
