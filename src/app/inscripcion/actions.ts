"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/push";
import { isRateLimited } from "@/lib/rate-limit";

export async function submitEnrollmentRequest(
  _prevState: { error: string; success?: boolean } | undefined,
  formData: FormData
) {
  // Protección anti-bots: si el campo trampa viene lleno, o el formulario se
  // envió a los pocos milisegundos de renderizarse, no se procesa — pero se
  // responde como si hubiera funcionado, para no delatar el filtro al bot.
  const honeypot = String(formData.get("company") ?? "").trim();
  const renderedAt = Number(formData.get("rendered_at"));
  const submittedTooFast =
    Number.isFinite(renderedAt) && Date.now() - renderedAt < 2000;

  if (honeypot || submittedTooFast) {
    return { error: "", success: true };
  }

  // Formulario público sin autenticación: se limita por IP para que no se
  // pueda saturar la tabla de solicitudes ni el buzón de notificaciones del
  // admin con envíos repetidos.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`inscripcion:${ip}`, { max: 5, windowMs: 10 * 60_000 })) {
    return { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." };
  }

  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const studentName = String(formData.get("student_name") ?? "").trim();

  if (!parentName || !parentPhone || !studentName) {
    return { error: "Nombre, teléfono y nombre del alumno son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("enrollment_requests").insert({
    parent_name: parentName,
    parent_phone: parentPhone,
    parent_email: String(formData.get("parent_email") ?? "").trim() || null,
    student_name: studentName,
    school_name: String(formData.get("school_name") ?? "").trim() || null,
    grade: String(formData.get("grade") ?? "").trim() || null,
    address_label: String(formData.get("address_label") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };

  await notifyAdmins({
    title: "📋 Nueva solicitud de inscripción",
    body: `${parentName} solicitó cupo para ${studentName}.`,
    url: "/admin/inscripciones",
  });

  return { error: "", success: true };
}
