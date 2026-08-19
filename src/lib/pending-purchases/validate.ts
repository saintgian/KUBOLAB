/**
 * validate.ts (Compras pendientes)
 * Validación inline del modal "Añadir compra" — mismo criterio (errores por campo, no solo
 * toast) que lib/expenses/validate.ts.
 */
import type { PendingPurchaseFormValues } from '../../data/admin/pending-purchases.types';

export type PendingPurchaseFormErrors = Partial<Record<keyof PendingPurchaseFormValues, string>>;

export const PURCHASE_FIELD_ORDER: (keyof PendingPurchaseFormValues)[] = ['title', 'category', 'priority', 'destination', 'quantity', 'estimatedAmount'];

export function validatePendingPurchaseForm(values: PendingPurchaseFormValues): PendingPurchaseFormErrors {
  const errors: PendingPurchaseFormErrors = {};
  if (!values.title.trim()) errors.title = 'Escribe qué necesitamos comprar.';
  if (!values.category) errors.category = 'Selecciona una categoría.';
  if (!values.priority) errors.priority = 'Selecciona una prioridad.';
  if (!values.destination) errors.destination = 'Selecciona un destino.';
  if (values.quantity !== undefined && (!Number.isFinite(values.quantity) || values.quantity <= 0)) {
    errors.quantity = 'Ingresa una cantidad mayor a 0.';
  }
  if (values.estimatedAmount !== undefined && (!Number.isFinite(values.estimatedAmount) || values.estimatedAmount < 0)) {
    errors.estimatedAmount = 'Ingresa un monto estimado válido.';
  }
  return errors;
}

export function hasErrors(errors: PendingPurchaseFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function firstInvalidField(errors: PendingPurchaseFormErrors): keyof PendingPurchaseFormValues | null {
  for (const field of PURCHASE_FIELD_ORDER) {
    if (errors[field]) return field;
  }
  const keys = Object.keys(errors) as (keyof PendingPurchaseFormValues)[];
  return keys[0] ?? null;
}
