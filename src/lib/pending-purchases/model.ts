/**
 * model.ts (Compras pendientes)
 * Único punto de derivación de id/estado/fecha al crear o editar una compra — igual patrón que
 * lib/expenses/model.ts. Toda compra NUEVA arranca SIEMPRE en 'review' ("En revisión") — el
 * usuario no la elige en el formulario de creación (no hay combobox Estado ahí). Una compra ya
 * existente conserva su estado al editarse (solo cambia por acción explícita, ver
 * PendingPurchaseDetailDrawer "Cambiar estado"). El cambio a 'purchased' solo ocurre en el flujo
 * de conversión (ver ExpensesWorkspace), después de que el gasto real se guardó con éxito.
 */
import type { PendingPurchase, PendingPurchaseFormValues } from '../../data/admin/pending-purchases.types';

let purchaseSequence = 0;

/** Id de sesión — nunca colisiona con los ids demo (`pp-0xx`) por el prefijo `pp-new-`. */
export function generatePurchaseId(): string {
  purchaseSequence += 1;
  return `pp-new-${Date.now().toString(36)}-${purchaseSequence}`;
}

export function buildPendingPurchase(values: PendingPurchaseFormValues, existing?: PendingPurchase): PendingPurchase {
  return {
    ...values,
    id: existing?.id ?? generatePurchaseId(),
    status: existing?.status ?? 'review',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedExpenseId: existing?.convertedExpenseId,
  };
}
