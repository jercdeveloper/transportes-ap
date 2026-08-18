import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const SIBLING_DISCOUNT_PERCENT = 10;

// El primer hijo (por fecha de registro) paga la tarifa completa; los
// siguientes hermanos del mismo padre/madre reciben el descuento.
export function resolveFeesWithSiblingDiscount(
  students: { id: string; parent_id: string; default_fee: number | null; created_at: string }[]
): Map<string, number> {
  const byParent = new Map<string, typeof students>();
  for (const s of students) {
    const list = byParent.get(s.parent_id) ?? [];
    list.push(s);
    byParent.set(s.parent_id, list);
  }

  const feeByStudent = new Map<string, number>();
  for (const siblings of byParent.values()) {
    const sorted = [...siblings].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    sorted.forEach((s, index) => {
      const base = s.default_fee ?? 0;
      const fee =
        index === 0 ? base : Math.round(base * (1 - SIBLING_DISCOUNT_PERCENT / 100));
      feeByStudent.set(s.id, fee);
    });
  }

  return feeByStudent;
}

export async function generateMonthlyPayments(period: string) {
  const admin = createAdminClient();

  const [{ data: students }, { data: existing }] = await Promise.all([
    admin.from("students").select("id, parent_id, default_fee, created_at"),
    admin.from("payments").select("student_id").eq("period", period),
  ]);

  const existingIds = new Set((existing ?? []).map((p) => p.student_id));
  const pending = (students ?? []).filter((s) => !existingIds.has(s.id));
  if (pending.length === 0) return 0;

  const feeByStudent = resolveFeesWithSiblingDiscount(students ?? []);

  const rows = pending.map((s) => ({
    student_id: s.id,
    period,
    amount: feeByStudent.get(s.id) ?? s.default_fee ?? 0,
    status: "pendiente" as const,
  }));

  const { error } = await admin.from("payments").insert(rows);
  if (error) throw new Error(error.message);

  return rows.length;
}
