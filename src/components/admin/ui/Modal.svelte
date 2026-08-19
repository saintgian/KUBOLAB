<script lang="ts">
  /**
   * Modal.svelte
   * Shell genérico de diálogo centrado (portal a document.body, focus trap, Escape, backdrop
   * click, body-scroll-lock, restore focus). Los tamaños (`size`) controlan solo el ancho del
   * panel vía CSS — el consumidor sigue componiendo header/body/footer con las clases existentes
   * `.modal-header/.modal-body/.modal-footer` para no duplicar esa capa visual.
   */
  import type { Snippet } from 'svelte';
  import { portal } from '../../../lib/ui/portal';
  import { hasOpenFloatingPanel } from '../../../lib/ui/floating-stack';

  interface Props {
    onClose: () => void;
    labelledBy: string;
    describedBy?: string;
    size?: 'default' | 'compact' | 'form';
    panelClass?: string;
    closeOnBackdrop?: boolean;
    children: Snippet;
  }

  let { onClose, labelledBy, describedBy = undefined, size = 'default', panelClass = '', closeOnBackdrop = true, children }: Props = $props();

  let panelEl: HTMLElement | undefined = $state();
  let previouslyFocused: HTMLElement | null = null;

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Un Combobox/Popover/Calendar abierto encima del modal debe cerrarse primero — su propio
      // listener de Escape (ver FloatingPanel.svelte) se registró después del de este modal, así
      // que sin este check el modal se cerraría por completo antes de que el panel llegara a
      // reaccionar. El modal simplemente cede el turno; no hace nada más con este Escape.
      if (hasOpenFloatingPanel()) return;
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      const focusables = panelEl?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || !focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  $effect(() => {
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown, true);
    const initialFocus =
      panelEl?.querySelector<HTMLElement>('[data-modal-close]') ??
      panelEl?.querySelector<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    initialFocus?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown, true);
      previouslyFocused?.focus();
    };
  });
</script>

<div use:portal>
  <div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
    <div
      class={`modal-panel modal-panel--${size} ${panelClass}`}
      bind:this={panelEl}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {@render children()}
    </div>
  </div>
</div>
