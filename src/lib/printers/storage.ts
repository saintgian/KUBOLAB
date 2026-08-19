/**
 * storage.ts (Equipos)
 * Persistencia local versionada (spec §20) — separa perfiles de impresora y eventos de
 * mantenimiento en dos claves distintas, nunca en un único blob, para poder migrar cada uno de
 * forma independiente. El catálogo de componentes y las reglas de mantenimiento (seed KUBO) NO se
 * persisten: son datos de configuración de sistema, no algo que el usuario edite todavía (spec §20
 * "separar seed/modelo … configuración del usuario … contadores … reglas … eventos" — reglas/seed
 * viven en código hasta que exista una UI real para editarlas).
 *
 * Mismo criterio de tolerancia a datos corruptos que `lib/pricing/storage.ts`: cualquier entrada
 * que no calce con la forma esperada se descarta en vez de romper el módulo completo.
 */
import type { MaintenanceEvent, PrinterProfile } from '../../data/admin/printers.types';

const PROFILES_STORAGE_KEY = 'kubo:printers:profiles:v1';
const EVENTS_STORAGE_KEY = 'kubo:printers:maintenance-events:v1';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPrinterProfile(value: unknown): value is PrinterProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.internalName === 'string' &&
    typeof candidate.installedConfiguration === 'object' &&
    candidate.installedConfiguration !== null &&
    typeof candidate.counters === 'object' &&
    candidate.counters !== null &&
    typeof candidate.costing === 'object' &&
    candidate.costing !== null
  );
}

function isMaintenanceEvent(value: unknown): value is MaintenanceEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.printerId === 'string' &&
    typeof candidate.componentId === 'string' &&
    typeof candidate.counterSnapshot === 'object' &&
    candidate.counterSnapshot !== null
  );
}

export function loadStoredPrinters(): PrinterProfile[] | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isPrinterProfile);
  } catch {
    return null;
  }
}

export function persistPrinters(printers: PrinterProfile[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(printers));
  } catch {
    // Almacenamiento lleno o no disponible (modo privado, cuota excedida) — sigue funcionando en
    // memoria para esta sesión, simplemente no sobrevive a un refresh.
  }
}

export function loadStoredMaintenanceEvents(): MaintenanceEvent[] | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isMaintenanceEvent);
  } catch {
    return null;
  }
}

export function persistMaintenanceEvents(events: MaintenanceEvent[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ver nota de persistPrinters().
  }
}
