/**
 * floating.ts
 * Cálculo de posición para overlays flotantes (popover/combobox/calendar/tooltip) posicionados
 * con `position: fixed` respecto al viewport — deliberado: al vivir en un portal a `document.body`
 * (ver portal.ts), `fixed` evita tener que sumar offsets de scroll de ancestros. Reposiciona con
 * flip vertical simple (arriba si no entra abajo) y clamp horizontal para nunca salir del viewport.
 */

export type FloatingSide = 'top' | 'bottom';
export type FloatingAlign = 'start' | 'end' | 'center';
export type FloatingPlacement = `${FloatingSide}-${FloatingAlign}`;

export interface FloatingSize {
  width: number;
  height: number;
}

export interface FloatingOptions {
  preferredPlacement?: FloatingPlacement;
  gap?: number;
  viewportPadding?: number;
  /**
   * Límite vertical adicional (ej. el `.modal-body` que contiene el trigger) — sin esto, un
   * Combobox dentro de un Modal calculaba su espacio disponible contra el viewport completo, así
   * que un trigger cerca del final del formulario podía abrir un panel que visualmente invadía el
   * `.modal-footer` (que vive fuera de `.modal-body`, pegado al fondo del modal). Con boundary, el
   * panel nunca crece más allá del área de contenido visible del modal.
   */
  boundary?: { top: number; bottom: number };
}

export interface FloatingResult {
  top: number;
  left: number;
  placement: FloatingPlacement;
  maxHeight: number;
}

export function computeFloatingPosition(anchor: DOMRect, panel: FloatingSize, options: FloatingOptions = {}): FloatingResult {
  const gap = options.gap ?? 8;
  const pad = options.viewportPadding ?? 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const preferred = options.preferredPlacement ?? 'bottom-start';
  const [preferredSide, align] = preferred.split('-') as [FloatingSide, FloatingAlign];

  const belowLimit = options.boundary ? Math.min(vh, options.boundary.bottom) : vh;
  const aboveLimit = options.boundary ? Math.max(0, options.boundary.top) : 0;
  const spaceBelow = belowLimit - anchor.bottom - gap - pad;
  const spaceAbove = anchor.top - aboveLimit - gap - pad;

  let side: FloatingSide = preferredSide;
  if (side === 'bottom' && panel.height > spaceBelow && spaceAbove > spaceBelow) {
    side = 'top';
  } else if (side === 'top' && panel.height > spaceAbove && spaceBelow > spaceAbove) {
    side = 'bottom';
  }

  let left: number;
  if (align === 'end') left = anchor.right - panel.width;
  else if (align === 'center') left = anchor.left + anchor.width / 2 - panel.width / 2;
  else left = anchor.left;

  left = Math.min(Math.max(left, pad), Math.max(pad, vw - panel.width - pad));

  const top = side === 'bottom' ? anchor.bottom + gap : Math.max(aboveLimit + pad, anchor.top - gap - panel.height);
  const maxHeight = side === 'bottom' ? Math.max(160, belowLimit - anchor.bottom - gap - pad) : Math.max(160, anchor.top - aboveLimit - gap - pad);

  return { top, left, placement: `${side}-${align}`, maxHeight };
}
