"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status =
  | "checking"
  | "idle"
  | "subscribed"
  | "denied"
  | "unsupported"
  | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSubscription() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setStatus(existing ? "subscribed" : "idle");
    }

    checkExistingSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    setStatus("checking");

    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600">
        <BellRing className="size-3.5" />
        Notificaciones activadas
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={subscribe}
      disabled={status === "checking"}
    >
      <Bell />
      {status === "checking"
        ? "Cargando..."
        : status === "denied"
          ? "Permiso denegado — actívalo en el navegador"
          : status === "error"
            ? "No se pudo activar. Intenta de nuevo"
            : "Activar notificaciones"}
    </Button>
  );
}
