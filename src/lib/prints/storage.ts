/**
 * storage.ts (Impresiones)
 * Persistencia local versionada, mismo patrón que lib/printers/storage.ts / lib/materials/storage.ts.
 */
import type { PrintRecord } from '../../data/admin/prints.types';

const PRINTS_STORAGE_KEY = 'kubo:prints:records:v1';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPrintRecord(value: unknown): value is PrintRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.displayId === 'string' &&
    typeof candidate.printerId === 'string' &&
    Array.isArray(candidate.materials)
  );
}

export function loadStoredPrints(): PrintRecord[] | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PRINTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isPrintRecord);
  } catch {
    return null;
  }
}

export function persistPrints(prints: PrintRecord[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(PRINTS_STORAGE_KEY, JSON.stringify(prints));
  } catch {
    // Almacenamiento lleno o no disponible — sigue funcionando en memoria para esta sesión.
  }
}
