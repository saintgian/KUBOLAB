/**
 * guidance.ts (Impresiones)
 * Motor de consejos contextuales pre/post impresión (spec "Consejos contextuales" y
 * "PrintGuidanceRule"). Una regla aplica cuando TODAS sus condiciones declaradas coinciden (AND
 * entre campos, OR dentro de cada lista) — una regla sin condiciones aplica siempre dentro de su
 * fase. Nunca decide "por nombre/color" (spec "Compatibilidad": "Nunca inferir abrasividad por
 * nombre/color") — todo se evalúa contra `PrintGuidanceContext`, construido a partir de metadata
 * real (perfil, configuración instalada, mantenimiento).
 */
import type { PrintGuidanceContext, PrintGuidanceRule } from '../../data/admin/prints.types';

function matchesList<T>(ruleValues: T[] | undefined, contextValues: T[]): boolean {
  if (!ruleValues || ruleValues.length === 0) return true;
  return ruleValues.some((value) => contextValues.includes(value));
}

function matchesSingle<T>(ruleValues: T[] | undefined, contextValue: T): boolean {
  if (!ruleValues || ruleValues.length === 0) return true;
  return ruleValues.includes(contextValue);
}

export function ruleMatchesContext(rule: PrintGuidanceRule, context: PrintGuidanceContext): boolean {
  const c = rule.conditions;
  if (!matchesSingle(c.printerModel, context.printerModel)) return false;
  if (!matchesSingle(c.purpose, context.purpose)) return false;
  if (!matchesList(c.materialTypes, context.materialTypes)) return false;
  if (!matchesList(c.reinforcement, context.reinforcements)) return false;
  if (!matchesSingle(c.nozzleMaterial, context.nozzleMaterial)) return false;
  if (!matchesSingle(c.nozzleDiameterMm, context.nozzleDiameterMm)) return false;
  if (!matchesList(c.previousMaterialTypes, context.previousMaterialTypes)) return false;
  if (!matchesList(c.maintenanceStates, context.maintenanceStates)) return false;
  return true;
}

const SEVERITY_RANK: Record<PrintGuidanceRule['severity'], number> = { info: 0, review: 1, attention: 2 };

export function buildGuidanceForPhase(rules: PrintGuidanceRule[], phase: PrintGuidanceRule['phase'], context: PrintGuidanceContext): PrintGuidanceRule[] {
  return rules
    .filter((rule) => rule.enabled && rule.phase === phase && ruleMatchesContext(rule, context))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}
