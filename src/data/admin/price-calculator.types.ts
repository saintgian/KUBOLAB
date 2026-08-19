/**
 * price-calculator.types.ts
 * Modelo de Herramientas → Calculadora de precios (docs/specs/admin-price-calculator-spec.md).
 * Calculadora 100% independiente: vive en memoria del componente, sin persistencia ni backend.
 * La única lectura externa es de perfiles de Producción → Materiales (solo lectura, ver
 * lib/materials/reference-cost.ts) — nunca descuenta stock ni escribe en Materiales/Finanzas.
 *
 * Varios campos (tarifa eléctrica, potencia, depreciación, mantenimiento, hora-hombre, packaging,
 * merma, fallos, margen, comisiones, indirectos, redondeo) llegan precargados con los "Supuestos
 * KUBO" (`KUBO_DEFAULTS` en price-calculator.constants.ts) para que el uso normal solo requiera
 * finalidad, cantidad, impresora, tiempo, material y gramos. Son supuestos operativos editables,
 * no tarifas oficiales — el usuario puede restaurarlos con `applyKuboDefaults` (lib/pricing/model.ts).
 */

export type CalculatorPurpose = 'sale' | 'custom' | 'test' | 'internal' | 'sample';

export type SlicerScope = 'unit' | 'batch';

export type ElectricityMode = 'estimated' | 'measured';

export type CostScope = 'project' | 'unit';

export type RoundingMode = 'none' | '0.10' | '0.50' | '1.00' | '5.00';

export type IndirectMode = 'fixed' | 'percentage';

/** 'profile' = costo tomado del perfil de Materiales; 'override' = costo manual para este cálculo
 * (nunca se escribe de vuelta en el perfil). */
export type MaterialCostSource = 'profile' | 'override';

export interface CalculationMaterial {
  id: string;
  profileId: string | '';
  /** Gramos reportados por el slicer, según `slicerScope` del cálculo. */
  grams: number | null;
  /** Costo/kg de referencia leído del perfil (o de su última compra) — null si el perfil no lo tiene. */
  referenceCostPerKg: number | null;
  /** `Usar otro costo para este cálculo` — nunca modifica el perfil real. */
  useOverride: boolean;
  costOverridePerKg: number | null;
}

export interface ElectricityInput {
  provider: string;
  location: string;
  /** S/kWh — Supuesto KUBO editable (default `KUBO_DEFAULTS.tariffPerKWh`). */
  tariffPerKWh: number;
  mode: ElectricityMode;
  /** W — Supuesto KUBO editable (default `KUBO_DEFAULTS.averagePowerW`), usado en modo Estimado. */
  averagePowerW: number;
  /** kWh medido para este trabajo — sin default inventado, exclusivo del modo Medido. */
  measuredKWh: number | null;
}

export interface AdditionalCostRow {
  id: string;
  concept: string;
  amount: number | null;
  scope: CostScope;
}

export interface PricingCalculation {
  name: string;
  notes: string;
  purpose: CalculatorPurpose;
  /** Para Prueba/Interno/Muestra, el bloque comercial se abre a demanda (spec §5). */
  simulateSalePrice: boolean;
  /** Cantidad final de unidades a costear. */
  quantity: number | null;
  /** Impresora usada para el costeo — texto libre precargado con `KUBO_DEFAULTS.printerName`.
   * Estructura preparada para que a futuro venga de perfiles de Equipos; esa integración no está
   * implementada todavía. */
  printerName: string;
  slicerScope: SlicerScope;
  unitsPerBatch: number | null;
  /** Editable — default sugerido `ceil(quantity / unitsPerBatch)`. */
  batches: number | null;
  printHours: number | null;
  printMinutes: number | null;
  materials: CalculationMaterial[];
  /** % — Supuesto KUBO editable (default `KUBO_DEFAULTS.materialWasteRate`). Solo afecta al costo
   * de material (spec §10). */
  materialWasteRate: number;
  electricity: ElectricityInput;
  /** S/h — Supuesto KUBO editable (default `KUBO_DEFAULTS.machineDepreciationPerHour`). */
  machineDepreciationPerHour: number;
  /** S/h — Supuesto KUBO editable (default `KUBO_DEFAULTS.machineMaintenancePerHour`). */
  machineMaintenancePerHour: number;
  /** % — Supuesto KUBO editable (default `KUBO_DEFAULTS.failureRate`). Aplica sobre
   * material+electricidad+máquina (spec §13). */
  failureRate: number;
  /** min — Trabajo manual › Diseño / preparación. Aplica por proyecto/tanda (no se multiplica por
   * cantidad), default 0. */
  designMinutes: number;
  /** min — Trabajo manual › Acabado / ensamblaje. Aplica por unidad (se multiplica por cantidad),
   * default 0. */
  finishingMinutes: number;
  /** S/h — tarifa única de hora-hombre para diseño y acabado. Supuesto KUBO editable
   * (default `KUBO_DEFAULTS.laborHourlyRate`). */
  laborHourlyRate: number;
  /** S/ — Packaging es únicamente un costo monetario (no se cobra como tiempo). Supuesto KUBO
   * editable (default `KUBO_DEFAULTS.packagingAmount`). */
  packagingAmount: number;
  /** Default `unit` (`KUBO_DEFAULTS.packagingScope`) — editable. */
  packagingScope: CostScope;
  additionalRows: AdditionalCostRow[];
  indirectMode: IndirectMode;
  indirectFixedAmount: number;
  /** % — solo usado si indirectMode === 'percentage'. */
  indirectPercentage: number;
  /** % — margen objetivo, control principal (spec §19). Supuesto KUBO editable (default 35). */
  targetMargin: number;
  /** % — comisión porcentual sobre precio neto antes de IGV (spec §18). */
  commissionRate: number;
  commissionFixed: number;
  applyIgv: boolean;
  /** Supuesto KUBO editable (default `KUBO_DEFAULTS.roundingMode`, S/0.50 hacia arriba). */
  roundingMode: RoundingMode;
  /** Filtro opcional cuando purpose es Venta/Custom (spec §27). */
  approvedForCommercialOnly: boolean;
}

/**
 * PricingSnapshot — registro guardado en Calculadora → Historial (spec §36). Congela una copia
 * completa e independiente de `PricingCalculation` más el resultado ya calculado en el momento de
 * `Guardar cálculo`, para que cambios futuros en KUBO_DEFAULTS o en el motor (`lib/pricing/engine.ts`)
 * nunca alteren un resultado histórico ya guardado. Solo se crea vía `Guardar cálculo` — nunca en
 * cada cambio reactivo del formulario.
 */
export interface PricingSnapshot {
  id: string;
  /** Reservado para migraciones de formato si el snapshot cambia de forma. */
  schemaVersion: 1;
  /** ISO 8601 — fecha y hora en que se inició esa consulta (spec §36), no la hora de guardado. */
  createdAt: string;
  /** Nunca vacío: si el usuario no puso Nombre, se genera desde material + finalidad + fecha/hora. */
  name: string;
  /** Copia congelada e independiente — abrir/duplicar nunca mutan este objeto. */
  calculation: PricingCalculation;
  /** `profileId -> "Nombre — Color"` resuelto al momento de guardar, para que el historial siga
   * siendo legible aunque el perfil de Materiales cambie o se elimine después. */
  materialLabels: Record<string, string>;
  /** Costo/precio ya calculados y congelados — spec §36 ("breakdown, costo total/unitario, precio
   * final total/unitario, ganancia y margen efectivo"). */
  result: {
    cost: import('../../lib/pricing/engine').CostBreakdown;
    price: import('../../lib/pricing/engine').PriceBreakdown | null;
    isComplete: boolean;
    missing: string[];
    totalPrintHours: number | null;
  };
  /** Si el bloque comercial (margen/IGV/precio) estaba visible al guardar — determina qué mostrar
   * en Abrir/Copiar resumen sin tener que recalcular `purposeShowsCommercialByDefault`. */
  showCommercial: boolean;
}
