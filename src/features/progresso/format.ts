export function formatarPct(v: number | null): string {
  if (v === null || Number.isNaN(v)) return '—';
  return `${Math.round(v * 100)}%`;
}

export function formatarDuracao(seg: number): string {
  const min = Math.round(seg / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
