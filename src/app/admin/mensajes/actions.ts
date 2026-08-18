"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export async function sendAdminMessage(
  parentId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { error } = await supabase.from("messages").insert({
    parent_id: parentId,
    sender_id: profile.id,
    body,
  });
  if (error) return { error: "No se pudo enviar el mensaje. Intenta de nuevo." };

  await sendPushToUser(parentId, {
    title: "💬 Nuevo mensaje de administración",
    body,
    url: "/padre/mensajes",
  });

  revalidatePath(`/admin/mensajes/${parentId}`);
  revalidatePath("/admin/mensajes");
}

export async function markThreadReadByAdmin(parentId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("parent_id", parentId)
    .eq("sender_id", parentId)
    .is("read_at", null);

  if (error) console.error("markThreadReadByAdmin:", error.message);
}
