const REGION_HINT = "Popayán, Cauca, Colombia";
// Centro aproximado de Popayán: sesga los resultados hacia la ciudad en vez
// de devolver la calle homónima más cercana en cualquier otra parte de Colombia.
const POPAYAN_PROXIMITY = "-76.6064,2.4448";

export async function searchAddress(
  query: string,
  signal: AbortSignal
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.error("Falta NEXT_PUBLIC_MAPBOX_TOKEN — no se puede buscar la dirección.");
    return null;
  }

  const q = query.toLowerCase().includes("popayán") || query.toLowerCase().includes("popayan")
    ? query
    : `${query}, ${REGION_HINT}`;

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodeURIComponent(q)}` +
    `&country=co` +
    `&proximity=${POPAYAN_PROXIMITY}` +
    `&limit=1` +
    `&access_token=${token}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    features: {
      geometry: { coordinates: [number, number] };
      properties: { full_address?: string; name?: string; place_formatted?: string };
    }[];
  };

  const feature = data.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates;
  const displayName =
    feature.properties.full_address ??
    [feature.properties.name, feature.properties.place_formatted].filter(Boolean).join(", ");

  return { lat, lng, displayName };
}
