"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createRoleUser, deleteRoleUser } from "@/lib/admin-users";
import { logAudit } from "@/lib/audit";
import type { PersonFormState } from "@/components/person-form";

export async function createPadre(
  _prevState: PersonFormState,
  formData: FormData
): Promise<PersonFormState> {
  const profile = await requireRole("admin");
  const fullName = String(formData.get("full_name") ?? "");

  try {
    await createRoleUser({
      role: "padre",
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      fullName,
      phone: String(formData.get("phone") ?? ""),
      documentId: String(formData.get("document_id") ?? ""),
      phoneAlt: String(formData.get("phone_alt") ?? ""),
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "crear",
    entityType: "padre",
    entityLabel: fullName,
  });

  revalidatePath("/admin/padres");
}

export async function updatePadre(
  id: string,
  _prevState: PersonFormState,
  formData: FormData
): Promise<PersonFormState> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "El nombre es obligatorio." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: String(formData.get("phone") ?? "").trim() || null,
      phone_alt: String(formData.get("phone_alt") ?? "").trim() || null,
      document_id: String(formData.get("document_id") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "editar",
    entityType: "padre",
    entityLabel: fullName,
  });

  revalidatePath("/admin/padres");
}

export async function removePadre(id: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: padre } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .single();

  await deleteRoleUser(id);

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "eliminar",
    entityType: "padre",
    entityLabel: padre?.full_name,
  });

  revalidatePath("/admin/padres");
}
