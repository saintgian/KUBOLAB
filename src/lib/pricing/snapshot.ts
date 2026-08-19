/**
 * snapshot.ts (Calculadora de precios)
 * Fábrica de `PricingSnapshot` para Calculadora → Historial (spec §36). Único punto que arma un
 * snapshot: clona `PricingCalculation` para que "Abrir"/"Duplicar" nunca puedan mutar el registro
 * histórico por referencia, congela `materialLabels` (nombre de perfil resuelto al momento de
 * guardar) y genera un nombre legible cuando el usuario no puso uno.
 */
import { PURPOSE_OPTIONS, optionLabel } from '../../data/admin/price-calculator.constants';
import type { PricingResult } from './engine';
import type { FilamentProfile } from '../../data/admin/materials.types';
import type { PricingCalculation, PricingSnapshot } from '../../data/admin/price-calculator.types';
import { formatDateTime } from './format';

let snapshotSequence = 0;

function nextSnapshotId(): string {
  snapshotSequence += 1;
  return `calc-snap-${Date.now().toString(36)}-${snapshotSequence}`;
}

/** Deep clone genérico e independiente de la referencia original — evita que editar la copia abierta
 * en el formulario mute silenciosamente el snapshot guardado (spec §36, "Abrir"). `calc`/`cost`/
 * `price` son proxies reactivos de Svelte 5 (`$state`) mientras el formulario está montado:
 * `structuredClone` no sabe clonarlos (no tienen los internal slots que pide el algoritmo), así que
 * se usa JSON, que solo necesita leer propiedades planas — que es exactamente lo que es
 * `PricingCalculation` (sin `Date`, `Map` ni funciones). */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function cloneCalculation(calc: PricingCalculation): PricingCalculation {
  return deepClone(calc);
}

export function buildMaterialLabels(calc: PricingCalculation, profiles: FilamentProfile[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const material of calc.materials) {
    if (!material.profileId || labels[material.profileId]) continue;
    const profile = profiles.find((item) => item.id === material.profileId);
    if (profile) labels[material.profileId] = `${profile.name} — ${profile.colorName}`;
  }
  return labels;
}

/** Nombre legible generado a partir de material + finalidad + fecha/hora cuando el usuario dejó el
 * campo Nombre vacío (spec §36, "Si no hay nombre, genera uno legible"). */
export function generateSnapshotName(calc: PricingCalculation, materialLabels: Record<string, string>, createdAt: string): string {
  const trimmedName = calc.name.trim();
  if (trimmedName) return trimmedName;

  const firstMaterialWithLabel = calc.materials.find((material) => material.profileId && materialLabels[material.profileId]);
  const materialLabel = firstMaterialWithLabel ? materialLabels[firstMaterialWithLabel.profileId] : 'Sin material';
  const purposeLabel = optionLabel(PURPOSE_OPTIONS, calc.purpose);
  return `${materialLabel} · ${purposeLabel} · ${formatDateTime(createdAt)}`;
}

/** "PLA+ Negro — 160 g" por material — usado tanto por el resumen del cálculo actual (con
 * `materialLabels` recién resueltos) como por Historial (con `snapshot.materialLabels` congelados). */
export function materialSummaryLines(calc: PricingCalculation, materialLabels: Record<string, string>): string[] {
  return calc.materials.map((material) => {
    const label = material.profileId ? (materialLabels[material.profileId] ?? 'Material sin perfil') : 'Material sin perfil';
    const grams = material.grams !== null ? `${material.grams.toLocaleString('es-PE', { maximumFractionDigits: 1 })} g` : 'sin gramos';
    return `${label} — ${grams}`;
  });
}

export interface BuildSnapshotParams {
  calc: PricingCalculation;
  profiles: FilamentProfile[];
  createdAt: string;
  showCommercial: boolean;
  result: PricingResult;
}

export function buildSnapshot({ calc, profiles, createdAt, showCommercial, result }: BuildSnapshotParams): PricingSnapshot {
  const calculation = cloneCalculation(calc);
  const materialLabels = buildMaterialLabels(calc, profiles);
  const name = generateSnapshotName(calc, materialLabels, createdAt);

  return {
    id: nextSnapshotId(),
    schemaVersion: 1,
    createdAt,
    name,
    calculation,
    materialLabels,
    result: {
      cost: deepClone(result.cost),
      price: result.price ? deepClone(result.price) : null,
      isComplete: result.isComplete,
      missing: [...result.missing],
      totalPrintHours: result.totalPrintHours,
    },
    showCommercial,
  };
}
