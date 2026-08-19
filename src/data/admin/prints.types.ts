/**
 * prints.types.ts
 * Modelo de Producción → Impresiones (docs/specs/admin-production-prints-spec.md). `PrintRecord` es
 * la fuente de verdad del uso real de una impresora y del consumo real de Materiales — Equipos y
 * Materiales nunca se editan a mano desde acá, siempre a través de los movimientos/efectos que este
 * módulo calcula (ver lib/prints/model.ts). Snapshot histórico (`printerSnapshot`/`materialSnapshot`)
 * porque el nombre/config de una impresora o un material puede cambiar después sin reescribir
 * impresiones ya registradas — los IDs siguen siendo la relación real (spec "Snapshot histórico").
 */
import type { ReinforcementType } from './printers.types';

export type PrintPurpose = 'sale' | 'custom' | 'calibration' | 'prototype' | 'internal' | 'sample';

export type PrintResult = 'success' | 'partial' | 'failed' | 'cancelled';

export interface PrintMaterialUsage {
  profileId: string;
  spoolId: string;
  consumedG: number;
  /** Subconjunto de `consumedG` — nunca se suma aparte (spec "Desperdicio"). */
  wastedG?: number;
  materialType: string;
  reinforcement?: ReinforcementType;
  materialSnapshot: { name: string; sku?: string };
  /** Enlaza esta línea con el `MaterialMovement` de consumo que generó — evita duplicar el
   * movimiento si el registro se vuelve a renderizar/guardar (spec "Movimiento de stock"). */
  materialMovementId?: string;
}

export interface PrintRecord {
  id: string;
  /** Ej. "IMP-0001" — identificador legible mostrado en historial/detalle. */
  displayId: string;
  date: string;
  name: string;
  purpose: PrintPurpose;
  result: PrintResult;
  printerId: string;
  printerSnapshot: {
    name: string;
    model: string;
    nozzleDiameterMm: number;
    nozzleMaterial: string;
    buildPlate?: string;
  };
  durationMinutes: number;
  plannedUnits?: number;
  producedUnits: number;
  materials: PrintMaterialUsage[];
  relatedOrderId?: string;
  relatedProjectId?: string;
  issueNote?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Valores editables del formulario — id/displayId/timestamps y los `materialMovementId` de cada
 * línea se derivan al guardar (lib/prints/model.ts), nunca se escriben a mano. */
export type PrintMaterialLineFormValues = Omit<PrintMaterialUsage, 'materialSnapshot' | 'materialMovementId' | 'materialType' | 'reinforcement'>;

export interface PrintRecordFormValues {
  date: string;
  name: string;
  purpose: PrintPurpose;
  result: PrintResult;
  printerId: string;
  durationMinutes: number;
  plannedUnits?: number;
  producedUnits: number;
  materials: PrintMaterialLineFormValues[];
  relatedOrderId?: string;
  relatedProjectId?: string;
  issueNote?: string;
  notes?: string;
}

/** Motor de consejos contextuales pre/post impresión (spec "PrintGuidanceRule"). No usa `any`: las
 * condiciones son todas opcionales y tipadas, una regla puede combinar varias a la vez (AND). */
export interface PrintGuidanceConditions {
  printerModel?: string[];
  purpose?: PrintPurpose[];
  materialTypes?: string[];
  reinforcement?: ('CF' | 'GF' | 'other-abrasive')[];
  nozzleMaterial?: string[];
  nozzleDiameterMm?: number[];
  previousMaterialTypes?: string[];
  maintenanceStates?: string[];
}

export interface PrintGuidanceRule {
  id: string;
  phase: 'pre-print' | 'post-print';
  title: string;
  message: string;
  severity: 'info' | 'review' | 'attention';
  source: 'manufacturer' | 'kubo';
  sourceLabel: string;
  sourceReference?: string;
  conditions: PrintGuidanceConditions;
  enabled: boolean;
}

export interface PrintGuidanceContext {
  printerModel: string;
  purpose: PrintPurpose;
  materialTypes: string[];
  reinforcements: ('CF' | 'GF' | 'other-abrasive')[];
  nozzleMaterial: string;
  nozzleDiameterMm: number;
  previousMaterialTypes: string[];
  maintenanceStates: string[];
  result?: PrintResult;
}
