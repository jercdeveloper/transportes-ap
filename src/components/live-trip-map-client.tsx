"use client";

import dynamic from "next/dynamic";

export const LiveTripMapClient = dynamic(
  () => import("@/components/live-trip-map").then((m) => m.LiveTripMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full items-center justify-center rounded-lg border border-input text-sm text-muted-foreground">
        Cargando mapa...
      </div>
    ),
  }
);
