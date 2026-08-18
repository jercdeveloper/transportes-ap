"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { createClient } from "@/lib/supabase/client";
import { distanceMeters, formatDistance } from "@/lib/geo";

const DEFAULT_CENTER: [number, number] = [2.4448, -76.6147]; // Popayán, Cauca
const MIN_TRUSTED_SPEED_MPS = 0.3; // ~1 km/h: por debajo es ruido del GPS parado
const MAX_TRUSTED_SPEED_MPS = 40; // ~144 km/h: por encima es un salto raro de GPS

const BUS_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 6 2 7"/>
    <path d="M10 6h4"/>
    <path d="m22 7-2-1"/>
    <rect width="16" height="16" x="4" y="3" rx="2"/>
    <path d="M4 11h16"/>
    <path d="M8 15h.01"/>
    <path d="M16 15h.01"/>
    <path d="M6 19v2"/>
    <path d="M18 21v-2"/>
  </svg>
`;

const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#4f46e5;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)">${BUS_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const stopIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#64748b;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitOnFirstBusPosition({
  busPos,
  stops,
}: {
  busPos: { lat: number; lng: number } | null;
  stops: { lat: number; lng: number }[];
}) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (!busPos || hasFitRef.current) return;
    hasFitRef.current = true;

    const points: [number, number][] = [
      [busPos.lat, busPos.lng],
      ...stops.map((s) => [s.lat, s.lng] as [number, number]),
    ];
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [map, busPos, stops]);

  return null;
}

function formatEtaMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "menos de 1 min";
  return `~${minutes} min`;
}

export function LiveTripMap({
  tripId,
  stops,
}: {
  tripId: string;
  stops: { lat: number; lng: number; label: string }[];
}) {
  const [busPos, setBusPos] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [speedMps, setSpeedMps] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const lastPosRef = useRef<{ lat: number; lng: number; ts: number } | null>(
    null
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`trip-${tripId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "location" }, ({ payload }) => {
        const newPos = { lat: payload.lat, lng: payload.lng };
        const now = Date.now();
        const prev = lastPosRef.current;

        if (prev) {
          const elapsedSeconds = (now - prev.ts) / 1000;
          if (elapsedSeconds > 0.5) {
            const speed = distanceMeters(prev, newPos) / elapsedSeconds;
            if (speed > MIN_TRUSTED_SPEED_MPS && speed < MAX_TRUSTED_SPEED_MPS) {
              setSpeedMps(speed);
            }
          }
        }

        lastPosRef.current = { ...newPos, ts: now };
        setBusPos(newPos);
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const distanceToStop =
    busPos && stops[0] ? distanceMeters(busPos, stops[0]) : null;
  const etaText =
    distanceToStop != null && speedMps
      ? formatEtaMinutes(distanceToStop / speedMps)
      : null;

  return (
    <div className="space-y-1">
      <div className="h-80 w-full overflow-hidden rounded-lg border border-input">
        <MapContainer
          center={stops[0] ? [stops[0].lat, stops[0].lng] : DEFAULT_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitOnFirstBusPosition busPos={busPos} stops={stops} />
          {stops.map((s, i) => (
            <Marker key={i} position={[s.lat, s.lng]} icon={stopIcon}>
              <Popup>{s.label}</Popup>
            </Marker>
          ))}
          {busPos && (
            <Marker position={[busPos.lat, busPos.lng]} icon={busIcon}>
              <Popup>Bus</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {busPos && (
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        )}
        {busPos
          ? distanceToStop != null
            ? `A ${formatDistance(distanceToStop)} de la parada${etaText ? ` · ${etaText}` : ""}`
            : "Ubicación del bus en vivo"
          : connected
            ? "Conectado, esperando la ubicación del bus..."
            : "Conectando..."}
      </p>
    </div>
  );
}
