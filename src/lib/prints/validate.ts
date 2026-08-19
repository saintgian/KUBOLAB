/**
 * validate.ts (Impresiones)
 * Validación inline por campo (nunca solo un toast), mismo contrato que lib/materials/validate.ts /
 * lib/printers/validate.ts. Además de los campos simples, valida cada línea de material contra el
 * stock real de la bobina elegida — es la primera barrera contra stock negativo (spec "nunca stock
 * negativo silencioso"); `lib/prints/model.ts` repite el check como último resguardo.
 */
import type { FilamentSpool } from '../../data/admin/materials.types';
import type { PrintRecordFormValues } from '../../data/admin/prints.types';
import { isValidIsoDate } from './format';

export type PrintFormErrors = Partial<Record<'date' | 'name' | 'purpose' | 'result' | 'printerId' | 'durationMinutes' | 'producedUnits' | 'materials', string>>;

const FIELD_ORDER: (keyof PrintFormErrors)[] = ['date', 'name', 'purpose', 'result', 'printerId', 'durationMinutes', 'producedUnits', 'materials'];

export interface MaterialLineError {
  index: number;
  field: 'profileId' | 'spoolId' | 'consumedG' | 'wastedG';
  message: string;
}

export function validateMaterialLines(values: PrintRecordFormValues, spools: FilamentSpool[]): MaterialLineError[] {
  const errors: MaterialLineError[] = [];
  values.materials.forEach((line, index) => {
    if (!line.profileId) {
      errors.push({ index, field: 'profileId', message: 'Selecciona un perfil de material.' });
      return;
    }
    if (!line.spoolId) {
      errors.push({ index, field: 'spoolId', message: 'No hay una bobina con stock disponible para este perfil.' });
      return;
    }
    if (!Number.isFinite(line.consumedG) || line.consumedG <= 0) {
      errors.push({ index, field: 'consumedG', message: 'Ingresa los gramos realmente consumidos (mayor a 0).' });
      return;
    }
    const spool = spools.find((s) => s.id === line.spoolId);
    if (spool && line.consumedG > spool.remainingWeightG) {
      errors.push({ index, field: 'consumedG', message: `Supera el stock disponible en esta bobina (${spool.remainingWeightG} g).` });
    }
    if (line.wastedG !== undefined && (line.wastedG < 0 || line.wastedG > line.consumedG)) {
      errors.push({ index, field: 'wastedG', message: 'El desperdicio debe estar entre 0 y los gramos consumidos.' });
    }
  });
  return errors;
}

export function validatePrintForm(values: PrintRecordFormValues, spools: FilamentSpool[]): PrintFormErrors {
  const errors: PrintFormErrors = {};
  if (!values.date || !isValidIsoDate(values.date)) errors.date = 'Selecciona una fecha válida.';
  if (!values.name.trim()) errors.name = 'Ingresa un nombre para el trabajo.';
  if (!values.purpose) errors.purpose = 'Selecciona una finalidad.';
  if (!values.result) errors.result = 'Selecciona un resultado.';
  if (!values.printerId) errors.printerId = 'Selecciona una impresora.';
  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes < 0) errors.durationMinutes = 'Ingresa un tiempo real válido (0 o mayor).';
  if (!Number.isFinite(values.producedUnits) || values.producedUnits < 0) errors.producedUnits = 'Ingresa las piezas obtenidas (0 o mayor).';
  if (values.materials.length === 0) errors.materials = 'Agrega al menos una línea de material.';
  else if (validateMaterialLines(values, spools).length > 0) errors.materials = 'Revisa las líneas de material — hay datos incompletos o stock insuficiente.';
  return errors;
}

export function firstInvalidPrintField(errors: PrintFormErrors): keyof PrintFormErrors | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
