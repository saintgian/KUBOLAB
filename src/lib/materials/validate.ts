/**
 * validate.ts (Materiales)
 * Validación inline por campo (nunca solo un toast) para los tres formularios del módulo: perfil,
 * ingreso de stock y actualización de peso. `firstInvalidField*` lleva el foco al primer campo
 * inválido al fallar el submit, siguiendo el mismo contrato que lib/expenses/validate.ts.
 */
import type { FilamentProfileFormValues, SpoolWeightUpdateValues, StockEntryFormValues } from '../../data/admin/materials.types';
import { isValidIsoDate } from './format';

export type ProfileFormErrors = Partial<Record<'name' | 'materialType' | 'colorName' | 'diameterMm' | 'usage' | 'validationStatus' | 'minimumStockG', string>>;

const PROFILE_FIELD_ORDER: (keyof ProfileFormErrors)[] = ['name', 'materialType', 'colorName', 'diameterMm', 'usage', 'validationStatus', 'minimumStockG'];

export function validateProfileForm(values: FilamentProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (!values.name.trim()) errors.name = 'Ingresa un nombre interno para el perfil.';
  if (!values.materialType) errors.materialType = 'Selecciona un tipo de material.';
  if (!values.colorName.trim()) errors.colorName = 'Ingresa el nombre del color.';
  if (!Number.isFinite(values.diameterMm) || values.diameterMm <= 0) errors.diameterMm = 'Ingresa un diámetro mayor a 0 mm.';
  if (!values.usage) errors.usage = 'Selecciona el uso permitido.';
  if (!values.validationStatus) errors.validationStatus = 'Selecciona el estado de validación.';
  if (!Number.isFinite(values.minimumStockG) || values.minimumStockG < 0) errors.minimumStockG = 'Ingresa un stock mínimo válido (0 o mayor).';
  return errors;
}

export function firstInvalidProfileField(errors: ProfileFormErrors): keyof ProfileFormErrors | null {
  return PROFILE_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export type StockEntryFormErrors = Partial<Record<'purchaseDate' | 'spoolCount' | 'netWeightPerSpoolG', string>>;

const STOCK_ENTRY_FIELD_ORDER: (keyof StockEntryFormErrors)[] = ['purchaseDate', 'spoolCount', 'netWeightPerSpoolG'];

export function validateStockEntryForm(values: StockEntryFormValues): StockEntryFormErrors {
  const errors: StockEntryFormErrors = {};
  if (!values.purchaseDate || !isValidIsoDate(values.purchaseDate)) errors.purchaseDate = 'Selecciona una fecha de compra válida.';
  if (!Number.isFinite(values.spoolCount) || values.spoolCount <= 0) errors.spoolCount = 'Ingresa una cantidad de bobinas mayor a 0.';
  if (!Number.isFinite(values.netWeightPerSpoolG) || values.netWeightPerSpoolG <= 0) errors.netWeightPerSpoolG = 'Ingresa un peso neto por bobina mayor a 0 g.';
  return errors;
}

export function firstInvalidStockEntryField(errors: StockEntryFormErrors): keyof StockEntryFormErrors | null {
  return STOCK_ENTRY_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export type WeightUpdateFormErrors = Partial<Record<'weightG', string>>;

export function validateWeightUpdateForm(values: SpoolWeightUpdateValues): WeightUpdateFormErrors {
  const errors: WeightUpdateFormErrors = {};
  if (!Number.isFinite(values.weightG) || values.weightG < 0) errors.weightG = 'Ingresa un peso válido (0 o mayor).';
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
