<script lang="ts">
  /**
   * MaterialsSummary.svelte
   * Resumen operativo de Materiales (spec §3) — 4 métricas reales, sin tendencias ni datos
   * ficticios. Se calcula siempre sobre la lista visible/filtrada (mismo criterio que
   * ExpensesSummary), para que "Stock bajo"/"En evaluación" reflejen lo que el usuario está viendo.
   */
  import type { MaterialsSummary } from '../../../lib/materials/filters';
  import { formatWeightG } from '../../../lib/materials/format';

  interface Props {
    summary: MaterialsSummary;
  }

  let { summary }: Props = $props();
</script>

<section class="materials-overview reveal" style="--delay: 40ms" aria-label="Resumen operativo de materiales">
  <div class="materials-summary">
    <div class="summary-metric">
      <p class="summary-metric-label">Stock total</p>
      <span class="summary-metric-value" aria-live="polite">{formatWeightG(summary.totalStockG)}</span>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Perfiles activos</p>
      <span class="summary-metric-value">{summary.activeProfileCount}</span>
      <p class="summary-metric-meta">no inactivos</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Stock bajo</p>
      <span class="summary-metric-value">{summary.lowStockCount}</span>
      <p class="summary-metric-meta">{summary.lowStockCount === 1 ? 'perfil por debajo del mínimo' : 'perfiles por debajo del mínimo'}</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">En evaluación</p>
      <span class="summary-metric-value">{summary.evaluationCount}</span>
      <p class="summary-metric-meta">sin aprobar todavía</p>
    </div>
  </div>
</section>
