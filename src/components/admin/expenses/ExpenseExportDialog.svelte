<script lang="ts">
  /**
   * ExpenseExportDialog.svelte
   * Exporta Gastos registrados y, opcionalmente, Compras pendientes — nunca en la misma hoja/
   * columnas cuando es XLSX (dos hojas separadas, ver lib/expenses/export.ts) y como dos archivos
   * distintos cuando es CSV (un CSV no admite hojas). El periodo por defecto es el Mensual/
   * Trimestral activo (fuente única, ver lib/expenses/period.ts) — "Todos los movimientos del
   * periodo" parte de ese rango, no de un preset propio del diálogo.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { Expense } from '../../../data/admin/expenses.types';
  import type { PendingPurchase } from '../../../data/admin/pending-purchases.types';
  import type { ExpenseFilters } from '../../../lib/expenses/filters';
  import { hasActiveFilters } from '../../../lib/expenses/filters';
  import { periodRange, type PeriodState } from '../../../lib/expenses/period';
  import {
    exportCombinedToXlsx,
    exportPurchasesToCsv,
    exportPurchasesToXlsx,
    exportToCsv,
    exportToXlsx,
  } from '../../../lib/expenses/export';

  interface Props {
    allExpenses: Expense[];
    filteredExpenses: Expense[];
    currentFilters: ExpenseFilters;
    currentPeriod: PeriodState;
    pendingPurchases: PendingPurchase[];
    filteredPendingPurchases: PendingPurchase[];
    onClose: () => void;
    onExported: () => void;
  }

  let { allExpenses, filteredExpenses, currentFilters, currentPeriod, pendingPurchases, filteredPendingPurchases, onClose, onExported }: Props = $props();

  type Scope = 'all' | 'filtered';
  type Format = 'xlsx' | 'csv';

  function rangeOf(expenses: Expense[]): { from: string; to: string } {
    if (expenses.length === 0) return periodRange(currentPeriod);
    let min = expenses[0].date;
    let max = expenses[0].date;
    for (const expense of expenses) {
      if (expense.date < min) min = expense.date;
      if (expense.date > max) max = expense.date;
    }
    return { from: min, to: max };
  }

  let scope = $state<Scope>(hasActiveFilters(currentFilters) ? 'filtered' : 'all');
  let format = $state<Format>('xlsx');
  let includeExpenses = $state(true);
  let includePurchases = $state(false);

  const periodDefault = periodRange(currentPeriod);
  let dateFrom = $state(periodDefault.from);
  let dateTo = $state(periodDefault.to);

  let exportExpenseList = $derived.by(() => {
    if (scope === 'filtered') return filteredExpenses;
    return allExpenses.filter((expense) => (!dateFrom || expense.date >= dateFrom) && (!dateTo || expense.date <= dateTo));
  });

  let exportPurchaseList = $derived.by(() => (scope === 'filtered' ? filteredPendingPurchases : pendingPurchases));

  let effectiveRange = $derived(rangeOf(exportExpenseList));
  let totalCount = $derived((includeExpenses ? exportExpenseList.length : 0) + (includePurchases ? exportPurchaseList.length : 0));
  let isExporting = $state(false);

  let plannedFileNames = $derived.by(() => {
    const { from, to } = effectiveRange;
    if (includeExpenses && includePurchases) {
      return format === 'xlsx' ? [`kubo-gastos-${from}_${to}.xlsx`] : [`kubo-gastos-${from}_${to}.csv`, `kubo-compras-pendientes-${from}_${to}.csv`];
    }
    if (includePurchases) return [`kubo-compras-pendientes-${from}_${to}.${format}`];
    return [`kubo-gastos-${from}_${to}.${format}`];
  });

  async function handleExport() {
    if (totalCount === 0 || isExporting) return;
    isExporting = true;
    try {
      const { from, to } = effectiveRange;
      if (includeExpenses && includePurchases) {
        if (format === 'xlsx') {
          await exportCombinedToXlsx(exportExpenseList, exportPurchaseList, from, to);
        } else {
          exportToCsv(exportExpenseList, from, to);
          await new Promise((resolve) => setTimeout(resolve, 200));
          exportPurchasesToCsv(exportPurchaseList, from, to);
        }
      } else if (includePurchases) {
        if (format === 'csv') exportPurchasesToCsv(exportPurchaseList, from, to);
        else await exportPurchasesToXlsx(exportPurchaseList, from, to);
      } else {
        if (format === 'csv') exportToCsv(exportExpenseList, from, to);
        else await exportToXlsx(exportExpenseList, from, to);
      }
      onExported();
    } finally {
      isExporting = false;
    }
  }

  function toggleExpenses() {
    if (includeExpenses && !includePurchases) return;
    includeExpenses = !includeExpenses;
  }

  function togglePurchases() {
    if (includePurchases && !includeExpenses) return;
    includePurchases = !includePurchases;
  }
</script>

<Modal onClose={onClose} labelledBy="export-dialog-title" size="default">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">FINANZAS · GASTOS</p>
        <h2 id="export-dialog-title">Exportar gastos</h2>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onClose} aria-label="Cerrar exportar gastos">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <div class="modal-body">
      <div class="filters-panel-section">
        <p class="filters-panel-title">DATOS A EXPORTAR</p>
        <div class="radio-group" style="flex-direction:column; align-items:flex-start; gap:10px;">
          <label class="radio-field"><input class="checkbox-native" type="checkbox" checked={includeExpenses} onchange={toggleExpenses} />Gastos registrados ({exportExpenseList.length})</label>
          <label class="radio-field"><input class="checkbox-native" type="checkbox" checked={includePurchases} onchange={togglePurchases} />Compras pendientes — estimado ({exportPurchaseList.length})</label>
        </div>
      </div>

      <div class="filters-panel-section">
        <p class="filters-panel-title">ALCANCE</p>
        <div class="radio-group" style="flex-direction:column; align-items:flex-start; gap:10px;">
          <label class="radio-field">
            <input class="radio-native" type="radio" name="export-scope" checked={scope === 'all'} onchange={() => (scope = 'all')} />
            Todos los movimientos del periodo
          </label>
          <label class="radio-field">
            <input class="radio-native" type="radio" name="export-scope" checked={scope === 'filtered'} onchange={() => (scope = 'filtered')} />
            Solo resultados filtrados
          </label>
        </div>
      </div>

      {#if scope === 'all'}
        <div class="filters-panel-section">
          <p class="filters-panel-title">PERIODO</p>
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="export-date-from">Desde</label>
              <input id="export-date-from" class="text-input" type="date" bind:value={dateFrom} />
            </div>
            <div class="field">
              <label class="field-label" for="export-date-to">Hasta</label>
              <input id="export-date-to" class="text-input" type="date" bind:value={dateTo} />
            </div>
          </div>
        </div>
      {/if}

      <div class="filters-panel-section">
        <p class="filters-panel-title">FORMATO</p>
        <div class="radio-group">
          <label class="radio-field">
            <input class="radio-native" type="radio" name="export-format" checked={format === 'xlsx'} onchange={() => (format = 'xlsx')} />
            Excel (.xlsx)
          </label>
          <label class="radio-field">
            <input class="radio-native" type="radio" name="export-format" checked={format === 'csv'} onchange={() => (format = 'csv')} />
            CSV (.csv)
          </label>
        </div>
        {#if includeExpenses && includePurchases && format === 'csv'}
          <p class="field-hint">Se descargan dos archivos CSV — uno por dataset, para no mezclar egresos reales con estimados.</p>
        {/if}
      </div>

      <p class="field-hint" aria-live="polite">
        <strong>{totalCount}</strong> movimiento{totalCount === 1 ? '' : 's'} para exportar.
      </p>
    </div>

    <footer class="modal-footer">
      <span class="modal-footer-meta">{plannedFileNames.join(' · ')}</span>
      <button type="button" class="secondary-button" onclick={onClose}>Cancelar</button>
      <button type="button" class="primary-button" onclick={handleExport} disabled={totalCount === 0 || isExporting}>
        <KuboIcon name="download" size={16} />
        Exportar
      </button>
    </footer>
  {/snippet}
</Modal>
