"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addAbsence(studentId: string, formData: FormData) {
  await requireRole("padre");
  const supabase = await createClient();

  const absenceDate = String(formData.get("absence_date") ?? "");
  if (!absenceDate) return;

  const { error } = await supabase.from("absences").insert({
    student_id: studentId,
    absence_date: absenceDate,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/padre");
}

export async function removeAbsence(absenceId: string) {
  await requireRole("padre");
  const supabase = await createClient();

  const { error } = await supabase.from("absences").delete().eq("id", absenceId);
  if (error) throw new Error(error.message);

  revalidatePath("/padre");
}

export async function confirmDropoff(eventId: string) {
  await requireRole("padre");
  const supabase = await createClient();

  const { error } = await supabase.rpc("confirm_dropoff", { p_event_id: eventId });
  if (error) throw new Error(error.message);

  revalidatePath("/padre");
}
