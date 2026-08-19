/**
 * chart.ts
 * Agrupa gastos por categoría para "Gastos por categoría" (ExpensesBarChart.svelte). Si hay más
 * categorías que `maxBars`, las más chicas se agrupan visualmente bajo "Otros" — sin alterar
 * `expenses` ni recalcular categorías reales en ningún otro sitio, es puramente para que el chart
 * no muestre 12 barras ilegibles.
 */
import type { Expense, ExpenseCategory } from '../../data/admin/expenses.types';
import { EXPENSE_CATEGORIES } from '../../data/admin/expenses.constants';

export interface CategoryBar {
  category: ExpenseCategory | 'other-grouped';
  label: string;
  amount: number;
  share: number;
}

export function categoryTotals(expenses: Expense[], maxBars = 6): CategoryBar[] {
  const totals = new Map<ExpenseCategory, number>();
  let grandTotal = 0;
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.totalAmount);
    grandTotal += expense.totalAmount;
  }

  const rows = EXPENSE_CATEGORIES.filter((option) => totals.has(option.value)).map((option) => ({
    category: option.value,
    label: option.label,
    amount: totals.get(option.value) ?? 0,
  }));
  rows.sort((a, b) => b.amount - a.amount);

  const share = (amount: number) => (grandTotal > 0 ? amount / grandTotal : 0);

  if (rows.length <= maxBars) {
    return rows.map((row) => ({ ...row, share: share(row.amount) }));
  }

  const head = rows.slice(0, maxBars - 1);
  const tail = rows.slice(maxBars - 1);
  const tailAmount = tail.reduce((sum, row) => sum + row.amount, 0);

  return [...head, { category: 'other-grouped' as const, label: 'Otros', amount: tailAmount }].map((row) => ({ ...row, share: share(row.amount) }));
}
