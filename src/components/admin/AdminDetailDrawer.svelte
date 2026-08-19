<script lang="ts">
  /**
   * AdminDetailDrawer.svelte
   * Primitiva reutilizable de detalle lateral. Se abre desde filas estáticas de Astro
   * (Pedidos, Producción, Proyectos Custom) a través de drawer-store.ts — las filas son
   * <button data-detail-trigger data-detail="..."> planos; un listener delegado en
   * index.astro llama a openDetail() con el JSON de esa fila. Solo este componente (el propio
   * drawer) necesita hidratarse; las filas que lo abren no cargan Svelte.
   * Desktop: panel lateral. Mobile: bottom-sheet (mismo componente, solo cambia el CSS).
   */
  import { onMount } from 'svelte';
  import { drawerOpen, drawerPayload, closeDetail, getLastTrigger } from '../../stores/drawer-store';
  import KuboIcon from '../ui/KuboIcon.svelte';

  let isOpen = $state(false);
  let payload = $state<import('../../stores/drawer-store').DrawerPayload | null>(null);
  let panelEl: HTMLElement | undefined = $state();

  drawerOpen.subscribe((value) => (isOpen = value));
  drawerPayload.subscribe((value) => (payload = value));

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeDetail();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDetail();
      return;
    }
    if (event.key === 'Tab') {
      const focusables = panelEl?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const closeBtn = panelEl?.querySelector<HTMLElement>('[data-drawer-close]');
        closeBtn?.focus();
      });
    } else {
      document.body.style.overflow = '';
      getLastTrigger()?.focus();
    }
  });

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen && payload}
  <div class="drawer-backdrop" onclick={handleBackdropClick} role="presentation">
    <div
      class="detail-drawer"
      bind:this={panelEl}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
    >
      <header class="drawer-header">
        <div>
          <p class="drawer-eyebrow">{payload.eyebrow}</p>
          <h2 id="detail-drawer-title">{payload.title}</h2>
        </div>
        <button type="button" class="icon-button" data-drawer-close onclick={closeDetail} aria-label="Cerrar panel de detalle">
          <KuboIcon name="xmark" size={20} />
        </button>
      </header>

      <div class="drawer-body">
        {#if payload.badge}
          <span class={`status-badge status-${payload.badge.tone}`}>{payload.badge.label}</span>
        {/if}

        <dl class="drawer-fields">
          {#each payload.fields as field (field.label)}
            <div class="drawer-field">
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          {/each}
        </dl>
      </div>

      {#if payload.actionHref && payload.actionLabel}
        <footer class="drawer-footer">
          <a class="secondary-button" href={payload.actionHref}>{payload.actionLabel}</a>
        </footer>
      {/if}
    </div>
  </div>
{/if}
