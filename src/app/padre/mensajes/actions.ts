"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/push";

export async function sendPadreMessage(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const profile = await requireRole("padre");
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { error } = await supabase.from("messages").insert({
    parent_id: profile.id,
    sender_id: profile.id,
    body,
  });
  if (error) return { error: "No se pudo enviar el mensaje. Intenta de nuevo." };

  await notifyAdmins({
    title: `💬 Mensaje de ${profile.full_name}`,
    body,
    url: `/admin/mensajes/${profile.id}`,
  });

  revalidatePath("/padre/mensajes");
}

export async function markThreadReadByParent() {
  const profile = await requireRole("padre");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("parent_id", profile.id)
    .neq("sender_id", profile.id)
    .is("read_at", null);

  // No crítico: si falla, el mensaje simplemente queda marcado como no
  // leído un poco más — no vale la pena romper toda la vista por esto.
  if (error) console.error("markThreadReadByParent:", error.message);
}
