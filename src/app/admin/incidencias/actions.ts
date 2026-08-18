"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteIncident(id: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/incidencias");
}
