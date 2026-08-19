/**
 * spools.ts (Impresiones)
 * Selección de bobina física para una línea de material (spec "Bobinas y stock"): filtra bobinas
 * utilizables (no descartadas, con remainingWeightG > 0) de un perfil y arma la opción de Combobox
 * mostrando restante/estado/ubicación/lote — nunca solo el id, para poder distinguir dos bobinas del
 * mismo perfil.
 */
import type { FilamentSpool, SpoolStatus } from '../../data/admin/materials.types';
import { formatWeightG } from './format';

const SPOOL_STATUS_LABEL: Record<SpoolStatus, string> = {
  sealed: 'Sellada',
  open: 'Abierta',
  empty: 'Vacía',
  discarded: 'Descartada',
};

export function usableSpoolsForProfile(profileId: string, spools: FilamentSpool[]): FilamentSpool[] {
  return spools
    .filter((spool) => spool.profileId === profileId && spool.status !== 'discarded' && spool.remainingWeightG > 0)
    .sort((a, b) => b.remainingWeightG - a.remainingWeightG);
}

export function spoolOptionLabel(spool: FilamentSpool): string {
  const parts = [`${formatWeightG(spool.remainingWeightG)} restante`, SPOOL_STATUS_LABEL[spool.status]];
  if (spool.location) parts.push(spool.location);
  if (spool.lot) parts.push(`Lote ${spool.lot}`);
  return parts.join(' · ');
}

export function spoolOptionsForProfile(profileId: string, spools: FilamentSpool[]): { value: string; label: string }[] {
  return usableSpoolsForProfile(profileId, spools).map((spool) => ({ value: spool.id, label: spoolOptionLabel(spool) }));
}
