/**
 * expenses.constants.ts
 * Listas controladas de Finanzas → Gastos, centralizadas para que ningún componente repita un
 * array propio (formulario, filtros, listado y exportación consumen exactamente estas mismas
 * opciones). Las categorías son fijas por ahora pero la forma { value, label } ya es compatible
 * con una futura fuente configurable sin cambiar el resto de la interfaz.
 */
import type {
  ExpenseCategory,
  ExpenseDestination,
  ExpenseDocumentType,
  ExpensePaymentMethod,
  ExpenseRelatedType,
  ExpenseUnit,
} from './expenses.types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const EXPENSE_CATEGORIES: Option<ExpenseCategory>[] = [
  { value: 'filament-materials', label: 'Filamento / materiales' },
  { value: 'production', label: 'Producción' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'tools-equipment', label: 'Herramientas y equipos' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'shipping', label: 'Envíos' },
  { value: 'mobility', label: 'Movilidad / pasajes' },
  { value: 'software', label: 'Software' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'services', label: 'Servicios' },
  { value: 'admin', label: 'Administrativo' },
  { value: 'other', label: 'Otros' },
];

export const EXPENSE_DESTINATIONS: Option<ExpenseDestination>[] = [
  { value: 'general', label: 'General' },
  { value: 'product', label: 'Producto' },
  { value: 'custom', label: 'Custom' },
  { value: 'production', label: 'Producción' },
  { value: 'admin', label: 'Administración' },
];

export const EXPENSE_PAYMENT_METHODS: Option<ExpensePaymentMethod>[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'debit-card', label: 'Tarjeta de débito' },
  { value: 'credit-card', label: 'Tarjeta de crédito' },
  { value: 'other', label: 'Otro' },
];

export const EXPENSE_DOCUMENT_TYPES: Option<ExpenseDocumentType>[] = [
  { value: 'none', label: 'Sin comprobante' },
  { value: 'boleta', label: 'Boleta' },
  { value: 'factura', label: 'Factura' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'other', label: 'Otro' },
];

export const EXPENSE_UNITS: Option<ExpenseUnit>[] = [
  { value: 'unit', label: 'Unidad' },
  { value: 'coil', label: 'Bobina' },
  { value: 'kg', label: 'Kg' },
  { value: 'box', label: 'Caja' },
  { value: 'service', label: 'Servicio' },
  { value: 'other', label: 'Otro' },
];

export const EXPENSE_RELATED_TYPES: Option<ExpenseRelatedType>[] = [
  { value: 'none', label: 'Ninguno' },
  { value: 'order', label: 'Pedido' },
  { value: 'custom-project', label: 'Proyecto Custom' },
  { value: 'product', label: 'Producto' },
];

/**
 * Referencias demo seleccionables para "Relacionado con". En producción esto vendría de
 * Pedidos/Custom/Productos reales — aquí es una lista fija y claramente etiquetada como demo.
 */
export const DEMO_RELATED_OPTIONS: Record<Exclude<ExpenseRelatedType, 'none'>, { id: string; label: string }[]> = {
  order: [
    { id: 'KUBO-1048', label: 'KUBO-1048 · Rosa Injante' },
    { id: 'KUBO-1052', label: 'KUBO-1052 · Bruno Salcedo' },
    { id: 'KUBO-1057', label: 'KUBO-1057 · Diana Ochoa' },
  ],
  'custom-project': [
    { id: 'CUSTOM-204', label: 'CUSTOM-204 · Organizador modular M1' },
    { id: 'CUSTOM-211', label: 'CUSTOM-211 · Soporte de pared Custom' },
  ],
  product: [
    { id: 'PROD-KUBO-BOX-01', label: 'Kubo Box Organizador' },
    { id: 'PROD-KUBO-DESK-02', label: 'Kubo Desk Set' },
  ],
};

/** Documentos aceptados en el adjunto de comprobante (extensión + mime, para input y validación). */
export const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
export const ATTACHMENT_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ATTACHMENT_ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
/** Límite de tamaño en frontend — arbitrario mientras no exista backend, fácil de ajustar aquí. */
export const ATTACHMENT_MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export function optionLabel<T extends string>(options: Option<T>[], value: T | undefined): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}
