<script lang="ts">
  /**
   * AdminSearch.svelte
   * Command search: reemplaza el input de búsqueda decorativo del topbar por un control real.
   * Busca únicamente sobre las rutas existentes en navigation.ts (flatNavItems) — nunca sobre
   * datos simulados de negocio. Un solo componente resuelve trigger + overlay + lista: separar
   * el trigger en su propia isla no aportaría nada (comparten todo el estado) y solo sumaría
   * hidratación.
   */
  import { onMount, tick } from 'svelte';
  import { flatNavItems, type NavItem } from '../../data/admin/navigation';
  import KuboIcon from '../ui/KuboIcon.svelte';

  let isOpen = $state(false);
  let query = $state('');
  let activeIndex = $state(0);
  let panelEl: HTMLElement | undefined = $state();
  let inputEl: HTMLInputElement | undefined = $state();
  let lastFocused: HTMLElement | null = null;

  let results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatNavItems;
    return flatNavItems.filter(
      (item: NavItem) => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  });

  function open() {
    lastFocused = document.activeElement as HTMLElement;
    isOpen = true;
    query = '';
    activeIndex = 0;
    document.body.style.overflow = 'hidden';
    tick().then(() => inputEl?.focus());
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    document.body.style.overflow = '';
    (lastFocused ?? document.querySelector<HTMLElement>('[data-search-trigger]'))?.focus();
    lastFocused = null;
  }

  function go(item: NavItem) {
    window.location.href = item.href;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      isOpen ? close() : open();
    }
  }

  function handlePanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length) activeIndex = (activeIndex + 1) % results.length;
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) activeIndex = (activeIndex - 1 + results.length) % results.length;
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) go(item);
      return;
    }
    if (event.key === 'Tab') {
      // Focus trap: el panel solo tiene el input y los botones de resultado.
      const focusables = panelEl?.querySelectorAll<HTMLElement>('input, button:not([disabled])');
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

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }

  onMount(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  });

  $effect(() => {
    if (activeIndex >= results.length) activeIndex = 0;
  });
</script>

<button
  type="button"
  class="global-search"
  data-search-trigger
  onclick={open}
  aria-haspopup="dialog"
  aria-expanded={isOpen}
  aria-label="Buscar en KUBO"
>
  <KuboIcon name="search" size={17} />
  <span class="search-placeholder">Buscar en KUBO...</span>
  <span class="search-shortcut" aria-hidden="true">⌘ K</span>
</button>

{#if isOpen}
  <div class="command-backdrop" onclick={handleBackdropClick} role="presentation">
    <div
      class="command-panel"
      bind:this={panelEl}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="Buscar en KUBO"
      onkeydown={handlePanelKeydown}
    >
      <label class="command-input-row">
        <KuboIcon name="search" size={18} />
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Buscar sección, módulo o herramienta..."
          aria-label="Buscar en KUBO"
          autocomplete="off"
        />
        <button type="button" class="command-close" onclick={close} aria-label="Cerrar búsqueda">
          <KuboIcon name="xmark" size={16} />
        </button>
      </label>

      <div class="command-results" role="listbox" aria-label="Resultados de búsqueda">
        {#if results.length === 0}
          <p class="command-empty">No encontramos esa sección.</p>
        {:else}
          {#each results as item, index (item.href)}
            <button
              type="button"
              class="command-result"
              class:is-active={index === activeIndex}
              role="option"
              aria-selected={index === activeIndex}
              onclick={() => go(item)}
              onmouseenter={() => (activeIndex = index)}
            >
              <span class="command-result-icon" aria-hidden="true">
                <KuboIcon name={item.icon} size={17} />
              </span>
              <span class="command-result-copy">
                <strong>{item.label}</strong>
                <small>{item.category}</small>
              </span>
              <KuboIcon name="nav-arrow-right" size={14} class="command-result-arrow" />
            </button>
          {/each}
        {/if}
      </div>

      <div class="command-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> cerrar</span>
      </div>
    </div>
  </div>
{/if}
