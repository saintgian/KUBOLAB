<script lang="ts">
  /**
   * ExpensesSummary.svelte
   * Resumen + "Gastos por categoría" en UNA sola superficie Connected Bento (métricas arriba,
   * chart abajo, un solo `.panel` con un divisor interno) — no 4 tarjetas + una tarjeta de chart
   * aparte. Los valores y las barras se recalculan siempre sobre el dataset visible del periodo
   * activo (prop `summary`/`bars`), nunca sobre el total sin filtrar.
   */
  import type { ExpenseSummary } from '../../../lib/expenses/filters';
  import type { CategoryBar } from '../../../lib/expenses/chart';
  import { formatCurrency } from '../../../lib/expenses/format';
  import { periodLabel, type PeriodState } from '../../../lib/expenses/period';
  import ExpensesBarChart from './ExpensesBarChart.svelte';

  interface Props {
    summary: ExpenseSummary;
    bars: CategoryBar[];
    period: PeriodState;
  }

  let { summary, bars, period }: Props = $props();

  function share(part: number, total: number): string {
    if (total <= 0) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  }

  let topCategory = $derived(bars[0] ?? null);
</script>

<section class="expenses-overview reveal" style="--delay: 40ms" aria-label="Resumen de gastos">
  <div class="expenses-summary">
    <div class="summary-metric">
      <p class="summary-metric-label">Gastos del periodo</p>
      <span class="summary-metric-value" aria-live="polite">{formatCurrency(summary.totalAmount)}</span>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Movimientos</p>
      <span class="summary-metric-value" aria-live="polite">{summary.count}</span>
      <p class="summary-metric-meta">registro{summary.count === 1 ? '' : 's'}</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Producción</p>
      <span class="summary-metric-value">{formatCurrency(summary.productionAmount)}</span>
      <p class="summary-metric-meta">{share(summary.productionAmount, summary.totalAmount)} del periodo</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Operación</p>
      <span class="summary-metric-value">{formatCurrency(summary.operationAmount)}</span>
      <p class="summary-metric-meta">{share(summary.operationAmount, summary.totalAmount)} del periodo</p>
    </div>
  </div>

  <div class="overview-chart-section">
    <div class="overview-chart-heading">
      <p class="overview-chart-title">Gastos por categoría</p>
      <div class="overview-chart-meta">
        <span class="overview-chart-period">{periodLabel(period)}</span>
        {#if topCategory}
          <span class="overview-chart-top">Mayor: {topCategory.label} · {formatCurrency(topCategory.amount)}</span>
        {/if}
      </div>
    </div>
    <ExpensesBarChart bars={bars} periodTotal={summary.totalAmount} />
  </div>
</section>
