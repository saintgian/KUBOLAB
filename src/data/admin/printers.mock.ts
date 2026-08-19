/**
 * printers.mock.ts
 * Seeds de Producción → Equipos. `DEMO_PRINTERS` trae exactamente el perfil inicial exigido por la
 * spec (§4): `Bambu Lab A1 #01`, `acquisitionDate` vacío, todos los contadores en 0. Los datos de
 * `technicalSpecs` están tomados de la ficha técnica oficial de Bambu Lab A1 (spec §2) — no se
 * inventa ningún valor no verificado. `DEMO_MAINTENANCE_RULES` combina 1) referencias explícitas de
 * fuente Bambu (`source: 'manufacturer'`) y 2) heurísticas preventivas internas (`source: 'kubo'`,
 * spec §11) — cada regla `kubo` declara su propio umbral, editable a futuro, y nunca se presenta
 * como intervalo oficial. `DEMO_MAINTENANCE_EVENTS` arranca vacío: KUBO no tiene historial previo
 * que reconstruir (spec §4/§22).
 */
import type { MaintenanceComponent, MaintenanceEvent, MaintenanceRule, PrinterProfile } from './printers.types';

export const PRINTERS_ARE_DEMO = true;

const A1_SCOPE = { manufacturer: 'Bambu Lab', model: 'A1' } as const;

export const DEMO_PRINTERS: PrinterProfile[] = [
  {
    id: 'printer-001',
    internalName: 'Bambu Lab A1 #01',
    manufacturer: 'Bambu Lab',
    model: 'A1',
    technology: 'FDM',
    status: 'active',
    serialNumber: '',
    acquisitionDate: '',
    technicalSpecs: {
      buildVolumeMm: { x: 256, y: 256, z: 256 },
      maxHotendTempC: 300,
      maxBedTempC: 100,
      supportedNozzleDiametersMm: [0.2, 0.4, 0.6, 0.8],
      manufacturerMaterialGuidance:
        'Ficha técnica A1: PLA, PETG, TPU y PVA como materiales ideales. ABS, ASA, PC, PA, PET y polímeros reforzados con CF/GF aparecen como Not Recommended.',
    },
    installedConfiguration: {
      nozzleDiameterMm: 0.4,
      nozzleMaterial: 'stainless-steel',
      buildPlate: 'Bambu Textured PEI Plate',
      hotendType: 'all-metal',
      installedAt: undefined,
    },
    costing: {
      averagePowerW: 120,
      referenceValuePen: 2000,
      referenceLifeHours: 5000,
      depreciationPerHourPen: 0.4,
      maintenanceReservePerHourPen: 0.25,
    },
    counters: {
      printMinutesTotal: 0,
      printsTotal: 0,
      printsSuccessful: 0,
      printsFailed: 0,
      filamentGramsTotal: 0,
      abrasiveFilamentGramsTotal: 0,
      filamentGramsByFamily: {},
      maintenanceEventsTotal: 0,
      lastPrintAt: undefined,
      lastMaintenanceAt: undefined,
    },
    notes: '',
    createdAt: '2026-08-19T09:00:00-05:00',
    updatedAt: '2026-08-19T09:00:00-05:00',
  },
];

/** Catálogo de componentes/consumibles (spec §7). El Essential Consumables Kit oficial de Bambu
 * para A1 incluye aceite/grasa, purge wiper, PTFE tubes, heatbed nozzle wiper, silicone sock y
 * filament cutter de repuesto — pertenecer al kit no implica un intervalo de cambio específico. */
export const MAINTENANCE_COMPONENTS: MaintenanceComponent[] = [
  { id: 'hotend-nozzle', label: 'Hotend / boquilla' },
  { id: 'extruder-gears', label: 'Extrusor (gears)' },
  { id: 'filament-cutter', label: 'Filament cutter', inOfficialConsumablesKit: true },
  { id: 'purge-wiper', label: 'Purge wiper', inOfficialConsumablesKit: true },
  { id: 'heatbed-nozzle-wiper', label: 'Heatbed nozzle wiper', inOfficialConsumablesKit: true },
  { id: 'ptfe-tubes', label: 'Tubos PTFE', inOfficialConsumablesKit: true },
  { id: 'silicone-sock', label: 'Silicone sock', inOfficialConsumablesKit: true },
  { id: 'lubrication-points', label: 'Puntos de lubricación (rieles/varillas)', inOfficialConsumablesKit: true },
  { id: 'build-plate', label: 'Placa de impresión (Textured PEI)' },
];

export const DEMO_MAINTENANCE_RULES: MaintenanceRule[] = [
  // Nozzle — regla del FABRICANTE: partículas abrasivas requieren boquilla endurecida.
  {
    id: 'rule-nozzle-abrasive-hardware',
    profileScope: A1_SCOPE,
    componentId: 'hotend-nozzle',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    materialCondition: { requiresAbrasiveExposure: true, requiredInstalledNozzleMaterial: ['stainless-steel'] },
    source: 'manufacturer',
    sourceLabel: 'Bambu Hotend — A1 Series (guía de compatibilidad por filamento/boquilla)',
    sourceReference: 'Partículas duras (CF/GF) requieren boquilla de acero endurecido para evitar desgaste excesivo.',
    severity: 'critical',
    enabled: true,
  },
  // Nozzle — regla KUBO: inspección preventiva por horas para uso no abrasivo (nunca "cambio obligatorio").
  {
    id: 'rule-nozzle-inspect-hours',
    profileScope: A1_SCOPE,
    componentId: 'hotend-nozzle',
    action: 'inspect',
    triggers: [{ type: 'hours', thresholdValue: 150 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  // Extrusor — lubricación/inspección preventiva.
  {
    id: 'rule-extruder-lubricate',
    profileScope: A1_SCOPE,
    componentId: 'extruder-gears',
    action: 'lubricate',
    triggers: [{ type: 'hours', thresholdValue: 200 }, { type: 'calendarDays', thresholdValue: 90 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  // Lubricación general de rieles/varillas.
  {
    id: 'rule-lubrication-general',
    profileScope: A1_SCOPE,
    componentId: 'lubrication-points',
    action: 'lubricate',
    triggers: [{ type: 'hours', thresholdValue: 200 }, { type: 'calendarDays', thresholdValue: 90 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  // Purge wiper — revisión por impresiones.
  {
    id: 'rule-purge-wiper-inspect',
    profileScope: A1_SCOPE,
    componentId: 'purge-wiper',
    action: 'inspect',
    triggers: [{ type: 'printCount', thresholdValue: 300 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-purge-wiper-replace',
    profileScope: A1_SCOPE,
    componentId: 'purge-wiper',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Reemplaza solo si el último mantenimiento registró desgaste, daño o limpieza deficiente.',
    severity: 'warning',
    enabled: true,
  },
  // Heatbed nozzle wiper — mismo tratamiento que purge wiper.
  {
    id: 'rule-heatbed-wiper-inspect',
    profileScope: A1_SCOPE,
    componentId: 'heatbed-nozzle-wiper',
    action: 'inspect',
    triggers: [{ type: 'printCount', thresholdValue: 300 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-heatbed-wiper-replace',
    profileScope: A1_SCOPE,
    componentId: 'heatbed-nozzle-wiper',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Reemplaza solo si el último mantenimiento registró desgaste o daño.',
    severity: 'warning',
    enabled: true,
  },
  // PTFE — revisión por gramos procesados.
  {
    id: 'rule-ptfe-inspect',
    profileScope: A1_SCOPE,
    componentId: 'ptfe-tubes',
    action: 'inspect',
    triggers: [{ type: 'filamentGrams', thresholdValue: 5000 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-ptfe-replace',
    profileScope: A1_SCOPE,
    componentId: 'ptfe-tubes',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Reemplaza solo si hay desgaste, deformación o fricción problemática registrada.',
    severity: 'warning',
    enabled: true,
  },
  // Silicone sock — revisión periódica.
  {
    id: 'rule-silicone-sock-inspect',
    profileScope: A1_SCOPE,
    componentId: 'silicone-sock',
    action: 'inspect',
    triggers: [{ type: 'calendarDays', thresholdValue: 60 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-silicone-sock-replace',
    profileScope: A1_SCOPE,
    componentId: 'silicone-sock',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Reemplaza solo si está deteriorado, roto o excesivamente contaminado.',
    severity: 'warning',
    enabled: true,
  },
  // Filament cutter — revisión periódica.
  {
    id: 'rule-filament-cutter-inspect',
    profileScope: A1_SCOPE,
    componentId: 'filament-cutter',
    action: 'inspect',
    triggers: [{ type: 'printCount', thresholdValue: 500 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'rule-filament-cutter-replace',
    profileScope: A1_SCOPE,
    componentId: 'filament-cutter',
    action: 'replace',
    triggers: [{ type: 'condition' }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Reemplaza por desgaste, cortes inconsistentes o condición dañada registrada.',
    severity: 'warning',
    enabled: true,
  },
  // Placa de impresión — inspección visual periódica (no consumible en el mismo sentido que PTFE/wipers).
  {
    id: 'rule-build-plate-inspect',
    profileScope: A1_SCOPE,
    componentId: 'build-plate',
    action: 'inspect',
    triggers: [{ type: 'printCount', thresholdValue: 200 }],
    triggerLogic: 'any',
    source: 'kubo',
    sourceLabel: 'Regla preventiva KUBO',
    sourceReference: 'Umbral interno editable — no es un intervalo oficial Bambu.',
    severity: 'info',
    enabled: true,
  },
];

export const DEMO_MAINTENANCE_EVENTS: MaintenanceEvent[] = [];
