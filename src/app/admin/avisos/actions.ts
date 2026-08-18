"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export async function createAnnouncement(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const routeId = String(formData.get("route_id") ?? "") || null;

  if (!title || !body) return { error: "Título y mensaje son obligatorios." };

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    route_id: routeId,
    created_by: profile.id,
  });
  if (error) return { error: "No se pudo crear el aviso: " + error.message };

  let parentIds: string[] = [];

  if (routeId) {
    const { data: assignments } = await supabase
      .from("student_route_assignment")
      .select("students(parent_id)")
      .eq("route_id", routeId);
    parentIds = [
      ...new Set(
        (assignments ?? [])
          .map((a) => a.students?.parent_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
  } else {
    const { data: parents } = await supabase.from("profiles").select("id").eq("role", "padre");
    parentIds = (parents ?? []).map((p) => p.id);
  }

  await Promise.all(
    parentIds.map((parentId) =>
      sendPushToUser(
        parentId,
        { title: `📢 ${title}`, body, url: "/padre" },
        "announcement"
      )
    )
  );

  revalidatePath("/admin/avisos");
}

export async function deleteAnnouncement(id: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/avisos");
}
