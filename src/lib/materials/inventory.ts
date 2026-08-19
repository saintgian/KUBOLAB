/**
 * inventory.ts
 * Único punto de derivación de stock/última compra/estado — la spec (§2) prohíbe guardar estos
 * valores como campos manuales del perfil, así que la lista, el resumen y el detalle SIEMPRE leen
 * estas funciones sobre `FilamentSpool[]`/`MaterialMovement[]`, nunca un campo propio.
 */
import type { FilamentProfile, FilamentSpool, MaterialMovement, StockStatus } from '../../data/admin/materials.types';

/** Bobinas descartadas no cuentan como stock disponible (están fuera de circulación). */
export function stockGForProfile(profileId: string, spools: FilamentSpool[]): number {
  return spools.filter((spool) => spool.profileId === profileId && spool.status !== 'discarded').reduce((sum, spool) => sum + Math.max(0, spool.remainingWeightG), 0);
}

export interface SpoolCounts {
  total: number;
  sealed: number;
  open: number;
  empty: number;
  discarded: number;
}

export function spoolCountsForProfile(profileId: string, spools: FilamentSpool[]): SpoolCounts {
  const own = spools.filter((spool) => spool.profileId === profileId);
  return {
    total: own.length,
    sealed: own.filter((s) => s.status === 'sealed').length,
    open: own.filter((s) => s.status === 'open').length,
    empty: own.filter((s) => s.status === 'empty').length,
    discarded: own.filter((s) => s.status === 'discarded').length,
  };
}

/** Fecha ISO más reciente entre los movimientos de tipo 'purchase' de este perfil, o null si nunca compró. */
export function lastPurchaseDateForProfile(profileId: string, movements: MaterialMovement[]): string | null {
  const dates = movements.filter((m) => m.profileId === profileId && m.type === 'purchase').map((m) => m.date);
  if (dates.length === 0) return null;
  return dates.reduce((latest, date) => (date > latest ? date : latest));
}

/** Reglas de estado derivado — nunca elegibles a mano (spec §7). */
export function deriveStockStatus(stockG: number, minimumStockG: number): StockStatus {
  if (stockG <= 0) return 'out-of-stock';
  if (stockG <= minimumStockG) return 'low-stock';
  return 'in-stock';
}

export interface MaterialListItem {
  profile: FilamentProfile;
  stockG: number;
  spoolCounts: SpoolCounts;
  lastPurchaseDate: string | null;
  stockStatus: StockStatus;
}

export interface PurchaseGroup {
  key: string;
  date: string;
  supplier: string | null;
  lot: string | null;
  spoolCount: number;
  totalWeightG: number;
  unitCost: number | null;
  totalCost: number | null;
  location: string | null;
}

/** Agrupa bobinas del mismo ingreso (misma fecha + proveedor + lote) en una sola línea de compra —
 * spec §15 pide conservar estos datos, sin fijar todavía una política contable de valoración. */
export function purchaseGroupsForProfile(profileId: string, spools: FilamentSpool[]): PurchaseGroup[] {
  const own = spools.filter((spool) => spool.profileId === profileId);
  const groups = new Map<string, PurchaseGroup>();
  for (const spool of own) {
    const key = `${spool.purchaseDate}__${spool.supplier ?? ''}__${spool.lot ?? ''}__${spool.unitCost ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.spoolCount += 1;
      existing.totalWeightG += spool.initialNetWeightG;
      existing.totalCost = existing.unitCost !== null ? existing.unitCost * existing.spoolCount : null;
    } else {
      groups.set(key, {
        key,
        date: spool.purchaseDate,
        supplier: spool.supplier ?? null,
        lot: spool.lot ?? null,
        spoolCount: 1,
        totalWeightG: spool.initialNetWeightG,
        unitCost: spool.unitCost ?? null,
        totalCost: spool.unitCost ?? null,
        location: spool.location ?? null,
      });
    }
  }
  return [...groups.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface InUseSpoolItem {
  spool: FilamentSpool;
  profile: FilamentProfile;
}

/** "Filamentos en uso" (spec: bobinas abiertas o actualmente asignadas) — una fila por bobina, no
 * por perfil, porque dos bobinas abiertas del mismo perfil son dos asignaciones físicas distintas.
 * `assignedTo` solo existe cuando Producción registre una reserva real; nunca se inventa acá. */
export function buildInUseSpoolItems(profiles: FilamentProfile[], spools: FilamentSpool[]): InUseSpoolItem[] {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile] as const));
  const items: InUseSpoolItem[] = [];
  for (const spool of spools) {
    if (spool.status !== 'open' && !spool.assignedTo) continue;
    const profile = profileById.get(spool.profileId);
    if (!profile) continue;
    items.push({ spool, profile });
  }
  return items.sort((a, b) => a.profile.name.localeCompare(b.profile.name, 'es'));
}

export function buildMaterialListItems(profiles: FilamentProfile[], spools: FilamentSpool[], movements: MaterialMovement[]): MaterialListItem[] {
  return profiles.map((profile) => {
    const stockG = stockGForProfile(profile.id, spools);
    return {
      profile,
      stockG,
      spoolCounts: spoolCountsForProfile(profile.id, spools),
      lastPurchaseDate: lastPurchaseDateForProfile(profile.id, movements),
      stockStatus: deriveStockStatus(stockG, profile.minimumStockG),
    };
  });
}
