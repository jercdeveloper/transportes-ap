"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setEnrollmentStatus(id: string, formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();

  const status = String(formData.get("status") ?? "pendiente") as
    | "pendiente"
    | "contactado"
    | "descartado";

  const { error } = await supabase
    .from("enrollment_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/inscripciones");
}

export async function deleteEnrollmentRequest(id: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("enrollment_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/inscripciones");
}
