/**
 * storage.ts (Materiales)
 * Persistencia local versionada, mismo patrón que lib/printers/storage.ts. Necesaria a partir de
 * Producción → Impresiones (docs/specs/admin-production-prints-spec.md): una impresión descuenta
 * stock real y ese descuento debe sobrevivir a la navegación entre `/admin/produccion/materiales/`
 * y `/admin/produccion/impresiones/`, algo que el estado en memoria de MaterialsWorkspace no podía
 * garantizar por sí solo. Tres claves separadas (perfiles/bobinas/movimientos), igual criterio que
 * Equipos: cada dataset se puede migrar de forma independiente.
 */
import type { FilamentProfile, FilamentSpool, MaterialMovement } from '../../data/admin/materials.types';

const PROFILES_STORAGE_KEY = 'kubo:materials:profiles:v1';
const SPOOLS_STORAGE_KEY = 'kubo:materials:spools:v1';
const MOVEMENTS_STORAGE_KEY = 'kubo:materials:movements:v1';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isFilamentProfile(value: unknown): value is FilamentProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.materialType === 'string';
}

function isFilamentSpool(value: unknown): value is FilamentSpool {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.profileId === 'string' && typeof candidate.remainingWeightG === 'number';
}

function isMaterialMovement(value: unknown): value is MaterialMovement {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.profileId === 'string' && typeof candidate.quantityG === 'number';
}

function load<T>(key: string, guard: (value: unknown) => value is T): T[] | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(guard);
  } catch {
    return null;
  }
}

function persist<T>(key: string, value: T[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Almacenamiento lleno o no disponible (modo privado, cuota excedida) — sigue funcionando en
    // memoria para esta sesión, simplemente no sobrevive a un refresh.
  }
}

export function loadStoredProfiles(): FilamentProfile[] | null {
  return load(PROFILES_STORAGE_KEY, isFilamentProfile);
}
export function persistProfiles(profiles: FilamentProfile[]): void {
  persist(PROFILES_STORAGE_KEY, profiles);
}

export function loadStoredSpools(): FilamentSpool[] | null {
  return load(SPOOLS_STORAGE_KEY, isFilamentSpool);
}
export function persistSpools(spools: FilamentSpool[]): void {
  persist(SPOOLS_STORAGE_KEY, spools);
}

export function loadStoredMovements(): MaterialMovement[] | null {
  return load(MOVEMENTS_STORAGE_KEY, isMaterialMovement);
}
export function persistMovements(movements: MaterialMovement[]): void {
  persist(MOVEMENTS_STORAGE_KEY, movements);
}
