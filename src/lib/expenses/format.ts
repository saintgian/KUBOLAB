/**
 * format.ts
 * Formato de fecha/moneda/ids para Finanzas → Gastos. Centralizado para que el formulario, el
 * listado, el detalle y la exportación muestren exactamente el mismo formato.
 */

const MONTHS_ABBR = [
  'ene.',
  'feb.',
  'mar.',
  'abr.',
  'may.',
  'jun.',
  'jul.',
  'ago.',
  'sep.',
  'oct.',
  'nov.',
  'dic.',
];

const MONTHS_FULL = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** YYYY-MM-DD del día actual en la zona horaria local del navegador. */
export function todayIso(): string {
  const now = new Date();
  return dateToIso(now);
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
  const date = parseIsoDate(iso);
  return dateToIso(date) === iso;
}

/** "17 ago. 2026" */
export function formatDateLong(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTHS_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

/** "17 AGO" — usado en la tarjeta mobile del listado. */
export function formatDateShort(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTHS_ABBR[date.getMonth()].replace('.', '').toUpperCase()}`;
}

/** "17 ago." — fecha compacta sin año, para metadata (ej. "Próxima necesidad" de Compras). */
export function formatDateCompact(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTHS_ABBR[date.getMonth()]}`;
}

/** "17 de agosto de 2026" — usado por el calendario para anunciar el mes visible. */
export function formatMonthYear(date: Date): string {
  return `${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

/** "S/ 118.00" */
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return 'S/ 0.00';
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let expenseSequence = 0;

/** Id de sesión — nunca colisiona con los ids demo (`exp-0xx`) por el prefijo `exp-new-`. */
export function generateExpenseId(): string {
  expenseSequence += 1;
  return `exp-new-${Date.now().toString(36)}-${expenseSequence}`;
}
