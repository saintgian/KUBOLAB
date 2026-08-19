/**
 * portal.ts
 * Acción Svelte que mueve un nodo a un contenedor fuera del árbol donde se declaró (por defecto
 * `document.body`). Es la base de la arquitectura de overlays: Popover/Combobox/Calendar/Modal ya
 * no dependen de que ningún ancestro (`.panel { overflow: clip }`, stacking contexts de tarjetas,
 * etc.) los deje pintar por encima — quedan al nivel raíz del documento, con su propio z-index.
 */
export interface PortalOptions {
  target?: HTMLElement | string;
}

function resolveTarget(target: HTMLElement | string | undefined): HTMLElement {
  if (!target) return document.body;
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) throw new Error(`portal: no se encontró el contenedor "${target}"`);
    return el;
  }
  return target;
}

export function portal(node: HTMLElement, target?: HTMLElement | string) {
  const targetEl = resolveTarget(target);
  targetEl.appendChild(node);

  return {
    update(newTarget?: HTMLElement | string) {
      const nextTargetEl = resolveTarget(newTarget);
      if (nextTargetEl !== node.parentElement) nextTargetEl.appendChild(node);
    },
    destroy() {
      node.parentNode?.removeChild(node);
    },
  };
}
