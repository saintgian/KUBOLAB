/**
 * filters.ts (Materiales)
 * Filtrado/orden/resumen de la lista de perfiles — una sola fuente para que toolbar, listado y
 * resumen operativo lean siempre el mismo criterio. Opera sobre `MaterialListItem[]` (perfil +
 * stock ya derivado, ver lib/materials/inventory.ts), nunca sobre `FilamentProfile[]` a secas,
 * porque el filtro de Stock necesita el estado derivado, no un campo del perfil.
 */
import type { MaterialUsage, StockStatus, ValidationStatus } from '../../data/admin/materials.types';
import type { MaterialListItem } from './inventory';

export interface MaterialFilters {
  search: string;
  materialType: string | 'all';
  usage: MaterialUsage | 'all';
  validationStatus: ValidationStatus | 'all';
  stockStatus: StockStatus | 'all';
}

export function defaultMaterialFilters(): MaterialFilters {
  return {
    search: '',
    materialType: 'all',
    usage: 'all',
    validationStatus: 'all',
    stockStatus: 'all',
  };
}

function matchesSearch(item: MaterialListItem, query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return [item.profile.name, item.profile.manufacturer, item.profile.productLine, item.profile.colorName, item.profile.internalCode]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}

export function matchesMaterialFilters(item: MaterialListItem, filters: MaterialFilters): boolean {
  if (!matchesSearch(item, filters.search)) return false;
  if (filters.materialType !== 'all' && item.profile.materialType !== filters.materialType) return false;
  if (filters.usage !== 'all' && item.profile.usage !== filters.usage) return false;
  if (filters.validationStatus !== 'all' && item.profile.validationStatus !== filters.validationStatus) return false;
  if (filters.stockStatus !== 'all' && item.stockStatus !== filters.stockStatus) return false;
  return true;
}

export function filterMaterials(items: MaterialListItem[], filters: MaterialFilters): MaterialListItem[] {
  return items.filter((item) => matchesMaterialFilters(item, filters));
}

export function sortMaterials(items: MaterialListItem[]): MaterialListItem[] {
  return [...items].sort((a, b) => a.profile.name.localeCompare(b.profile.name, 'es'));
}

export function hasActiveMaterialFilters(filters: MaterialFilters): boolean {
  const defaults = defaultMaterialFilters();
  return (Object.keys(defaults) as (keyof MaterialFilters)[]).some((key) => filters[key] !== defaults[key]);
}

export interface MaterialsSummary {
  totalStockG: number;
  activeProfileCount: number;
  lowStockCount: number;
  evaluationCount: number;
}

/** Se calcula sobre la lista visible/filtrada — mismo criterio que Finanzas → Gastos. */
export function summarizeMaterials(items: MaterialListItem[]): MaterialsSummary {
  return items.reduce<MaterialsSummary>(
    (acc, item) => {
      acc.totalStockG += item.stockG;
      if (item.profile.validationStatus !== 'inactive') acc.activeProfileCount += 1;
      if (item.stockStatus === 'low-stock') acc.lowStockCount += 1;
      if (item.profile.validationStatus === 'evaluation') acc.evaluationCount += 1;
      return acc;
    },
    { totalStockG: 0, activeProfileCount: 0, lowStockCount: 0, evaluationCount: 0 }
  );
}
