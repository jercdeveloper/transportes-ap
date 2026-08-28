// La búsqueda real ocurre en /api/geocode (servidor) — así la clave de
// Google nunca se expone al navegador, siguiendo la recomendación de Google
// para la Geocoding API (a diferencia del Maps JavaScript API, esta no
// necesita correr en el cliente).
export async function searchAddress(
  query: string,
  signal: AbortSignal
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) return null;

  return (await res.json()) as { lat: number; lng: number; displayName: string } | null;
}
