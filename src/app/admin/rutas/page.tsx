import Link from "next/link";
import { Suspense } from "react";
import { Map, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createRoute, updateRouteDriver, deleteRoute } from "./actions";
import { RouteForm } from "./route-form";
import { DriverSelect } from "./driver-select";
import { SearchBox } from "@/components/search-box";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function RutasPage({
  searchParams,
}: PageProps<"/admin/rutas">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let routesQuery = supabase
    .from("routes")
    .select("id, name, driver_id, vehicle_plate");
  if (q) routesQuery = routesQuery.ilike("name", `%${q}%`);

  const [{ data: routes }, { data: choferes }] = await Promise.all([
    routesQuery,
    supabase.from("profiles").select("id, full_name").eq("role", "chofer"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Rutas</h1>
        <p className="text-sm text-muted-foreground">
          Rutas, chofer asignado y datos del vehículo.
        </p>
      </div>

      <RouteForm action={createRoute} choferes={choferes ?? []} submitLabel="Crear ruta" />

      <Suspense>
        <SearchBox placeholder="Buscar ruta por nombre..." />
      </Suspense>

      <div className="space-y-3">
        {routes?.length ? (
          routes.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/rutas/${r.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                  {r.vehicle_plate && (
                    <p className="text-sm text-muted-foreground">{r.vehicle_plate}</p>
                  )}
                  <DriverSelect
                    action={updateRouteDriver.bind(null, r.id)}
                    driverId={r.driver_id}
                    choferes={choferes ?? []}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/admin/rutas/${r.id}`} />}
                  >
                    <Map />
                    <span className="sr-only">Editar / ver mapa</span>
                  </Button>
                  <form action={deleteRoute.bind(null, r.id)}>
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
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay rutas.</p>
        )}
      </div>
    </div>
  );
}
