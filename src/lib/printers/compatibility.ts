/**
 * compatibility.ts (Equipos)
 * Evaluación de compatibilidad material/configuración (spec §2 "Matiz importante de las fuentes
 * Bambu" y §12). Regla central: CF/GF nunca se presenta como simplemente `Compatible` con A1 — la
 * ficha técnica general los marca `Not Recommended`; la guía de hardware del hotend es información
 * ADICIONAL sobre boquilla, no una reconciliación que suba el estado a `Compatible`/`Ideal`.
 * Distingue siempre `source: 'manufacturer'` (ficha técnica / guía de hotend) de `source: 'kubo'`
 * (familia no reconocida — cautela interna, nunca atribuida a Bambu).
 */
import { A1_COMPATIBLE_FAMILIES, A1_NOT_RECOMMENDED_FAMILIES, polymerFamilyLabel } from '../../data/admin/printers.constants';
import type { InstalledPrinterConfiguration, MaterialCompatibilityResult, PolymerFamily, ReinforcementType } from '../../data/admin/printers.types';

export function isAbrasive(reinforcement: ReinforcementType | undefined): boolean {
  return reinforcement === 'CF' || reinforcement === 'GF' || reinforcement === 'other-abrasive';
}

export function evaluateMaterialCompatibility(
  family: PolymerFamily,
  reinforcement: ReinforcementType | undefined,
  installedConfiguration: InstalledPrinterConfiguration
): MaterialCompatibilityResult {
  const familyLabel = polymerFamilyLabel(family) || family;

  if (isAbrasive(reinforcement)) {
    const reinforcementLabel = reinforcement === 'CF' ? 'CF' : reinforcement === 'GF' ? 'GF' : 'partículas abrasivas';

    if (installedConfiguration.nozzleMaterial === 'stainless-steel') {
      return {
        status: 'attention',
        reason: `${familyLabel}-${reinforcementLabel} contiene partículas abrasivas y la impresora tiene instalada boquilla de acero inoxidable.`,
        additionalGuidance: 'Bambu requiere boquilla de acero endurecido para filamentos con partículas duras (guía Bambu Hotend — A1 Series).',
        source: 'manufacturer',
      };
    }

    // Bambu solo probó PLA-CF/PETG-CF con endurecida 0.4 — GF y otras cargas abrasivas no están
    // cubiertas por esa guía específica (spec §2), así que caen en la recomendación general (0.6).
    const isTestedHardened04 = reinforcement === 'CF' && (family === 'PLA' || family === 'PETG') && installedConfiguration.nozzleMaterial === 'hardened-steel' && installedConfiguration.nozzleDiameterMm === 0.4;

    return {
      status: 'not-recommended',
      reason: `A1: polímeros reforzados con CF/GF aparecen como Not Recommended en la ficha técnica general.`,
      additionalGuidance: isTestedHardened04
        ? `Bambu probó ${familyLabel}-${reinforcementLabel} con boquilla endurecida de 0.4 mm (guía específica del hotend) — esto no cambia el estado general de A1 a Compatible/Ideal.`
        : 'La guía oficial del hotend favorece boquilla endurecida de 0.6 mm para CF/GF generales, para reducir riesgo de atasco y abrasión.',
      source: 'manufacturer',
    };
  }

  if (A1_COMPATIBLE_FAMILIES.has(family)) {
    return {
      status: 'compatible',
      reason: `${familyLabel} aparece como material ideal en la ficha técnica general de A1.`,
      source: 'manufacturer',
    };
  }

  if (A1_NOT_RECOMMENDED_FAMILIES.has(family)) {
    return {
      status: 'not-recommended',
      reason: `${familyLabel} aparece como Not Recommended en la ficha técnica general de A1.`,
      source: 'manufacturer',
    };
  }

  return {
    status: 'attention',
    reason: `${familyLabel || 'Este material'} no está en la ficha técnica general de A1 verificada por KUBO.`,
    additionalGuidance: 'Verifica compatibilidad en la fuente oficial de Bambu antes de imprimir — KUBO no tiene este dato confirmado.',
    source: 'kubo',
  };
}
