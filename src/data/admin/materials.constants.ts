/**
 * materials.constants.ts
 * Listas controladas de Producción → Materiales. `MATERIAL_TYPES` es la única fuente de "qué
 * materiales existen hoy"; sumar un material nuevo en el futuro es agregar una fila acá, sin tocar
 * el modelo (`FilamentProfile.materialType` es `string`, no una unión literal) ni la UI de los
 * formularios/filtros, que ya leen esta lista. No inventa parámetros técnicos por tipo — solo
 * identidad/etiqueta; ver lib/materials/sku.ts para el código de SKU de cada uno.
 */
import type { MaterialUsage, MovementType, SpoolPresentation, SpoolStatus, StockStatus, ValidationStatus } from './materials.types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const MATERIAL_TYPES: Option<string>[] = [
  { value: 'pla-plus', label: 'PLA+' },
  { value: 'petg', label: 'PETG' },
  { value: 'tpu', label: 'TPU' },
  { value: 'pla-cf', label: 'PLA-CF' },
  { value: 'petg-cf', label: 'PETG-CF' },
  { value: 'pa-cf', label: 'PA-CF' },
  { value: 'other', label: 'Otro' },
];

export const MATERIAL_USAGE_OPTIONS: Option<MaterialUsage>[] = [
  { value: 'commercial', label: 'Comercial' },
  { value: 'internal', label: 'Interno' },
  { value: 'both', label: 'Ambos' },
];

export const VALIDATION_STATUS_OPTIONS: Option<ValidationStatus>[] = [
  { value: 'evaluation', label: 'En evaluación' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'inactive', label: 'Inactivo' },
];

export const PRESENTATION_OPTIONS: Option<SpoolPresentation>[] = [
  { value: 'spool', label: 'Bobina' },
  { value: 'refill', label: 'Refill' },
  { value: 'sample', label: 'Muestra' },
  { value: 'other', label: 'Otro' },
];

export const SPOOL_STATUS_OPTIONS: Option<SpoolStatus>[] = [
  { value: 'sealed', label: 'Sellada' },
  { value: 'open', label: 'Abierta' },
  { value: 'empty', label: 'Vacía' },
  { value: 'discarded', label: 'Descartada' },
];

/** Solo estos dos son elegibles como "estado inicial" de una bobina al ingresar stock (spec §8/§9). */
export const INITIAL_SPOOL_STATUS_OPTIONS: Option<'sealed' | 'open'>[] = [
  { value: 'sealed', label: 'Sellada' },
  { value: 'open', label: 'Abierta' },
];

export const MOVEMENT_TYPE_OPTIONS: Option<MovementType>[] = [
  { value: 'purchase', label: 'Compra / ingreso' },
  { value: 'consumption', label: 'Consumo' },
  { value: 'waste', label: 'Merma' },
  { value: 'adjustment', label: 'Ajuste' },
  { value: 'return', label: 'Devolución' },
];

export const STOCK_STATUS_OPTIONS: Option<StockStatus>[] = [
  { value: 'in-stock', label: 'En stock' },
  { value: 'low-stock', label: 'Stock bajo' },
  { value: 'out-of-stock', label: 'Sin stock' },
];

export function optionLabel<T extends string>(options: Option<T>[], value: T | undefined): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}
