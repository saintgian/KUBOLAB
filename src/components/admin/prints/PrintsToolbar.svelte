<script lang="ts">
  /**
   * PrintsToolbar.svelte
   * Buscar + un único popover "Filtros" (impresora/finalidad/resultado/material/rango de fechas) —
   * mismo patrón de superficie única que MaterialsToolbar.svelte (docs/admin-ui-rules.md).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { PrinterProfile } from '../../../data/admin/printers.types';
  import { PRINT_PURPOSE_OPTIONS, PRINT_RESULT_OPTIONS, optionLabel } from '../../../data/admin/prints.constants';
  import { defaultPrintFilters, hasActivePrintFilters, type PrintFilters } from '../../../lib/prints/filters';

  interface Props {
    filters: PrintFilters;
    printers: PrinterProfile[];
    materialTypeOptions: { value: string; label: string }[];
    resultCount: number;
  }

  let { filters, printers, materialTypeOptions, resultCount }: Props = $props();

  let filtersOpen = $state(false);
  let filtersTriggerEl: HTMLButtonElement | undefined = $state();

  const PRINTER_OPTIONS = printers.map((p) => ({ value: p.id, label: p.internalName }));

  function countActive(f: PrintFilters): number {
    const d = defaultPrintFilters();
    let n = 0;
    if (f.printerId !== d.printerId) n++;
    if (f.purpose !== d.purpose) n++;
    if (f.result !== d.result) n++;
    if (f.materialType !== d.materialType) n++;
    if (f.dateFrom !== d.dateFrom || f.dateTo !== d.dateTo) n++;
    return n;
  }

  let activeCount = $derived(countActive(filters));

  function printerLabel(id: string): string {
    return PRINTER_OPTIONS.find((p) => p.value === id)?.label ?? id;
  }

  function clearAll() {
    Object.assign(filters, defaultPrintFilters());
  }
</script>

<div class="expenses-toolbar reveal" style="--delay: 80ms">
  <div class="toolbar-search">
    <span class="search-icon" aria-hidden="true"><KuboIcon name="search" size={16} /></span>
    <input type="search" value={filters.search} oninput={(event) => (filters.search = (event.currentTarget as HTMLInputElement).value)} placeholder="Buscar por ID o nombre del trabajo" aria-label="Buscar impresiones" />
  </div>

  <button type="button" class="compact-filter" bind:this={filtersTriggerEl} onclick={() => (filtersOpen = !filtersOpen)} aria-haspopup="dialog" aria-expanded={filtersOpen}>
    <KuboIcon name="filter-list" size={15} />
    Filtros
    {#if activeCount > 0}<span class="filter-count-badge">{activeCount}</span>{/if}
    <KuboIcon name="nav-arrow-down" size={13} />
  </button>

  <FloatingPanel anchorEl={filtersTriggerEl} open={filtersOpen} onClose={() => (filtersOpen = false)} width={300} panelClass="filters-panel" ariaLabel="Filtrar impresiones">
    {#snippet children()}
      {#if printers.length > 1}
        <div class="filters-panel-section">
          <label class="field-label" for="prints-filter-printer">Impresora</label>
          <Combobox id="prints-filter-printer" value={filters.printerId} options={[{ value: 'all', label: 'Todas' }, ...PRINTER_OPTIONS]} onChange={(v) => (filters.printerId = v)} ariaLabel="Filtrar por impresora" />
        </div>
      {/if}
      <div class="filters-panel-section">
        <label class="field-label" for="prints-filter-purpose">Finalidad</label>
        <Combobox id="prints-filter-purpose" value={filters.purpose} options={[{ value: 'all', label: 'Todas' }, ...PRINT_PURPOSE_OPTIONS]} onChange={(v) => (filters.purpose = v)} ariaLabel="Filtrar por finalidad" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="prints-filter-result">Resultado</label>
        <Combobox id="prints-filter-result" value={filters.result} options={[{ value: 'all', label: 'Todos' }, ...PRINT_RESULT_OPTIONS]} onChange={(v) => (filters.result = v)} ariaLabel="Filtrar por resultado" />
      </div>
      {#if materialTypeOptions.length > 0}
        <div class="filters-panel-section">
          <label class="field-label" for="prints-filter-material">Material</label>
          <Combobox id="prints-filter-material" value={filters.materialType} options={[{ value: 'all', label: 'Todos' }, ...materialTypeOptions]} onChange={(v) => (filters.materialType = v)} ariaLabel="Filtrar por material" />
        </div>
      {/if}
      <div class="filters-panel-section">
        <span class="field-label" id="prints-filter-date-label">Rango de fechas</span>
        <div class="field-row" style="margin-top: var(--space-1);">
          <input type="date" class="text-input" aria-labelledby="prints-filter-date-label" bind:value={filters.dateFrom} />
          <input type="date" class="text-input" aria-labelledby="prints-filter-date-label" bind:value={filters.dateTo} />
        </div>
      </div>
    {/snippet}
  </FloatingPanel>

  {#if hasActivePrintFilters(filters)}
    <button type="button" class="text-link toolbar-clear-link" onclick={clearAll}>Limpiar filtros</button>
  {/if}

  {#if hasActivePrintFilters(filters)}
    <div class="active-filters-row" aria-live="polite">
      <span class="sr-only">{resultCount} {resultCount === 1 ? 'impresión coincide' : 'impresiones coinciden'} con los filtros activos</span>
      {#if filters.printerId !== 'all'}
        <span class="filter-chip">{printerLabel(filters.printerId)}<button type="button" onclick={() => (filters.printerId = 'all')} aria-label="Quitar filtro de impresora"><KuboIcon name="xmark" size={12} /></button></span>
      {/if}
      {#if filters.purpose !== 'all'}
        <span class="filter-chip">{optionLabel(PRINT_PURPOSE_OPTIONS, filters.purpose)}<button type="button" onclick={() => (filters.purpose = 'all')} aria-label="Quitar filtro de finalidad"><KuboIcon name="xmark" size={12} /></button></span>
      {/if}
      {#if filters.result !== 'all'}
        <span class="filter-chip">{optionLabel(PRINT_RESULT_OPTIONS, filters.result)}<button type="button" onclick={() => (filters.result = 'all')} aria-label="Quitar filtro de resultado"><KuboIcon name="xmark" size={12} /></button></span>
      {/if}
    </div>
  {/if}
</div>
