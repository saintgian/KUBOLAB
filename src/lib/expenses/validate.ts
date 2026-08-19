/**
 * validate.ts
 * Validación del formulario de gastos. Errores inline por campo (nunca solo un toast) — ver
 * requisito de accesibilidad: cada error se asocia a su input vía aria-describedby/aria-invalid
 * en ExpenseForm.svelte, que también usa `FIELD_ORDER` para llevar el foco al primer inválido.
 */
import type { ExpenseFormValues } from '../../data/admin/expenses.types';
import { ATTACHMENT_ACCEPTED_TYPES, ATTACHMENT_MAX_SIZE_BYTES } from '../../data/admin/expenses.constants';
import { formatFileSize, isValidIsoDate } from './format';

export type ExpenseFormErrors = Partial<Record<
  | 'date'
  | 'category'
  | 'concept'
  | 'purchaseAmount'
  | 'quantity'
  | 'mobilityAmount'
  | 'paymentMethod'
  | 'destination'
  | 'attachment',
  string
>>;

/** Orden de foco al enviar un formulario inválido — debe calzar con el orden visual de los campos. */
export const FIELD_ORDER: (keyof ExpenseFormErrors)[] = [
  'date',
  'category',
  'concept',
  'purchaseAmount',
  'quantity',
  'mobilityAmount',
  'paymentMethod',
  'destination',
  'attachment',
];

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  if (!values.date || !isValidIsoDate(values.date)) {
    errors.date = 'Selecciona una fecha válida.';
  }

  if (!values.category) {
    errors.category = 'Selecciona una categoría.';
  }

  if (!values.concept.trim()) {
    errors.concept = 'Ingresa un concepto para este gasto.';
  }

  if (!Number.isFinite(values.purchaseAmount) || values.purchaseAmount <= 0) {
    errors.purchaseAmount = 'Ingresa un monto mayor a S/ 0.00';
  }

  if (values.quantity !== undefined && values.quantity !== null && (!Number.isFinite(values.quantity) || values.quantity <= 0)) {
    errors.quantity = 'La cantidad debe ser mayor a 0.';
  }

  if (values.hasMobility) {
    if (!Number.isFinite(values.mobilityAmount) || (values.mobilityAmount ?? 0) <= 0) {
      errors.mobilityAmount = 'Ingresa el monto de movilidad o desactiva la opción.';
    }
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = 'Selecciona un medio de pago.';
  }

  if (!values.destination) {
    errors.destination = 'Selecciona un destino.';
  }

  return errors;
}

export function hasErrors(errors: ExpenseFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function firstInvalidField(errors: ExpenseFormErrors): keyof ExpenseFormErrors | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/** Validación centralizada del adjunto — un único lugar para ajustar tipos/tamaño permitidos. */
export function validateAttachmentFile(file: File): string | null {
  const isAccepted = ATTACHMENT_ACCEPTED_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!isAccepted) {
    return 'Formato no admitido. Usa PDF, JPG o PNG.';
  }
  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    return `El archivo pesa más de ${formatFileSize(ATTACHMENT_MAX_SIZE_BYTES)}.`;
  }
  return null;
}
