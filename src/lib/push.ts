import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configurado de forma perezosa (no al cargar el módulo): Next.js evalúa
// este módulo al recolectar datos de cada ruta durante el build, incluso
// para rutas que nunca llegan a enviar un push — si las variables VAPID no
// estuvieran disponibles en ese momento, el build entero fallaría por algo
// que en realidad es un problema de runtime, no de compilación.
let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidConfigured = true;
}

export async function notifyAdmins(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  await Promise.all(
    (admins ?? []).map((a) => sendPushToUser(a.id, payload))
  );
}

export type NotificationKind =
  | "trip_start"
  | "pickup_dropoff"
  | "announcement"
  | "payment_reminder";

const KIND_PREFERENCE_COLUMN: Record<NotificationKind, string> = {
  trip_start: "notify_trip_start",
  pickup_dropoff: "notify_pickup_dropoff",
  announcement: "notify_announcements",
  payment_reminder: "notify_payment_reminders",
};

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
  kind?: NotificationKind
) {
  const admin = createAdminClient();

  if (kind) {
    const column = KIND_PREFERENCE_COLUMN[kind];
    const { data: profile } = await admin
      .from("profiles")
      .select(column)
      .eq("id", userId)
      .single();
    const allowed = (profile as Record<string, boolean> | null)?.[column];
    if (allowed === false) return;
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  ensureVapidConfigured();

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
