<script lang="ts">
  /**
   * PriceCalculatorBreakdown.svelte
   * Breakdown visual compacto del costo total — barras proporcionales sin librería de charts
   * (spec §23). Nunca sustituye los montos numéricos, siempre se muestra junto a ellos.
   */
  import type { CostBreakdown } from '../../../lib/pricing/engine';
  import { formatCurrency } from '../../../lib/pricing/format';

  interface Props {
    cost: CostBreakdown;
  }

  let { cost }: Props = $props();

  interface BreakdownSegment {
    label: string;
    value: number;
    tone: 'carbon' | 'blue' | 'red';
  }

  let segments = $derived<BreakdownSegment[]>(
    [
      { label: 'Material + merma', value: cost.materialWithWaste, tone: 'carbon' as const },
      { label: 'Electricidad', value: cost.electricityCost, tone: 'blue' as const },
      { label: 'Depreciación', value: cost.depreciationCost, tone: 'carbon' as const },
      { label: 'Mantenimiento', value: cost.maintenanceCost, tone: 'carbon' as const },
      { label: 'Fallos', value: cost.failureProvision, tone: 'red' as const },
      { label: 'Trabajo manual', value: cost.laborTotal, tone: 'blue' as const },
      { label: 'Packaging', value: cost.packagingCost, tone: 'blue' as const },
      { label: 'Adicionales', value: cost.additionalTotal, tone: 'carbon' as const },
      { label: 'Indirectos', value: cost.indirectCost, tone: 'blue' as const },
    ].filter((segment) => segment.value > 0)
  );

  let maxValue = $derived(Math.max(cost.totalCost, 1));
</script>

<div class="calc-breakdown" role="img" aria-label="Distribución proporcional del costo total por componente">
  {#each segments as segment (segment.label)}
    <div class="calc-breakdown-row">
      <span class="calc-breakdown-label">{segment.label}</span>
      <div class="calc-breakdown-track">
        <div class={`calc-breakdown-fill calc-breakdown-fill-${segment.tone}`} style={`width:${Math.min(100, (segment.value / maxValue) * 100)}%`}></div>
      </div>
      <span class="calc-breakdown-value">{formatCurrency(segment.value)}</span>
    </div>
  {/each}
</div>
