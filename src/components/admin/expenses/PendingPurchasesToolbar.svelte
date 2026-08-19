<script lang="ts">
  /**
   * PendingPurchasesToolbar.svelte
   * Buscar + un único popover "Filtros" (Prioridad/Estado/Categoría/Fecha necesaria) + Añadir —
   * mismo patrón de superficie única ya validado en ExpensesToolbar, así en mobile se reduce a
   * "[Buscar] [Filtros] [+Añadir]" sin duplicar markup para el breakpoint angosto.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import { EXPENSE_CATEGORIES, optionLabel } from '../../../data/admin/expenses.constants';
  import { PURCHASE_PRIORITIES, PURCHASE_STATUSES } from '../../../data/admin/pending-purchases.constants';
  import { defaultPurchaseFilters, hasActivePurchaseFilters, type PendingPurchaseFilters } from '../../../lib/pending-purchases/filters';
  import { formatDateLong } from '../../../lib/expenses/format';

  interface Props {
    filters: PendingPurchaseFilters;
    resultCount: number;
    onCreate: () => void;
  }

  let { filters, resultCount, onCreate }: Props = $props();

  let filtersOpen = $state(false);
  let filtersTriggerEl: HTMLButtonElement | undefined = $state();

  const STATUS_OPTIONS = [{ value: 'active', label: 'Activas' }, { value: 'all', label: 'Todos los estados' }, ...PURCHASE_STATUSES];

  function countActive(f: PendingPurchaseFilters): number {
    const d = defaultPurchaseFilters();
    let n = 0;
    if (f.priority !== d.priority) n++;
    if (f.status !== d.status) n++;
    if (f.category !== d.category) n++;
    if (f.destination !== d.destination) n++;
    if (f.neededByTo !== d.neededByTo) n++;
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
    if (filters.priority !== 'all') list.push({ key: 'priority', label: `Prioridad: ${optionLabel(PURCHASE_PRIORITIES, filters.priority)}`, remove: () => (filters.priority = 'all') });
    if (filters.status !== 'active') {
      const label = filters.status === 'all' ? 'Todos los estados' : optionLabel(PURCHASE_STATUSES, filters.status);
      list.push({ key: 'status', label: `Estado: ${label}`, remove: () => (filters.status = 'active') });
    }
    if (filters.category !== 'all') list.push({ key: 'category', label: `Categoría: ${optionLabel(EXPENSE_CATEGORIES, filters.category)}`, remove: () => (filters.category = 'all') });
    if (filters.neededByTo) list.push({ key: 'neededBy', label: `Hasta: ${formatDateLong(filters.neededByTo)}`, remove: () => (filters.neededByTo = '') });
    return list;
  });

  function clearAll() {
    Object.assign(filters, defaultPurchaseFilters());
  }
</script>

<div class="expenses-toolbar reveal" style="--delay: 80ms">
  <div class="toolbar-search">
    <span class="search-icon" aria-hidden="true"><KuboIcon name="search" size={16} /></span>
    <input
      type="search"
      value={filters.search}
      oninput={(event) => (filters.search = (event.currentTarget as HTMLInputElement).value)}
      placeholder="Buscar compra por nombre o proveedor"
      aria-label="Buscar compras pendientes"
    />
  </div>

  <button type="button" class="compact-filter" bind:this={filtersTriggerEl} onclick={() => (filtersOpen = !filtersOpen)} aria-haspopup="dialog" aria-expanded={filtersOpen}>
    <KuboIcon name="filter-list" size={15} />
    Filtros
    {#if activeCount > 0}<span class="filter-count-badge">{activeCount}</span>{/if}
    <KuboIcon name="nav-arrow-down" size={13} />
  </button>

  <FloatingPanel anchorEl={filtersTriggerEl} open={filtersOpen} onClose={() => (filtersOpen = false)} width={300} panelClass="filters-panel" ariaLabel="Filtrar compras pendientes">
    {#snippet children()}
      <div class="filters-panel-section">
        <label class="field-label" for="purchases-filter-priority">Prioridad</label>
        <Combobox id="purchases-filter-priority" value={filters.priority} options={[{ value: 'all', label: 'Todas' }, ...PURCHASE_PRIORITIES]} onChange={(v) => (filters.priority = v)} ariaLabel="Filtrar por prioridad" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="purchases-filter-status">Estado</label>
        <Combobox id="purchases-filter-status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => (filters.status = v)} ariaLabel="Filtrar por estado" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="purchases-filter-category">Categoría</label>
        <Combobox id="purchases-filter-category" value={filters.category} options={[{ value: 'all', label: 'Todas' }, ...EXPENSE_CATEGORIES]} onChange={(v) => (filters.category = v)} ariaLabel="Filtrar por categoría" />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="purchases-filter-needed-by">Necesario antes de</label>
        <input
          id="purchases-filter-needed-by"
          class="text-input"
          type="date"
          value={filters.neededByTo}
          oninput={(e) => (filters.neededByTo = (e.currentTarget as HTMLInputElement).value)}
        />
      </div>
    {/snippet}
  </FloatingPanel>

  {#if hasActivePurchaseFilters(filters)}
    <button type="button" class="text-link" onclick={clearAll}>Limpiar filtros</button>
  {/if}

  <div class="toolbar-actions">
    <button type="button" class="primary-button" onclick={onCreate}>
      <KuboIcon name="plus" size={16} />
      Añadir compra
    </button>
  </div>

  {#if chips.length > 0}
    <div class="active-filters-row" aria-live="polite">
      <span class="sr-only">{resultCount} compras coinciden con los filtros activos</span>
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
