/**
 * reference-cost.ts
 * Costo de referencia por kg de un perfil de filamento, derivado de sus compras registradas
 * (`FilamentSpool.unitCost` vía `purchaseGroupsForProfile`) — el perfil en sí no guarda un campo
 * de costo (ver materials.types.ts). Usado únicamente por la Calculadora de precios en modo
 * lectura: nunca escribe en Materiales ni descuenta stock (spec admin-price-calculator §9, §27).
 */
import type { FilamentSpool } from '../../data/admin/materials.types';
import { purchaseGroupsForProfile } from './inventory';

/** Costo/kg derivado de la compra más reciente con costo y peso conocidos, o null si el perfil
 * nunca registró una compra con costo (nunca se asume S/0 — spec §9). */
export function referenceCostPerKgForProfile(profileId: string, spools: FilamentSpool[]): number | null {
  const groups = purchaseGroupsForProfile(profileId, spools);
  const withCost = groups.find((group) => group.totalCost !== null && group.totalWeightG > 0);
  if (!withCost || withCost.totalCost === null) return null;
  return withCost.totalCost / (withCost.totalWeightG / 1000);
}
