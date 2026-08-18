import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "@/components/person-form";
import { BackLink } from "@/components/back-link";
import { updateChofer } from "../actions";

export default async function EditChoferPage({
  params,
}: PageProps<"/admin/choferes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: chofer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "chofer")
    .maybeSingle();

  if (!chofer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/choferes" label="Volver a choferes" />
        <h1 className="text-xl font-semibold tracking-tight">{chofer.full_name}</h1>
      </div>

      <PersonForm
        action={updateChofer.bind(null, id)}
        submitLabel="Guardar cambios"
        variant="chofer"
        mode="edit"
        initialValues={{
          full_name: chofer.full_name,
          document_id: chofer.document_id,
          phone: chofer.phone,
          phone_alt: chofer.phone_alt,
          license_number: chofer.license_number,
          license_category: chofer.license_category,
          license_expiry: chofer.license_expiry,
        }}
      />
    </div>
  );
}
