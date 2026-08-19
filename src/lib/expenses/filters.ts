/**
 * filters.ts
 * Filtrado/búsqueda y resumen numérico de Finanzas → Gastos. Una sola fuente para que la
 * toolbar, el listado y el resumen superior lean siempre el mismo criterio — nada de lógica de
 * filtro duplicada entre componentes.
 */
import type { Expense, ExpenseCategory, ExpenseDestination, ExpenseDocumentType, ExpensePaymentMethod } from '../../data/admin/expenses.types';
import { inPeriod, type PeriodState } from './period';

export type TriState = 'all' | 'with' | 'without';

/**
 * El rango de fechas ya no vive acá — lo gobierna el control Mensual/Trimestral superior (ver
 * lib/expenses/period.ts), fuente única de periodo. Estos filtros solo restringen más el
 * resultado dentro de ese periodo (categoría/destino/medio/comprobante/movilidad/monto/búsqueda).
 */
export interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | 'all';
  destination: ExpenseDestination | 'all';
  paymentMethod: ExpensePaymentMethod | 'all';
  supplier: string;
  documentType: ExpenseDocumentType | 'all';
  receiptState: TriState;
  mobilityState: TriState;
  amountMin: number | null;
  amountMax: number | null;
}

export function defaultFilters(): ExpenseFilters {
  return {
    search: '',
    category: 'all',
    destination: 'all',
    paymentMethod: 'all',
    supplier: '',
    documentType: 'all',
    receiptState: 'all',
    mobilityState: 'all',
    amountMin: null,
    amountMax: null,
  };
}

function matchesSearch(expense: Expense, query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return [expense.concept, expense.supplier, expense.documentNumber, expense.notes]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}

export function matchesFilters(expense: Expense, filters: ExpenseFilters): boolean {
  if (!matchesSearch(expense, filters.search)) return false;
  if (filters.category !== 'all' && expense.category !== filters.category) return false;
  if (filters.destination !== 'all' && expense.destination !== filters.destination) return false;
  if (filters.paymentMethod !== 'all' && expense.paymentMethod !== filters.paymentMethod) return false;
  if (filters.documentType !== 'all' && expense.documentType !== filters.documentType) return false;
  if (filters.supplier.trim() && !(expense.supplier ?? '').toLowerCase().includes(filters.supplier.trim().toLowerCase())) return false;
  if (filters.receiptState === 'with' && expense.documentType === 'none') return false;
  if (filters.receiptState === 'without' && expense.documentType !== 'none') return false;
  if (filters.mobilityState === 'with' && !expense.hasMobility) return false;
  if (filters.mobilityState === 'without' && expense.hasMobility) return false;
  if (filters.amountMin !== null && expense.totalAmount < filters.amountMin) return false;
  if (filters.amountMax !== null && expense.totalAmount > filters.amountMax) return false;
  return true;
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  return expenses.filter((expense) => matchesFilters(expense, filters));
}

/** Aplica primero el periodo activo (fuente única) y luego los filtros adicionales. */
export function filterExpensesForPeriod(expenses: Expense[], period: PeriodState, filters: ExpenseFilters): Expense[] {
  return expenses.filter((expense) => inPeriod(expense.date, period) && matchesFilters(expense, filters));
}

export function sortByDateDesc(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function hasActiveFilters(filters: ExpenseFilters): boolean {
  const defaults = defaultFilters();
  return (Object.keys(defaults) as (keyof ExpenseFilters)[]).some((key) => filters[key] !== defaults[key]);
}

export interface ExpenseSummary {
  totalAmount: number;
  count: number;
  productionAmount: number;
  operationAmount: number;
}

/**
 * Producción = suma de gastos cuyo destino es "Producción" (fabricación en sí).
 * Operación = todo lo demás (general, administración, producto, custom) — el costo de mantener
 * KUBO funcionando fuera del taller. Ambos se calculan sobre exactamente el mismo dataset
 * visible/filtrado que el listado, nunca sobre el total sin filtrar.
 */
export function summarize(expenses: Expense[]): ExpenseSummary {
  return expenses.reduce<ExpenseSummary>(
    (acc, expense) => {
      acc.totalAmount += expense.totalAmount;
      acc.count += 1;
      if (expense.destination === 'production') acc.productionAmount += expense.totalAmount;
      else acc.operationAmount += expense.totalAmount;
      return acc;
    },
    { totalAmount: 0, count: 0, productionAmount: 0, operationAmount: 0 }
  );
}
