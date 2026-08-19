/**
 * sku.ts (Materiales)
 * Único punto de generación del SKU interno KUBO — `KUBO-FIL-{MATERIAL}-{COLOR}-{SECUENCIA}`.
 * `model.ts` es el único llamador (al crear un perfil, nunca al editar); no reimplementes esta
 * lógica en un componente. La secuencia es estable: nunca se recalcula ni cambia para perfiles ya
 * creados, y nunca colisiona porque se deriva del máximo ya usado para ese material+color.
 */
import type { FilamentProfile } from '../../data/admin/materials.types';

/** Código de material del SKU — no siempre coincide con la label mostrada (ej. "PLA+" -> "PLA"). */
const MATERIAL_SKU_CODE: Record<string, string> = {
  'pla-plus': 'PLA',
  petg: 'PETG',
  tpu: 'TPU',
  'pla-cf': 'PLA-CF',
  'petg-cf': 'PETG-CF',
  'pa-cf': 'PA-CF',
  other: 'OTRO',
};

/** Colores frecuentes de KUBO — cualquier color fuera de esta lista cae al fallback alfabético. */
const COLOR_SKU_CODE: Record<string, string> = {
  negro: 'BLK',
  blanco: 'WHT',
  transparente: 'CLR',
  natural: 'NAT',
  gris: 'GRY',
  rojo: 'RED',
  azul: 'BLU',
  verde: 'GRN',
  amarillo: 'YEL',
  naranja: 'ORG',
  morado: 'PUR',
  violeta: 'PUR',
  rosado: 'PNK',
  dorado: 'GLD',
  plateado: 'SLV',
  marrón: 'BRN',
  marron: 'BRN',
  beige: 'BEI',
};

/** Reduce cualquier texto a un código corto de letras mayúsculas (sin tildes/espacios) — fallback
 * cuando el material o color no está en el mapa de códigos conocidos. */
function fallbackCode(value: string, length: number): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  return cleaned.slice(0, length) || 'GEN';
}

export function materialSkuCode(materialType: string): string {
  return MATERIAL_SKU_CODE[materialType] ?? fallbackCode(materialType, 4);
}

export function colorSkuCode(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  return COLOR_SKU_CODE[key] ?? fallbackCode(colorName, 3);
}

/** Genera el SKU estable de un perfil nuevo. La secuencia es única entre perfiles que ya
 * comparten el mismo prefijo material+color (no un contador global) — así "PLA Negro" y
 * "PETG Negro" arrancan cada uno en 001. */
export function generateInternalSku(materialType: string, colorName: string, existingProfiles: FilamentProfile[]): string {
  const prefix = `KUBO-FIL-${materialSkuCode(materialType)}-${colorSkuCode(colorName || 'General')}-`;
  const usedSequences = existingProfiles
    .map((profile) => profile.internalCode)
    .filter((code): code is string => typeof code === 'string' && code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (usedSequences.length > 0 ? Math.max(...usedSequences) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}
