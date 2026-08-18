const REGION_HINT = "Popayán, Cauca, Colombia";

export async function searchAddress(
  query: string,
  signal: AbortSignal
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const q = query.toLowerCase().includes("popayán") || query.toLowerCase().includes("popayan")
    ? query
    : `${query}, ${REGION_HINT}`;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=co&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!results.length) return null;

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    displayName: results[0].display_name,
  };
}
