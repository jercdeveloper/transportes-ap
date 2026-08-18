"use server";

import { requireRole } from "@/lib/auth";
import { sendExpiryAlerts } from "@/lib/expiry-alerts";

export async function sendExpiryAlertsNow() {
  await requireRole("admin");
  const count = await sendExpiryAlerts();
  return {
    message:
      count > 0
        ? `Se encontraron ${count} documento(s) por vencer, se envió la notificación.`
        : "No hay documentos por vencer en los próximos 15 días.",
  };
}
