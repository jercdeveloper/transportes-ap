"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";
import type { BloodType, StudentDocumentType } from "@/lib/supabase/types";

function readStudentFields(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    school_name: String(formData.get("school_name") ?? "").trim() || null,
    parent_id: String(formData.get("parent_id") ?? ""),
    address_label: String(formData.get("address_label") ?? "").trim(),
    lat_raw: String(formData.get("lat") ?? ""),
    lng_raw: String(formData.get("lng") ?? ""),
    document_type:
      (String(formData.get("document_type") ?? "") as StudentDocumentType) || null,
    document_id: String(formData.get("document_id") ?? "").trim() || null,
    birth_date: String(formData.get("birth_date") ?? "") || null,
    grade: String(formData.get("grade") ?? "").trim() || null,
    blood_type: (String(formData.get("blood_type") ?? "") as BloodType) || null,
    medical_notes: String(formData.get("medical_notes") ?? "").trim() || null,
    emergency_contact_name:
      String(formData.get("emergency_contact_name") ?? "").trim() || null,
    emergency_contact_phone:
      String(formData.get("emergency_contact_phone") ?? "").trim() || null,
    emergency_contact_relation:
      String(formData.get("emergency_contact_relation") ?? "").trim() || null,
    default_fee: formData.get("default_fee")
      ? Number(formData.get("default_fee"))
      : null,
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
  };
}

export async function createStudent(
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const fields = readStudentFields(formData);
  const lat = Number(fields.lat_raw);
  const lng = Number(fields.lng_raw);

  if (!fields.full_name || !fields.parent_id) {
    return { error: "Nombre y padre/madre son obligatorios." };
  }
  if (
    !fields.address_label ||
    !fields.lat_raw ||
    !fields.lng_raw ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return { error: "Marca la dirección del alumno en el mapa." };
  }

  const { error } = await supabase.from("students").insert({
    full_name: fields.full_name,
    school_name: fields.school_name,
    parent_id: fields.parent_id,
    address_label: fields.address_label,
    lat,
    lng,
    document_type: fields.document_type,
    document_id: fields.document_id,
    birth_date: fields.birth_date,
    grade: fields.grade,
    blood_type: fields.blood_type,
    medical_notes: fields.medical_notes,
    emergency_contact_name: fields.emergency_contact_name,
    emergency_contact_phone: fields.emergency_contact_phone,
    emergency_contact_relation: fields.emergency_contact_relation,
    default_fee: fields.default_fee,
    photo_url: fields.photo_url,
  });

  if (error) return { error: error.message };

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "crear",
    entityType: "alumno",
    entityLabel: fields.full_name,
  });

  revalidatePath("/admin/alumnos");
}

export async function updateStudent(
  studentId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const fields = readStudentFields(formData);
  const lat = Number(fields.lat_raw);
  const lng = Number(fields.lng_raw);

  if (!fields.full_name || !fields.parent_id) {
    return { error: "Nombre y padre/madre son obligatorios." };
  }
  if (
    !fields.address_label ||
    !fields.lat_raw ||
    !fields.lng_raw ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return { error: "Marca la dirección del alumno en el mapa." };
  }

  const { error } = await supabase
    .from("students")
    .update({
      full_name: fields.full_name,
      school_name: fields.school_name,
      parent_id: fields.parent_id,
      address_label: fields.address_label,
      lat,
      lng,
      document_type: fields.document_type,
      document_id: fields.document_id,
      birth_date: fields.birth_date,
      grade: fields.grade,
      blood_type: fields.blood_type,
      medical_notes: fields.medical_notes,
      emergency_contact_name: fields.emergency_contact_name,
      emergency_contact_phone: fields.emergency_contact_phone,
      emergency_contact_relation: fields.emergency_contact_relation,
      default_fee: fields.default_fee,
      photo_url: fields.photo_url,
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "editar",
    entityType: "alumno",
    entityLabel: fields.full_name,
  });

  revalidatePath("/admin/alumnos");
  revalidatePath(`/admin/alumnos/${studentId}`);
}

export async function deleteStudent(id: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "eliminar",
    entityType: "alumno",
    entityLabel: student?.full_name,
  });

  revalidatePath("/admin/alumnos");
}

export async function assignStudentRoute(
  studentId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  await requireRole("admin");
  const supabase = await createClient();

  const routeId = String(formData.get("route_id") ?? "");
  const stopOrderRaw = Number(formData.get("stop_order"));
  const stopOrder =
    Number.isFinite(stopOrderRaw) && stopOrderRaw > 0 ? Math.trunc(stopOrderRaw) : 1;

  if (!routeId) {
    const { error } = await supabase
      .from("student_route_assignment")
      .delete()
      .eq("student_id", studentId);
    if (error) return { error: error.message };
  } else {
    // Upsert atómico por student_id (un alumno solo tiene una ruta a la vez)
    // en vez de borrar y luego insertar en dos pasos separados — así un
    // fallo a mitad de camino no puede dejar al alumno sin ruta asignada.
    const { error } = await supabase
      .from("student_route_assignment")
      .upsert(
        { student_id: studentId, route_id: routeId, stop_order: stopOrder },
        { onConflict: "student_id" }
      );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/alumnos");
  revalidatePath(`/admin/alumnos/${studentId}`);
}

export async function addAuthorizedPerson(studentId: string, formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const { error } = await supabase.from("authorized_pickup_persons").insert({
    student_id: studentId,
    full_name: fullName,
    phone: String(formData.get("phone") ?? "").trim() || null,
    document_id: String(formData.get("document_id") ?? "").trim() || null,
    relation: String(formData.get("relation") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/alumnos/${studentId}`);
}

export async function importStudentsCsv(
  _prevState: { error?: string; result?: { success: number; errors: string[] } } | undefined,
  formData: FormData
) {
  await requireRole("admin");
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo CSV." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "El archivo está vacío." };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const { data: padres } = await supabase
    .from("profiles")
    .select("id, document_id")
    .eq("role", "padre");
  const parentByDoc = new Map(
    (padres ?? [])
      .filter((p): p is typeof p & { document_id: string } => Boolean(p.document_id))
      .map((p) => [p.document_id, p.id])
  );

  const errors: string[] = [];
  let success = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2;
    const get = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (row[idx] ?? "").trim() : "";
    };

    const fullName = get("full_name");
    const parentDoc = get("parent_document_id");

    if (!fullName) {
      errors.push(`Fila ${rowNum}: falta el nombre del alumno.`);
      continue;
    }
    if (!parentDoc) {
      errors.push(`Fila ${rowNum}: falta el documento del padre/madre.`);
      continue;
    }

    const parentId = parentByDoc.get(parentDoc);
    if (!parentId) {
      errors.push(`Fila ${rowNum}: no existe un padre/madre con documento "${parentDoc}".`);
      continue;
    }

    const latRaw = get("lat");
    const lngRaw = get("lng");
    const feeRaw = get("default_fee");
    const lat = latRaw ? Number(latRaw) : null;
    const lng = lngRaw ? Number(lngRaw) : null;
    const defaultFee = feeRaw ? Number(feeRaw) : null;

    const { error } = await supabase.from("students").insert({
      full_name: fullName,
      parent_id: parentId,
      school_name: get("school_name") || null,
      grade: get("grade") || null,
      address_label: get("address_label") || null,
      lat: lat != null && !Number.isNaN(lat) ? lat : null,
      lng: lng != null && !Number.isNaN(lng) ? lng : null,
      document_type: (get("document_type") || null) as StudentDocumentType | null,
      document_id: get("document_id") || null,
      birth_date: get("birth_date") || null,
      blood_type: (get("blood_type") || null) as BloodType | null,
      default_fee: defaultFee != null && !Number.isNaN(defaultFee) ? defaultFee : null,
    });

    if (error) errors.push(`Fila ${rowNum}: ${error.message}`);
    else success += 1;
  }

  revalidatePath("/admin/alumnos");
  return { result: { success, errors } };
}

export async function removeAuthorizedPerson(studentId: string, personId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("authorized_pickup_persons").delete().eq("id", personId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/alumnos/${studentId}`);
}
