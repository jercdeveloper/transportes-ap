import Link from "next/link";
import { Bus, CalendarX, History, CircleCheck, House, Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LiveTripMapClient } from "@/components/live-trip-map-client";
import { PushSubscribeButton } from "@/components/push-subscribe-button";
import { addAbsence, removeAbsence, confirmDropoff } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export default async function PadrePage() {
  const profile = await requireRole("padre");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, full_name, address_label, lat, lng, student_route_assignment(route_id, routes(name))"
    )
    .eq("parent_id", profile.id);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const studentIds = students?.map((s) => s.id) ?? [];

  const [{ data: payments }, { data: events }, { data: absences }] =
    studentIds.length > 0
      ? await Promise.all([
          supabase
            .from("payments")
            .select("student_id, status")
            .eq("period", currentPeriod)
            .in("student_id", studentIds),
          supabase
            .from("trip_events")
            .select("id, student_id, event_type, created_at, parent_confirmed_at")
            .in("student_id", studentIds)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("absences")
            .select("id, student_id, absence_date")
            .in("student_id", studentIds)
            .gte("absence_date", today)
            .order("absence_date"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const paymentByStudent = new Map(
    (payments ?? []).map((p) => [p.student_id, p.status])
  );

  const eventsByStudent = new Map<
    string,
    {
      id: string;
      event_type: string;
      created_at: string;
      parent_confirmed_at: string | null;
    }[]
  >();
  for (const e of events ?? []) {
    const list = eventsByStudent.get(e.student_id) ?? [];
    if (list.length < 5) list.push(e);
    eventsByStudent.set(e.student_id, list);
  }

  const absencesByStudent = new Map<
    string,
    { id: string; absence_date: string }[]
  >();
  for (const a of absences ?? []) {
    const list = absencesByStudent.get(a.student_id) ?? [];
    list.push(a);
    absencesByStudent.set(a.student_id, list);
  }

  const routeIds = [
    ...new Set(
      (students ?? [])
        .map((s) => s.student_route_assignment?.[0]?.route_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: activeTrips } =
    routeIds.length > 0
      ? await supabase
          .from("trips")
          .select("id, route_id")
          .in("route_id", routeIds)
          .eq("trip_date", today)
          .eq("status", "active")
      : { data: [] };

  const activeTripByRoute = new Map(
    (activeTrips ?? []).map((t) => [t.route_id, t.id])
  );

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, routes(name)")
    .or(
      routeIds.length > 0
        ? `route_id.is.null,route_id.in.(${routeIds.join(",")})`
        : "route_id.is.null"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (!students?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes alumnos registrados. Contacta al administrador.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PushSubscribeButton />
      </div>

      {announcements && announcements.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Megaphone className="size-4 text-primary" />
              Avisos
            </p>
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground">{a.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.routes?.name ? `Ruta ${a.routes.name} · ` : ""}
                    {new Date(a.created_at).toLocaleDateString("es-CO")}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {students.map((s) => {
        const assignment = s.student_route_assignment?.[0];
        const paymentStatus = paymentByStudent.get(s.id) ?? "sin registro";
        const activeTripId = assignment?.route_id
          ? activeTripByRoute.get(assignment.route_id)
          : undefined;
        const studentEvents = eventsByStudent.get(s.id) ?? [];
        const studentAbsences = absencesByStudent.get(s.id) ?? [];

        return (
          <Card key={s.id}>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{s.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Ruta: {assignment?.routes?.name ?? "sin asignar"}
                  {s.address_label ? ` · Parada: ${s.address_label}` : ""}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Pago de {currentPeriod}:</span>
                  <StatusBadge tone={paymentStatus === "pagado" ? "success" : "warning"}>
                    {paymentStatus}
                  </StatusBadge>
                  <Link
                    href={`/padre/pagos/${s.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver historial
                  </Link>
                </p>
              </div>

              {activeTripId && s.lat != null && s.lng != null && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Bus className="size-4 text-primary" />
                    El bus está en camino
                  </p>
                  <LiveTripMapClient
                    tripId={activeTripId}
                    stops={[
                      {
                        lat: s.lat,
                        lng: s.lng,
                        label: s.address_label ?? s.full_name,
                      },
                    ]}
                  />
                </div>
              )}

              <Separator />

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <CalendarX className="size-4 text-primary" />
                  Ausencias
                </p>
                {studentAbsences.length > 0 && (
                  <ul className="mb-2 space-y-1">
                    {studentAbsences.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between text-sm text-muted-foreground"
                      >
                        <span>No asiste el {a.absence_date}</span>
                        <form action={removeAbsence.bind(null, a.id)}>
                          <button
                            type="submit"
                            className="text-destructive hover:underline"
                          >
                            Cancelar
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  action={addAbsence.bind(null, s.id)}
                  className="flex items-center gap-2"
                >
                  <Input
                    type="date"
                    name="absence_date"
                    min={today}
                    required
                    className="w-auto"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Marcar ausencia
                  </Button>
                </form>
              </div>

              {studentEvents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                      <History className="size-4 text-primary" />
                      Historial reciente
                    </p>
                    <ul className="space-y-1.5">
                      {studentEvents.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span className="flex items-center gap-1.5">
                            {e.event_type === "recogido" ? (
                              <CircleCheck className="size-3.5 text-emerald-600" />
                            ) : (
                              <House className="size-3.5 text-primary" />
                            )}
                            {e.event_type === "recogido" ? "Recogido" : "Entregado"} ·{" "}
                            {new Date(e.created_at).toLocaleString("es-CO")}
                            {e.parent_confirmed_at ? " · confirmado" : ""}
                          </span>
                          {e.event_type === "entregado" && !e.parent_confirmed_at && (
                            <form action={confirmDropoff.bind(null, e.id)}>
                              <Button type="submit" variant="outline" size="sm">
                                Confirmar llegada
                              </Button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
