<script lang="ts">
  /**
   * ExpensesBarChart.svelte
   * "Gastos por categoría" del periodo activo — SVG dibujado a mano con Svelte, sin librería de
   * gráficos (no React/Recharts). Barras HORIZONTALES: cada categoría es una fila HTML (label +
   * valor con texto real, nunca truncado) que contiene un `<svg>` propio solo para la barra en sí
   * — así el nombre completo de categorías largas ("Filamento / materiales") siempre es legible,
   * y la altura total del bloque es el flujo natural de filas (sin viewBox gigante ni alto fijo).
   * El resto se agrupa en "Otros" solo a nivel visual (ver lib/expenses/chart.ts, ya ordena desc).
   * El tooltip reutiliza FloatingPanel en variante carbón (misma primitive que Combobox/Calendar)
   * anclado a la fila activa. Además se expone una tabla `.sr-only` con los mismos datos: el
   * tooltip no es la única forma de acceder a la información (accesibilidad).
   */
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import type { CategoryBar } from '../../../lib/expenses/chart';
  import { formatCurrency } from '../../../lib/expenses/format';

  interface Props {
    bars: CategoryBar[];
    periodTotal: number;
  }

  let { bars, periodTotal }: Props = $props();

  let maxAmount = $derived(Math.max(1, ...bars.map((b) => b.amount)));

  let hoverIndex = $state<number | null>(null);
  let pinnedIndex = $state<number | null>(null);
  let activeIndex = $derived(pinnedIndex ?? hoverIndex);
  let rowEls: (HTMLButtonElement | undefined)[] = $state([]);

  // El dataset puede cambiar (periodo/filtros) mientras hay una fila fijada — si el índice fijado
  // ya no existe en el nuevo `bars`, lo soltamos en vez de dejar un tooltip huérfano.
  $effect(() => {
    if (pinnedIndex !== null && pinnedIndex > bars.length - 1) pinnedIndex = null;
    if (hoverIndex !== null && hoverIndex > bars.length - 1) hoverIndex = null;
  });

  function fillWidth(bar: CategoryBar): number {
    return maxAmount > 0 ? (bar.amount / maxAmount) * 200 : 0;
  }

  function selectRow(index: number) {
    pinnedIndex = pinnedIndex === index ? null : index;
  }
</script>

<div class="chart-wrap">
  {#if bars.length === 0}
    <p class="chart-empty">Sin gastos registrados en este periodo todavía.</p>
  {:else}
    <ul class="chart-rows">
      {#each bars as bar, index (bar.category)}
        <li class="chart-row-item">
          <button
            type="button"
            class="chart-row"
            class:is-active={activeIndex === index}
            class:is-dimmed={activeIndex !== null && activeIndex !== index}
            bind:this={rowEls[index]}
            aria-pressed={pinnedIndex === index}
            aria-label={`${bar.label}: ${formatCurrency(bar.amount)}, ${Math.round(bar.share * 100)}% del periodo`}
            onmouseenter={() => (hoverIndex = index)}
            onmouseleave={() => (hoverIndex = null)}
            onfocus={() => (hoverIndex = index)}
            onblur={() => (hoverIndex = null)}
            onclick={() => selectRow(index)}
          >
            <span class="chart-row-label" aria-hidden="true">{bar.label}</span>
            <span class="chart-row-track" aria-hidden="true">
              <svg class="chart-bar-svg" viewBox="0 0 200 22" preserveAspectRatio="none">
                <rect class="chart-bar-track" x="0" y="0" width="200" height="22" rx="1" />
                <rect class="chart-bar-fill" x="0" y="0" width={fillWidth(bar)} height="22" rx="1" />
              </svg>
            </span>
            <span class="chart-row-value" aria-hidden="true">{formatCurrency(bar.amount)}</span>
          </button>
        </li>
      {/each}
    </ul>

    <table class="sr-only">
      <caption>Gastos por categoría del periodo activo</caption>
      <thead>
        <tr><th scope="col">Categoría</th><th scope="col">Monto</th><th scope="col">Porcentaje del periodo</th></tr>
      </thead>
      <tbody>
        {#each bars as bar (bar.category)}
          <tr><td>{bar.label}</td><td>{formatCurrency(bar.amount)}</td><td>{Math.round(bar.share * 100)}%</td></tr>
        {/each}
      </tbody>
    </table>

    {#if activeIndex !== null && bars[activeIndex]}
      <FloatingPanel
        anchorEl={rowEls[activeIndex]}
        open={true}
        onClose={() => {
          pinnedIndex = null;
          hoverIndex = null;
        }}
        variant="carbon"
        placement="top-start"
        width={200}
        interactive={false}
        panelClass="chart-tooltip-panel"
        ariaLabel="Detalle de categoría"
      >
        {#snippet children()}
          <p class="chart-tooltip-label">{bars[activeIndex].label}</p>
          <p class="chart-tooltip-amount">{formatCurrency(bars[activeIndex].amount)}</p>
          <p class="chart-tooltip-share">{Math.round(bars[activeIndex].share * 100)}% del periodo</p>
        {/snippet}
      </FloatingPanel>
    {/if}
  {/if}
</div>
