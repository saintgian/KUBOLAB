/**
 * storage.ts (Calculadora de precios)
 * Persistencia local del Historial (spec §36) — todavía no hay backend, así que el navegador es la
 * única fuente de verdad entre recargas. Guarda únicamente snapshots creados por `Guardar cálculo`;
 * nunca escribe en cada cambio reactivo del formulario (ver PriceCalculatorWorkspace.svelte).
 *
 * Tolerante a datos corruptos o de un formato futuro/pasado: cualquier entrada que no calce con
 * `PricingSnapshot` se descarta en vez de romper el historial completo.
 */
import type { PricingSnapshot } from '../../data/admin/price-calculator.types';

const HISTORY_STORAGE_KEY = 'kubo:calculator:history:v1';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPricingSnapshot(value: unknown): value is PricingSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.calculation === 'object' &&
    candidate.calculation !== null &&
    typeof candidate.result === 'object' &&
    candidate.result !== null
  );
}

export function loadHistorySnapshots(): PricingSnapshot[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPricingSnapshot);
  } catch {
    return [];
  }
}

export function persistHistorySnapshots(snapshots: PricingSnapshot[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Almacenamiento lleno o no disponible (modo privado, cuota excedida) — el historial sigue
    // funcionando en memoria para esta sesión, simplemente no sobrevive a un refresh.
  }
}
