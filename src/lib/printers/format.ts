/**
 * format.ts (Equipos)
 * Formato de fecha/tiempo/peso/ids propio del módulo — duplica helpers mínimos de fecha en vez de
 * importar `lib/materials/format.ts` (mismo criterio ya usado entre módulos: cada uno de Producción
 * es independiente mientras no exista backend compartido).
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

/** Parsea "YYYY-MM-DD" como fecha local (evita el corrimiento de zona horaria de `new Date(iso)`). */
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

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso || !isValidIsoDate(iso)) return null;
  const ms = Date.now() - parseIsoDate(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
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

export function minutesToHours(totalMinutes: number): number {
  return totalMinutes / 60;
}

export function formatWeightG(grams: number): string {
  if (!Number.isFinite(grams)) return '0 g';
  const rounded = Math.round(grams);
  if (Math.abs(rounded) >= 1000) {
    return `${(rounded / 1000).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }
  return `${rounded} g`;
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || !Number.isFinite(amount)) return '—';
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyPerHour(amount: number | undefined): string {
  if (amount === undefined || !Number.isFinite(amount)) return '—';
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h`;
}

let printerSequence = 0;
let eventSequence = 0;

/** Ids de sesión — nunca colisionan con los ids demo (`printer-0xx`/`event-0xx`) por el prefijo `-new-`. */
export function generatePrinterId(): string {
  printerSequence += 1;
  return `printer-new-${Date.now().toString(36)}-${printerSequence}`;
}

export function generateMaintenanceEventId(): string {
  eventSequence += 1;
  return `event-new-${Date.now().toString(36)}-${eventSequence}`;
}
