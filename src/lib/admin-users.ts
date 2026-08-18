import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

export async function createRoleUser({
  role,
  email,
  password,
  fullName,
  phone,
  documentId,
  phoneAlt,
  licenseNumber,
  licenseCategory,
  licenseExpiry,
}: {
  role: UserRole;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  documentId?: string;
  phoneAlt?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo crear el usuario.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    full_name: fullName,
    phone: phone || null,
    document_id: documentId || null,
    phone_alt: phoneAlt || null,
    license_number: licenseNumber || null,
    license_category: licenseCategory || null,
    license_expiry: licenseExpiry || null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }
}

export async function deleteRoleUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
