/**
 * printers.types.ts
 * Modelo de Producción → Equipos (docs/specs/admin-equipment-printers-spec.md). Separa a propósito
 * identidad/config instalada (`PrinterProfile`) de reglas (`MaintenanceRule`) y eventos
 * (`MaintenanceEvent`) — igual criterio que Materiales separa perfil/bobina/movimiento: registrar
 * un mantenimiento nunca debe poder tocar por accidente los contadores acumulados de la máquina
 * (spec §10 "Registrar mantenimiento nunca pone a cero los contadores globales").
 *
 * `technicalSpecs` solo contiene datos verificados en fuente oficial Bambu (spec §2/§22); los
 * defaults de costeo (`PrinterCostingDefaults`) son heurísticas KUBO, nunca datos de fabricante.
 */

export type PrinterTechnology = 'FDM';

export type PrinterStatus = 'active' | 'maintenance' | 'retired';

export type NozzleMaterial = 'stainless-steel' | 'hardened-steel' | 'other';

/** String (no unión literal) a propósito, mismo criterio que `MaterialType` en Materiales: la
 * spec exige poder sumar familias de polímero sin cambiar el modelo. Las conocidas hoy viven
 * centralizadas en printers.constants.ts. */
export type PolymerFamily = string;

/** Refuerzo/aditivo abrasivo — nunca el término genérico "fibra" (spec §12). */
export type ReinforcementType = 'CF' | 'GF' | 'other-abrasive';

export type MaintenanceAction = 'inspect' | 'clean' | 'lubricate' | 'replace';

export type MaintenanceTriggerType = 'hours' | 'printCount' | 'filamentGrams' | 'abrasiveGrams' | 'calendarDays' | 'condition';

export type MaintenanceRuleSource = 'manufacturer' | 'kubo';

export type MaintenanceConditionFound = 'ok' | 'wear' | 'damaged' | 'dirty' | 'other';

/** Estado UI de mantenimiento (spec §13) — evaluado, nunca guardado como campo persistente. */
export type MaintenanceStatus = 'up-to-date' | 'upcoming' | 'review' | 'attention';

export type MaintenanceSeverity = 'info' | 'warning' | 'critical';

/** Solo datos reales verificados en fuente oficial Bambu (spec §2/§6). Todo campo puede quedar
 * vacío si no hay fuente verificada — nunca se rellena con un valor inventado. */
export interface PrinterTechnicalSpecs {
  buildVolumeMm?: { x: number; y: number; z: number };
  maxHotendTempC?: number;
  maxBedTempC?: number;
  supportedNozzleDiametersMm?: number[];
  /** Ej. "PLA/PETG/TPU/PVA: Ideal · ABS/ASA/PC/PA/PET/CF/GF: Not Recommended (ficha A1)". */
  manufacturerMaterialGuidance?: string;
}

export interface InstalledPrinterConfiguration {
  nozzleDiameterMm: number;
  nozzleMaterial: NozzleMaterial;
  buildPlate?: string;
  hotendType?: string;
  /** Fecha en que se instaló esta configuración — se actualiza al registrar un mantenimiento que
   * cambia de repuesto (spec §16), nunca al editar el perfil por otro motivo. */
  installedAt?: string;
}

/** Defaults operativos KUBO para costeo — NUNCA especificaciones oficiales de Bambu (spec §5/§22).
 * `machineCostPerHourPen = depreciationPerHourPen + maintenanceReservePerHourPen`; no incluye
 * electricidad. */
export interface PrinterCostingDefaults {
  averagePowerW: number;
  referenceValuePen: number;
  referenceLifeHours: number;
  depreciationPerHourPen: number;
  maintenanceReservePerHourPen: number;
}

export interface PrinterCounters {
  printMinutesTotal: number;
  printsTotal: number;
  printsSuccessful: number;
  printsFailed: number;
  filamentGramsTotal: number;
  abrasiveFilamentGramsTotal: number;
  /** Acumulado por familia de material (spec §4 "Mantener también acumulados por familia"). */
  filamentGramsByFamily: Record<PolymerFamily, number>;
  maintenanceEventsTotal: number;
  lastPrintAt?: string;
  lastMaintenanceAt?: string;
}

export interface PrinterProfile {
  id: string;
  internalName: string;
  manufacturer: string;
  model: string;
  technology: PrinterTechnology;
  status: PrinterStatus;
  serialNumber?: string;
  /** Vacía por defecto, editable por el usuario — nunca calculada automáticamente (spec §4/§5). */
  acquisitionDate?: string;
  technicalSpecs: PrinterTechnicalSpecs;
  installedConfiguration: InstalledPrinterConfiguration;
  costing: PrinterCostingDefaults;
  counters: PrinterCounters;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Componente/consumible del catálogo de mantenimiento (spec §7) — dato, no hardcodeado en la UI. */
export interface MaintenanceComponent {
  id: string;
  label: string;
  /** Pertenece al Essential Consumables Kit oficial de Bambu para A1 — no implica un intervalo de
   * cambio específico (spec §7), solo identifica el consumible. */
  inOfficialConsumablesKit?: boolean;
}

/** Condición de material/hardware que activa una regla sin depender de un trigger numérico —
 * p. ej. "material abrasivo + boquilla inoxidable instalada" (spec §11 nozzle). */
export interface MaintenanceMaterialCondition {
  requiresAbrasiveExposure?: boolean;
  requiredInstalledNozzleMaterial?: NozzleMaterial[];
}

export interface MaintenanceTrigger {
  type: MaintenanceTriggerType;
  /** Umbral numérico para hours/printCount/filamentGrams/abrasiveGrams/calendarDays. Vacío para
   * type 'condition' (evaluado solo por materialCondition/requiredConfiguration). */
  thresholdValue?: number;
}

export interface MaintenanceRule {
  id: string;
  /** Alcance del perfil al que aplica — el modelo A1 hoy, ampliable a futuros modelos. */
  profileScope: { manufacturer: string; model: string } | 'all';
  componentId: string;
  action: MaintenanceAction;
  triggers: MaintenanceTrigger[];
  triggerLogic: 'any' | 'all';
  materialCondition?: MaintenanceMaterialCondition;
  requiredConfiguration?: Partial<InstalledPrinterConfiguration>;
  source: MaintenanceRuleSource;
  /** Texto mostrado en UI — nunca "intervalo oficial" si `source === 'kubo'` (spec §11/§25). */
  sourceLabel: string;
  sourceReference?: string;
  severity: MaintenanceSeverity;
  enabled: boolean;
}

export interface MaintenanceEvent {
  id: string;
  printerId: string;
  date: string;
  componentId: string;
  action: MaintenanceAction;
  conditionFound: MaintenanceConditionFound;
  replacementPerformed: boolean;
  /** Solo si `replacementPerformed` es true y el repuesto cambia la configuración instalada
   * (p. ej. boquilla inoxidable → endurecida) — spec §16. */
  installedPart?: Partial<InstalledPrinterConfiguration>;
  /** Snapshot de los contadores de la impresora en el momento del evento — nunca se recalcula
   * después; es el punto desde el que se evalúa el siguiente ciclo de esa regla (spec §10). */
  counterSnapshot: PrinterCounters;
  notes?: string;
  createdAt: string;
}

/** Compatibilidad evaluada de un material (spec §12) — nunca se guarda, siempre se deriva. */
export type CompatibilityStatus = 'compatible' | 'not-recommended' | 'attention';

export interface MaterialCompatibilityResult {
  status: CompatibilityStatus;
  reason: string;
  /** Guía adicional de hardware específica (p. ej. hotend endurecido) — no cambia `status`. */
  additionalGuidance?: string;
  source: MaintenanceRuleSource;
}

/** Contrato de evaluación de material real usado en una impresión — payload mínimo que enviará
 * la futura pantalla Impresiones (spec §12/§18), reutilizado ya por el motor de mantenimiento. */
export interface PrintMaterialUsage {
  profileId: string;
  materialType: PolymerFamily;
  reinforcement?: ReinforcementType;
  grams: number;
}

/** Payload mínimo que enviará Producción → Impresiones (spec §17). No implementado todavía —
 * solo el contrato, para no romperlo cuando esa pantalla exista. */
export interface PrintRecordPayload {
  printerId: string;
  date: string;
  durationMinutes: number;
  result: 'success' | 'failed' | 'partial';
  unitsProduced: number;
  materials: PrintMaterialUsage[];
}

export type PrinterProfileFormValues = Omit<PrinterProfile, 'id' | 'createdAt' | 'updatedAt' | 'counters'>;

export interface MaintenanceEventFormValues {
  date: string;
  componentId: string;
  action: MaintenanceAction;
  conditionFound: MaintenanceConditionFound;
  replacementPerformed: boolean;
  installedPart?: Partial<InstalledPrinterConfiguration>;
  notes?: string;
}
