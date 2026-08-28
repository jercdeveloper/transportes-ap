import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

const REGION_HINT = "Popayán, Cauca, Colombia";
// Cuadro aproximado de Popayán (suroeste|noreste): sesga los resultados
// hacia la ciudad en vez de devolver la calle homónima más cercana en
// cualquier otra parte de Colombia.
const POPAYAN_BOUNDS = "2.35,-76.65|2.55,-76.50";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Falta GOOGLE_MAPS_API_KEY — no se puede buscar la dirección.");
    return NextResponse.json(null);
  }

  const address = query.toLowerCase().includes("popayán") || query.toLowerCase().includes("popayan")
    ? query
    : `${query}, ${REGION_HINT}`;

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&components=country:CO` +
    `&bounds=${POPAYAN_BOUNDS}` +
    `&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json(null);

  const data = (await res.json()) as {
    status: string;
    results: {
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }[];
  };

  if (data.status !== "OK" || !data.results.length) return NextResponse.json(null);

  const result = data.results[0];
  return NextResponse.json({
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    displayName: result.formatted_address,
  });
}
