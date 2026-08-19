/**
 * drawer-store.ts
 * Estado del detail drawer reutilizable. Las filas que lo abren (Pedidos, Producción,
 * Proyectos Custom) son markup estático de Astro con un <button data-detail-trigger>; un único
 * listener delegado (ver src/pages/admin/index.astro) lee el JSON de data-detail y llama a
 * openDetail(). Así ninguna fila individual necesita hidratarse — solo el propio drawer
 * (AdminDetailDrawer.svelte) es una isla.
 */
import { writable } from 'svelte/store';

export type DrawerField = { label: string; value: string };

export type DrawerPayload = {
  eyebrow: string;
  title: string;
  badge?: { tone: string; label: string };
  fields: DrawerField[];
  actionHref?: string;
  actionLabel?: string;
};

export const drawerPayload = writable<DrawerPayload | null>(null);
export const drawerOpen = writable(false);

let lastTrigger: HTMLElement | null = null;

export function openDetail(payload: DrawerPayload, triggerEl?: HTMLElement | null) {
  lastTrigger = triggerEl ?? (typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null);
  drawerPayload.set(payload);
  drawerOpen.set(true);
}

export function closeDetail() {
  drawerOpen.set(false);
}

export function getLastTrigger(): HTMLElement | null {
  return lastTrigger;
}
