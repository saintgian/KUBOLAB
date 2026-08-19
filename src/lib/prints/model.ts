/**
 * model.ts (Impresiones)
 * Único punto de mutación de Producción → Impresiones — spec: "Centralizar estas mutaciones en
 * store/service, no en componentes". Tres responsabilidades separadas a propósito, igual criterio
 * que Materiales separa perfil/bobina/movimiento:
 *
 * 1. `applyPrintMaterialEffects` / `revertPrintMaterialEffects` — el único código que toca
 *    `FilamentSpool.remainingWeightG` y crea/retira `MaterialMovement` de tipo 'consumption' desde
 *    Impresiones. Editar SIEMPRE revierte antes de reaplicar (spec "nunca aplicar una edición sobre
 *    los efectos anteriores"; ejemplo: 184 g → 148 g devuelve 184 g y luego descuenta 148 g).
 * 2. `reconcilePrinterCounters` — recalcula los contadores de uso de una impresora sumando TODOS
 *    sus PrintRecord desde cero (nunca incrementa/decrementa a mano) — spec "reconciliar Equipos"
 *    sin drift posible: crear/editar/eliminar simplemente vuelven a llamarlo después de mutar el
 *    array de impresiones. `maintenanceEventsTotal`/`lastMaintenanceAt` no se tocan acá: pertenecen
 *    al mantenimiento (lib/printers/model.ts), no al uso de producción.
 * 3. `buildPrintRecord` / `duplicatePrintDraft` — orquestan 1) para producir el PrintRecord final +
 *    los arrays de bobinas/movimientos ya actualizados que el workspace debe guardar.
 */
import type { FilamentProfile, FilamentSpool, MaterialMovement } from '../../data/admin/materials.types';
import type { PrinterProfile } from '../../data/admin/printers.types';
import type { PrintMaterialLineFormValues, PrintMaterialUsage, PrintRecord, PrintRecordFormValues } from '../../data/admin/prints.types';
import { isAbrasive } from '../printers/compatibility';
import { generateMovementId } from '../materials/format';
import { generatePrintId, nextDisplayId } from './format';
import { deriveMaterialFamily } from './materialFamily';

export interface PrintMaterialEffectsResult {
  materials: PrintMaterialUsage[];
  spools: FilamentSpool[];
  movements: MaterialMovement[];
}

export class InsufficientStockError extends Error {
  constructor(public readonly profileName: string) {
    super(`Stock insuficiente en la bobina seleccionada de "${profileName}".`);
    this.name = 'InsufficientStockError';
  }
}

/** Aplica el consumo de una impresión sobre bobinas/movimientos que YA deben estar libres de
 * cualquier efecto anterior de esta misma impresión (llamar revertPrintMaterialEffects primero si
 * es una edición). Nunca deja stock negativo silencioso: si una línea pide más de lo disponible,
 * lanza `InsufficientStockError` en vez de clampear en silencio — el formulario debe validar esto
 * antes, esto es el último resguardo (spec "nunca stock negativo silencioso"). */
export function applyPrintMaterialEffects(
  lines: PrintMaterialLineFormValues[],
  profiles: FilamentProfile[],
  spools: FilamentSpool[],
  movements: MaterialMovement[],
  date: string,
  relatedPrintId: string
): PrintMaterialEffectsResult {
  let workingSpools = spools;
  const newMovements: MaterialMovement[] = [];
  const materials: PrintMaterialUsage[] = [];

  for (const line of lines) {
    const spool = workingSpools.find((s) => s.id === line.spoolId);
    const profile = profiles.find((p) => p.id === line.profileId);
    if (!spool || !profile) {
      throw new Error('Bobina o perfil de material no encontrado.');
    }
    if (line.consumedG > spool.remainingWeightG) {
      throw new InsufficientStockError(profile.name);
    }

    const remainingWeightG = Math.max(0, Math.round(spool.remainingWeightG - line.consumedG));
    workingSpools = workingSpools.map((s) =>
      s.id === spool.id ? { ...s, remainingWeightG, status: remainingWeightG === 0 && s.status !== 'discarded' ? 'empty' : s.status } : s
    );

    const { family, reinforcement } = deriveMaterialFamily(profile.materialType);
    const movement: MaterialMovement = {
      id: generateMovementId(),
      profileId: profile.id,
      spoolId: spool.id,
      type: 'consumption',
      quantityG: -line.consumedG,
      date,
      note: `Consumo de impresión ${relatedPrintId}`,
      relatedPrintId,
      createdAt: new Date().toISOString(),
    };
    newMovements.push(movement);
    materials.push({
      profileId: profile.id,
      spoolId: spool.id,
      consumedG: line.consumedG,
      wastedG: line.wastedG,
      materialType: family,
      reinforcement,
      materialSnapshot: { name: profile.name, sku: profile.internalCode },
      materialMovementId: movement.id,
    });
  }

  return { materials, spools: workingSpools, movements: [...movements, ...newMovements] };
}

/** Devuelve el gramaje consumido a cada bobina y retira los movimientos de tipo 'consumption' que
 * esa impresión había generado. Idempotente-seguro: si una bobina fue eliminada del inventario
 * mientras tanto, simplemente no hay nada que devolver para esa línea (no rompe el flujo). */
export function revertPrintMaterialEffects(record: PrintRecord, spools: FilamentSpool[], movements: MaterialMovement[]): { spools: FilamentSpool[]; movements: MaterialMovement[] } {
  let workingSpools = spools;
  for (const usage of record.materials) {
    const spool = workingSpools.find((s) => s.id === usage.spoolId);
    if (!spool) continue;
    const remainingWeightG = spool.remainingWeightG + usage.consumedG;
    workingSpools = workingSpools.map((s) =>
      s.id === spool.id ? { ...s, remainingWeightG, status: s.status === 'empty' && remainingWeightG > 0 ? 'open' : s.status } : s
    );
  }
  const movementIds = new Set(record.materials.map((m) => m.materialMovementId).filter((id): id is string => Boolean(id)));
  const workingMovements = movements.filter((m) => !movementIds.has(m.id));
  return { spools: workingSpools, movements: workingMovements };
}

interface BuildPrintRecordContext {
  profiles: FilamentProfile[];
  spools: FilamentSpool[];
  movements: MaterialMovement[];
  printer: PrinterProfile;
  existing?: PrintRecord;
  existingPrints: PrintRecord[];
}

/** Punto único de create/update (spec §"Editar y eliminar"): si `existing` viene presente, primero
 * revierte sus efectos y SOLO DESPUÉS valida y reaplica los nuevos — nunca aplica una edición sobre
 * los efectos anteriores. Puede lanzar `InsufficientStockError`. */
export function buildPrintRecord(values: PrintRecordFormValues, context: BuildPrintRecordContext): { record: PrintRecord; spools: FilamentSpool[]; movements: MaterialMovement[] } {
  const now = new Date().toISOString();
  let spools = context.spools;
  let movements = context.movements;

  const id = context.existing?.id ?? generatePrintId();
  const displayId = context.existing?.displayId ?? nextDisplayId(context.existingPrints);

  if (context.existing) {
    const reverted = revertPrintMaterialEffects(context.existing, spools, movements);
    spools = reverted.spools;
    movements = reverted.movements;
  }

  const effects = applyPrintMaterialEffects(values.materials, context.profiles, spools, movements, values.date, id);

  const record: PrintRecord = {
    id,
    displayId,
    date: values.date,
    name: values.name,
    purpose: values.purpose,
    result: values.result,
    printerId: values.printerId,
    printerSnapshot: {
      name: context.printer.internalName,
      model: context.printer.model,
      nozzleDiameterMm: context.printer.installedConfiguration.nozzleDiameterMm,
      nozzleMaterial: context.printer.installedConfiguration.nozzleMaterial,
      buildPlate: context.printer.installedConfiguration.buildPlate,
    },
    durationMinutes: values.durationMinutes,
    plannedUnits: values.plannedUnits,
    producedUnits: values.producedUnits,
    materials: effects.materials,
    relatedOrderId: values.relatedOrderId || undefined,
    relatedProjectId: values.relatedProjectId || undefined,
    issueNote: values.issueNote || undefined,
    notes: values.notes || undefined,
    createdAt: context.existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { record, spools: effects.spools, movements: effects.movements };
}

/** Revierte los efectos de una impresión que se va a eliminar — el caller retira `record` del
 * array de impresiones y llama `reconcilePrinterCounters` después (spec "Eliminar": "Revertir stock
 * y uso de Equipos antes de borrar"). */
export function deletePrintMaterialEffects(record: PrintRecord, spools: FilamentSpool[], movements: MaterialMovement[]): { spools: FilamentSpool[]; movements: MaterialMovement[] } {
  return revertPrintMaterialEffects(record, spools, movements);
}

/** Borrador nuevo para "Duplicar" (spec: "sin movimientos, ID ni fecha originales. No toca stock
 * hasta guardar"). El perfil de material se conserva como referencia útil, pero bobina/gramos se
 * reinician a propósito: la bobina original puede ya no tener stock, así que el usuario vuelve a
 * elegir de forma explícita en vez de heredar un consumo que podría fallar en silencio. */
export function duplicatePrintDraft(record: PrintRecord, todayIso: string): PrintRecordFormValues {
  return {
    date: todayIso,
    name: `${record.name} (copia)`,
    purpose: record.purpose,
    result: record.result,
    printerId: record.printerId,
    durationMinutes: record.durationMinutes,
    plannedUnits: record.plannedUnits,
    producedUnits: record.producedUnits,
    materials: record.materials.map((m) => ({ profileId: m.profileId, spoolId: '', consumedG: 0, wastedG: undefined })),
    relatedOrderId: record.relatedOrderId,
    relatedProjectId: record.relatedProjectId,
    issueNote: undefined,
    notes: undefined,
  };
}

/** Recalcula desde cero los contadores de USO de una impresora sumando todos sus PrintRecord —
 * nunca incrementa/decrementa un valor existente, así que crear/editar/eliminar impresiones no
 * puede desincronizar el contador (spec "Tras create/update/delete, reconciliar contadores para
 * evitar drift"). Deja intactos `maintenanceEventsTotal`/`lastMaintenanceAt` (pertenecen al
 * mantenimiento, no al uso de producción — ver lib/printers/model.ts). */
export function reconcilePrinterCounters(printer: PrinterProfile, allPrints: PrintRecord[]): PrinterProfile {
  const printsForThisPrinter = allPrints.filter((p) => p.printerId === printer.id);

  let printMinutesTotal = 0;
  let printsTotal = 0;
  let printsSuccessful = 0;
  let printsFailed = 0;
  let filamentGramsTotal = 0;
  let abrasiveFilamentGramsTotal = 0;
  const filamentGramsByFamily: Record<string, number> = {};
  let lastPrintAt: string | undefined;

  for (const print of printsForThisPrinter) {
    printMinutesTotal += print.durationMinutes;
    printsTotal += 1;
    if (print.result === 'success') printsSuccessful += 1;
    if (print.result === 'failed') printsFailed += 1;
    for (const usage of print.materials) {
      filamentGramsTotal += usage.consumedG;
      filamentGramsByFamily[usage.materialType] = (filamentGramsByFamily[usage.materialType] ?? 0) + usage.consumedG;
      if (isAbrasive(usage.reinforcement)) abrasiveFilamentGramsTotal += usage.consumedG;
    }
    if (!lastPrintAt || print.date > lastPrintAt) lastPrintAt = print.date;
  }

  return {
    ...printer,
    counters: {
      ...printer.counters,
      printMinutesTotal,
      printsTotal,
      printsSuccessful,
      printsFailed,
      filamentGramsTotal,
      abrasiveFilamentGramsTotal,
      filamentGramsByFamily,
      lastPrintAt,
    },
    updatedAt: new Date().toISOString(),
  };
}
