import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "@/components/person-form";
import { BackLink } from "@/components/back-link";
import { updatePadre } from "../actions";

export default async function EditPadrePage({
  params,
}: PageProps<"/admin/padres/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: padre } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "padre")
    .maybeSingle();

  if (!padre) notFound();

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/padres" label="Volver a padres" />
        <h1 className="text-xl font-semibold tracking-tight">{padre.full_name}</h1>
      </div>

      <PersonForm
        action={updatePadre.bind(null, id)}
        submitLabel="Guardar cambios"
        variant="padre"
        mode="edit"
        initialValues={{
          full_name: padre.full_name,
          document_id: padre.document_id,
          phone: padre.phone,
          phone_alt: padre.phone_alt,
        }}
      />
    </div>
  );
}
