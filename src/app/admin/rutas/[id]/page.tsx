import Link from "next/link";
import { notFound } from "next/navigation";
import { Wrench, Trash2, FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RouteMapClient } from "./route-map-client";
import { RouteForm } from "../route-form";
import { updateRoute, addMaintenanceRecord, deleteMaintenanceRecord } from "../actions";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function RutaDetailPage({
  params,
}: PageProps<"/admin/rutas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: route }, { data: choferes }, { data: assignments }, { data: maintenance }] =
    await Promise.all([
      supabase.from("routes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .or("role.eq.chofer,and(role.eq.admin,is_driver.eq.true)"),
      supabase
        .from("student_route_assignment")
        .select("stop_order, students(full_name, address_label, lat, lng)")
        .eq("route_id", id)
        .order("stop_order"),
      supabase
        .from("maintenance_records")
        .select("id, type, description, odometer_km, cost, performed_at")
        .eq("route_id", id)
        .order("performed_at", { ascending: false }),
    ]);

  if (!route) notFound();

  const stops = (assignments ?? [])
    .filter((a) => a.students?.lat != null && a.students?.lng != null)
    .map((a) => ({
      order: a.stop_order,
      label: a.students!.address_label ?? a.students!.full_name,
      lat: a.students!.lat!,
      lng: a.students!.lng!,
      studentName: a.students!.full_name,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BackLink href="/admin/rutas" label="Volver a rutas" />
          <h1 className="text-xl font-semibold tracking-tight">{route.name}</h1>
        </div>
        <Button variant="outline" size="sm" render={<a href={`/api/export/ruta/${id}`} />}>
          <FileDown /> Hoja de ruta (PDF)
        </Button>
      </div>

      <RouteForm
        action={updateRoute.bind(null, id)}
        choferes={choferes ?? []}
        submitLabel="Guardar cambios"
        initialValues={{
          name: route.name,
          driver_id: route.driver_id,
          vehicle_plate: route.vehicle_plate,
          vehicle_model: route.vehicle_model,
          vehicle_capacity: route.vehicle_capacity,
          soat_expiry: route.soat_expiry,
          tech_inspection_expiry: route.tech_inspection_expiry,
        }}
      />

      <div>
        <h2 className="mb-1 text-sm font-semibold">Paradas</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Las paradas son las direcciones de los alumnos asignados a esta
          ruta. Para agregar o reordenar paradas, ve a{" "}
          <Link href="/admin/alumnos" className="underline">
            Alumnos
          </Link>
          .
        </p>

        {stops.length ? (
          <>
            <RouteMapClient stops={stops} />
            <div className="mt-3 space-y-2">
              {stops
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <Card key={s.studentName + s.order}>
                    <CardContent>
                      <p className="text-sm font-medium">
                        {s.order}. {s.studentName}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay alumnos asignados a esta ruta.
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4 text-primary" />
            Mantenimiento del vehículo
          </CardTitle>
          <CardDescription>
            Registro de mantenimientos realizados (cambios de aceite, llantas, frenos, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {maintenance?.length ? (
              maintenance.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {m.type} · {m.performed_at}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        m.odometer_km != null ? `${m.odometer_km.toLocaleString("es-CO")} km` : null,
                        m.cost != null ? `$${m.cost.toLocaleString("es-CO")}` : null,
                        m.description,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sin detalles adicionales"}
                    </p>
                  </div>
                  <form action={deleteMaintenanceRecord.bind(null, id, m.id)}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="submit"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no hay registros de mantenimiento.
              </p>
            )}
          </div>

          <form
            action={addMaintenanceRecord.bind(null, id)}
            className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <Input id="type" name="type" placeholder="Cambio de aceite" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="performed_at">Fecha</Label>
              <Input id="performed_at" name="performed_at" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="odometer_km">Kilometraje</Label>
              <Input id="odometer_km" name="odometer_km" type="number" min="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost">Costo</Label>
              <Input id="cost" name="cost" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Agregar registro
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
