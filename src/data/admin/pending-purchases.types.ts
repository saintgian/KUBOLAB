/**
 * pending-purchases.types.ts
 * Modelo de "Compras pendientes" — lo que KUBO necesita comprar ANTES de que exista un gasto
 * real. Vive en memoria de sesión, igual que `Expense` (ver expenses.types.ts): no hay backend
 * todavía. Comparte `ExpenseCategory`/`ExpenseDestination`/`ExpenseRelatedType` con Gastos porque
 * conceptualmente son las mismas listas de negocio — no se duplican como enums propios.
 */
import type { ExpenseCategory, ExpenseDestination, ExpenseRelatedType, ExpenseUnit } from './expenses.types';

export type PurchasePriority = 'high' | 'medium' | 'low';

export type PurchaseStatus = 'review' | 'pending' | 'quoting' | 'approved' | 'purchased' | 'cancelled';

export interface PendingPurchase {
  id: string;
  /** Qué necesitamos — p. ej. "PLA+ negro". */
  title: string;
  category: ExpenseCategory;
  priority: PurchasePriority;
  quantity?: number;
  unit?: ExpenseUnit;
  /** Monto ESTIMADO — nunca se trata como gasto real (ver requisito "estimado ≠ gasto"). */
  estimatedAmount?: number;
  /** Fecha en la que se necesita, ISO (YYYY-MM-DD). */
  neededBy?: string;
  destination: ExpenseDestination;
  relatedType?: ExpenseRelatedType;
  relatedId?: string;
  preferredSupplier?: string;
  status: PurchaseStatus;
  notes?: string;
  createdAt: string;
  /**
   * Id del `Expense` creado al convertir esta compra en gasto real (ver lib/expenses/model.ts
   * `buildExpense` + flujo de conversión en ExpensesWorkspace). Solo se setea DESPUÉS de guardar
   * el gasto con éxito — nunca antes, para no marcar "Comprada" una compra que en realidad no se
   * llegó a registrar (el usuario canceló el modal).
   */
  convertedExpenseId?: string;
}

export type PendingPurchaseFormValues = Omit<PendingPurchase, 'id' | 'createdAt' | 'status' | 'convertedExpenseId'>;
