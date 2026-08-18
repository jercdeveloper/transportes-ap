"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#4f46e5;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const existingStopIcon = L.divIcon({
  className: "",
  html: '<div style="width:10px;height:10px;border-radius:50%;background:#94a3b8;border:2px solid white"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const DEFAULT_CENTER: [number, number] = [2.4448, -76.6147]; // Popayán, Cauca

function ClickHandler({
  onPick,
  skipNextRecenterRef,
}: {
  onPick: (lat: number, lng: number) => void;
  skipNextRecenterRef: React.MutableRefObject<boolean>;
}) {
  useMapEvents({
    click(e) {
      skipNextRecenterRef.current = true;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({
  lat,
  lng,
  skipNextRecenterRef,
}: {
  lat: number | null;
  lng: number | null;
  skipNextRecenterRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null) return;
    if (skipNextRecenterRef.current) {
      skipNextRecenterRef.current = false;
      return;
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
    // Solo debe reaccionar a cambios de lat/lng, no a movimientos del mapa en sí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return null;
}

export function StopMapPicker({
  lat,
  lng,
  onChange,
  existingStops = [],
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  existingStops?: { lat: number; lng: number; label: string }[];
}) {
  const skipNextRecenterRef = useRef(false);
  const [center, setCenter] = useState<[number, number]>(
    lat != null && lng != null
      ? [lat, lng]
      : existingStops.length > 0
        ? [existingStops[0].lat, existingStops[0].lng]
        : DEFAULT_CENTER
  );

  useEffect(() => {
    if (lat != null || lng != null || existingStops.length > 0) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter([pos.coords.latitude, pos.coords.longitude]);
    });
    // Solo al montar: centra una vez con la ubicación del navegador si no hay pistas mejores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border border-input">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} skipNextRecenterRef={skipNextRecenterRef} />
        <RecenterOnChange lat={lat} lng={lng} skipNextRecenterRef={skipNextRecenterRef} />
        {existingStops.map((s, i) => (
          <Marker key={i} position={[s.lat, s.lng]} icon={existingStopIcon}>
            <Popup>{s.label}</Popup>
          </Marker>
        ))}
        {lat != null && lng != null && (
          <Marker position={[lat, lng]} icon={pinIcon} />
        )}
      </MapContainer>
    </div>
  );
}
