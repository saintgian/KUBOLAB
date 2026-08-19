/**
 * export.ts
 * Exportación de gastos a CSV/XLSX. CSV se genera con APIs nativas del navegador (Blob + URL),
 * sin dependencias. XLSX usa `xlsx` (SheetJS) — la única dependencia añadida para esta feature,
 * cargada con `import()` dinámico dentro de `exportToXlsx` para que no entre en el bundle inicial
 * de la página (solo se descarga cuando el usuario efectivamente exporta a .xlsx).
 */
import type { Expense } from '../../data/admin/expenses.types';
import type { PendingPurchase } from '../../data/admin/pending-purchases.types';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_DESTINATIONS,
  EXPENSE_DOCUMENT_TYPES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_RELATED_TYPES,
  EXPENSE_UNITS,
  optionLabel,
} from '../../data/admin/expenses.constants';
import { PURCHASE_STATUSES } from '../../data/admin/pending-purchases.constants';
import { formatDateLong } from './format';

const EXPORT_COLUMNS = [
  'Fecha',
  'Concepto',
  'Categoría',
  'Proveedor',
  'Monto compra',
  'Movilidad',
  'Total',
  'Medio de pago',
  'Cuenta/origen',
  'Destino',
  'Tipo relacionado',
  'Referencia',
  'Tipo de comprobante',
  'Número de comprobante',
  'Nombre de archivo',
  'Notas',
] as const;

function expenseToRow(expense: Expense): (string | number)[] {
  return [
    formatDateLong(expense.date),
    expense.concept,
    optionLabel(EXPENSE_CATEGORIES, expense.category),
    expense.supplier ?? '',
    round2(expense.purchaseAmount),
    expense.hasMobility ? round2(expense.mobilityAmount ?? 0) : 0,
    round2(expense.totalAmount),
    optionLabel(EXPENSE_PAYMENT_METHODS, expense.paymentMethod),
    expense.paymentAccount ?? '',
    optionLabel(EXPENSE_DESTINATIONS, expense.destination),
    expense.related ? optionLabel(EXPENSE_RELATED_TYPES, expense.related.type) : '',
    expense.related?.label ?? '',
    optionLabel(EXPENSE_DOCUMENT_TYPES, expense.documentType),
    expense.documentNumber ?? '',
    expense.attachment?.fileName ?? '',
    expense.notes ?? '',
  ];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function exportFileName(from: string, to: string, format: 'csv' | 'xlsx'): string {
  return `kubo-gastos-${from}_${to}.${format}`;
}

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(expenses: Expense[]): string {
  const lines = [EXPORT_COLUMNS.map(csvEscape).join(',')];
  for (const expense of expenses) {
    lines.push(expenseToRow(expense).map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportToCsv(expenses: Expense[], from: string, to: string): void {
  const csv = buildCsv(expenses);
  // BOM UTF-8 al inicio: Excel en español no reconoce tildes/ñ sin este marcador.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, exportFileName(from, to, 'csv'));
}

/**
 * `xlsx` (SheetJS) se importa dinámicamente aquí, no en el top-level del módulo — así el parser
 * de .xlsx solo se descarga cuando el usuario elige ese formato, nunca en la carga inicial de la
 * página de Gastos.
 */
export async function exportToXlsx(expenses: Expense[], from: string, to: string): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  appendExpenseSheet(XLSX, workbook, expenses);
  XLSX.writeFile(workbook, exportFileName(from, to, 'xlsx'));
}

// ---------- Compras pendientes ----------
// Nunca se mezclan en la misma hoja/columnas que Gastos: son un dataset ESTIMADO, no egresos
// reales (ver requisito "estimado y gasto real nunca se confunden").

const PURCHASE_EXPORT_COLUMNS = [
  'Prioridad',
  'Compra',
  'Categoría',
  'Cantidad',
  'Unidad',
  'Estimado',
  'Fecha necesaria',
  'Destino',
  'Tipo relacionado',
  'Referencia',
  'Proveedor sugerido',
  'Estado',
  'Notas',
] as const;

function purchasePriorityLabel(priority: PendingPurchase['priority']): string {
  return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
}

function purchaseToRow(purchase: PendingPurchase): (string | number)[] {
  return [
    purchasePriorityLabel(purchase.priority),
    purchase.title,
    optionLabel(EXPENSE_CATEGORIES, purchase.category),
    purchase.quantity ?? '',
    purchase.unit ? optionLabel(EXPENSE_UNITS, purchase.unit) : '',
    purchase.estimatedAmount !== undefined ? round2(purchase.estimatedAmount) : '',
    purchase.neededBy ? formatDateLong(purchase.neededBy) : '',
    optionLabel(EXPENSE_DESTINATIONS, purchase.destination),
    purchase.relatedType ? optionLabel(EXPENSE_RELATED_TYPES, purchase.relatedType) : '',
    purchase.relatedId ?? '',
    purchase.preferredSupplier ?? '',
    optionLabel(PURCHASE_STATUSES, purchase.status),
    purchase.notes ?? '',
  ];
}

export function purchasesFileName(from: string, to: string, format: 'csv' | 'xlsx'): string {
  return `kubo-compras-pendientes-${from}_${to}.${format}`;
}

export function buildPurchasesCsv(purchases: PendingPurchase[]): string {
  const lines = [PURCHASE_EXPORT_COLUMNS.map(csvEscape).join(',')];
  for (const purchase of purchases) lines.push(purchaseToRow(purchase).map(csvEscape).join(','));
  return lines.join('\r\n');
}

export function exportPurchasesToCsv(purchases: PendingPurchase[], from: string, to: string): void {
  const csv = buildPurchasesCsv(purchases);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, purchasesFileName(from, to, 'csv'));
}

function appendExpenseSheet(XLSX: typeof import('xlsx'), workbook: import('xlsx').WorkBook, expenses: Expense[]): void {
  const rows = [EXPORT_COLUMNS as unknown as string[], ...expenses.map(expenseToRow)];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = EXPORT_COLUMNS.map((_, index) => ({ wch: index === 1 ? 32 : 16 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');
}

function appendPurchaseSheet(XLSX: typeof import('xlsx'), workbook: import('xlsx').WorkBook, purchases: PendingPurchase[]): void {
  const rows = [PURCHASE_EXPORT_COLUMNS as unknown as string[], ...purchases.map(purchaseToRow)];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = PURCHASE_EXPORT_COLUMNS.map((_, index) => ({ wch: index === 1 ? 32 : 16 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras pendientes');
}

export async function exportPurchasesToXlsx(purchases: PendingPurchase[], from: string, to: string): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  appendPurchaseSheet(XLSX, workbook, purchases);
  XLSX.writeFile(workbook, purchasesFileName(from, to, 'xlsx'));
}

/** Un solo libro, dos hojas separadas — solo cuando el usuario elige exportar ambos datasets a la vez. */
export async function exportCombinedToXlsx(expenses: Expense[], purchases: PendingPurchase[], from: string, to: string): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  appendExpenseSheet(XLSX, workbook, expenses);
  appendPurchaseSheet(XLSX, workbook, purchases);
  XLSX.writeFile(workbook, exportFileName(from, to, 'xlsx'));
}
