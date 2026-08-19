/**
 * printer-models.ts
 * Catálogo centralizado de templates de modelo de impresora (spec §2/§4/§5) — único punto donde
 * vive la ficha técnica verificada de fabricante, la configuración instalada de fábrica y los
 * Supuestos KUBO de costeo de un modelo. El flujo de alta (PrinterProfileForm) SOLO lee de acá;
 * nunca hardcodea specs de la A1 en el componente visual, así que agregar un modelo nuevo es
 * agregar una entrada aquí, no tocar el formulario.
 */
import type { InstalledPrinterConfiguration, PrinterCostingDefaults, PrinterTechnicalSpecs } from './printers.types';

export interface PrinterModelTemplate {
  id: string;
  manufacturer: string;
  model: string;
  /** Prefijo usado para sugerir `internalName` (spec: "Bambu Lab A1 #02"). */
  namePrefix: string;
  technicalSpecs: PrinterTechnicalSpecs;
  installedConfiguration: Omit<InstalledPrinterConfiguration, 'installedAt'>;
  costing: PrinterCostingDefaults;
}

/** Único template disponible hoy (spec §22: no inventar perfiles de otras impresoras todavía). */
export const PRINTER_MODEL_TEMPLATES: PrinterModelTemplate[] = [
  {
    id: 'bambu-lab-a1',
    manufacturer: 'Bambu Lab',
    model: 'A1',
    namePrefix: 'Bambu Lab A1',
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
    },
    costing: {
      averagePowerW: 120,
      referenceValuePen: 2000,
      referenceLifeHours: 5000,
      depreciationPerHourPen: 0.4,
      maintenanceReservePerHourPen: 0.25,
    },
  },
];

export function findPrinterModelTemplate(manufacturer: string, model: string): PrinterModelTemplate | undefined {
  return PRINTER_MODEL_TEMPLATES.find(
    (t) => t.manufacturer.toLowerCase() === manufacturer.toLowerCase() && t.model.toLowerCase() === model.toLowerCase()
  );
}
