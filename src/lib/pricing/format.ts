/**
 * format.ts (Calculadora de precios)
 * Formato numérico propio de la calculadora — moneda se reutiliza de Finanzas → Gastos
 * (`formatCurrency`) para no duplicar la lógica de S/ ya validada en ese módulo.
 */
export { formatCurrency } from '../expenses/format';

export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0%';
  return `${(value * 100).toLocaleString('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

export function formatGrams(value: number): string {
  if (!Number.isFinite(value)) return '0 g';
  return `${value.toLocaleString('es-PE', { maximumFractionDigits: 1 })} g`;
}

export function formatHours(value: number): string {
  if (!Number.isFinite(value)) return '0 h';
  return `${value.toLocaleString('es-PE', { maximumFractionDigits: 2 })} h`;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** "18 ago 2026, 3:45 p. m." — fecha y hora legible para Perú, usada por Historial y Copiar resumen
 * (spec §36). Recibe un ISO 8601 completo (con hora), no una fecha `YYYY-MM-DD` sola. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return DATE_TIME_FORMATTER.format(date).replace(/\.,/, ',');
}

export function nowIso(): string {
  return new Date().toISOString();
}
