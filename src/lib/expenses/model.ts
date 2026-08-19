/**
 * model.ts
 * Único punto de derivación de `totalAmount` — create y edit pasan siempre por `buildExpense`,
 * así el cálculo (compra + movilidad, sin doble contabilización) nunca diverge entre el preview
 * en vivo del formulario y lo que termina guardado en el dataset de sesión.
 */
import type { Expense, ExpenseFormValues } from '../../data/admin/expenses.types';
import { generateExpenseId } from './format';

export function computeTotalAmount(values: Pick<ExpenseFormValues, 'purchaseAmount' | 'hasMobility' | 'mobilityAmount'>): number {
  const purchase = Number.isFinite(values.purchaseAmount) ? values.purchaseAmount : 0;
  const mobility = values.hasMobility && Number.isFinite(values.mobilityAmount ?? NaN) ? (values.mobilityAmount as number) : 0;
  return Math.round((purchase + mobility) * 100) / 100;
}

export function buildExpense(values: ExpenseFormValues, existing?: Expense): Expense {
  return {
    ...values,
    id: existing?.id ?? generateExpenseId(),
    totalAmount: computeTotalAmount(values),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}
