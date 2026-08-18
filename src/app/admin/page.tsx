import {
  GraduationCap,
  Route as RouteIcon,
  CarFront,
  Radio,
  FileClock,
  Siren,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isoTimeAgo } from "@/lib/dates";
import { LiveTripMapClient } from "@/components/live-trip-map-client";
import { ExpiryBar } from "@/components/expiry-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SendExpiryAlertsButton } from "./send-expiry-alerts-button";
import { sendExpiryAlertsNow } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: routes }, { data: drivers }] =
    await Promise.all([
      supabase.from("students").select("id, full_name, school_name"),
      supabase
        .from("routes")
        .select("id, name, driver_id, soat_expiry, tech_inspection_expiry"),
      supabase
        .from("profiles")
        .select("id, full_name, license_expiry")
        .eq("role", "chofer"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const { data: activeTrips } = await supabase
    .from("trips")
    .select("id, route_id, routes(name)")
    .eq("trip_date", today)
    .eq("status", "active");

  const activeRouteIds = (activeTrips ?? []).map((t) => t.route_id);
  const { data: activeAssignments } =
    activeRouteIds.length > 0
      ? await supabase
          .from("student_route_assignment")
          .select("route_id, stop_order, students(full_name, address_label, lat, lng)")
          .in("route_id", activeRouteIds)
          .order("stop_order")
      : { data: [] };

  const stopsByRoute = new Map<
    string,
    { lat: number; lng: number; label: string }[]
  >();
  for (const a of activeAssignments ?? []) {
    if (a.students?.lat == null || a.students?.lng == null) continue;
    const list = stopsByRoute.get(a.route_id) ?? [];
    list.push({
      lat: a.students.lat,
      lng: a.students.lng,
      label: a.students.address_label ?? a.students.full_name,
    });
    stopsByRoute.set(a.route_id, list);
  }

  const hasExpiryData =
    routes?.some((r) => r.soat_expiry || r.tech_inspection_expiry) ||
    drivers?.some((d) => d.license_expiry);

  const oneDayAgo = isoTimeAgo(24 * 60 * 60 * 1000);
  const { data: emergencyAlerts } = await supabase
    .from("emergency_alerts")
    .select("id, lat, lng, created_at, routes(name), profiles(full_name)")
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Vista general de la operación de Transportes AP.
        </p>
      </div>

      {emergencyAlerts && emergencyAlerts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Siren className="size-4" />
              Alertas de emergencia (últimas 24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emergencyAlerts.map((a) => (
              <div key={a.id} className="text-sm">
                <span className="font-medium">{a.routes?.name ?? "Ruta eliminada"}</span> ·{" "}
                {a.profiles?.full_name ?? "Chofer"} ·{" "}
                {new Date(a.created_at).toLocaleString("es-CO")}
                {a.lat != null && a.lng != null && (
                  <>
                    {" · "}
                    <a
                      href={`https://maps.google.com/?q=${a.lat},${a.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Ver ubicación
                    </a>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Alumnos" value={students?.length ?? 0} icon={GraduationCap} />
        <StatCard label="Rutas" value={routes?.length ?? 0} icon={RouteIcon} />
        <StatCard label="Choferes" value={drivers?.length ?? 0} icon={CarFront} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            Viajes activos ahora
          </CardTitle>
          <CardDescription>
            Ubicación en vivo de los buses con un viaje en curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTrips?.length ? (
            <div className="space-y-4">
              {activeTrips.map((t) => (
                <div key={t.id}>
                  <p className="mb-1 text-sm font-medium">{t.routes?.name}</p>
                  <LiveTripMapClient
                    tripId={t.id}
                    stops={stopsByRoute.get(t.route_id) ?? []}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No hay viajes en curso en este momento." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="size-4 text-primary" />
              Vencimientos
            </CardTitle>
            <CardDescription>
              SOAT, tecnomecánica y licencias de conducción.
            </CardDescription>
          </div>
          <SendExpiryAlertsButton action={sendExpiryAlertsNow} />
        </CardHeader>
        <CardContent className="space-y-3">
          {routes?.map((r) => (
            <div key={r.id} className="space-y-2">
              {r.soat_expiry && (
                <ExpiryBar label={`SOAT · ${r.name}`} date={r.soat_expiry} />
              )}
              {r.tech_inspection_expiry && (
                <ExpiryBar
                  label={`Tecnomecánica · ${r.name}`}
                  date={r.tech_inspection_expiry}
                />
              )}
            </div>
          ))}
          {drivers?.map(
            (d) =>
              d.license_expiry && (
                <ExpiryBar
                  key={d.id}
                  label={`Licencia · ${d.full_name}`}
                  date={d.license_expiry}
                />
              )
          )}
          {!hasExpiryData && (
            <EmptyState text="Aún no has registrado fechas de vencimiento." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alumnos</CardTitle>
          </CardHeader>
          <CardContent>
            {students?.length ? (
              <ul className="divide-y divide-border">
                {students.map((s) => (
                  <li key={s.id} className="py-2 text-sm">
                    {s.full_name}
                    {s.school_name ? (
                      <span className="text-muted-foreground"> · {s.school_name}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="Aún no hay alumnos registrados." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rutas</CardTitle>
          </CardHeader>
          <CardContent>
            {routes?.length ? (
              <ul className="divide-y divide-border">
                {routes.map((r) => (
                  <li key={r.id} className="py-2 text-sm">
                    {r.name}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="Aún no hay rutas creadas." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
