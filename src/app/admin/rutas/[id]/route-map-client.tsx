"use client";

import dynamic from "next/dynamic";

const RouteOverviewMap = dynamic(
  () => import("@/components/route-overview-map").then((m) => m.RouteOverviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center rounded-lg border border-input text-sm text-muted-foreground">
        Cargando mapa...
      </div>
    ),
  }
);

export { RouteOverviewMap as RouteMapClient };
