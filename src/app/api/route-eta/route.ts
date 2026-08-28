import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // Solo padre y admin la usan (el mapa en vivo del chofer no la llama) —
  // no hay datos sensibles de por medio, solo dos coordenadas que ya son
  // visibles en el mapa, pero cada llamada consume cuota de pago de Google
  // Maps, así que se restringe por rol y se limita la tasa por usuario.
  const profile = await getSessionProfile();
  if (profile.role !== "padre" && profile.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (isRateLimited(`route-eta:${profile.id}`, { max: 30, windowMs: 5 * 60_000 })) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const originLat = Number(searchParams.get("originLat"));
  const originLng = Number(searchParams.get("originLng"));
  const destLat = Number(searchParams.get("destLat"));
  const destLng = Number(searchParams.get("destLng"));

  if ([originLat, originLng, destLat, destLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Falta GOOGLE_MAPS_API_KEY.");
    return NextResponse.json(null);
  }

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
      destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    }),
  });

  if (!res.ok) return NextResponse.json(null);

  const data = (await res.json()) as {
    routes?: { duration?: string; distanceMeters?: number }[];
  };

  const route = data.routes?.[0];
  const durationSeconds = route?.duration ? Number(route.duration.replace("s", "")) : NaN;
  if (!route || Number.isNaN(durationSeconds)) return NextResponse.json(null);

  return NextResponse.json({
    distanceMeters: route.distanceMeters ?? null,
    durationSeconds,
  });
}
