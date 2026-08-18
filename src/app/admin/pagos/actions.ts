"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPaymentReminders } from "@/lib/payment-reminders";
import { generateMonthlyPayments } from "@/lib/payments";
import { logAudit } from "@/lib/audit";
import type { PaymentStatus } from "@/lib/supabase/types";

export async function setPayment(
  studentId: string,
  period: string,
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const amount = Number(formData.get("amount"));
  const lateFeeRaw = Number(formData.get("late_fee"));
  const lateFee = Number.isNaN(lateFeeRaw) ? 0 : lateFeeRaw;
  const status = String(formData.get("status") ?? "pendiente") as PaymentStatus;

  if (Number.isNaN(amount)) return { error: "El monto no es válido." };

  const { error } = await supabase.from("payments").upsert(
    {
      student_id: studentId,
      period,
      amount,
      late_fee: lateFee,
      status,
      paid_at: status === "pagado" ? new Date().toISOString() : null,
    },
    { onConflict: "student_id,period" }
  );
  if (error) return { error: "No se pudo guardar el pago: " + error.message };

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .single();

  await logAudit({
    actorId: profile.id,
    actorName: profile.full_name,
    action: "editar",
    entityType: "pago",
    entityLabel: `${student?.full_name ?? "alumno"} — ${period}`,
  });

  revalidatePath("/admin/pagos");
}

export async function sendReminders(period: string) {
  await requireRole("admin");
  const count = await sendPaymentReminders(period);
  return {
    message:
      count > 0
        ? `Se enviaron ${count} recordatorio(s) de pago pendiente.`
        : "No hay pagos pendientes este mes.",
  };
}

export async function generatePayments(period: string) {
  await requireRole("admin");
  const count = await generateMonthlyPayments(period);
  return {
    message:
      count > 0
        ? `Se generaron ${count} pago(s) pendiente(s) para ${period}.`
        : "Todos los alumnos ya tenían un pago registrado este periodo.",
  };
}
