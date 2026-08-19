/**
 * summary.ts (Calculadora de precios)
 * Único lugar que arma el texto de "Copiar resumen" — usado tanto por el cálculo que se está
 * ingresando (PriceCalculatorWorkspace.svelte) como por cada consulta de Historial
 * (PriceCalculatorHistory.svelte), para no duplicar esta lógica entre los dos lugares (spec §36).
 *
 * `consultDate` es siempre la fecha/hora de inicio de esa consulta — en el cálculo actual, cuándo
 * arrancó esa sesión de edición; en Historial, la guardada en el snapshot — nunca `new Date()` al
 * momento de copiar.
 */
import { PURPOSE_OPTIONS, optionLabel } from '../../data/admin/price-calculator.constants';
import type { CostBreakdown, PriceBreakdown } from './engine';
import type { PricingCalculation } from '../../data/admin/price-calculator.types';
import { formatCurrency, formatDateTime, formatGrams, formatHours, formatPercent } from './format';
import { materialSummaryLines } from './snapshot';

export interface SummaryInput {
  name: string;
  calc: PricingCalculation;
  materialLabels: Record<string, string>;
  cost: CostBreakdown;
  price: PriceBreakdown | null;
  isComplete: boolean;
  missing: string[];
  showCommercial: boolean;
  totalPrintHours: number | null;
  consultDate: string;
}

export function buildSummaryText(input: SummaryInput): string {
  const { name, calc, materialLabels, cost, price, isComplete, missing, showCommercial, totalPrintHours, consultDate } = input;
  const lines: string[] = [];

  lines.push(`Fecha de consulta: ${formatDateTime(consultDate)}`);
  lines.push(`${name} · ${optionLabel(PURPOSE_OPTIONS, calc.purpose)}`);
  lines.push(`Cantidad: ${calc.quantity ?? '—'} unidad(es)`);
  lines.push(`Impresora: ${calc.printerName || '—'}`);
  lines.push(`Tiempo de impresión: ${totalPrintHours !== null ? formatHours(totalPrintHours) : '—'}`);

  for (const line of materialSummaryLines(calc, materialLabels)) {
    lines.push(`Material: ${line}`);
  }

  lines.push(`Costo total: ${formatCurrency(cost.totalCost)}`);
  lines.push(`Costo / unidad: ${formatCurrency(cost.unitCost)}`);

  if (showCommercial && price) {
    lines.push(`Margen utilizado: ${formatPercent(calc.targetMargin / 100)}`);
    lines.push(`Precio sin IGV: ${formatCurrency(price.netPriceBeforeTax)}`);
    if (calc.applyIgv) lines.push(`IGV (18%): ${formatCurrency(price.igvAmount)}`);
    lines.push(`Precio final / unidad: ${formatCurrency(price.roundedFinalPricePerUnit)}`);
    lines.push(`Precio total: ${formatCurrency(price.totalOrderPrice)}`);
    lines.push(`Ganancia estimada: ${formatCurrency(price.roundedProfit)}`);
  }

  const assumptions: string[] = [];
  assumptions.push(`hora-hombre ${formatCurrency(calc.laborHourlyRate)}/h`);
  assumptions.push(`packaging ${formatCurrency(calc.packagingAmount)}`);
  assumptions.push(`merma ${calc.materialWasteRate}%`);
  assumptions.push(`fallos ${calc.failureRate}%`);
  if (showCommercial) assumptions.push(`redondeo S/${calc.roundingMode === 'none' ? '0' : calc.roundingMode}`);
  lines.push(`Supuestos: ${assumptions.join(' · ')}`);

  if (!isComplete) lines.push(`⚠ Cálculo incompleto: ${missing.join(' / ')}`);

  return lines.join('\n');
}

export interface SaleSummaryInput {
  name: string;
  calc: PricingCalculation;
  price: PriceBreakdown | null;
  isComplete: boolean;
  showCommercial: boolean;
}

/** Un cálculo tiene resultado comercial válido para "Copiar para venta" cuando está completo, muestra
 * precio de venta y el motor llegó a calcular un `price` (spec: nunca copiar con datos incompletos). */
export function hasValidSaleSummary({ price, isComplete, showCommercial }: SaleSummaryInput): boolean {
  return isComplete && showCommercial && price !== null;
}

/** Texto de "Copiar para venta" — deliberadamente distinto de `buildSummaryText`: solo lo que un
 * cliente necesita ver (nombre, cantidad, material total, IGV, precio final de venta), nunca costos
 * internos, margen, ganancia ni supuestos operativos. Único punto que arma este texto, reutilizado
 * por el cálculo actual (PriceCalculatorWorkspace.svelte) y por Historial
 * (PriceCalculatorHistory.svelte). */
export function buildSaleSummaryText(input: SaleSummaryInput): string | null {
  const { name, calc, price } = input;
  if (!hasValidSaleSummary(input)) return null;

  const totalGrams = calc.materials.reduce((sum, material) => sum + (material.grams ?? 0), 0);

  const lines: string[] = [];
  lines.push(`Nombre: ${name}`);
  lines.push(`Cantidad: ${calc.quantity ?? 0} unidades`);
  lines.push(`Material: ${formatGrams(totalGrams)}`);
  lines.push(`IGV: ${calc.applyIgv ? 'Incluido' : 'No incluido'}`);
  lines.push(`Precio final: ${formatCurrency((price as PriceBreakdown).totalOrderPrice)}`);

  return lines.join('\n');
}
