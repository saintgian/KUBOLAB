/**
 * printers.constants.ts
 * Listas controladas de Producción → Equipos, mismo criterio que materials.constants.ts.
 * `POLYMER_FAMILIES` es la única fuente de "qué familias existen hoy"; el modelo (`PolymerFamily`)
 * sigue siendo `string` para poder sumar una nueva sin tocarlo. Marca explícitamente qué familias
 * son abrasivas (CF/GF/partículas duras) — esa marca alimenta el motor de mantenimiento
 * (lib/printers/compatibility.ts), nunca se decide "a ojo" en un componente.
 */
import type { MaintenanceAction, MaintenanceConditionFound, MaintenanceStatus, NozzleMaterial, PrinterStatus, ReinforcementType } from './printers.types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const PRINTER_STATUS_OPTIONS: Option<PrinterStatus>[] = [
  { value: 'active', label: 'Activa' },
  { value: 'maintenance', label: 'En mantenimiento' },
  { value: 'retired', label: 'Retirada' },
];

export const NOZZLE_MATERIAL_OPTIONS: Option<NozzleMaterial>[] = [
  { value: 'stainless-steel', label: 'Acero inoxidable' },
  { value: 'hardened-steel', label: 'Acero endurecido' },
  { value: 'other', label: 'Otro' },
];

export const REINFORCEMENT_OPTIONS: Option<ReinforcementType>[] = [
  { value: 'CF', label: 'CF (fibra de carbono)' },
  { value: 'GF', label: 'GF (fibra de vidrio)' },
  { value: 'other-abrasive', label: 'Otra carga abrasiva' },
];

export const MAINTENANCE_ACTION_OPTIONS: Option<MaintenanceAction>[] = [
  { value: 'inspect', label: 'Inspeccionar' },
  { value: 'clean', label: 'Limpiar' },
  { value: 'lubricate', label: 'Lubricar' },
  { value: 'replace', label: 'Reemplazar' },
];

export const MAINTENANCE_CONDITION_OPTIONS: Option<MaintenanceConditionFound>[] = [
  { value: 'ok', label: 'Bien' },
  { value: 'wear', label: 'Desgaste' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'dirty', label: 'Sucio' },
  { value: 'other', label: 'Otro' },
];

export const MAINTENANCE_STATUS_OPTIONS: Option<MaintenanceStatus>[] = [
  { value: 'up-to-date', label: 'Al día' },
  { value: 'upcoming', label: 'Próximo' },
  { value: 'review', label: 'Revisar' },
  { value: 'attention', label: 'Atención' },
];

/** Familia base de polímero — separada de refuerzo/aditivo (spec §12: "el payload debe distinguir
 * polímero base y refuerzo/aditivo"). `abrasive: true` marca las familias que por sí solas ya
 * cuentan como abrasivas (CF/GF genéricas); PLA/PETG/TPU/PVA/ABS/etc. solo son abrasivas si
 * además llevan `reinforcement`. */
export const POLYMER_FAMILIES: Option<string>[] = [
  { value: 'PLA', label: 'PLA' },
  { value: 'PETG', label: 'PETG' },
  { value: 'TPU', label: 'TPU' },
  { value: 'PVA', label: 'PVA' },
  { value: 'ABS', label: 'ABS' },
  { value: 'ASA', label: 'ASA' },
  { value: 'PC', label: 'PC' },
  { value: 'PA', label: 'PA (nylon)' },
  { value: 'PET', label: 'PET' },
  { value: 'other', label: 'Otro' },
];

/** Familias que la ficha técnica general de A1 marca `Ideal`/compatible (spec §2). */
export const A1_COMPATIBLE_FAMILIES = new Set(['PLA', 'PETG', 'TPU', 'PVA']);

/** Familias que la ficha técnica general de A1 marca `Not Recommended` incluso sin refuerzo
 * (spec §2/§12). */
export const A1_NOT_RECOMMENDED_FAMILIES = new Set(['ABS', 'ASA', 'PC', 'PA', 'PET']);

export function optionLabel<T extends string>(options: Option<T>[], value: T | undefined): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}

export function polymerFamilyLabel(value: string | undefined): string {
  return optionLabel(POLYMER_FAMILIES, value);
}
