<script lang="ts">
  /**
   * ExpensesToolbar.svelte
   * Superficie única de Buscar + Filtros. `filters` es el mismo objeto $state que vive en
   * ExpensesWorkspace — se muta directamente (no hay store global). Mensual/Trimestral (ver
   * PeriodControl) y las acciones Exportar/Registrar gasto viven en el header de la página
   * (ExpensesWorkspace), no acá — mantiene esta superficie enfocada solo en filtrar el listado.
   * El popover "Filtros" usa FloatingPanel (portal + posicionamiento fixed), así nunca queda
   * recortado por la tabla de abajo, y usa Combobox en los campos con lista controlada
   * (Categoría/Destino/Medio/Comprobante).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import {
    EXPENSE_CATEGORIES,
    EXPENSE_DESTINATIONS,
    EXPENSE_DOCUMENT_TYPES,
    EXPENSE_PAYMENT_METHODS,
    optionLabel,
  } from '../../../data/admin/expenses.constants';
  import { defaultFilters, hasActiveFilters, type ExpenseFilters, type TriState } from '../../../lib/expenses/filters';

  interface Props {
    filters: ExpenseFilters;
    resultCount: number;
  }

  let { filters, resultCount }: Props = $props();

  let filtersOpen = $state(false);
  let filtersTriggerEl: HTMLButtonElement | undefined = $state();

  function closeFilters(restoreFocus = false) {
    if (restoreFocus) filtersTriggerEl?.focus();
    filtersOpen = false;
  }

  function countMoreFilters(f: ExpenseFilters): number {
    const d = defaultFilters();
    let n = 0;
    if (f.category !== d.category) n++;
    if (f.destination !== d.destination) n++;
    if (f.paymentMethod !== d.paymentMethod) n++;
    if (f.supplier !== d.supplier) n++;
    if (f.documentType !== d.documentType) n++;
    if (f.receiptState !== d.receiptState) n++;
    if (f.mobilityState !== d.mobilityState) n++;
    if (f.amountMin !== d.amountMin) n++;
    if (f.amountMax !== d.amountMax) n++;
    return n;
  }

  let moreFiltersCount = $derived(countMoreFilters(filters));

  interface Chip {
    key: string;
    label: string;
    remove: () => void;
  }

  let chips = $derived.by<Chip[]>(() => {
    const list: Chip[] = [];
    if (filters.search.trim()) {
      list.push({ key: 'search', label: `Buscar: "${filters.search.trim()}"`, remove: () => (filters.search = '') });
    }
    if (filters.category !== 'all') {
      list.push({ key: 'category', label: `Categoría: ${optionLabel(EXPENSE_CATEGORIES, filters.category)}`, remove: () => (filters.category = 'all') });
    }
    if (filters.destination !== 'all') {
      list.push({ key: 'destination', label: `Destino: ${optionLabel(EXPENSE_DESTINATIONS, filters.destination)}`, remove: () => (filters.destination = 'all') });
    }
    if (filters.paymentMethod !== 'all') {
      list.push({ key: 'payment', label: `Medio: ${optionLabel(EXPENSE_PAYMENT_METHODS, filters.paymentMethod)}`, remove: () => (filters.paymentMethod = 'all') });
    }
    if (filters.supplier.trim()) {
      list.push({ key: 'supplier', label: `Proveedor: ${filters.supplier.trim()}`, remove: () => (filters.supplier = '') });
    }
    if (filters.documentType !== 'all') {
      list.push({ key: 'document', label: `Comprobante: ${optionLabel(EXPENSE_DOCUMENT_TYPES, filters.documentType)}`, remove: () => (filters.documentType = 'all') });
    }
    if (filters.receiptState !== 'all') {
      list.push({
        key: 'receipt',
        label: filters.receiptState === 'with' ? 'Con comprobante' : 'Sin comprobante',
        remove: () => (filters.receiptState = 'all'),
      });
    }
    if (filters.mobilityState !== 'all') {
      list.push({
        key: 'mobility',
        label: filters.mobilityState === 'with' ? 'Con movilidad' : 'Sin movilidad',
        remove: () => (filters.mobilityState = 'all'),
      });
    }
    if (filters.amountMin !== null || filters.amountMax !== null) {
      const min = filters.amountMin !== null ? filters.amountMin : '';
      const max = filters.amountMax !== null ? filters.amountMax : '';
      list.push({
        key: 'amount',
        label: `Monto: S/ ${min} – S/ ${max}`,
        remove: () => {
          filters.amountMin = null;
          filters.amountMax = null;
        },
      });
    }
    return list;
  });

  function clearAll() {
    Object.assign(filters, defaultFilters());
  }

  function setTriState(field: 'receiptState' | 'mobilityState', value: TriState) {
    filters[field] = value;
  }
</script>

<div class="expenses-toolbar reveal" style="--delay: 80ms">
  <div class="toolbar-search">
    <span class="search-icon" aria-hidden="true"><KuboIcon name="search" size={16} /></span>
    <input
      type="search"
      value={filters.search}
      oninput={(event) => (filters.search = (event.currentTarget as HTMLInputElement).value)}
      placeholder="Buscar por concepto, proveedor o categoría"
      aria-label="Buscar gastos"
    />
  </div>

  <button
    type="button"
    class="compact-filter"
    bind:this={filtersTriggerEl}
    onclick={() => (filtersOpen = !filtersOpen)}
    aria-haspopup="dialog"
    aria-expanded={filtersOpen}
  >
    <KuboIcon name="filter-list" size={15} />
    Filtros
    {#if moreFiltersCount > 0}<span class="filter-count-badge">{moreFiltersCount}</span>{/if}
    <KuboIcon name="nav-arrow-down" size={13} />
  </button>

  <FloatingPanel anchorEl={filtersTriggerEl} open={filtersOpen} onClose={() => closeFilters(false)} width={320} panelClass="filters-panel" ariaLabel="Más filtros">
    {#snippet children()}
      <div class="filters-panel-section">
        <label class="field-label" for="expenses-filter-category">Categoría</label>
        <Combobox
          id="expenses-filter-category"
          value={filters.category}
          options={[{ value: 'all', label: 'Todas' }, ...EXPENSE_CATEGORIES]}
          onChange={(v) => (filters.category = v)}
          ariaLabel="Filtrar por categoría"
        />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="expenses-filter-destination">Destino</label>
        <Combobox
          id="expenses-filter-destination"
          value={filters.destination}
          options={[{ value: 'all', label: 'Todos' }, ...EXPENSE_DESTINATIONS]}
          onChange={(v) => (filters.destination = v)}
          ariaLabel="Filtrar por destino"
        />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="expenses-filter-payment">Medio de pago</label>
        <Combobox
          id="expenses-filter-payment"
          value={filters.paymentMethod}
          options={[{ value: 'all', label: 'Todos' }, ...EXPENSE_PAYMENT_METHODS]}
          onChange={(v) => (filters.paymentMethod = v)}
          ariaLabel="Filtrar por medio de pago"
        />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="expenses-filter-supplier">Proveedor</label>
        <input
          id="expenses-filter-supplier"
          class="text-input"
          type="text"
          value={filters.supplier}
          oninput={(e) => (filters.supplier = (e.currentTarget as HTMLInputElement).value)}
          placeholder="Ej. 3D Market Perú"
        />
      </div>
      <div class="filters-panel-section">
        <label class="field-label" for="expenses-filter-document">Tipo de comprobante</label>
        <Combobox
          id="expenses-filter-document"
          value={filters.documentType}
          options={[{ value: 'all', label: 'Todos' }, ...EXPENSE_DOCUMENT_TYPES]}
          onChange={(v) => (filters.documentType = v)}
          ariaLabel="Filtrar por tipo de comprobante"
        />
      </div>
      <div class="filters-panel-section">
        <p class="filters-panel-title">COMPROBANTE</p>
        <div class="radio-group">
          <label class="radio-field"><input class="radio-native" type="radio" name="receipt-state" checked={filters.receiptState === 'all'} onchange={() => setTriState('receiptState', 'all')} />Todos</label>
          <label class="radio-field"><input class="radio-native" type="radio" name="receipt-state" checked={filters.receiptState === 'with'} onchange={() => setTriState('receiptState', 'with')} />Con</label>
          <label class="radio-field"><input class="radio-native" type="radio" name="receipt-state" checked={filters.receiptState === 'without'} onchange={() => setTriState('receiptState', 'without')} />Sin</label>
        </div>
      </div>
      <div class="filters-panel-section">
        <p class="filters-panel-title">MOVILIDAD</p>
        <div class="radio-group">
          <label class="radio-field"><input class="radio-native" type="radio" name="mobility-state" checked={filters.mobilityState === 'all'} onchange={() => setTriState('mobilityState', 'all')} />Todos</label>
          <label class="radio-field"><input class="radio-native" type="radio" name="mobility-state" checked={filters.mobilityState === 'with'} onchange={() => setTriState('mobilityState', 'with')} />Con</label>
          <label class="radio-field"><input class="radio-native" type="radio" name="mobility-state" checked={filters.mobilityState === 'without'} onchange={() => setTriState('mobilityState', 'without')} />Sin</label>
        </div>
      </div>
      <div class="filters-panel-section">
        <p class="filters-panel-title">RANGO DE MONTO (S/)</p>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="expenses-amount-min">Mínimo</label>
            <input
              id="expenses-amount-min"
              class="text-input"
              type="text"
              inputmode="decimal"
              value={filters.amountMin ?? ''}
              oninput={(e) => (filters.amountMin = (e.currentTarget as HTMLInputElement).value === '' ? null : Number((e.currentTarget as HTMLInputElement).value))}
              placeholder="0.00"
            />
          </div>
          <div class="field">
            <label class="field-label" for="expenses-amount-max">Máximo</label>
            <input
              id="expenses-amount-max"
              class="text-input"
              type="text"
              inputmode="decimal"
              value={filters.amountMax ?? ''}
              oninput={(e) => (filters.amountMax = (e.currentTarget as HTMLInputElement).value === '' ? null : Number((e.currentTarget as HTMLInputElement).value))}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
    {/snippet}
  </FloatingPanel>

  {#if hasActiveFilters(filters)}
    <button type="button" class="text-link toolbar-clear-link" onclick={clearAll}>Limpiar filtros</button>
  {/if}

  {#if chips.length > 0}
    <div class="active-filters-row" aria-live="polite">
      <span class="sr-only">{resultCount} gastos coinciden con los filtros activos</span>
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
