/**
 * model.ts (Equipos)
 * Único punto de derivación de id/fechas al crear/editar un perfil, y el único lugar que traduce
 * "Registrar mantenimiento" en el par evento+perfil-actualizado que exige la spec (§10/§16):
 * registrar un evento JAMÁS reinicia `counters` (solo `maintenanceEventsTotal`/`lastMaintenanceAt`
 * cambian), y solo actualiza `installedConfiguration` cuando el evento trae `installedPart`.
 */
import type { MaintenanceEvent, MaintenanceEventFormValues, PrinterProfile, PrinterProfileFormValues } from '../../data/admin/printers.types';
import { generateMaintenanceEventId, generatePrinterId } from './format';

/** `{...a, ...partial}` sobrescribiría un campo existente con `undefined` si `partial` trae esa
 * clave con valor vacío ("Sin cambio" en el formulario) — filtra esas claves antes de mezclar. */
function definedFieldsOnly<T extends object>(partial: Partial<T>): Partial<T> {
  return Object.fromEntries(Object.entries(partial).filter(([, value]) => value !== undefined)) as Partial<T>;
}

/** Sugiere el siguiente nombre legible de una secuencia ("Bambu Lab A1 #02") a partir de los
 * nombres ya existentes que comparten `namePrefix` — nunca deriva el `id` del nombre (spec: "El ID
 * debe continuar siendo estable e independiente del nombre"), solo propone texto editable. */
export function suggestInternalName(existingPrinters: PrinterProfile[], namePrefix: string): string {
  const pattern = new RegExp(`^${namePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} #(\\d+)$`, 'i');
  const usedNumbers = existingPrinters
    .map((p) => p.internalName.match(pattern)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);
  const next = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
  return `${namePrefix} #${String(next).padStart(2, '0')}`;
}

export function buildPrinterProfile(values: PrinterProfileFormValues, existing?: PrinterProfile): PrinterProfile {
  const now = new Date().toISOString();
  if (existing) {
    return {
      ...values,
      id: existing.id,
      counters: existing.counters,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }
  return {
    ...values,
    id: generatePrinterId(),
    counters: {
      printMinutesTotal: 0,
      printsTotal: 0,
      printsSuccessful: 0,
      printsFailed: 0,
      filamentGramsTotal: 0,
      abrasiveFilamentGramsTotal: 0,
      filamentGramsByFamily: {},
      maintenanceEventsTotal: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Devuelve el evento nuevo + el perfil con `installedConfiguration`/metadata de mantenimiento
 * actualizados — nunca toca `printMinutesTotal`, `printsTotal`, `filamentGramsTotal`, etc. */
export function buildMaintenanceEvent(printer: PrinterProfile, values: MaintenanceEventFormValues): { event: MaintenanceEvent; printer: PrinterProfile } {
  const event: MaintenanceEvent = {
    id: generateMaintenanceEventId(),
    printerId: printer.id,
    date: values.date,
    componentId: values.componentId,
    action: values.action,
    conditionFound: values.conditionFound,
    replacementPerformed: values.replacementPerformed,
    installedPart: values.replacementPerformed && values.installedPart ? values.installedPart : undefined,
    counterSnapshot: printer.counters,
    notes: values.notes,
    createdAt: new Date().toISOString(),
  };

  const updatedPrinter: PrinterProfile = {
    ...printer,
    installedConfiguration:
      event.installedPart !== undefined
        ? { ...printer.installedConfiguration, ...definedFieldsOnly(event.installedPart), installedAt: values.date }
        : printer.installedConfiguration,
    counters: {
      ...printer.counters,
      maintenanceEventsTotal: printer.counters.maintenanceEventsTotal + 1,
      lastMaintenanceAt: values.date,
    },
    updatedAt: new Date().toISOString(),
  };

  return { event, printer: updatedPrinter };
}
