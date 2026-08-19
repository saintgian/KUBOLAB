<script lang="ts">
  /**
   * DashboardAnalytics.svelte
   * Módulo reactivo de analítica: Ventas (chart SVG + resumen) y Por canal (donut). Reacciona
   * al período elegido en AdminPeriodSelector.svelte vía periodStore (mismo store, dos islas).
   *
   * Deliberadamente NO incluye los 5 KPI ni el resto del Dashboard (Pedidos, Producción,
   * Productos, Custom, Actividad): esos siguen siendo Astro estático. Los 4 KPI secundarios no
   * varían de forma realista por "período" en este dataset demo (son snapshots operativos, no
   * series históricas) y envolverlos aquí solo para animar un número habría inflado el bundle
   * de esta isla sin una necesidad real de interactividad — la limitación queda documentada en
   * el reporte de la tarea en vez de fabricar reactividad decorativa.
   *
   * Iteración 5: los dos <article> (panel-sales, panel-revenue) ahora viven dentro de un único
   * <div class="analytics-surface"> — chrome/layout únicamente (ver admin-dashboard.css), cero
   * cambios en el estado/lógica de arriba. El wrapper lleva la única animación .reveal de la
   * superficie completa; los <article> internos ya no llevan su propio .reveal/--delay (antes
   * cada uno entraba por separado — ahora entran como una sola unidad).
   */
  import { periodStore, PERIOD_LABELS, type PeriodKey } from '../../stores/period-store';
  import { salesByPeriod, revenueChannelsByPeriod } from '../../data/admin/dashboard.mock';

  const SALES_W = 760;
  const SALES_H = 230;
  const PAD_X = 20;
  const PAD_Y = 24;

  let period = $state<PeriodKey>('7d');
  let switching = $state(false);
  let firstRun = true;
  let switchTimer: ReturnType<typeof setTimeout> | undefined;

  periodStore.subscribe((value) => {
    if (firstRun) {
      period = value;
      firstRun = false;
      return;
    }
    if (value === period) return;
    period = value;
    switching = true;
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => {
      switching = false;
    }, 200);
    activePointIndex = null;
    activeChannelIndex = null;
  });

  let currentSales = $derived(salesByPeriod[period]);
  let currentChannels = $derived(revenueChannelsByPeriod[period]);

  let salesPoints = $derived(
    currentSales.values.map((value, i) => {
      const x = PAD_X + (i * (SALES_W - PAD_X * 2)) / (currentSales.values.length - 1);
      const y = SALES_H - PAD_Y - (value / currentSales.maxValue) * (SALES_H - PAD_Y * 2);
      return { x, y, value };
    })
  );

  let salesLine = $derived(
    salesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  );

  let activePointIndex = $state<number | null>(null);
  let svgEl: SVGSVGElement | undefined = $state();

  function nearestIndexFromClientX(clientX: number): number {
    if (!svgEl) return 0;
    const rect = svgEl.getBoundingClientRect();
    const ratio = SALES_W / rect.width;
    const vbX = (clientX - rect.left) * ratio;
    let nearest = 0;
    let minDist = Infinity;
    salesPoints.forEach((p, i) => {
      const d = Math.abs(p.x - vbX);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    });
    return nearest;
  }

  function handlePointerMove(event: PointerEvent) {
    activePointIndex = nearestIndexFromClientX(event.clientX);
  }

  function handlePointerLeave() {
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches) return;
    activePointIndex = null;
  }

  function handlePointClick(index: number) {
    activePointIndex = index;
  }

  let tooltipAlign = $derived.by(() => {
    if (activePointIndex === null) return 'center';
    if (activePointIndex <= 0) return 'start';
    if (activePointIndex >= currentSales.labels.length - 1) return 'end';
    return 'center';
  });

  // ---------- Donut ----------
  const RADIUS = 56;
  const CIRC = 2 * Math.PI * RADIUS;

  let donutArcs = $derived.by(() => {
    let cumulative = 0;
    return currentChannels.map((channel) => {
      const segLen = (channel.value / 100) * CIRC;
      const arc = { ...channel, offset: cumulative, segLen };
      cumulative += segLen;
      return arc;
    });
  });

  let activeChannelIndex = $state<number | null>(null);

  let centerLabel = $derived(
    activeChannelIndex !== null ? currentChannels[activeChannelIndex].label : 'TOTAL'
  );
  let centerValue = $derived(
    activeChannelIndex !== null
      ? `${currentChannels[activeChannelIndex].amount} · ${currentChannels[activeChannelIndex].value}%`
      : currentSales.summary[0].value
  );
</script>

<div class="analytics-surface reveal" style="--delay: 140ms">
<article class="panel panel-sales">
  <header class="panel-header">
    <div>
      <h2>Ventas</h2>
    </div>
    <span class="compact-filter-label">{PERIOD_LABELS[period]}</span>
  </header>

  <div class="sales-chart-wrap" class:is-switching={switching}>
    <div class="chart-axis-labels" aria-hidden="true">
      <span>10K</span>
      <span>7.5K</span>
      <span>5K</span>
      <span>2.5K</span>
      <span>0</span>
    </div>

    <div class="sales-chart-plot">
    <svg
      bind:this={svgEl}
      class="sales-chart"
      viewBox={`0 0 ${SALES_W} ${SALES_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby="sales-chart-title sales-chart-desc"
      onpointermove={handlePointerMove}
      onpointerleave={handlePointerLeave}
      onpointerdown={handlePointerMove}
    >
      <title id="sales-chart-title">Ventas demo — {PERIOD_LABELS[period].toLowerCase()}</title>
      <desc id="sales-chart-desc">
        Serie demo de {currentSales.values.length} puntos. Total del período: {currentSales.summary[0].value}.
      </desc>

      {#each [0, 1, 2, 3, 4] as row (row)}
        <line
          class="chart-grid-line"
          x1={PAD_X}
          y1={PAD_Y + (row * (SALES_H - PAD_Y * 2)) / 4}
          x2={SALES_W - PAD_X}
          y2={PAD_Y + (row * (SALES_H - PAD_Y * 2)) / 4}
        />
      {/each}

      {#if activePointIndex !== null}
        {@const p = salesPoints[activePointIndex]}
        <line class="chart-crosshair" x1={p.x} y1={PAD_Y} x2={p.x} y2={SALES_H - PAD_Y} />
      {/if}

      <path class="sales-line" pathLength="1" d={salesLine} />
    </svg>

    <div class="sales-points-layer">
      {#each salesPoints as point, index (index)}
        <button
          type="button"
          class="sales-point"
          class:is-active={index === activePointIndex}
          style={`left:${(point.x / SALES_W) * 100}%; top:${(point.y / SALES_H) * 100}%;`}
          aria-label={`${currentSales.labels[index]}: S/ ${point.value.toLocaleString('es-PE')}`}
          onfocus={() => handlePointClick(index)}
          onclick={() => handlePointClick(index)}
        >
          <span class="sales-point-halo"></span>
          <span class="sales-point-dot"></span>
        </button>
      {/each}
    </div>

    {#if activePointIndex !== null}
      {@const p = salesPoints[activePointIndex]}
      <div
        class={`chart-tooltip align-${tooltipAlign}`}
        style={`left:${(p.x / SALES_W) * 100}%; top:${(p.y / SALES_H) * 100}%;`}
      >
        <span>{currentSales.labels[activePointIndex]}</span>
        <strong>S/ {p.value.toLocaleString('es-PE')}</strong>
      </div>
    {/if}
    </div>

    <div class="chart-x-labels" aria-hidden="true">
      {#each currentSales.labels as label (label)}
        <span>{label}</span>
      {/each}
    </div>
  </div>

  <div class="sales-summary" class:is-switching={switching}>
    {#each currentSales.summary as item (item.label)}
      <div class="summary-stat">
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </div>
    {/each}
  </div>
</article>

<article class="panel panel-revenue">
  <header class="panel-header">
    <div>
      <h2>Por canal</h2>
    </div>
    <span class="demo-chip">DATOS DEMO</span>
  </header>

  <div class="donut-zone" class:is-switching={switching}>
    <div class="revenue-donut-svg-wrap">
      <svg class="revenue-donut-svg" viewBox="0 0 160 160" role="img" aria-label={`Distribución por canal, ${PERIOD_LABELS[period].toLowerCase()}`}>
        <g transform="rotate(-90 80 80)">
          <circle class="donut-track" cx="80" cy="80" r={RADIUS} />
          {#each donutArcs as arc, index (arc.label)}
            <circle
              class={`donut-arc tone-${arc.tone}`}
              class:is-active={activeChannelIndex === index}
              class:is-dimmed={activeChannelIndex !== null && activeChannelIndex !== index}
              cx="80"
              cy="80"
              r={RADIUS}
              stroke-dasharray={`${arc.segLen} ${CIRC - arc.segLen}`}
              stroke-dashoffset={-arc.offset}
              tabindex="0"
              role="button"
              aria-label={`${arc.label}: ${arc.value}%, ${arc.amount}`}
              onpointerenter={() => (activeChannelIndex = index)}
              onpointerleave={() => (activeChannelIndex = null)}
              onfocus={() => (activeChannelIndex = index)}
              onblur={() => (activeChannelIndex = null)}
            />
          {/each}
        </g>
      </svg>
      <div class="donut-center">
        <span>{centerLabel}</span>
        <strong>{centerValue}</strong>
      </div>
    </div>

    <div class="channel-list">
      {#each currentChannels as channel, index (channel.label)}
        <button
          type="button"
          class="channel-row"
          class:is-active={activeChannelIndex === index}
          onpointerenter={() => (activeChannelIndex = index)}
          onpointerleave={() => (activeChannelIndex = null)}
          onfocus={() => (activeChannelIndex = index)}
          onblur={() => (activeChannelIndex = null)}
        >
          <span class={`channel-dot tone-${channel.tone}`} aria-hidden="true"></span>
          <span class="channel-copy">
            <strong>{channel.label}</strong>
            <small>{channel.value}%</small>
          </span>
          <span class="channel-amount">{channel.amount}</span>
        </button>
      {/each}
    </div>
  </div>
</article>
</div>
