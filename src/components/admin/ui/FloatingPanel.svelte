<script lang="ts">
  /**
   * FloatingPanel.svelte
   * Primitive de overlay flotante reutilizable — capa base de Popover/Combobox/Calendar/Tooltip.
   * Se porta a `document.body` (ver lib/ui/portal.ts) para escapar de cualquier ancestro con
   * overflow/clip o stacking context problemático (la causa del bug "Periodo/Filtros recortados"),
   * y se posiciona con `position: fixed` calculado por lib/ui/floating.ts, con flip vertical y
   * clamp horizontal para nunca salir del viewport. En mobile (<768px) se convierte en bottom
   * sheet vía CSS (mismo mecanismo que ya usaba `.popover-backdrop`, ahora centralizado acá).
   */
  import { tick, type Snippet } from 'svelte';
  import { portal } from '../../../lib/ui/portal';
  import { computeFloatingPosition, type FloatingPlacement } from '../../../lib/ui/floating';
  import { pushFloatingPanel, popFloatingPanel } from '../../../lib/ui/floating-stack';

  interface Props {
    anchorEl: HTMLElement | null | undefined;
    open: boolean;
    onClose: () => void;
    placement?: FloatingPlacement;
    width?: number | 'trigger';
    minWidth?: number;
    /** Tope duro de alto, aparte del espacio disponible real (ej. Combobox: ~280px aunque sobre viewport). */
    maxHeightCap?: number;
    variant?: 'light' | 'carbon';
    role?: string;
    id?: string;
    ariaLabel?: string;
    labelledBy?: string;
    panelClass?: string;
    interactive?: boolean;
    children: Snippet;
  }

  let {
    anchorEl,
    open,
    onClose,
    placement = 'bottom-start',
    width = 'trigger',
    minWidth = 220,
    maxHeightCap = undefined,
    variant = 'light',
    role = 'dialog',
    id = undefined,
    ariaLabel = undefined,
    labelledBy = undefined,
    panelClass = '',
    interactive = true,
    children,
  }: Props = $props();

  let panelEl: HTMLElement | undefined = $state();
  let top = $state(-9999);
  let left = $state(-9999);
  let maxHeight = $state(320);

  function reposition() {
    if (!anchorEl || !panelEl) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    // Si el trigger vive dentro de un Modal, el límite real no es el viewport sino el área de
    // contenido visible (`.modal-body`) — evita que el panel invada el `.modal-footer` (ver
    // floating.ts `boundary`).
    const boundaryEl = anchorEl.closest<HTMLElement>('.modal-body');
    const boundary = boundaryEl ? boundaryEl.getBoundingClientRect() : undefined;
    // Si el trigger se desplazó fuera del área visible (scroll dentro del modal, o del propio
    // viewport) el panel ya no tiene nada que anclar — en vez de dejarlo flotando en una posición
    // obsoleta/incorrecta, lo cerramos. Vuelve a abrirse con normalidad cuando el trigger sea
    // visible de nuevo y el usuario interactúe con él.
    const visibleTop = boundary ? Math.max(boundary.top, 0) : 0;
    const visibleBottom = boundary ? Math.min(boundary.bottom, window.innerHeight) : window.innerHeight;
    const anchorVisible =
      anchorRect.bottom > visibleTop &&
      anchorRect.top < visibleBottom &&
      anchorRect.right > 0 &&
      anchorRect.left < window.innerWidth;
    if (!anchorVisible) {
      onClose();
      return;
    }
    const panelWidth = width === 'trigger' ? Math.max(anchorRect.width, minWidth) : width;
    panelEl.style.width = `${panelWidth}px`;
    const result = computeFloatingPosition(
      anchorRect,
      { width: panelWidth, height: panelEl.offsetHeight || 240 },
      { preferredPlacement: placement, boundary: boundary ? { top: boundary.top, bottom: boundary.bottom } : undefined }
    );
    top = result.top;
    left = result.left;
    maxHeight = maxHeightCap !== undefined ? Math.min(result.maxHeight, maxHeightCap) : result.maxHeight;
  }

  function handleDocClick(event: MouseEvent) {
    const target = event.target as Node;
    if (panelEl?.contains(target)) return;
    if (anchorEl?.contains(target)) return;
    onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      // El panel se cierra pero el Modal/formulario que lo contiene sigue abierto (ver Modal.svelte
      // + floating-stack.ts) — el foco vuelve al trigger, nunca se pierde en el documento.
      anchorEl?.focus();
      return;
    }
    // El panel vive en un portal a document.body (fuera del árbol del trigger). Si el panel abrió
    // dentro de un Modal y dejáramos que Tab saliera de forma nativa, escaparía del focus trap del
    // modal (el panel no es descendiente de su `panelEl`). Devolvemos el foco al trigger — que sí
    // vive dentro del modal — antes de cerrar, para que el trap del modal retome el control.
    if (event.key === 'Tab') {
      event.preventDefault();
      anchorEl?.focus();
      onClose();
    }
  }

  $effect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      await tick();
      if (!cancelled) reposition();
    })();
    pushFloatingPanel();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => reposition()) : null;
    if (ro && panelEl) ro.observe(panelEl);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('click', handleDocClick);
    document.addEventListener('keydown', handleKeydown, true);
    // Defensivo y ligero: en mobile el teclado virtual reduce el viewport visual sin disparar
    // `resize` de `window` en todos los navegadores — si `visualViewport` existe, lo escuchamos
    // también para que el panel se reposicione/clampee en vez de quedar detrás del teclado.
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', reposition);
    vv?.addEventListener('scroll', reposition);
    return () => {
      cancelled = true;
      popFloatingPanel();
      ro?.disconnect();
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('click', handleDocClick);
      document.removeEventListener('keydown', handleKeydown, true);
      vv?.removeEventListener('resize', reposition);
      vv?.removeEventListener('scroll', reposition);
    };
  });
</script>

{#if open}
  <div use:portal>
    <div class="floating-panel-backdrop" onclick={() => onClose()} aria-hidden="true"></div>
    <div
      class={`floating-panel ${variant === 'carbon' ? 'floating-panel--carbon' : ''} ${panelClass}`}
      bind:this={panelEl}
      style={`top:${top}px; left:${left}px; max-height:${maxHeight}px;`}
      role={interactive ? role : 'presentation'}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
    >
      {@render children()}
    </div>
  </div>
{/if}
