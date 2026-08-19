/**
 * floating-stack.ts
 * Contador global de FloatingPanel abiertos (Combobox/Popover/Calendar/Tooltip). Existe para
 * resolver el conflicto Modal + Escape: Modal y FloatingPanel escuchan `keydown` en `document`
 * con capture:true de forma independiente, y el listener de Modal se registra primero (se monta
 * antes de que el usuario abra ningún combobox), así que sin este contador Escape cerraba el
 * Modal completo en vez del combobox que estaba abierto encima. Modal consulta `hasOpenFloatingPanel()`
 * antes de cerrarse por Escape; si hay un panel abierto, cede el paso al propio Escape del panel.
 */
let depth = 0;

export function pushFloatingPanel(): void {
  depth += 1;
}

export function popFloatingPanel(): void {
  depth = Math.max(0, depth - 1);
}

export function hasOpenFloatingPanel(): boolean {
  return depth > 0;
}
