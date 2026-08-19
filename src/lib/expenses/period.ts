/**
 * period.ts
 * Fuente única del periodo activo (Mensual/Trimestral) de Finanzas → Gastos. `ExpensesWorkspace`
 * es dueño de un único `PeriodState`; resumen, chart, listado por defecto, compras pendientes por
 * defecto y el diálogo de exportación leen todos el mismo rango — nunca se duplica el estado de
 * periodo entre componentes (ver requisito "fuente única de periodo").
 */
import { dateToIso } from './format';

export type PeriodMode = 'monthly' | 'quarterly';

export interface PeriodState {
  mode: PeriodMode;
  year: number;
  /** 0-11, solo relevante en modo mensual. */
  month: number;
  /** 1-4, solo relevante en modo trimestral. */
  quarter: number;
}

const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_NAMES_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const QUARTER_MONTHS: Record<number, [number, number]> = { 1: [0, 2], 2: [3, 5], 3: [6, 8], 4: [9, 11] };

export function currentPeriod(mode: PeriodMode = 'monthly'): PeriodState {
  const now = new Date();
  return { mode, year: now.getFullYear(), month: now.getMonth(), quarter: Math.floor(now.getMonth() / 3) + 1 };
}

export function periodRange(period: PeriodState): { from: string; to: string } {
  if (period.mode === 'monthly') {
    const from = new Date(period.year, period.month, 1);
    const to = new Date(period.year, period.month + 1, 0);
    return { from: dateToIso(from), to: dateToIso(to) };
  }
  const [startMonth, endMonth] = QUARTER_MONTHS[period.quarter];
  const from = new Date(period.year, startMonth, 1);
  const to = new Date(period.year, endMonth + 1, 0);
  return { from: dateToIso(from), to: dateToIso(to) };
}

/** "Agosto 2026" o "T3 · 2026" */
export function periodLabel(period: PeriodState): string {
  if (period.mode === 'monthly') return `${MONTH_NAMES_FULL[period.month]} ${period.year}`;
  return `T${period.quarter} · ${period.year}`;
}

/** "Jul — Sep", solo aplica en modo trimestral. */
export function periodSubLabel(period: PeriodState): string | null {
  if (period.mode !== 'quarterly') return null;
  const [startMonth, endMonth] = QUARTER_MONTHS[period.quarter];
  return `${MONTH_NAMES_ABBR[startMonth]} — ${MONTH_NAMES_ABBR[endMonth]}`;
}

export function shiftPeriod(period: PeriodState, direction: 1 | -1): PeriodState {
  if (period.mode === 'monthly') {
    let month = period.month + direction;
    let year = period.year;
    if (month > 11) {
      month = 0;
      year += 1;
    } else if (month < 0) {
      month = 11;
      year -= 1;
    }
    return { ...period, month, year };
  }
  let quarter = period.quarter + direction;
  let year = period.year;
  if (quarter > 4) {
    quarter = 1;
    year += 1;
  } else if (quarter < 1) {
    quarter = 4;
    year -= 1;
  }
  return { ...period, quarter, year };
}

/** Cambia de modo conservando el mismo momento del calendario (mes actual <-> su trimestre). */
export function setPeriodMode(period: PeriodState, mode: PeriodMode): PeriodState {
  if (period.mode === mode) return period;
  if (mode === 'quarterly') return { ...period, mode, quarter: Math.floor(period.month / 3) + 1 };
  const [startMonth] = QUARTER_MONTHS[period.quarter];
  return { ...period, mode, month: startMonth };
}

export function inPeriod(dateIso: string, period: PeriodState): boolean {
  const { from, to } = periodRange(period);
  return dateIso >= from && dateIso <= to;
}
