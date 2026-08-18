"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateNotificationPreferences(formData: FormData) {
  const profile = await getSessionProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      notify_trip_start: formData.get("notify_trip_start") === "on",
      notify_pickup_dropoff: formData.get("notify_pickup_dropoff") === "on",
      notify_announcements: formData.get("notify_announcements") === "on",
      notify_payment_reminders: formData.get("notify_payment_reminders") === "on",
    })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/cuenta/notificaciones");
}
