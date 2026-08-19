/**
 * engine.ts
 * Motor reactivo puro de la Calculadora de precios (docs/specs/admin-price-calculator-spec.md
 * §7-§24). Sin estado propio: recibe un `PricingCalculation` completo y devuelve el breakdown de
 * costo/precio + la lista de datos obligatorios faltantes. La UI (PriceCalculatorWorkspace.svelte)
 * llama a `calculatePricing` dentro de un `$derived`, así que cada cambio de input recalcula todo
 * en tiempo real sin botón "Calcular" (spec §28).
 */
import { IGV_RATE, ROUNDING_STEPS } from '../../data/admin/price-calculator.constants';
import type { AdditionalCostRow, CalculationMaterial, PricingCalculation } from '../../data/admin/price-calculator.types';

/** Horas decimales a partir de horas+minutos. `null` si falta algún campo (spec §8: ambos *). */
export function normalizedPrintHours(hours: number | null, minutes: number | null): number | null {
  if (hours === null || minutes === null) return null;
  if (hours < 0 || minutes < 0) return null;
  return hours + minutes / 60;
}

function costPerKgForMaterial(material: CalculationMaterial): number | null {
  if (material.useOverride) return material.costOverridePerKg;
  return material.referenceCostPerKg;
}

export interface MaterialLineResult {
  id: string;
  profileId: string;
  normalizedGrams: number | null;
  costPerKg: number | null;
  cost: number;
  /** true si la fila tiene perfil elegido pero sin gramos, sin costo/kg, o sin perfil elegido. */
  incomplete: boolean;
}

export interface AdditionalLineResult {
  id: string;
  cost: number;
}

export interface CostBreakdown {
  materialLines: MaterialLineResult[];
  totalMaterialCost: number;
  materialWithWaste: number;
  electricityCost: number;
  /** S/ — separado de electricidad y de mantenimiento. */
  depreciationCost: number;
  /** S/ — separado de electricidad y de depreciación. */
  maintenanceCost: number;
  /** S/ — depreciationCost + maintenanceCost, sin electricidad ("Costo de máquina"). */
  machineCost: number;
  /** S/h — depreciación/h + mantenimiento/h, valor de referencia (no se multiplica de nuevo). */
  machineHourlyRate: number;
  failureProvision: number;
  directProductionCost: number;
  /** S/ — Trabajo manual › Diseño / preparación (proyecto/tanda, no se multiplica por cantidad). */
  designCost: number;
  /** S/ — Trabajo manual › Acabado / ensamblaje (por unidad). */
  finishingCost: number;
  /** S/ — designCost + finishingCost. */
  laborTotal: number;
  /** S/ — Packaging, siempre costo monetario (nunca tiempo). */
  packagingCost: number;
  additionalLines: AdditionalLineResult[];
  additionalTotal: number;
  baseBeforeIndirect: number;
  indirectCost: number;
  totalCost: number;
  unitCost: number;
}

export interface PriceBreakdown {
  netPriceBeforeTax: number;
  commissionAmount: number;
  profit: number;
  effectiveMargin: number;
  markup: number;
  igvAmount: number;
  finalPricePerUnit: number;
  roundedFinalPricePerUnit: number;
  roundedNetPrice: number;
  roundedCommissionAmount: number;
  roundedProfit: number;
  roundedEffectiveMargin: number;
  totalOrderPrice: number;
  /** false cuando `1 - comisión - margen <= 0` (spec §19: margen+comisión sin solución). */
  hasValidSolution: boolean;
}

export interface PricingResult {
  scaleFactor: number;
  totalPrintHours: number | null;
  cost: CostBreakdown;
  price: PriceBreakdown | null;
  missing: string[];
  isComplete: boolean;
}

function additionalRowCost(row: AdditionalCostRow, quantity: number): number {
  if (row.amount === null) return 0;
  return row.scope === 'unit' ? row.amount * quantity : row.amount;
}

function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const EPSILON = 1e-9;
  return Math.ceil((value - EPSILON) / step) * step;
}

export function calculatePricing(calc: PricingCalculation): PricingResult {
  const missing: string[] = [];

  const quantity = calc.quantity;
  if (quantity === null || quantity <= 0) missing.push('Cantidad final debe ser mayor a 0.');
  const qtyForScope = quantity ?? 0;

  const perScopeHours = normalizedPrintHours(calc.printHours, calc.printMinutes);
  if (perScopeHours === null) missing.push('Tiempo de impresión inválido (horas y minutos son obligatorios).');

  if (calc.slicerScope === 'batch' && (calc.unitsPerBatch === null || calc.unitsPerBatch <= 0)) {
    missing.push('Unidades producidas por tanda debe ser mayor a 0.');
  }
  const batches = calc.slicerScope === 'batch' ? calc.batches : null;
  if (calc.slicerScope === 'batch' && (batches === null || batches <= 0)) {
    missing.push('Tandas necesarias debe ser mayor a 0.');
  }

  // scaleFactor: cuántas veces se multiplica lo que reporta el slicer para llegar al total del pedido.
  const scaleFactor = calc.slicerScope === 'batch' ? (batches ?? 0) : (quantity ?? 0);
  const totalPrintHours = perScopeHours === null ? null : perScopeHours * scaleFactor;

  if (calc.materials.length === 0) {
    missing.push('Añade al menos un material.');
  }

  const materialLines: MaterialLineResult[] = calc.materials.map((material) => {
    const costPerKg = costPerKgForMaterial(material);
    const grams = material.grams;
    const normalizedGrams = grams === null ? null : grams * scaleFactor;
    const rowHasProfile = material.profileId !== '';
    let incomplete = false;
    if (!rowHasProfile) {
      incomplete = true;
      missing.push('Selecciona un perfil de filamento para cada material.');
    } else {
      if (grams === null || grams <= 0) {
        incomplete = true;
        missing.push('Indica los gramos utilizados para cada material.');
      }
      if (costPerKg === null) {
        incomplete = true;
        missing.push('Falta el costo/kg de un material (perfil sin costo y sin override).');
      }
    }
    const cost = normalizedGrams !== null && costPerKg !== null ? (normalizedGrams / 1000) * costPerKg : 0;
    return { id: material.id, profileId: material.profileId, normalizedGrams, costPerKg, cost, incomplete };
  });

  const totalMaterialCost = materialLines.reduce((sum, line) => sum + line.cost, 0);
  const wasteRate = calc.materialWasteRate / 100;
  const materialWithWaste = totalMaterialCost * (1 + wasteRate);

  if (calc.electricity.mode === 'measured' && calc.electricity.measuredKWh === null) {
    missing.push('Indica el consumo medido (kWh).');
  }

  let electricityCost = 0;
  if (calc.electricity.mode === 'estimated') {
    if (totalPrintHours !== null) {
      const kWh = (calc.electricity.averagePowerW / 1000) * totalPrintHours;
      electricityCost = kWh * calc.electricity.tariffPerKWh;
    }
  } else if (calc.electricity.measuredKWh !== null) {
    electricityCost = calc.electricity.measuredKWh * calc.electricity.tariffPerKWh;
  }

  // Máquina: depreciación y mantenimiento separados de electricidad (nunca se suman entre sí con
  // ella). `machineHourlyRate` es el S/0.65/h de referencia mostrado en la UI.
  const depreciationCost = totalPrintHours !== null ? totalPrintHours * calc.machineDepreciationPerHour : 0;
  const maintenanceCost = totalPrintHours !== null ? totalPrintHours * calc.machineMaintenancePerHour : 0;
  const machineCost = depreciationCost + maintenanceCost;
  const machineHourlyRate = calc.machineDepreciationPerHour + calc.machineMaintenancePerHour;

  const failureRate = calc.failureRate / 100;
  const failureBase = materialWithWaste + electricityCost + machineCost;
  const failureProvision = failureBase * failureRate;

  const directProductionCost = materialWithWaste + electricityCost + machineCost + failureProvision;

  // Trabajo manual: Diseño/preparación aplica por proyecto/tanda; Acabado/ensamblaje por unidad.
  // Ambos comparten la misma tarifa hora-hombre (spec: "Trabajo manual").
  const designCost = (calc.designMinutes / 60) * calc.laborHourlyRate;
  const finishingCost = (calc.finishingMinutes / 60) * calc.laborHourlyRate * qtyForScope;
  const laborTotal = designCost + finishingCost;

  // Packaging: siempre un costo monetario, nunca tiempo.
  const packagingCost = calc.packagingScope === 'unit' ? calc.packagingAmount * qtyForScope : calc.packagingAmount;

  const additionalLines: AdditionalLineResult[] = calc.additionalRows.map((row) => ({ id: row.id, cost: additionalRowCost(row, qtyForScope) }));
  const additionalTotal = additionalLines.reduce((sum, line) => sum + line.cost, 0);

  const baseBeforeIndirect = directProductionCost + laborTotal + packagingCost + additionalTotal;

  const indirectCost = calc.indirectMode === 'fixed' ? calc.indirectFixedAmount : baseBeforeIndirect * (calc.indirectPercentage / 100);

  const totalCost = baseBeforeIndirect + indirectCost;
  const unitCost = quantity && quantity > 0 ? totalCost / quantity : 0;

  const cost: CostBreakdown = {
    materialLines,
    totalMaterialCost,
    materialWithWaste,
    electricityCost,
    depreciationCost,
    maintenanceCost,
    machineCost,
    machineHourlyRate,
    failureProvision,
    directProductionCost,
    designCost,
    finishingCost,
    laborTotal,
    packagingCost,
    additionalLines,
    additionalTotal,
    baseBeforeIndirect,
    indirectCost,
    totalCost,
    unitCost,
  };

  const c = calc.commissionRate / 100;
  const m = calc.targetMargin / 100;
  const denominator = 1 - c - m;
  const hasValidSolution = denominator > 0;
  if (!hasValidSolution) missing.push('Margen objetivo + comisión no puede ser 100% o más.');

  let price: PriceBreakdown | null = null;
  if (hasValidSolution) {
    const F = calc.commissionFixed;
    const netPriceBeforeTax = (totalCost + F) / denominator;
    const commissionAmount = netPriceBeforeTax * c + F;
    const profit = netPriceBeforeTax - commissionAmount - totalCost;
    const effectiveMargin = netPriceBeforeTax > 0 ? profit / netPriceBeforeTax : 0;
    const markup = totalCost > 0 ? profit / totalCost : 0;

    const igvAmount = calc.applyIgv ? netPriceBeforeTax * IGV_RATE : 0;
    const finalPricePerUnit = netPriceBeforeTax + igvAmount;

    const step = ROUNDING_STEPS[calc.roundingMode];
    const roundedFinalPricePerUnit = roundUpToStep(finalPricePerUnit, step);
    const roundedNetPrice = calc.applyIgv ? roundedFinalPricePerUnit / (1 + IGV_RATE) : roundedFinalPricePerUnit;
    const roundedCommissionAmount = roundedNetPrice * c + F;
    const roundedProfit = roundedNetPrice - roundedCommissionAmount - totalCost;
    const roundedEffectiveMargin = roundedNetPrice > 0 ? roundedProfit / roundedNetPrice : 0;

    const totalOrderPrice = roundedFinalPricePerUnit * qtyForScope;

    price = {
      netPriceBeforeTax,
      commissionAmount,
      profit,
      effectiveMargin,
      markup,
      igvAmount,
      finalPricePerUnit,
      roundedFinalPricePerUnit,
      roundedNetPrice,
      roundedCommissionAmount,
      roundedProfit,
      roundedEffectiveMargin,
      totalOrderPrice,
      hasValidSolution,
    };
  }

  const uniqueMissing = [...new Set(missing)];

  return {
    scaleFactor,
    totalPrintHours,
    cost,
    price,
    missing: uniqueMissing,
    isComplete: uniqueMissing.length === 0,
  };
}
