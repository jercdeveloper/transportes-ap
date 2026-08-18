import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "@/components/person-form";
import { WhatsappLink } from "@/components/whatsapp-link";
import { SearchBox } from "@/components/search-box";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPadre, removePadre } from "./actions";

export default async function PadresPage({
  searchParams,
}: PageProps<"/admin/padres">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  let padresQuery = supabase
    .from("profiles")
    .select("id, full_name, phone, phone_alt, document_id")
    .eq("role", "padre");
  if (q) padresQuery = padresQuery.ilike("full_name", `%${q}%`);

  const [{ data: padres }, { data: students }] = await Promise.all([
    padresQuery,
    supabase.from("students").select("id, parent_id, full_name"),
  ]);

  const childrenByParent = new Map<string, string[]>();
  for (const s of students ?? []) {
    const list = childrenByParent.get(s.parent_id) ?? [];
    list.push(s.full_name);
    childrenByParent.set(s.parent_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Padres</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas de acceso para los padres/madres de familia.
        </p>
      </div>

      <Suspense>
        <SearchBox placeholder="Buscar padre/madre por nombre..." />
      </Suspense>

      <PersonForm action={createPadre} submitLabel="Crear padre" variant="padre" />

      <div className="space-y-3">
        {padres?.length ? (
          padres.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.document_id ?? "sin documento"} · {p.phone ?? "sin teléfono"}
                    {p.phone_alt ? ` / ${p.phone_alt}` : ""} ·{" "}
                    {(childrenByParent.get(p.id) ?? []).join(", ") ||
                      "sin hijos registrados"}
                  </p>
                  <div className="mt-1.5 flex gap-3 text-xs">
                    <WhatsappLink phone={p.phone} />
                    <WhatsappLink phone={p.phone_alt} label="WhatsApp alterno" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/admin/padres/${p.id}`} />}
                  >
                    <Pencil />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <form action={removePadre.bind(null, p.id)}>
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
          <p className="text-sm text-muted-foreground">Aún no hay padres.</p>
        )}
      </div>
    </div>
  );
}
