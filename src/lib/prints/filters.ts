/**
 * filters.ts (Impresiones)
 * Filtrado del historial — una sola fuente para que toolbar e historial lean siempre el mismo
 * criterio, mismo patrón que lib/materials/filters.ts.
 */
import type { PrintPurpose, PrintRecord, PrintResult } from '../../data/admin/prints.types';

export interface PrintFilters {
  search: string;
  printerId: string | 'all';
  purpose: PrintPurpose | 'all';
  result: PrintResult | 'all';
  materialType: string | 'all';
  dateFrom: string;
  dateTo: string;
}

export function defaultPrintFilters(): PrintFilters {
  return { search: '', printerId: 'all', purpose: 'all', result: 'all', materialType: 'all', dateFrom: '', dateTo: '' };
}

function matchesSearch(record: PrintRecord, query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return [record.displayId, record.name].some((value) => value.toLowerCase().includes(needle));
}

export function matchesPrintFilters(record: PrintRecord, filters: PrintFilters): boolean {
  if (!matchesSearch(record, filters.search)) return false;
  if (filters.printerId !== 'all' && record.printerId !== filters.printerId) return false;
  if (filters.purpose !== 'all' && record.purpose !== filters.purpose) return false;
  if (filters.result !== 'all' && record.result !== filters.result) return false;
  if (filters.materialType !== 'all' && !record.materials.some((m) => m.materialType === filters.materialType)) return false;
  if (filters.dateFrom && record.date < filters.dateFrom) return false;
  if (filters.dateTo && record.date > filters.dateTo) return false;
  return true;
}

export function filterPrints(records: PrintRecord[], filters: PrintFilters): PrintRecord[] {
  return records.filter((record) => matchesPrintFilters(record, filters));
}

export function sortPrintsByDateDesc(records: PrintRecord[]): PrintRecord[] {
  return [...records].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
}

export function hasActivePrintFilters(filters: PrintFilters): boolean {
  const defaults = defaultPrintFilters();
  return (Object.keys(defaults) as (keyof PrintFilters)[]).some((key) => filters[key] !== defaults[key]);
}
