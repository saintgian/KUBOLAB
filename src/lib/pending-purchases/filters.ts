/**
 * filters.ts (Compras pendientes)
 * Filtrado/orden/resumen de Compras pendientes — misma idea que lib/expenses/filters.ts, pero
 * sin periodo (las compras pendientes no están atadas al Mensual/Trimestral de Gastos: son cosas
 * por comprar, no egresos con fecha real). El estado por defecto solo muestra
 * Pendiente/Cotizando/Aprobada — Comprada/Cancelada quedan detrás del filtro "Estado".
 */
import type { PendingPurchase, PurchasePriority, PurchaseStatus } from '../../data/admin/pending-purchases.types';
import type { ExpenseCategory, ExpenseDestination } from '../../data/admin/expenses.types';
import { DEFAULT_VISIBLE_STATUSES, priorityRank } from '../../data/admin/pending-purchases.constants';

export type PurchaseStatusFilter = 'active' | 'all' | PurchaseStatus;

export interface PendingPurchaseFilters {
  search: string;
  priority: PurchasePriority | 'all';
  status: PurchaseStatusFilter;
  category: ExpenseCategory | 'all';
  destination: ExpenseDestination | 'all';
  neededByTo: string;
}

export function defaultPurchaseFilters(): PendingPurchaseFilters {
  return {
    search: '',
    priority: 'all',
    status: 'active',
    category: 'all',
    destination: 'all',
    neededByTo: '',
  };
}

function matchesSearch(purchase: PendingPurchase, query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return [purchase.title, purchase.preferredSupplier, purchase.notes].filter((v): v is string => Boolean(v)).some((v) => v.toLowerCase().includes(needle));
}

/** Único punto de verdad de "qué cuenta como compra activa" (En revisión + Pendiente + Cotizando +
 * Aprobada) — lo reutilizan el filtro "Activas" por defecto y el resumen "Compras activas", para
 * no mantener la misma lista de estados duplicada en dos lugares. */
export function isActivePurchase(purchase: PendingPurchase): boolean {
  return (DEFAULT_VISIBLE_STATUSES as PurchaseStatus[]).includes(purchase.status);
}

function matchesStatus(purchase: PendingPurchase, status: PurchaseStatusFilter): boolean {
  if (status === 'active') return isActivePurchase(purchase);
  if (status === 'all') return true;
  return purchase.status === status;
}

export function matchesPurchaseFilters(purchase: PendingPurchase, filters: PendingPurchaseFilters): boolean {
  if (!matchesSearch(purchase, filters.search)) return false;
  if (!matchesStatus(purchase, filters.status)) return false;
  if (filters.priority !== 'all' && purchase.priority !== filters.priority) return false;
  if (filters.category !== 'all' && purchase.category !== filters.category) return false;
  if (filters.destination !== 'all' && purchase.destination !== filters.destination) return false;
  if (filters.neededByTo && (!purchase.neededBy || purchase.neededBy > filters.neededByTo)) return false;
  return true;
}

export function filterPurchases(purchases: PendingPurchase[], filters: PendingPurchaseFilters): PendingPurchase[] {
  return purchases.filter((purchase) => matchesPurchaseFilters(purchase, filters));
}

/** Prioridad (alta primero) → fecha necesaria (antes primero, sin fecha al final) → más reciente creada primero. */
export function sortPurchases(purchases: PendingPurchase[]): PendingPurchase[] {
  return [...purchases].sort((a, b) => {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority !== 0) return byPriority;
    const aNeeded = a.neededBy ?? '9999-12-31';
    const bNeeded = b.neededBy ?? '9999-12-31';
    if (aNeeded !== bNeeded) return aNeeded < bNeeded ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function hasActivePurchaseFilters(filters: PendingPurchaseFilters): boolean {
  const defaults = defaultPurchaseFilters();
  return (Object.keys(defaults) as (keyof PendingPurchaseFilters)[]).some((key) => filters[key] !== defaults[key]);
}

export interface PendingPurchaseSummary {
  count: number;
  highPriorityCount: number;
  estimatedAmount: number;
  nextNeededBy: string | null;
}

/** Se calcula sobre la lista visible/filtrada — nunca suma este estimado a los gastos reales. */
export function summarizePurchases(purchases: PendingPurchase[]): PendingPurchaseSummary {
  const summary = purchases.reduce<PendingPurchaseSummary>(
    (acc, purchase) => {
      acc.count += 1;
      if (purchase.priority === 'high') acc.highPriorityCount += 1;
      acc.estimatedAmount += purchase.estimatedAmount ?? 0;
      return acc;
    },
    { count: 0, highPriorityCount: 0, estimatedAmount: 0, nextNeededBy: null }
  );
  const dated = purchases.map((p) => p.neededBy).filter((v): v is string => Boolean(v));
  summary.nextNeededBy = dated.length > 0 ? dated.reduce((min, v) => (v < min ? v : min)) : null;
  return summary;
}

export interface PurchasePriorityBreakdown {
  high: number;
  medium: number;
  low: number;
}

/** Conteo por prioridad de la lista visible/filtrada — usado por la mini distribución de Compras. */
export function priorityBreakdown(purchases: PendingPurchase[]): PurchasePriorityBreakdown {
  return purchases.reduce<PurchasePriorityBreakdown>(
    (acc, purchase) => {
      acc[purchase.priority] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
}
