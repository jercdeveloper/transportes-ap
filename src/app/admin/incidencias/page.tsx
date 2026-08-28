import Image from "next/image";
import { FileDown, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteIncident } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function IncidenciasPage() {
  const supabase = await createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select(
      "id, description, photo_url, created_at, routes(name), students(full_name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Incidencias</h1>
          <p className="text-sm text-muted-foreground">
            Reportes enviados por los choferes durante los viajes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href="/api/export/incidencias" />}>
            <FileDown /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/export/incidencias?format=pdf" />}
          >
            <FileText /> PDF
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {incidents?.length ? (
          incidents.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">{i.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {i.routes?.name ?? "—"}
                    {i.students?.full_name ? ` · ${i.students.full_name}` : ""} ·{" "}
                    {new Date(i.created_at).toLocaleString("es-CO")}
                  </p>
                  {i.photo_url && (
                    <Image
                      src={i.photo_url}
                      alt="Evidencia de la incidencia"
                      width={128}
                      height={128}
                      className="mt-2 h-32 w-32 rounded-lg object-cover ring-1 ring-border"
                    />
                  )}
                </div>
                <form action={deleteIncident.bind(null, i.id)}>
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
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No hay incidencias reportadas.</p>
        )}
      </div>
    </div>
  );
}
