/**
 * Motion — valores centralizados para las islas Svelte.
 * Los mismos números existen como custom properties CSS en admin-core.css
 * (--motion-fast/--motion-normal/--motion-panel/--motion-ease) para que el motion de
 * markup estático (Astro/CSS) y el de las islas (Svelte, JS) no diverjan.
 */
export const MOTION = {
  fast: 140,
  normal: 180,
  panel: 260,
  ease: 'cubic-bezier(.2,.8,.2,1)',
} as const;

/** Lee prefers-reduced-motion en caliente (no cachea: el usuario puede cambiarlo en runtime). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Duración efectiva: 0 si el usuario pide movimiento reducido. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
