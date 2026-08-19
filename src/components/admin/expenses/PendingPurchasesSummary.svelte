<script lang="ts">
  /**
   * PendingPurchasesSummary.svelte
   * Resumen compacto de Compras pendientes + mini distribución por prioridad, en UNA superficie
   * Connected Bento (mismo lenguaje que ExpensesSummary: métricas arriba, divisor, bloque
   * secundario abajo). "Monto estimado" se etiqueta explícitamente como estimado: nunca se llama
   * "Total" ni se suma a los Gastos registrados (ver lib/pending-purchases/filters.ts).
   */
  import type { PendingPurchaseSummary, PurchasePriorityBreakdown } from '../../../lib/pending-purchases/filters';
  import { formatCurrency, formatDateCompact } from '../../../lib/expenses/format';

  interface Props {
    summary: PendingPurchaseSummary;
    priorityBreakdown: PurchasePriorityBreakdown;
  }

  let { summary, priorityBreakdown }: Props = $props();

  let maxPriorityCount = $derived(Math.max(1, priorityBreakdown.high, priorityBreakdown.medium, priorityBreakdown.low));

  let priorityRows = $derived([
    { key: 'high', label: 'Alta', count: priorityBreakdown.high },
    { key: 'medium', label: 'Media', count: priorityBreakdown.medium },
    { key: 'low', label: 'Baja', count: priorityBreakdown.low },
  ]);

  let showDistribution = $derived(priorityBreakdown.high + priorityBreakdown.medium + priorityBreakdown.low > 0);
</script>

<section class="purchases-overview reveal" style="--delay: 40ms" aria-label="Resumen de compras pendientes">
  <div class="purchases-summary">
    <div class="summary-metric">
      <p class="summary-metric-label">Compras activas</p>
      <span class="summary-metric-value" aria-live="polite">{summary.count}</span>
      <p class="summary-metric-meta">compra{summary.count === 1 ? '' : 's'}</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Prioridad alta</p>
      <span class="summary-metric-value">{summary.highPriorityCount}</span>
      <p class="summary-metric-meta">{summary.highPriorityCount === 1 ? 'requiere' : 'requieren'} atención pronto</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Monto estimado</p>
      <span class="summary-metric-value">{formatCurrency(summary.estimatedAmount)}</span>
      <p class="summary-metric-meta">estimado, no es gasto real</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Próxima necesidad</p>
      <span class="summary-metric-value">{summary.nextNeededBy ? formatDateCompact(summary.nextNeededBy) : '—'}</span>
      <p class="summary-metric-meta">{summary.nextNeededBy ? 'fecha más próxima' : 'sin fecha registrada'}</p>
    </div>
  </div>

  {#if showDistribution}
    <div class="purchases-distribution">
      <p class="purchases-distribution-title">Compras por prioridad</p>
      <div class="priority-bars">
        {#each priorityRows as row (row.key)}
          <div class="priority-bar-row">
            <span class="priority-chip priority-bar-label priority-{row.key}">
              <span class="priority-dot"></span>
              {row.label}
            </span>
            <span class="priority-bar-track">
              <span class="priority-bar-fill priority-bar-fill-{row.key}" style={`width:${(row.count / maxPriorityCount) * 100}%`}></span>
            </span>
            <span class="priority-bar-count">{row.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>
