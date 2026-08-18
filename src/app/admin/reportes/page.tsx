import {
  FileDown,
  FileText,
  TrendingUp,
  Wallet,
  CircleAlert,
  Gauge,
  CalendarCheck,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PaymentTrendChart } from "@/components/payment-trend-chart";
import { PeriodNav } from "@/components/period-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function shiftPeriod(period: string, months: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReportesPage({
  searchParams,
}: PageProps<"/admin/reportes">) {
  const params = await searchParams;
  const period =
    typeof params.period === "string"
      ? params.period
      : new Date().toISOString().slice(0, 7);

  const supabase = await createClient();

  const trendPeriods = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5));

  const periodStart = `${period}-01`;
  const periodEnd = `${shiftPeriod(period, 1)}-01`;

  const [
    { data: payments },
    { data: assignments },
    { data: routes },
    { data: trendPayments },
    { data: trips },
    { data: absences },
    { data: incidents },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("student_id, amount, status")
      .eq("period", period),
    supabase.from("student_route_assignment").select("student_id, route_id"),
    supabase.from("routes").select("id, name"),
    supabase
      .from("payments")
      .select("period, amount, status")
      .in("period", trendPeriods),
    supabase
      .from("trips")
      .select("route_id, started_at, ended_at")
      .gte("trip_date", periodStart)
      .lt("trip_date", periodEnd)
      .eq("status", "completed"),
    supabase
      .from("absences")
      .select("student_id")
      .gte("absence_date", periodStart)
      .lt("absence_date", periodEnd),
    supabase
      .from("incidents")
      .select("route_id, created_at")
      .gte("created_at", periodStart)
      .lt("created_at", periodEnd),
  ]);

  const trendByPeriod = new Map(
    trendPeriods.map((p) => [p, { pagado: 0, pendiente: 0 }])
  );
  for (const p of trendPayments ?? []) {
    const entry = trendByPeriod.get(p.period);
    if (!entry) continue;
    if (p.status === "pagado") entry.pagado += p.amount;
    else entry.pendiente += p.amount;
  }
  const trendData = trendPeriods.map((p) => ({ period: p, ...trendByPeriod.get(p)! }));

  const routeByStudent = new Map(
    (assignments ?? []).map((a) => [a.student_id, a.route_id])
  );
  const routeNameById = new Map((routes ?? []).map((r) => [r.id, r.name]));

  let totalPagado = 0;
  let totalPendiente = 0;
  const byRoute = new Map<string, { pagado: number; pendiente: number }>();

  for (const p of payments ?? []) {
    const routeId = routeByStudent.get(p.student_id) ?? "sin-ruta";
    const entry = byRoute.get(routeId) ?? { pagado: 0, pendiente: 0 };

    if (p.status === "pagado") {
      totalPagado += p.amount;
      entry.pagado += p.amount;
    } else {
      totalPendiente += p.amount;
      entry.pendiente += p.amount;
    }

    byRoute.set(routeId, entry);
  }

  const tripStatsByRoute = new Map<string, { count: number; totalMinutes: number; timed: number }>();
  for (const t of trips ?? []) {
    const entry = tripStatsByRoute.get(t.route_id) ?? { count: 0, totalMinutes: 0, timed: 0 };
    entry.count += 1;
    if (t.started_at && t.ended_at) {
      const minutes = (new Date(t.ended_at).getTime() - new Date(t.started_at).getTime()) / 60000;
      if (minutes > 0) {
        entry.totalMinutes += minutes;
        entry.timed += 1;
      }
    }
    tripStatsByRoute.set(t.route_id, entry);
  }

  const studentsByRoute = new Map<string, number>();
  for (const routeId of routeByStudent.values()) {
    studentsByRoute.set(routeId, (studentsByRoute.get(routeId) ?? 0) + 1);
  }

  const absencesByRoute = new Map<string, number>();
  for (const a of absences ?? []) {
    const routeId = routeByStudent.get(a.student_id);
    if (!routeId) continue;
    absencesByRoute.set(routeId, (absencesByRoute.get(routeId) ?? 0) + 1);
  }

  const attendanceByRoute = [...routeNameById.keys()]
    .filter((routeId) => tripStatsByRoute.has(routeId))
    .map((routeId) => {
      const tripCount = tripStatsByRoute.get(routeId)?.count ?? 0;
      const studentCount = studentsByRoute.get(routeId) ?? 0;
      const absenceCount = absencesByRoute.get(routeId) ?? 0;
      const expected = tripCount * studentCount;
      const rate = expected > 0 ? Math.round((1 - absenceCount / expected) * 100) : null;
      return { routeId, absenceCount, rate };
    });

  const incidentsByRoute = new Map<string, number>();
  for (const i of incidents ?? []) {
    incidentsByRoute.set(i.route_id, (incidentsByRoute.get(i.route_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Recaudo y tendencia de pagos del transporte.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/export/reportes?period=${period}`} />}
          >
            <FileDown /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/export/reportes?period=${period}&format=pdf`} />}
          >
            <FileText /> PDF
          </Button>
        </div>
      </div>

      <PeriodNav
        basePath="/admin/reportes"
        period={period}
        prevHref={shiftPeriod(period, -1)}
        nextHref={shiftPeriod(period, 1)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-emerald-600">
                ${totalPagado.toLocaleString("es-CO")}
              </p>
              <p className="text-sm text-muted-foreground">Recaudado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <CircleAlert className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-amber-600">
                ${totalPendiente.toLocaleString("es-CO")}
              </p>
              <p className="text-sm text-muted-foreground">Pendiente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Tendencia (últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentTrendChart data={trendData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por ruta</CardTitle>
        </CardHeader>
        <CardContent>
          {byRoute.size ? (
            <ul className="divide-y divide-border">
              {[...byRoute.entries()].map(([routeId, totals]) => (
                <li key={routeId} className="flex items-center justify-between py-2 text-sm">
                  <span>{routeNameById.get(routeId) ?? "Sin ruta asignada"}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="text-emerald-600">
                      ${totals.pagado.toLocaleString("es-CO")}
                    </span>{" "}
                    recaudado ·{" "}
                    <span className="text-amber-600">
                      ${totals.pendiente.toLocaleString("es-CO")}
                    </span>{" "}
                    pendiente
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay pagos registrados este mes.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" />
            Rendimiento de rutas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tripStatsByRoute.size ? (
            <ul className="divide-y divide-border">
              {[...tripStatsByRoute.entries()].map(([routeId, stats]) => (
                <li key={routeId} className="flex items-center justify-between py-2 text-sm">
                  <span>{routeNameById.get(routeId) ?? "Ruta eliminada"}</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.count} viaje{stats.count === 1 ? "" : "s"}
                    {stats.timed > 0
                      ? ` · duración promedio ${Math.round(stats.totalMinutes / stats.timed)} min`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay viajes completados este mes.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" />
            Tasa de asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceByRoute.length ? (
            <ul className="divide-y divide-border">
              {attendanceByRoute.map(({ routeId, absenceCount, rate }) => (
                <li key={routeId} className="flex items-center justify-between py-2 text-sm">
                  <span>{routeNameById.get(routeId) ?? "Ruta eliminada"}</span>
                  <span className="text-xs text-muted-foreground">
                    {absenceCount} ausencia{absenceCount === 1 ? "" : "s"}
                    {rate != null ? ` · ${rate}% de asistencia` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay viajes registrados este mes para calcular la asistencia.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-primary" />
            Incidencias por ruta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidentsByRoute.size ? (
            <ul className="divide-y divide-border">
              {[...incidentsByRoute.entries()].map(([routeId, count]) => (
                <li key={routeId} className="flex items-center justify-between py-2 text-sm">
                  <span>{routeNameById.get(routeId) ?? "Ruta eliminada"}</span>
                  <span className="text-xs text-muted-foreground">
                    {count} incidencia{count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se reportaron incidencias este mes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
