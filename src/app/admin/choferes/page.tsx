import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "@/components/person-form";
import { WhatsappLink } from "@/components/whatsapp-link";
import { SearchBox } from "@/components/search-box";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createChofer, removeChofer } from "./actions";

export default async function ChoferesPage({
  searchParams,
}: PageProps<"/admin/choferes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let choferesQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, phone_alt, document_id, license_number, license_category, license_expiry"
    )
    .eq("role", "chofer");
  if (q) choferesQuery = choferesQuery.ilike("full_name", `%${q}%`);

  const [{ data: choferes }, { data: routes }] = await Promise.all([
    choferesQuery,
    supabase.from("routes").select("id, name, driver_id"),
  ]);

  const routeByDriver = new Map(
    (routes ?? []).map((r) => [r.driver_id, r.name])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Choferes</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas de acceso para los conductores de tus rutas.
        </p>
      </div>

      <PersonForm action={createChofer} submitLabel="Crear chofer" variant="chofer" />

      <Suspense>
        <SearchBox placeholder="Buscar chofer por nombre..." />
      </Suspense>

      <div className="space-y-3">
        {choferes?.length ? (
          choferes.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{c.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.document_id ?? "sin documento"} · {c.phone ?? "sin teléfono"}
                    {c.phone_alt ? ` / ${c.phone_alt}` : ""} ·{" "}
                    {routeByDriver.get(c.id) ?? "sin ruta asignada"}
                  </p>
                  {(c.license_number || c.license_category || c.license_expiry) && (
                    <p className="text-sm text-muted-foreground">
                      Licencia {c.license_number ?? "—"}
                      {c.license_category ? ` (${c.license_category})` : ""}
                      {c.license_expiry ? ` · vence ${c.license_expiry}` : ""}
                    </p>
                  )}
                  <div className="mt-1.5 flex gap-3 text-xs">
                    <WhatsappLink phone={c.phone} />
                    <WhatsappLink phone={c.phone_alt} label="WhatsApp alterno" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/admin/choferes/${c.id}`} />}
                  >
                    <Pencil />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <form action={removeChofer.bind(null, c.id)}>
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
          <p className="text-sm text-muted-foreground">Aún no hay choferes.</p>
        )}
      </div>
    </div>
  );
}
