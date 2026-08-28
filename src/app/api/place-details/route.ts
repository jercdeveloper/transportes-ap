import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json(null);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Falta GOOGLE_MAPS_API_KEY.");
    return NextResponse.json(null);
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "location,formattedAddress",
      },
    }
  );

  if (!res.ok) return NextResponse.json(null);

  const data = (await res.json()) as {
    location?: { latitude: number; longitude: number };
    formattedAddress?: string;
  };

  if (!data.location) return NextResponse.json(null);

  return NextResponse.json({
    lat: data.location.latitude,
    lng: data.location.longitude,
    displayName: data.formattedAddress ?? "",
  });
}
