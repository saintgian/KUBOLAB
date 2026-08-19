/**
 * expenses.types.ts
 * Modelo de datos de Finanzas → Gastos. Vive en memoria de sesión (ver expenses.mock.ts) — no
 * hay backend ni persistencia todavía. El modelo ya está preparado para que, cuando exista un
 * origen real, solo haya que reemplazar la fuente de `Expense[]` sin tocar la interfaz: los
 * campos `relatedType`/`relatedId` ya separan la referencia conceptual (pedido/proyecto/producto)
 * de un futuro fetch real, y `attachment.file` es el único campo que no sobrevive a un refresh
 * (vive solo en memoria del navegador, por diseño — ver requisito de no simular URLs persistentes).
 */

export type ExpenseCategory =
  | 'filament-materials'
  | 'production'
  | 'packaging'
  | 'tools-equipment'
  | 'maintenance'
  | 'shipping'
  | 'mobility'
  | 'software'
  | 'marketing'
  | 'services'
  | 'admin'
  | 'other';

export type ExpenseDestination = 'general' | 'product' | 'custom' | 'production' | 'admin';

export type ExpensePaymentMethod =
  | 'cash'
  | 'yape'
  | 'plin'
  | 'transfer'
  | 'debit-card'
  | 'credit-card'
  | 'other';

export type ExpenseDocumentType = 'none' | 'boleta' | 'factura' | 'recibo' | 'ticket' | 'other';

export type ExpenseUnit = 'unit' | 'coil' | 'kg' | 'box' | 'service' | 'other';

export type ExpenseRelatedType = 'order' | 'custom-project' | 'product' | 'none';

export interface ExpenseAttachment {
  /** Nombre de archivo mostrado en UI. */
  fileName: string;
  /** Tamaño en bytes, cuando se conoce (no aplica a adjuntos demo precargados). */
  fileSize?: number;
  /** MIME type, cuando se conoce. */
  fileType?: string;
  /**
   * Referencia real al archivo, solo presente cuando el usuario lo adjuntó en esta sesión.
   * Nunca se sube a un servidor en esta etapa — vive únicamente en memoria del navegador y se
   * pierde al recargar. Los adjuntos del dataset demo no tienen `file` (no hay binario real).
   */
  file?: File;
}

export interface ExpenseRelated {
  type: ExpenseRelatedType;
  /** Id/referencia demo (p. ej. "KUBO-1048"). Sin conexión real a backend todavía. */
  id: string;
  /** Etiqueta legible para mostrar sin tener que resolver el id contra otro dataset. */
  label: string;
}

export interface Expense {
  id: string;
  /** Fecha del gasto en formato ISO (YYYY-MM-DD), sin componente de hora. */
  date: string;
  category: ExpenseCategory;
  concept: string;
  supplier?: string;
  /** Monto de la compra en soles, siempre > 0. */
  purchaseAmount: number;
  quantity?: number;
  unit?: ExpenseUnit;
  hasMobility: boolean;
  mobilityAmount?: number;
  mobilityReason?: string;
  /** Derivado de purchaseAmount + (mobilityAmount si hasMobility). Nunca se edita a mano. */
  totalAmount: number;
  paymentMethod: ExpensePaymentMethod;
  paymentAccount?: string;
  destination: ExpenseDestination;
  related?: ExpenseRelated;
  documentType: ExpenseDocumentType;
  documentNumber?: string;
  attachment?: ExpenseAttachment;
  notes?: string;
  /** Timestamp ISO de cuándo se registró en esta sesión. */
  createdAt: string;
}

/** Valores editables del formulario — sin id/createdAt/totalAmount (estos se derivan al guardar). */
export type ExpenseFormValues = Omit<Expense, 'id' | 'createdAt' | 'totalAmount'>;
