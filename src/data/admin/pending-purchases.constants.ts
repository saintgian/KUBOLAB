/**
 * pending-purchases.constants.ts
 * Listas controladas de Compras pendientes, centralizadas igual que expenses.constants.ts.
 */
import type { PurchasePriority, PurchaseStatus } from './pending-purchases.types';
import type { Option } from './expenses.constants';

export const PURCHASE_PRIORITIES: Option<PurchasePriority>[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
];

export const PURCHASE_STATUSES: Option<PurchaseStatus>[] = [
  { value: 'review', label: 'En revisión' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'quoting', label: 'Cotizando' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'purchased', label: 'Comprada' },
  { value: 'cancelled', label: 'Cancelada' },
];

/** Estados que puede asignar una acción/edición manual — `purchased` queda excluido a propósito:
 * solo se llega a "Comprada" convirtiendo la compra en gasto real (ver ExpensesWorkspace `convertPurchase`). */
export const MANUAL_PURCHASE_STATUSES: Option<PurchaseStatus>[] = PURCHASE_STATUSES.filter((status) => status.value !== 'purchased');

/** Estados que se muestran por defecto en la vista principal — "Compras activas" (ver
 * lib/pending-purchases/filters.ts `isActivePurchase`). Comprada/Cancelada quedan en historial vía filtro. */
export const DEFAULT_VISIBLE_STATUSES: PurchaseStatus[] = ['review', 'pending', 'quoting', 'approved'];

const PRIORITY_ORDER: Record<PurchasePriority, number> = { high: 0, medium: 1, low: 2 };

export function priorityRank(priority: PurchasePriority): number {
  return PRIORITY_ORDER[priority];
}
