export function daysUntil(date: string): number {
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export function isoTimeAgo(milliseconds: number): string {
  return new Date(Date.now() - milliseconds).toISOString();
}
