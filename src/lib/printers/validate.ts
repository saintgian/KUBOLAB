/**
 * validate.ts (Equipos)
 * Validación inline por campo (nunca solo un toast), mismo contrato que lib/materials/validate.ts:
 * `firstInvalidField*` lleva el foco al primer campo inválido al fallar el submit.
 */
import type { MaintenanceEventFormValues, PrinterProfileFormValues } from '../../data/admin/printers.types';
import { isValidIsoDate } from './format';

export type ProfileFormErrors = Partial<Record<'internalName' | 'manufacturer' | 'model' | 'nozzleDiameterMm' | 'acquisitionDate', string>>;

const PROFILE_FIELD_ORDER: (keyof ProfileFormErrors)[] = ['internalName', 'manufacturer', 'model', 'acquisitionDate', 'nozzleDiameterMm'];

export function validateProfileForm(values: PrinterProfileFormValues, opts?: { requireAcquisitionDate?: boolean }): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (!values.internalName.trim()) errors.internalName = 'Ingresa un nombre interno para la impresora.';
  if (!values.manufacturer.trim()) errors.manufacturer = 'Ingresa el fabricante.';
  if (!values.model.trim()) errors.model = 'Ingresa el modelo.';
  if (opts?.requireAcquisitionDate && !values.acquisitionDate?.trim()) {
    errors.acquisitionDate = 'Ingresa la fecha de adquisición.';
  }
  if (!Number.isFinite(values.installedConfiguration.nozzleDiameterMm) || values.installedConfiguration.nozzleDiameterMm <= 0) {
    errors.nozzleDiameterMm = 'Ingresa un diámetro de boquilla mayor a 0 mm.';
  }
  return errors;
}

export function firstInvalidProfileField(errors: ProfileFormErrors): keyof ProfileFormErrors | null {
  return PROFILE_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export type MaintenanceEventFormErrors = Partial<Record<'date' | 'componentId', string>>;

const MAINTENANCE_EVENT_FIELD_ORDER: (keyof MaintenanceEventFormErrors)[] = ['date', 'componentId'];

export function validateMaintenanceEventForm(values: MaintenanceEventFormValues): MaintenanceEventFormErrors {
  const errors: MaintenanceEventFormErrors = {};
  if (!values.date || !isValidIsoDate(values.date)) errors.date = 'Selecciona una fecha válida.';
  if (!values.componentId) errors.componentId = 'Selecciona un componente.';
  return errors;
}

export function firstInvalidMaintenanceEventField(errors: MaintenanceEventFormErrors): keyof MaintenanceEventFormErrors | null {
  return MAINTENANCE_EVENT_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
