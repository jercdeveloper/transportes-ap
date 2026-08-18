"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [2.4448, -76.6147]; // Popayán, Cauca

function numberedIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#4f46e5;color:white;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
  }, [map, points]);

  return null;
}

export function RouteOverviewMap({
  stops,
}: {
  stops: { lat: number; lng: number; label: string; order: number }[];
}) {
  const points = stops.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border border-input">
      <MapContainer
        center={points[0] ?? DEFAULT_CENTER}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {stops.map((s, i) => (
          <Marker key={i} position={[s.lat, s.lng]} icon={numberedIcon(s.order)}>
            <Popup>
              {s.order}. {s.label}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
