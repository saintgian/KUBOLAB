/**
 * materialFamily.ts (Impresiones)
 * Puente entre `FilamentProfile.materialType` (slug editable de Materiales, ver
 * data/admin/materials.constants.ts) y `PolymerFamily`/`ReinforcementType` (vocabulario verificado
 * de Equipos, ver data/admin/printers.constants.ts) — dos espacios de valores distintos a propósito
 * (spec Equipos §12: "el payload debe distinguir polímero base y refuerzo/aditivo"). Solo mapea los
 * materialType conocidos hoy en Materiales; nunca inventa una familia para uno desconocido.
 */
import type { ReinforcementType } from '../../data/admin/printers.types';

export interface DerivedMaterialFamily {
  family: string;
  reinforcement?: ReinforcementType;
}

const MATERIAL_TYPE_FAMILY_MAP: Record<string, DerivedMaterialFamily> = {
  'pla-plus': { family: 'PLA' },
  petg: { family: 'PETG' },
  tpu: { family: 'TPU' },
  'pla-cf': { family: 'PLA', reinforcement: 'CF' },
  'petg-cf': { family: 'PETG', reinforcement: 'CF' },
  'pa-cf': { family: 'PA', reinforcement: 'CF' },
};

export function deriveMaterialFamily(materialType: string): DerivedMaterialFamily {
  return MATERIAL_TYPE_FAMILY_MAP[materialType] ?? { family: 'other' };
}
