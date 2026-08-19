/**
 * prints.constants.ts
 * Listas controladas de Producción → Impresiones, mismo criterio que materials.constants.ts /
 * printers.constants.ts.
 */
import type { PrintPurpose, PrintResult } from './prints.types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const PRINT_PURPOSE_OPTIONS: Option<PrintPurpose>[] = [
  { value: 'sale', label: 'Venta' },
  { value: 'custom', label: 'Custom' },
  { value: 'calibration', label: 'Calibración' },
  { value: 'prototype', label: 'Prueba / prototipo' },
  { value: 'internal', label: 'Interno' },
  { value: 'sample', label: 'Muestra / marketing' },
];

export const PRINT_RESULT_OPTIONS: Option<PrintResult>[] = [
  { value: 'success', label: 'Correcta' },
  { value: 'partial', label: 'Parcial' },
  { value: 'failed', label: 'Fallida' },
  { value: 'cancelled', label: 'Cancelada' },
];

/** Modificador de `.status-chip` por resultado — 'success' y 'cancelled' reutilizan primitives ya
 * existentes en admin-dashboard.css; 'partial'/'failed' son nuevos modificadores del mismo sistema
 * (ver styles/admin-dashboard.css, nunca badges locales). */
export const PRINT_RESULT_STATUS_CLASS: Record<PrintResult, string> = {
  success: 'status-success',
  partial: 'status-partial',
  failed: 'status-failed',
  cancelled: 'status-cancelled',
};

export function optionLabel<T extends string>(options: Option<T>[], value: T | undefined): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}
