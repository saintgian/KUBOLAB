<script lang="ts">
  /**
   * MaterialsToolbar.svelte
   * Buscar + un único popover "Filtros" (Tipo/Uso/Validación/Stock) — mismo patrón de superficie
   * única ya validado en ExpensesToolbar/PendingPurchasesToolbar (reutiliza `.expenses-toolbar` y
   * compañía tal cual, ver docs/admin-ui-rules.md "Formularios y FormGrid"). `filters` es el mismo
   * objeto $state que vive en MaterialsWorkspace — se muta directo, sin store global.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import { MATERIAL_TYPES, MATERIAL_USAGE_OPTIONS, STOCK_STATUS_OPTIONS, VALIDATION_STATUS_OPTIONS, optionLabel } from '../../../data/admin/materials.constants';
  import { defaultMaterialFilters, hasActiveMaterialFilters, type MaterialFilters } from '../../../lib/materials/filters';

  interface Props {
    filters: MaterialFilters;
    resultCount: number;
  }

  let { filters, resultCount }: Props = $props();

  let filtersOpen = $state(false);
  let filtersTriggerEl: HTMLButtonElement | undefined = $state();

  function countActive(f: MaterialFilters): number {
    const d = defaultMaterialFilters();
    let n = 0;
    if (f.materialType !== d.materialType) n++;
    if (f.usage !== d.usage) n++;
    if (f.validationStatus !== d.validationStatus) n++;
    if (f.stockStatus !== d.stockStatus) n++;
    return n;
  }

  let activeCount = $derived(countActive(filters));

  interface Chip {
    key: string;
    label: string;
    remove: () => void;
  }

  let chips = $derived.by<Chip[]>(() => {
    const list: Chip[] = [];
    if (filters.search.trim()) list.push({ key: 'search', label: `Buscar: "${filters.search.trim()}"`, remove: () => (filters.search = '') });
    if (filters.materialType !== 'all') list.push({ key: 'type', label: `Tipo: ${optionLabel(MATERIAL_TYPES, filters.materialType)}`, remove: () => (filters.materialType = 'all') });
    if (filters.usage !== 'all') list.push({ key: 'usage', label: `Uso: ${optionLabel(MATERIAL_USAGE_OPTIONS, filters.usage)}`, remove: () => (filters.usage = 'all') });
    if (filters.validationStatus !== 'all')
      list.push({ key: 'validation', label: `Validación: ${optionLabel(VALIDATION_STATUS_OPTIONS, filters.validationStatus)}`, remove: () => (filters.validationStatus = 'all') });
    if (filters.stockStatus !== 'all') list.push({ key: 'stock', label: `Stock: ${optionLabel(STOCK_STATUS_OPTIONS, filters.stockStatus)}`, remove: () => (filters.stockStatus = 'all') });
    return list;
  });

  function clearAll() {
    Object.assign(filters, defaultMaterialFilters());
  }
</script>

<div class="expenses-toolbar reveal" style="--delay: 80ms">
  <div class="toolbar-search">
    <span class="search-icon" aria-hidden="true"><KuboIcon name="search" size={16} /></span>
    <input
      type="search"
      value={filters.search}
      oninput={(event) => (filters.search = (event.currentTarget as HTMLInputElement).value)}
      placeholder="Buscar por nombre, fabricante o color"
      aria-label="Buscar materiales"
    />
  </div>

  <button type="button" class="compact-filter" bind:this={filtersTriggerEl} onclick={() => (filtersOpen = !filtersOpen)} aria-haspopup="dialog" aria-expanded={filtersOpen}>
    <KuboIcon name="filter-list" size={15} />
    Filtros
    {#if activeCount > 0}<span class="filter-count-badge">{activeCount}</span>{/if}
    <KuboIcon name="nav-arrow-down" size={13} />
  </button>

  <FloatingPanel anchorEl={filtersTriggerEl} open={filtersOpen} onClose={() => (filtersOpen = false)} width={300} panelClass="filters-panel" ariaLabel="Filtrar materiales">
    {#snippet children()}
      <div class="filters-panel-section">
        <label class="field-label" for="materials-filter-type">Tipo</label>
        <Combobox id="materials-filter-type" value={filters.materialType} options={[{ value: 'all', label: 'Todos' }, ...MATERIAL_TYPES]} onChange={(v) => (filters.materialType = v)} ariaLabel="Filtrar por tipo de material" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="materials-filter-usage">Uso</label>
        <Combobox id="materials-filter-usage" value={filters.usage} options={[{ value: 'all', label: 'Todos' }, ...MATERIAL_USAGE_OPTIONS]} onChange={(v) => (filters.usage = v)} ariaLabel="Filtrar por uso" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="materials-filter-validation">Validación</label>
        <Combobox id="materials-filter-validation" value={filters.validationStatus} options={[{ value: 'all', label: 'Todas' }, ...VALIDATION_STATUS_OPTIONS]} onChange={(v) => (filters.validationStatus = v)} ariaLabel="Filtrar por estado de validación" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="materials-filter-stock">Stock</label>
        <Combobox id="materials-filter-stock" value={filters.stockStatus} options={[{ value: 'all', label: 'Todos' }, ...STOCK_STATUS_OPTIONS]} onChange={(v) => (filters.stockStatus = v)} ariaLabel="Filtrar por estado de stock" />
      </div>
    {/snippet}
  </FloatingPanel>

  {#if hasActiveMaterialFilters(filters)}
    <button type="button" class="text-link toolbar-clear-link" onclick={clearAll}>Limpiar filtros</button>
  {/if}

  {#if chips.length > 0}
    <div class="active-filters-row" aria-live="polite">
      <span class="sr-only">{resultCount} {resultCount === 1 ? 'material coincide' : 'materiales coinciden'} con los filtros activos</span>
      {#each chips as chip (chip.key)}
        <span class="filter-chip">
          {chip.label}
          <button type="button" onclick={chip.remove} aria-label={`Quitar filtro ${chip.label}`}>
            <KuboIcon name="xmark" size={12} />
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>
