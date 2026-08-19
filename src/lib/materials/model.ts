/**
 * model.ts (Materiales)
 * Único punto de derivación de id/fechas al crear perfiles, bobinas y movimientos — y el único
 * lugar que traduce "Añadir stock inicial" / "Agregar stock" en el trío perfil+bobinas+movimiento
 * que exige la spec (§2: nunca convertir stock en un campo editable del perfil).
 */
import type {
  FilamentProfile,
  FilamentProfileFormValues,
  FilamentSpool,
  MaterialMovement,
  SpoolWeightUpdateValues,
  StockEntryFormValues,
} from '../../data/admin/materials.types';
import { generateMovementId, generateProfileId, generateSpoolId, todayIso } from './format';
import { generateInternalSku } from './sku';

/** `existingProfiles` es el array completo de sesión — se usa únicamente para calcular la
 * secuencia del SKU nuevo (spec "Centraliza la generación; no la dupliques en componentes"): al
 * editar (`existing` presente), el SKU del perfil nunca se recalcula ni cambia. */
export function buildProfile(values: FilamentProfileFormValues, existingProfiles: FilamentProfile[], existing?: FilamentProfile): FilamentProfile {
  const now = new Date().toISOString();
  if (existing) {
    return {
      ...values,
      id: existing.id,
      internalCode: existing.internalCode,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }
  return {
    ...values,
    id: generateProfileId(),
    internalCode: generateInternalSku(values.materialType, values.colorName, existingProfiles),
    createdAt: now,
    updatedAt: now,
  };
}

/** Un ingreso de stock crea SIEMPRE `spoolCount` bobinas idénticas (mismo peso/costo/lote/estado
 * inicial) + un único movimiento de compra por el total — nunca bobinas sin su movimiento, ni
 * viceversa (spec §8/§9: "el ingreso crea inventario/movimiento"). */
export function buildStockEntry(
  profileId: string,
  values: StockEntryFormValues
): { spools: FilamentSpool[]; movement: MaterialMovement } {
  const spools: FilamentSpool[] = Array.from({ length: values.spoolCount }, () => ({
    id: generateSpoolId(),
    profileId,
    lot: values.lot || undefined,
    status: values.initialStatus,
    initialNetWeightG: values.netWeightPerSpoolG,
    remainingWeightG: values.netWeightPerSpoolG,
    purchaseDate: values.purchaseDate,
    openedAt: values.initialStatus === 'open' ? values.purchaseDate : undefined,
    supplier: values.supplier || undefined,
    location: values.location || undefined,
    unitCost: values.unitCost,
    expenseId: values.relatedExpenseId || undefined,
    notes: values.notes || undefined,
  }));

  const movement: MaterialMovement = {
    id: generateMovementId(),
    profileId,
    type: 'purchase',
    quantityG: values.spoolCount * values.netWeightPerSpoolG,
    date: values.purchaseDate,
    note: values.notes || `Compra ingresada · ${values.spoolCount} bobina${values.spoolCount === 1 ? '' : 's'}`,
    relatedExpenseId: values.relatedExpenseId || undefined,
    createdAt: new Date().toISOString(),
  };

  return { spools, movement };
}

/** Peso restante nunca negativo (spec §11) — se aplica sea cual sea el método (neto directo o
 * bruto - tara). Devuelve la bobina actualizada + el movimiento de ajuste que lo explica. */
export function applySpoolWeightUpdate(
  spool: FilamentSpool,
  values: SpoolWeightUpdateValues
): { spool: FilamentSpool; movement: MaterialMovement } {
  const rawRemaining = values.method === 'gross' ? values.weightG - (spool.tareWeightG ?? 0) : values.weightG;
  const remainingWeightG = Math.max(0, Math.round(rawRemaining));
  const quantityG = remainingWeightG - spool.remainingWeightG;

  const updatedSpool: FilamentSpool = {
    ...spool,
    remainingWeightG,
    status: remainingWeightG === 0 && spool.status !== 'discarded' ? 'empty' : spool.status,
  };

  const movement: MaterialMovement = {
    id: generateMovementId(),
    profileId: spool.profileId,
    spoolId: spool.id,
    type: 'adjustment',
    quantityG,
    date: todayIso(),
    note: values.note || 'Actualización de peso restante',
    createdAt: new Date().toISOString(),
  };

  return { spool: updatedSpool, movement };
}
