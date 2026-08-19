/**
 * prints.mock.ts
 * Seeds de Producción → Impresiones. `DEMO_PRINTS` arranca vacío: KUBO no tiene historial de
 * impresiones previo que reconstruir (mismo criterio que `DEMO_MAINTENANCE_EVENTS` en Equipos).
 * `DEMO_GUIDANCE_RULES` implementa las "Reglas iniciales de consejos" de la spec — cada regla
 * declara `source`/`sourceReference` explícitos; las que citan a Bambu enlazan la ficha oficial
 * verificada (spec "Fuentes oficiales Bambu a verificar"), el resto queda etiquetada `kubo`.
 */
import type { PrintGuidanceRule, PrintRecord } from './prints.types';

export const PRINTS_ARE_DEMO = true;

export const DEMO_PRINTS: PrintRecord[] = [];

const BAMBU_A1_URL = 'https://us.store.bambulab.com/products/A1/';
const BAMBU_HOTEND_A1_URL = 'https://us.store.bambulab.com/products/bambu-hotend-a1-series';

export const DEMO_GUIDANCE_RULES: PrintGuidanceRule[] = [
  // Abrasivos — fabricante: boquilla inoxidable + CF/GF/partícula dura.
  {
    id: 'guidance-abrasive-nozzle',
    phase: 'pre-print',
    title: 'Boquilla no apta para material abrasivo',
    message: 'Este material lleva CF/GF/partículas duras y la impresora tiene instalada boquilla de acero inoxidable. Bambu requiere boquilla de acero endurecido para reducir el desgaste con filamentos abrasivos.',
    severity: 'attention',
    source: 'manufacturer',
    sourceLabel: 'Bambu Hotend — A1 Series',
    sourceReference: BAMBU_HOTEND_A1_URL,
    conditions: { reinforcement: ['CF', 'GF', 'other-abrasive'], nozzleMaterial: ['stainless-steel'] },
    enabled: true,
  },
  // Abrasivos — fabricante: guía específica hardened 0.4 para PLA-CF/PETG-CF probado por Bambu.
  {
    id: 'guidance-cf-hardened-04',
    phase: 'pre-print',
    title: 'Guía específica de hotend para CF/GF',
    message: 'Bambu probó PLA-CF/PETG-CF con boquilla endurecida de 0.4 mm. Para CF/GF en general, la guía del hotend favorece 0.6 mm endurecida para reducir riesgo de atasco y abrasión.',
    severity: 'info',
    source: 'manufacturer',
    sourceLabel: 'Bambu Hotend — A1 Series',
    sourceReference: BAMBU_HOTEND_A1_URL,
    conditions: { reinforcement: ['CF', 'GF', 'other-abrasive'], nozzleMaterial: ['hardened-steel'] },
    enabled: true,
  },
  // Materiales no recomendados en A1 — fabricante.
  {
    id: 'guidance-a1-not-recommended',
    phase: 'pre-print',
    title: 'Material no recomendado para A1',
    message: 'La ficha técnica general de A1 marca este material como Not Recommended. Puedes registrar igual el resultado real de la impresión — esto no bloquea el historial.',
    severity: 'review',
    source: 'manufacturer',
    sourceLabel: 'Bambu Lab A1 — ficha técnica oficial',
    sourceReference: BAMBU_A1_URL,
    conditions: { materialTypes: ['ABS', 'ASA', 'PC', 'PA', 'PET'] },
    enabled: true,
  },
  // Limpieza/purga — KUBO.
  {
    id: 'guidance-purge-inspect',
    phase: 'pre-print',
    title: 'Inspecciona la boquilla antes de imprimir',
    message: 'Inspecciona la boquilla y purga residuos si cambiaste de material o ves material adherido.',
    severity: 'info',
    source: 'kubo',
    sourceLabel: 'Consejo KUBO',
    conditions: {},
    enabled: true,
  },
  // Calibración — KUBO.
  {
    id: 'guidance-calibration-record',
    phase: 'pre-print',
    title: 'Registra el resultado de la calibración',
    message: 'Si esta impresión valida un nuevo perfil técnico, recuerda actualizar Materiales manualmente después — nunca se modifica automáticamente.',
    severity: 'info',
    source: 'kubo',
    sourceLabel: 'Consejo KUBO',
    conditions: { purpose: ['calibration'] },
    enabled: true,
  },
  // Venta/Custom — KUBO.
  {
    id: 'guidance-sale-custom-check',
    phase: 'pre-print',
    title: 'Verifica cantidad y condición antes de marcar Correcta',
    message: 'Verifica la cantidad final y la condición visual/funcional de la pieza antes de marcar el resultado como Correcta.',
    severity: 'info',
    source: 'kubo',
    sourceLabel: 'Consejo KUBO',
    conditions: { purpose: ['sale', 'custom'] },
    enabled: true,
  },
  // Temperaturas — KUBO (fallback genérico cuando no hay perfil técnico real).
  {
    id: 'guidance-temperature-check',
    phase: 'pre-print',
    title: 'Verifica el perfil de material y la placa',
    message: 'Verifica que el perfil de material y la placa seleccionada coincidan con tu configuración de impresión.',
    severity: 'info',
    source: 'kubo',
    sourceLabel: 'Consejo KUBO',
    conditions: {},
    enabled: true,
  },
  // Fallida/Parcial — KUBO, postimpresión.
  {
    id: 'guidance-failed-partial-document',
    phase: 'post-print',
    title: 'Documenta la incidencia',
    message: 'Documenta la incidencia (qué falló, en qué momento) y revisa si esta impresión activó alguna acción de mantenimiento.',
    severity: 'review',
    source: 'kubo',
    sourceLabel: 'Consejo KUBO',
    conditions: {},
    enabled: true,
  },
];
