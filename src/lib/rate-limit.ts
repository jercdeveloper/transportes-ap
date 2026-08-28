import "server-only";

// Limitador simple en memoria, por instancia de función serverless. No es
// perfecto bajo alta escala (cada instancia tiene su propio contador), pero
// para el volumen real de esta app basta para frenar abuso casual de
// endpoints que consumen cuota de pago (Google Maps) o que aceptan envíos
// públicos sin autenticación.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const now = Date.now();

  // Limpieza oportunista para no acumular entradas vencidas indefinidamente.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }

  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}
