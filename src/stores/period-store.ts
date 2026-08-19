/**
 * period-store.ts
 * Estado compartido mínimo entre dos islas Svelte independientes: el selector de período en
 * el header (AdminPeriodSelector.svelte) y el módulo de analítica en el dashboard
 * (DashboardAnalytics.svelte). Viven en regiones del DOM distintas (topbar vs. grid de
 * contenido), así que no pueden comunicarse por props — un store de Svelte importado por
 * ambos módulos es la opción más liviana (no añade dependencias: `svelte/store` viene con
 * Svelte) frente a duplicar el control dentro de cada isla o crear una tercera isla "puente".
 * No hay persistencia: al recargar vuelve a 7 días.
 */
import { writable } from 'svelte/store';

export type PeriodKey = '7d' | '30d' | '90d';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
};

export const periodStore = writable<PeriodKey>('7d');
