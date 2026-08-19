<script lang="ts">
  /**
   * PeriodControl.svelte
   * Control superior Mensual/Trimestral + navegador de periodo — fuente única de periodo para
   * toda la vista de Registrados (ver lib/expenses/period.ts). `period` es el mismo objeto que
   * vive en ExpensesWorkspace; este componente nunca lo muta directamente (a diferencia de
   * `filters`) porque cambiar de modo o de año recalcula varios campos a la vez, así que se pasa
   * por callback `onChange` con el objeto ya resuelto.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import {
    currentPeriod,
    periodLabel,
    periodSubLabel,
    setPeriodMode,
    shiftPeriod,
    type PeriodMode,
    type PeriodState,
  } from '../../../lib/expenses/period';

  interface Props {
    period: PeriodState;
    onChange: (next: PeriodState) => void;
  }

  let { period, onChange }: Props = $props();

  let open = $state(false);
  let triggerEl: HTMLButtonElement | undefined = $state();

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const QUARTERS = [1, 2, 3, 4];

  function setMode(mode: PeriodMode) {
    if (mode !== period.mode) onChange(setPeriodMode(period, mode));
  }

  function step(direction: 1 | -1) {
    onChange(shiftPeriod(period, direction));
  }

  function closePanel() {
    open = false;
    triggerEl?.focus();
  }

  function jumpToCurrent() {
    onChange(currentPeriod(period.mode));
    closePanel();
  }

  function pickMonth(monthIndex: number) {
    onChange({ ...period, month: monthIndex });
    closePanel();
  }

  function pickQuarter(quarter: number) {
    onChange({ ...period, quarter });
    closePanel();
  }

  function shiftYear(delta: number) {
    onChange({ ...period, year: period.year + delta });
  }
</script>

<div class="period-control">
  <div class="period-mode-toggle" role="group" aria-label="Tipo de periodo">
    <button type="button" class="period-mode-btn" class:is-active={period.mode === 'monthly'} aria-pressed={period.mode === 'monthly'} onclick={() => setMode('monthly')}>
      Mensual
    </button>
    <button type="button" class="period-mode-btn" class:is-active={period.mode === 'quarterly'} aria-pressed={period.mode === 'quarterly'} onclick={() => setMode('quarterly')}>
      Trimestral
    </button>
  </div>

  <div class="period-nav">
    <button type="button" class="icon-button" onclick={() => step(-1)} aria-label={period.mode === 'monthly' ? 'Mes anterior' : 'Trimestre anterior'}>
      <KuboIcon name="nav-arrow-left" size={16} />
    </button>
    <button
      type="button"
      class="compact-filter period-trigger"
      bind:this={triggerEl}
      onclick={() => (open = !open)}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <KuboIcon name="calendar" size={15} />
      <span class="period-trigger-label">
        {periodLabel(period)}
        {#if periodSubLabel(period)}<span class="period-trigger-sub">{periodSubLabel(period)}</span>{/if}
      </span>
      <KuboIcon name="nav-arrow-down" size={13} />
    </button>
    <button type="button" class="icon-button" onclick={() => step(1)} aria-label={period.mode === 'monthly' ? 'Mes siguiente' : 'Trimestre siguiente'}>
      <KuboIcon name="nav-arrow-right" size={16} />
    </button>
  </div>

  <FloatingPanel anchorEl={triggerEl} open={open} onClose={closePanel} variant="carbon" width={272} panelClass="period-panel" ariaLabel="Seleccionar periodo">
    {#snippet children()}
      <div class="period-panel-year">
        <button type="button" class="panel-action" onclick={() => shiftYear(-1)} aria-label="Año anterior"><KuboIcon name="nav-arrow-left" size={15} /></button>
        <span class="period-panel-year-label">{period.year}</span>
        <button type="button" class="panel-action" onclick={() => shiftYear(1)} aria-label="Año siguiente"><KuboIcon name="nav-arrow-right" size={15} /></button>
      </div>
      {#if period.mode === 'monthly'}
        <div class="period-panel-grid period-panel-grid--months">
          {#each MONTHS as name, index (name)}
            <button type="button" class="period-panel-cell" class:is-selected={index === period.month} onclick={() => pickMonth(index)}>{name}</button>
          {/each}
        </div>
      {:else}
        <div class="period-panel-grid period-panel-grid--quarters">
          {#each QUARTERS as q (q)}
            <button type="button" class="period-panel-cell" class:is-selected={q === period.quarter} onclick={() => pickQuarter(q)}>T{q}</button>
          {/each}
        </div>
      {/if}
      <div class="period-panel-footer">
        <button type="button" class="text-link" onclick={jumpToCurrent}>{period.mode === 'monthly' ? 'Mes actual' : 'Trimestre actual'}</button>
      </div>
    {/snippet}
  </FloatingPanel>
</div>
