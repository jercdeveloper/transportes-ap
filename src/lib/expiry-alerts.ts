import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/push";

const ALERT_WINDOW_DAYS = 15;

function daysUntil(date: string) {
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export async function sendExpiryAlerts() {
  const admin = createAdminClient();

  const [{ data: routes }, { data: drivers }] = await Promise.all([
    admin.from("routes").select("name, soat_expiry, tech_inspection_expiry"),
    admin
      .from("profiles")
      .select("full_name, license_expiry")
      .eq("role", "chofer"),
  ]);

  const alerts: string[] = [];

  for (const r of routes ?? []) {
    if (r.soat_expiry && daysUntil(r.soat_expiry) <= ALERT_WINDOW_DAYS) {
      alerts.push(`SOAT de "${r.name}" vence en ${daysUntil(r.soat_expiry)} día(s).`);
    }
    if (
      r.tech_inspection_expiry &&
      daysUntil(r.tech_inspection_expiry) <= ALERT_WINDOW_DAYS
    ) {
      alerts.push(
        `Tecnomecánica de "${r.name}" vence en ${daysUntil(r.tech_inspection_expiry)} día(s).`
      );
    }
  }

  for (const d of drivers ?? []) {
    if (d.license_expiry && daysUntil(d.license_expiry) <= ALERT_WINDOW_DAYS) {
      alerts.push(
        `Licencia de ${d.full_name} vence en ${daysUntil(d.license_expiry)} día(s).`
      );
    }
  }

  if (alerts.length === 0) return 0;

  await notifyAdmins({
    title: "📄 Documentos por vencer",
    body: alerts.join(" · "),
    url: "/admin",
  });

  return alerts.length;
}
