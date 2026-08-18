import { Megaphone, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AvisosPage() {
  const supabase = await createClient();

  const [{ data: announcements }, { data: routes }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at, route_id, routes(name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("routes").select("id, name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Avisos</h1>
        <p className="text-sm text-muted-foreground">
          Envía un anuncio por push a todos los padres o a los de una ruta específica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" />
            Nuevo aviso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm routes={routes ?? []} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {announcements?.length ? (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.routes?.name ? `Ruta: ${a.routes.name}` : "Todos los padres"} ·{" "}
                    {new Date(a.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                <form action={deleteAnnouncement.bind(null, a.id)}>
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
          <p className="text-sm text-muted-foreground">Aún no se han enviado avisos.</p>
        )}
      </div>
    </div>
  );
}
