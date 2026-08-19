/**
 * materials.types.ts
 * Modelo de Producción → Materiales: perfil de filamento + inventario (bobinas) + movimientos,
 * separados a propósito (ver docs/specs/admin-materials-spec.md §2). Vive en memoria de sesión
 * (ver materials.mock.ts) — no hay backend todavía. `stockDisponible`/`ultimaCompra` NUNCA se
 * guardan como campos del perfil: se derivan siempre de `FilamentSpool[]`/`MaterialMovement[]`
 * (ver lib/materials/inventory.ts), para que no puedan divergir de la realidad del inventario.
 */

/**
 * String (no unión literal) a propósito: la spec exige poder sumar materiales futuros sin cambiar
 * el modelo. Las opciones conocidas hoy (PLA+, PETG) viven centralizadas en materials.constants.ts.
 */
export type MaterialType = string;

export type MaterialUsage = 'commercial' | 'internal' | 'both';

export type ValidationStatus = 'evaluation' | 'approved' | 'inactive';

export type SpoolPresentation = 'spool' | 'refill' | 'sample' | 'other';

export type SpoolStatus = 'sealed' | 'open' | 'empty' | 'discarded';

/** Solo 'purchase' y 'adjustment' tienen UI en esta iteración (ver spec §12) — 'consumption' y
 * 'waste' se generarán automáticamente cuando Producción esté conectado; 'return' queda modelado
 * para cuando exista el flujo de devoluciones. */
export type MovementType = 'purchase' | 'consumption' | 'waste' | 'adjustment' | 'return';

/** Derivado únicamente — nunca se guarda ni se elige a mano (ver spec §7). */
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

/** Datos documentados por el fabricante — nunca inventados; solo se cargan cuando vienen de ficha
 * técnica real. Todos los campos pueden quedar vacíos. */
export interface ManufacturerSpecs {
  nozzleTempRangeC?: string;
  bedTempRangeC?: string;
  densityGCm3?: number;
  dryingRecommendation?: string;
}

/** Valores que KUBO realmente probó — separados de la ficha del fabricante (ver spec §14). Todos
 * los campos pueden quedar vacíos; nunca se rellenan con defaults técnicos inventados. */
export interface KuboPrintProfile {
  nozzleTempC?: number;
  bedTempC?: number;
  flowRatio?: number;
  maxVolumetricSpeed?: number;
  printerCompatible?: string;
  nozzleCompatible?: string;
  bambuStudioPresetName?: string;
  lastCalibrationDate?: string;
  testNotes?: string;
}

export interface FilamentProfile {
  id: string;
  name: string;
  materialType: MaterialType;
  manufacturer?: string;
  productLine?: string;
  colorName: string;
  /** Referencia visual de inventario — no representa exactamente el resultado impreso. */
  colorHex?: string;
  diameterMm: number;
  manufacturerSku?: string;
  /** SKU interno KUBO — `KUBO-FIL-{MATERIAL}-{COLOR}-{SECUENCIA}` (ver lib/materials/sku.ts). Se
   * genera una sola vez al crear el perfil y nunca cambia al editar nombre/fabricante después. */
  internalCode?: string;
  usage: MaterialUsage;
  validationStatus: ValidationStatus;
  nominalSpoolWeightG?: number;
  tareWeightG?: number;
  presentation?: SpoolPresentation;
  presentationNotes?: string;
  /** Peso a partir del cual el stock se considera "Stock bajo" (ver spec §7). */
  minimumStockG: number;
  defaultLocation?: string;
  preferredSupplier?: string;
  manufacturerSpecs?: ManufacturerSpecs;
  kuboPrintProfile?: KuboPrintProfile;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilamentSpool {
  id: string;
  profileId: string;
  lot?: string;
  status: SpoolStatus;
  initialNetWeightG: number;
  remainingWeightG: number;
  tareWeightG?: number;
  purchaseDate: string;
  openedAt?: string;
  supplier?: string;
  location?: string;
  unitCost?: number;
  /** Preparado para enlazar con un Gasto real de Finanzas — nunca simulado en esta iteración. */
  expenseId?: string;
  /** Referencia a una orden/producción real que reserva esta bobina — solo se completa cuando
   * exista ese dato real (spec: nunca inventar asignaciones). Producción todavía no está conectado. */
  assignedTo?: string;
  notes?: string;
}

export interface MaterialMovement {
  id: string;
  profileId: string;
  spoolId?: string;
  type: MovementType;
  /** Gramos. Positivo = entra material (compra/devolución); negativo = sale o se corrige a menos
   * (consumo/merma/ajuste a la baja); un ajuste también puede ser positivo (corrección al alza). */
  quantityG: number;
  date: string;
  note?: string;
  relatedExpenseId?: string;
  /** Enlaza un movimiento de tipo 'consumption' con el PrintRecord que lo generó (Producción →
   * Impresiones) — evita duplicar el movimiento al recargar/re-renderizar y es lo que permite
   * revertir exactamente el efecto de una impresión al editarla/eliminarla. */
  relatedPrintId?: string;
  createdAt: string;
}

/** Valores editables del formulario de perfil — id/createdAt/updatedAt se derivan al guardar. */
export type FilamentProfileFormValues = Omit<FilamentProfile, 'id' | 'createdAt' | 'updatedAt'>;

/** Bloque opcional "Añadir stock inicial" al crear un perfil (spec §8) — mismos campos que
 * "Agregar stock" (spec §9) menos la referencia a un perfil ya existente. */
export interface StockEntryFormValues {
  purchaseDate: string;
  supplier?: string;
  spoolCount: number;
  netWeightPerSpoolG: number;
  unitCost?: number;
  lot?: string;
  initialStatus: Extract<SpoolStatus, 'sealed' | 'open'>;
  location?: string;
  relatedExpenseId?: string;
  documentReference?: string;
  notes?: string;
}

export type WeightUpdateMethod = 'net' | 'gross';

export interface SpoolWeightUpdateValues {
  method: WeightUpdateMethod;
  /** Peso neto restante (method 'net') o peso bruto de balanza (method 'gross'; se resta la tara). */
  weightG: number;
  note?: string;
}
