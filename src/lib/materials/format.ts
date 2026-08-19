/**
 * format.ts (Materiales)
 * Formato de fecha/peso/ids propio del módulo — duplica helpers mínimos de fecha en vez de
 * importar `lib/expenses/format.ts` (mismo criterio que `lib/pending-purchases/model.ts` con su
 * propio generador de id): Materiales no depende de Finanzas todavía (ver spec §16).
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

/** "17 AGO" — tarjeta mobile del listado. */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso || !isValidIsoDate(iso)) return '—';
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTHS_ABBR[date.getMonth()].replace('.', '').toUpperCase()}`;
}

/** "2.43 kg" si >= 1000 g, "430 g" si no — nunca mezcla unidades a media palabra. */
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

let profileSequence = 0;
let spoolSequence = 0;
let movementSequence = 0;

/** Ids de sesión — nunca colisionan con los ids demo (`mat-0xx`/`spool-0xx`/`mov-0xx`) por el prefijo `-new-`. */
export function generateProfileId(): string {
  profileSequence += 1;
  return `mat-new-${Date.now().toString(36)}-${profileSequence}`;
}

export function generateSpoolId(): string {
  spoolSequence += 1;
  return `spool-new-${Date.now().toString(36)}-${spoolSequence}`;
}

export function generateMovementId(): string {
  movementSequence += 1;
  return `mov-new-${Date.now().toString(36)}-${movementSequence}`;
}
