import { History, FileDown, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

const ACTION_TONE: Record<string, "success" | "info" | "danger"> = {
  crear: "success",
  editar: "info",
  eliminar: "danger",
};

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, actor_name, action, entity_type, entity_label, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Bitácora de auditoría</h1>
          <p className="text-sm text-muted-foreground">
            Últimos 200 cambios administrativos registrados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href="/api/export/auditoria" />}>
            <FileDown /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/export/auditoria?format=pdf" />}
          >
            <FileText /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-1 divide-y divide-border">
          {entries?.length ? (
            entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <History className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{e.actor_name ?? "Sistema"}</span>{" "}
                    <StatusBadge tone={ACTION_TONE[e.action] ?? "neutral"}>{e.action}</StatusBadge>{" "}
                    {e.entity_type}
                    {e.entity_label ? ` — ${e.entity_label}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("es-CO")}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Aún no hay registros.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
