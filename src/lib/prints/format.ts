/**
 * format.ts (Impresiones)
 * Formato de fecha/tiempo/peso/ids propio del módulo — mismo criterio que lib/printers/format.ts:
 * cada módulo de Producción es independiente mientras no exista backend compartido.
 */

const MONTHS_ABBR = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

export function todayIso(): string {
  return dateToIso(new Date());
}

export function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function isValidIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return dateToIso(parseIsoDate(iso)) === iso;
}

/** "17 ago. 2026" */
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso || !isValidIsoDate(iso)) return '—';
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTHS_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

/** "18 h 30 min" / "45 min" — nunca decimales confusos de hora. */
export function formatMinutesAsHours(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0 h';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatWeightG(grams: number): string {
  if (!Number.isFinite(grams)) return '0 g';
  const rounded = Math.round(grams);
  if (Math.abs(rounded) >= 1000) {
    return `${(rounded / 1000).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }
  return `${rounded} g`;
}

let printSequence = 0;

/** Ids de sesión — nunca colisionan con ids demo por el prefijo `-new-`. */
export function generatePrintId(): string {
  printSequence += 1;
  return `print-new-${Date.now().toString(36)}-${printSequence}`;
}

/** "IMP-0001" — correlativo visible en historial/detalle, calculado sobre los registros existentes
 * (nunca un contador aparte que pueda desincronizarse). */
export function nextDisplayId(existing: { displayId: string }[]): string {
  const numbers = existing.map((p) => Number(p.displayId.replace(/^IMP-/, ''))).filter((n) => Number.isFinite(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `IMP-${String(next).padStart(4, '0')}`;
}
