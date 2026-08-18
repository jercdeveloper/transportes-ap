import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function sendPaymentReminders(period: string) {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("payments")
    .select("amount, students(full_name, parent_id)")
    .eq("period", period)
    .eq("status", "pendiente");

  let sent = 0;

  await Promise.all(
    (pending ?? []).map(async (p) => {
      if (!p.students?.parent_id) return;
      await sendPushToUser(
        p.students.parent_id,
        {
          title: "💳 Recordatorio de pago",
          body: `El pago de ${period} de ${p.students.full_name} (${amountLabel(p.amount)}) sigue pendiente.`,
          url: "/padre",
        },
        "payment_reminder"
      );
      sent += 1;
    })
  );

  return sent;
}

function amountLabel(amount: number) {
  return `$${amount.toLocaleString("es-CO")}`;
}
