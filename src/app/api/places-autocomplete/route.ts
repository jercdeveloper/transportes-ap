import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

const REGION_HINT = "Popayán, Cauca, Colombia";
const POPAYAN_CENTER = { latitude: 2.4448, longitude: -76.6064 };

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("q");
  if (!input) return NextResponse.json([]);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Falta GOOGLE_MAPS_API_KEY.");
    return NextResponse.json([]);
  }

  const query = input.toLowerCase().includes("popay") ? input : `${input}, ${REGION_HINT}`;

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["co"],
      locationBias: {
        circle: { center: POPAYAN_CENTER, radius: 15000 },
      },
    }),
  });

  if (!res.ok) return NextResponse.json([]);

  const data = (await res.json()) as {
    suggestions?: { placePrediction?: { placeId: string; text: { text: string } } }[];
  };

  const suggestions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is { placeId: string; text: { text: string } } => Boolean(p))
    .map((p) => ({ placeId: p.placeId, text: p.text.text }));

  return NextResponse.json(suggestions);
}
