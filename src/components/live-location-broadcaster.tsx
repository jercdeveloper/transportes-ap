"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { distanceMeters } from "@/lib/geo";

const MIN_INTERVAL_MS = 4000;
const NEAR_STOP_METERS = 300;

export function LiveLocationBroadcaster({
  tripId,
  active,
  stops = [],
  onNearStop,
}: {
  tripId: string;
  active: boolean;
  stops?: { studentId: string; lat: number; lng: number }[];
  onNearStop?: (studentId: string) => void;
}) {
  const [status, setStatus] = useState<"connecting" | "sharing" | "error">(
    "connecting"
  );
  const notifiedStopsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!active) return;

    const supabase = createClient();
    const channel = supabase.channel(`trip-${tripId}`, {
      config: { broadcast: { self: false } },
    });

    let watchId: number | null = null;
    let lastSentAt = 0;

    channel.subscribe((subscribeStatus) => {
      if (subscribeStatus !== "SUBSCRIBED") return;

      if (!navigator.geolocation) {
        setStatus("error");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          for (const stop of stops) {
            if (notifiedStopsRef.current.has(stop.studentId)) continue;
            if (distanceMeters(pos, stop) <= NEAR_STOP_METERS) {
              notifiedStopsRef.current.add(stop.studentId);
              onNearStop?.(stop.studentId);
            }
          }

          if (now - lastSentAt < MIN_INTERVAL_MS) return;
          lastSentAt = now;

          channel.send({
            type: "broadcast",
            event: "location",
            payload: pos,
          });
          setStatus("sharing");
        },
        () => setStatus("error"),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    });

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, active]);

  if (!active) return null;

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === "sharing" && (
        <>
          <MapPin className="size-3.5 text-primary" />
          Compartiendo tu ubicación en vivo
        </>
      )}
      {status === "connecting" && "Conectando para compartir ubicación..."}
      {status === "error" &&
        "No se pudo acceder a tu ubicación. Revisa los permisos de ubicación del navegador."}
    </p>
  );
}
