/**
 * price-calculator.constants.ts
 * Listas controladas y defaults de Herramientas → Calculadora de precios, centralizadas para no
 * repetir arrays ni magic numbers (IGV, redondeo) entre el motor y la UI (spec §20, §21, §25).
 */
import type { CalculatorPurpose, CostScope, ElectricityMode, IndirectMode, RoundingMode, SlicerScope } from './price-calculator.types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** Única fuente de la tasa de IGV — nunca repetir `0.18` suelto en el motor o la UI. */
export const IGV_RATE = 0.18;

export const PURPOSE_OPTIONS: Option<CalculatorPurpose>[] = [
  { value: 'sale', label: 'Venta' },
  { value: 'custom', label: 'Custom' },
  { value: 'test', label: 'Prueba / prototipo' },
  { value: 'internal', label: 'Interno' },
  { value: 'sample', label: 'Muestra / marketing' },
];

/** Venta/Custom siempre muestran el bloque comercial; el resto lo oculta por defecto (spec §5). */
export function purposeShowsCommercialByDefault(purpose: CalculatorPurpose): boolean {
  return purpose === 'sale' || purpose === 'custom';
}

export const SLICER_SCOPE_OPTIONS: Option<SlicerScope>[] = [
  { value: 'unit', label: 'Una unidad' },
  { value: 'batch', label: 'Una tanda completa' },
];

export const ELECTRICITY_MODE_OPTIONS: Option<ElectricityMode>[] = [
  { value: 'estimated', label: 'Estimado' },
  { value: 'measured', label: 'Medido' },
];

export const INDIRECT_MODE_OPTIONS: Option<IndirectMode>[] = [
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'fixed', label: 'Monto fijo' },
];

export const COST_SCOPE_OPTIONS: Option<CostScope>[] = [
  { value: 'project', label: 'Proyecto / tanda' },
  { value: 'unit', label: 'Por unidad' },
];

export const ROUNDING_OPTIONS: Option<RoundingMode>[] = [
  { value: 'none', label: 'Sin redondeo' },
  { value: '0.10', label: 'S/ 0.10' },
  { value: '0.50', label: 'S/ 0.50' },
  { value: '1.00', label: 'S/ 1.00' },
  { value: '5.00', label: 'S/ 5.00' },
];

export const ROUNDING_STEPS: Record<RoundingMode, number> = {
  none: 0,
  '0.10': 0.1,
  '0.50': 0.5,
  '1.00': 1,
  '5.00': 5,
};

/** Sugerencias de fila — el usuario puede editar el concepto libremente (spec §15). Packaging
 * queda fuera: tiene su propio campo dedicado (Trabajo manual / Packaging, siempre monetario). */
export const ADDITIONAL_CONCEPT_SUGGESTIONS = ['Insertos / tornillos / imanes', 'Consumibles', 'Servicio externo', 'Envío / logística', 'Otro'];

/** Referencia mostrada junto a la tarifa eléctrica — no se usa para calcular nada (spec §11, §25). */
export const ELECTRICITY_PROVIDER = 'Luz del Sur';
export const ELECTRICITY_LOCATION = 'San Juan de Miraflores, Lima';

/**
 * "Supuestos KUBO v1" — defaults operativos editables que precargan la calculadora para que el uso
 * normal solo requiera finalidad, cantidad, impresora, tiempo, material y gramos. Se muestran con
 * la etiqueta `Supuestos KUBO`: nunca se presentan como tarifas oficiales ni mediciones reales.
 * Único punto de verdad — usado por `blankCalculation` y `applyKuboDefaults` (lib/pricing/model.ts)
 * para que "Restablecer valores KUBO" nunca quede desincronizado del estado inicial.
 */
export const KUBO_DEFAULTS = {
  printerName: 'Bambu Lab A1',
  electricityProvider: ELECTRICITY_PROVIDER,
  electricityLocation: ELECTRICITY_LOCATION,
  /** S/kWh estimado para Luz del Sur en San Juan de Miraflores, Lima. */
  tariffPerKWh: 0.75,
  /** W — potencia promedio de costeo para la Bambu Lab A1. */
  averagePowerW: 120,
  /** S/h — depreciación de máquina. */
  machineDepreciationPerHour: 0.4,
  /** S/h — reserva de mantenimiento. */
  machineMaintenancePerHour: 0.25,
  /** S/h — hora-hombre única para Diseño/preparación y Acabado/ensamblaje. */
  laborHourlyRate: 20,
  /** S/ — packaging, costo monetario por defecto (nunca tiempo). */
  packagingAmount: 2,
  packagingScope: 'unit' as CostScope,
  /** % — merma adicional de material. */
  materialWasteRate: 3,
  /** % — provisión por fallos/reimpresión. */
  failureRate: 5,
  /** % — margen objetivo. */
  targetMargin: 35,
  commissionRate: 0,
  commissionFixed: 0,
  indirectMode: 'percentage' as IndirectMode,
  indirectPercentage: 0,
  indirectFixedAmount: 0,
  /** S/0.50 hacia arriba. */
  roundingMode: '0.50' as RoundingMode,
} as const;

/** S/h — suma derivada de depreciación + mantenimiento, sin electricidad (spec "Máquina"). */
export const KUBO_MACHINE_HOURLY_RATE = KUBO_DEFAULTS.machineDepreciationPerHour + KUBO_DEFAULTS.machineMaintenancePerHour;

export function optionLabel<T extends string>(options: Option<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
