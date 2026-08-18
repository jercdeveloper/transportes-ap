import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return profile;
});

export async function requireRole(role: UserRole) {
  const profile = await getSessionProfile();
  if (profile.role !== role) redirect(`/${profile.role}`);
  return profile;
}
