/**
 * model.ts (Calculadora de precios)
 * Fábricas de estado inicial — fila de material/costo adicional en blanco, el `PricingCalculation`
 * en blanco que arranca el workspace, y `applyKuboDefaults` para el botón "Restablecer valores
 * KUBO". Únicos ids de sesión (nunca persisten, la calculadora no tiene backend — spec §32).
 */
import { ELECTRICITY_LOCATION, ELECTRICITY_PROVIDER, KUBO_DEFAULTS } from '../../data/admin/price-calculator.constants';
import type { AdditionalCostRow, CalculationMaterial, PricingCalculation } from '../../data/admin/price-calculator.types';

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

export function blankMaterialRow(): CalculationMaterial {
  return {
    id: nextId('calc-mat'),
    profileId: '',
    grams: null,
    referenceCostPerKg: null,
    useOverride: false,
    costOverridePerKg: null,
  };
}

export function blankAdditionalRow(concept = ''): AdditionalCostRow {
  return {
    id: nextId('calc-add'),
    concept,
    amount: null,
    scope: 'project',
  };
}

/** Tandas necesarias por defecto — `ceil(cantidadFinal / unidadesPorTanda)` (spec §7), editable
 * después por el usuario. */
export function defaultBatches(quantity: number | null, unitsPerBatch: number | null): number | null {
  if (quantity === null || unitsPerBatch === null || unitsPerBatch <= 0) return null;
  return Math.ceil(quantity / unitsPerBatch);
}

export function blankCalculation(): PricingCalculation {
  return {
    name: '',
    notes: '',
    purpose: 'sale',
    simulateSalePrice: false,
    quantity: 1,
    printerName: KUBO_DEFAULTS.printerName,
    slicerScope: 'unit',
    unitsPerBatch: null,
    batches: null,
    printHours: null,
    printMinutes: null,
    materials: [blankMaterialRow()],
    materialWasteRate: KUBO_DEFAULTS.materialWasteRate,
    electricity: {
      provider: ELECTRICITY_PROVIDER,
      location: ELECTRICITY_LOCATION,
      tariffPerKWh: KUBO_DEFAULTS.tariffPerKWh,
      mode: 'estimated',
      averagePowerW: KUBO_DEFAULTS.averagePowerW,
      measuredKWh: null,
    },
    machineDepreciationPerHour: KUBO_DEFAULTS.machineDepreciationPerHour,
    machineMaintenancePerHour: KUBO_DEFAULTS.machineMaintenancePerHour,
    failureRate: KUBO_DEFAULTS.failureRate,
    designMinutes: 0,
    finishingMinutes: 0,
    laborHourlyRate: KUBO_DEFAULTS.laborHourlyRate,
    packagingAmount: KUBO_DEFAULTS.packagingAmount,
    packagingScope: KUBO_DEFAULTS.packagingScope,
    additionalRows: [],
    indirectMode: KUBO_DEFAULTS.indirectMode,
    indirectFixedAmount: KUBO_DEFAULTS.indirectFixedAmount,
    indirectPercentage: KUBO_DEFAULTS.indirectPercentage,
    targetMargin: KUBO_DEFAULTS.targetMargin,
    commissionRate: KUBO_DEFAULTS.commissionRate,
    commissionFixed: KUBO_DEFAULTS.commissionFixed,
    applyIgv: false,
    roundingMode: KUBO_DEFAULTS.roundingMode,
    approvedForCommercialOnly: false,
  };
}

/**
 * "Restablecer valores KUBO" — repone solo los supuestos operativos (electricidad, máquina,
 * hora-hombre, packaging, merma, fallos, margen, comisiones, indirectos, redondeo) a los defaults
 * KUBO v1, sin tocar cantidad, materiales, tiempos de impresión ni identificación del cálculo en
 * curso (esos no son "supuestos", son datos que el usuario ya ingresó para este trabajo).
 */
export function applyKuboDefaults(calc: PricingCalculation): PricingCalculation {
  return {
    ...calc,
    printerName: KUBO_DEFAULTS.printerName,
    electricity: {
      ...calc.electricity,
      provider: KUBO_DEFAULTS.electricityProvider,
      location: KUBO_DEFAULTS.electricityLocation,
      tariffPerKWh: KUBO_DEFAULTS.tariffPerKWh,
      averagePowerW: KUBO_DEFAULTS.averagePowerW,
    },
    machineDepreciationPerHour: KUBO_DEFAULTS.machineDepreciationPerHour,
    machineMaintenancePerHour: KUBO_DEFAULTS.machineMaintenancePerHour,
    laborHourlyRate: KUBO_DEFAULTS.laborHourlyRate,
    packagingAmount: KUBO_DEFAULTS.packagingAmount,
    packagingScope: KUBO_DEFAULTS.packagingScope,
    materialWasteRate: KUBO_DEFAULTS.materialWasteRate,
    failureRate: KUBO_DEFAULTS.failureRate,
    targetMargin: KUBO_DEFAULTS.targetMargin,
    commissionRate: KUBO_DEFAULTS.commissionRate,
    commissionFixed: KUBO_DEFAULTS.commissionFixed,
    indirectMode: KUBO_DEFAULTS.indirectMode,
    indirectPercentage: KUBO_DEFAULTS.indirectPercentage,
    indirectFixedAmount: KUBO_DEFAULTS.indirectFixedAmount,
    roundingMode: KUBO_DEFAULTS.roundingMode,
  };
}
