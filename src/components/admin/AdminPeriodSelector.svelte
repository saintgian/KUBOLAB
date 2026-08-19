<script lang="ts">
  /**
   * AdminPeriodSelector.svelte
   * Control de período en el topbar. Escribe en periodStore (src/stores/period-store.ts),
   * compartido con DashboardAnalytics.svelte para que Ventas/Por canal reaccionen sin recargar
   * la página. Ver period-store.ts para la justificación de por qué un store compartido y no
   * una isla "puente" adicional.
   */
  import { onMount } from 'svelte';
  import { periodStore, PERIOD_LABELS, type PeriodKey } from '../../stores/period-store';
  import KuboIcon from '../ui/KuboIcon.svelte';

  const options: PeriodKey[] = ['7d', '30d', '90d'];

  let open = $state(false);
  let period = $state<PeriodKey>('7d');
  let rootEl: HTMLElement | undefined = $state();
  let triggerEl: HTMLButtonElement | undefined = $state();

  periodStore.subscribe((value) => (period = value));

  function toggle() {
    open = !open;
  }

  function select(value: PeriodKey) {
    periodStore.set(value);
    open = false;
    triggerEl?.focus();
  }

  function handleDocClick(event: MouseEvent) {
    if (open && rootEl && !rootEl.contains(event.target as Node)) open = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      open = false;
      triggerEl?.focus();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocClick);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('click', handleDocClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="popover-wrap" bind:this={rootEl}>
  <button
    class="period-button"
    type="button"
    bind:this={triggerEl}
    onclick={toggle}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={`Período: ${PERIOD_LABELS[period]}`}
  >
    <KuboIcon name="calendar" size={16} />
    <span class="period-button-label">{PERIOD_LABELS[period]}</span>
    <KuboIcon name="nav-arrow-down" size={14} class="period-chevron" />
  </button>

  {#if open}
    <div class="mini-popover" role="listbox" aria-label="Seleccionar período">
      {#each options as value (value)}
        <button
          type="button"
          role="option"
          aria-selected={value === period}
          class:is-selected={value === period}
          onclick={() => select(value)}
        >
          {PERIOD_LABELS[value]}
        </button>
      {/each}
    </div>
  {/if}
</div>
