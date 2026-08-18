import { Bell } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateNotificationPreferences } from "./actions";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  chofer: "/chofer",
  padre: "/padre",
};

const OPTIONS = [
  {
    name: "notify_trip_start",
    label: "El bus inició su recorrido / está cerca",
  },
  {
    name: "notify_pickup_dropoff",
    label: "Recogida y entrega de mi hijo/a",
  },
  {
    name: "notify_announcements",
    label: "Avisos generales de administración",
  },
  {
    name: "notify_payment_reminders",
    label: "Recordatorios de pago pendiente",
  },
] as const;

export default async function NotificacionesPage() {
  const profile = await getSessionProfile();
  const home = ROLE_HOME[profile.role] ?? "/";
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "notify_trip_start, notify_pickup_dropoff, notify_announcements, notify_payment_reminders"
    )
    .eq("id", profile.id)
    .single();

  return (
    <div className="mx-auto max-w-sm space-y-4 px-4 py-6">
      <BackLink href={home} label="Volver" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Preferencias de notificación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNotificationPreferences} className="space-y-4">
            {OPTIONS.map((opt) => (
              <label key={opt.name} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name={opt.name}
                  defaultChecked={data?.[opt.name] ?? true}
                  className="size-4 accent-primary"
                />
                {opt.label}
              </label>
            ))}
            <Button type="submit" className="w-full">
              Guardar preferencias
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
