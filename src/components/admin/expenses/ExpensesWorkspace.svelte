<script lang="ts">
  /**
   * ExpensesWorkspace.svelte
   * Unidad reactiva de Finanzas → Gastos. Dueña de TODO el estado de sesión — dataset de gastos,
   * dataset de compras pendientes, periodo activo (Mensual/Trimestral, fuente única), filtros de
   * cada vista, pestaña activa y qué overlay está abierto — sin store global. Los gastos y las
   * compras pendientes son datasets separados a propósito (ver requisito "compra pendiente ≠
   * gasto"): el monto estimado de una compra pendiente NUNCA entra a `summarize()` de Gastos.
   *
   * Ambos datasets arrancan en DEMO_EXPENSES / DEMO_PENDING_PURCHASES y solo viven en memoria de
   * esta sesión — no hay backend todavía.
   */
  import ExpensesSummary from './ExpensesSummary.svelte';
  import ExpensesToolbar from './ExpensesToolbar.svelte';
  import ExpenseList from './ExpenseList.svelte';
  import ExpenseForm from './ExpenseForm.svelte';
  import ExpenseDetailDrawer from './ExpenseDetailDrawer.svelte';
  import ExpenseExportDialog from './ExpenseExportDialog.svelte';
  import PendingPurchasesSummary from './PendingPurchasesSummary.svelte';
  import PendingPurchasesToolbar from './PendingPurchasesToolbar.svelte';
  import PendingPurchaseList from './PendingPurchaseList.svelte';
  import PendingPurchaseForm from './PendingPurchaseForm.svelte';
  import PendingPurchaseDetailDrawer from './PendingPurchaseDetailDrawer.svelte';
  import PeriodControl from './PeriodControl.svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import { DEMO_EXPENSES } from '../../../data/admin/expenses.mock';
  import { DEMO_PENDING_PURCHASES } from '../../../data/admin/pending-purchases.mock';
  import type { Expense, ExpenseFormValues } from '../../../data/admin/expenses.types';
  import type { PendingPurchase, PendingPurchaseFormValues, PurchaseStatus } from '../../../data/admin/pending-purchases.types';
  import { defaultFilters, filterExpensesForPeriod, sortByDateDesc, summarize } from '../../../lib/expenses/filters';
  import { categoryTotals } from '../../../lib/expenses/chart';
  import { currentPeriod, type PeriodState } from '../../../lib/expenses/period';
  import { buildExpense } from '../../../lib/expenses/model';
  import { defaultPurchaseFilters, filterPurchases, priorityBreakdown, sortPurchases, summarizePurchases } from '../../../lib/pending-purchases/filters';
  import { buildPendingPurchase } from '../../../lib/pending-purchases/model';

  type Tab = 'registered' | 'pending';
  let activeTab = $state<Tab>('registered');

  // ---------- Registrados ----------
  let expenses = $state<Expense[]>([...DEMO_EXPENSES]);
  let period = $state<PeriodState>(currentPeriod());
  let filters = $state(defaultFilters());

  let filteredExpenses = $derived(sortByDateDesc(filterExpensesForPeriod(expenses, period, filters)));
  let summary = $derived(summarize(filteredExpenses));
  let categoryBars = $derived(categoryTotals(filteredExpenses));

  type FormTarget = { mode: 'create' } | { mode: 'edit'; expense: Expense } | { mode: 'convert'; purchase: PendingPurchase };

  let formTarget = $state<FormTarget | null>(null);
  let selectedExpense = $state<Expense | null>(null);
  let exportOpen = $state(false);
  let feedback = $state<string | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let returnFocusEl: HTMLElement | null = null;

  function captureFocus() {
    returnFocusEl = document.activeElement as HTMLElement | null;
  }

  function restoreFocus() {
    returnFocusEl?.focus();
    returnFocusEl = null;
  }

  function showFeedback(message: string) {
    feedback = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, 3200);
  }

  function openCreate() {
    captureFocus();
    formTarget = { mode: 'create' };
  }

  function openEditFromDetail(expense: Expense) {
    selectedExpense = null;
    formTarget = { mode: 'edit', expense };
  }

  function closeForm() {
    formTarget = null;
    restoreFocus();
  }

  function handleFormSubmit(values: ExpenseFormValues) {
    const target = formTarget;
    if (!target) return;
    if (target.mode === 'edit') {
      const updated = buildExpense(values, target.expense);
      expenses = expenses.map((item) => (item.id === updated.id ? updated : item));
      formTarget = null;
      restoreFocus();
      showFeedback('Cambios guardados.');
      return;
    }
    const created = buildExpense(values);
    expenses = [...expenses, created];
    if (target.mode === 'convert') {
      const sourceId = target.purchase.id;
      purchases = purchases.map((purchase) => (purchase.id === sourceId ? { ...purchase, status: 'purchased', convertedExpenseId: created.id } : purchase));
      showFeedback('Gasto registrado. Compra marcada como comprada.');
    } else {
      showFeedback('Gasto registrado.');
    }
    formTarget = null;
    restoreFocus();
  }

  function selectExpense(expense: Expense) {
    captureFocus();
    selectedExpense = expense;
  }

  function closeDetail() {
    selectedExpense = null;
    restoreFocus();
  }

  function deleteExpense(expense: Expense) {
    expenses = expenses.filter((item) => item.id !== expense.id);
    selectedExpense = null;
    restoreFocus();
    showFeedback('Gasto eliminado de esta sesión.');
  }

  function openExport() {
    captureFocus();
    exportOpen = true;
  }

  function closeExport() {
    exportOpen = false;
    restoreFocus();
  }

  function handleExported() {
    exportOpen = false;
    restoreFocus();
    showFeedback('Exportación lista.');
  }

  function clearFiltersFromList() {
    Object.assign(filters, defaultFilters());
  }

  // ---------- Compras pendientes ----------
  let purchases = $state<PendingPurchase[]>([...DEMO_PENDING_PURCHASES]);
  let purchaseFilters = $state(defaultPurchaseFilters());

  let filteredPurchases = $derived(sortPurchases(filterPurchases(purchases, purchaseFilters)));
  let purchaseSummary = $derived(summarizePurchases(filteredPurchases));
  let purchasePriorityBreakdown = $derived(priorityBreakdown(filteredPurchases));

  type PurchaseFormTarget = { mode: 'create' } | { mode: 'edit'; purchase: PendingPurchase };

  let purchaseFormTarget = $state<PurchaseFormTarget | null>(null);
  let selectedPurchase = $state<PendingPurchase | null>(null);

  function openCreatePurchase() {
    captureFocus();
    purchaseFormTarget = { mode: 'create' };
  }

  function openEditPurchaseFromDetail(purchase: PendingPurchase) {
    selectedPurchase = null;
    purchaseFormTarget = { mode: 'edit', purchase };
  }

  function closePurchaseForm() {
    purchaseFormTarget = null;
    restoreFocus();
  }

  function handlePurchaseFormSubmit(values: PendingPurchaseFormValues) {
    const target = purchaseFormTarget;
    if (!target) return;
    if (target.mode === 'edit') {
      const updated = buildPendingPurchase(values, target.purchase);
      purchases = purchases.map((item) => (item.id === updated.id ? updated : item));
      showFeedback('Compra actualizada.');
    } else {
      purchases = [...purchases, buildPendingPurchase(values)];
      showFeedback('Compra añadida.');
    }
    purchaseFormTarget = null;
    restoreFocus();
  }

  function selectPurchase(purchase: PendingPurchase) {
    captureFocus();
    selectedPurchase = purchase;
  }

  function closePurchaseDetail() {
    selectedPurchase = null;
    restoreFocus();
  }

  /** Abre "Registrar gasto" prefilleno desde una compra pendiente — ver ExpenseForm `prefill`. */
  function convertPurchase(purchase: PendingPurchase) {
    selectedPurchase = null;
    formTarget = { mode: 'convert', purchase };
  }

  function cancelPurchase(purchase: PendingPurchase) {
    purchases = purchases.map((item) => (item.id === purchase.id ? { ...item, status: 'cancelled' } : item));
    selectedPurchase = null;
    restoreFocus();
    showFeedback('Compra cancelada.');
  }

  /** Cambio manual de estado (En revisión → Pendiente → Cotizando → Aprobada) desde el detalle —
   * 'purchased' nunca pasa por acá, solo por `convertPurchase` tras guardar el gasto real. */
  function changePurchaseStatus(purchase: PendingPurchase, status: PurchaseStatus) {
    purchases = purchases.map((item) => (item.id === purchase.id ? { ...item, status } : item));
    selectedPurchase = { ...purchase, status };
    showFeedback('Estado actualizado.');
  }

  function clearPurchaseFiltersFromList() {
    Object.assign(purchaseFilters, defaultPurchaseFilters());
  }

  function purchaseToPrefill(purchase: PendingPurchase): Partial<ExpenseFormValues> {
    return {
      concept: purchase.title,
      category: purchase.category,
      supplier: purchase.preferredSupplier,
      purchaseAmount: purchase.estimatedAmount,
      quantity: purchase.quantity,
      unit: purchase.unit,
      destination: purchase.destination,
      related: purchase.relatedType && purchase.relatedId ? { type: purchase.relatedType, id: purchase.relatedId, label: purchase.relatedId } : undefined,
      notes: purchase.notes,
    };
  }

  function handleTabKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      activeTab = activeTab === 'registered' ? 'pending' : 'registered';
    }
  }
</script>

<div class="expenses-header reveal" style="--delay: 0ms">
  <div class="page-heading">
    <div class="eyebrow-line">
      <span class="page-index">FINANZAS</span>
      <span class="demo-chip">DATOS DEMO</span>
    </div>
    <h1>Gastos</h1>
    <p>Registra y controla los egresos de KUBO.</p>
  </div>

  <div class="expenses-tabs" role="tablist" aria-label="Vistas de Gastos" onkeydown={handleTabKeydown}>
    <button
      type="button"
      role="tab"
      id="tab-registered"
      aria-selected={activeTab === 'registered'}
      aria-controls="tabpanel-registered"
      tabindex={activeTab === 'registered' ? 0 : -1}
      class="expenses-tab"
      class:is-active={activeTab === 'registered'}
      onclick={() => (activeTab = 'registered')}
    >
      Registrados <span class="expenses-tab-count">{filteredExpenses.length}</span>
    </button>
    <button
      type="button"
      role="tab"
      id="tab-pending"
      aria-selected={activeTab === 'pending'}
      aria-controls="tabpanel-pending"
      tabindex={activeTab === 'pending' ? 0 : -1}
      class="expenses-tab"
      class:is-active={activeTab === 'pending'}
      onclick={() => (activeTab = 'pending')}
    >
      Compras pendientes <span class="expenses-tab-count">{filteredPurchases.length}</span>
    </button>
  </div>

  {#if activeTab === 'registered'}
    <div class="expenses-header-actions">
      <PeriodControl period={period} onChange={(next) => (period = next)} />
      <div class="expenses-header-buttons">
        <button type="button" class="secondary-button" onclick={openExport}>
          <KuboIcon name="download" size={16} />
          <span class="btn-label">Exportar</span>
        </button>
        <button type="button" class="primary-button" onclick={openCreate}>
          <KuboIcon name="plus" size={16} />
          Registrar gasto
        </button>
      </div>
    </div>
  {/if}
</div>

{#if activeTab === 'registered'}
  <div id="tabpanel-registered" role="tabpanel" aria-labelledby="tab-registered">
    <ExpensesSummary summary={summary} bars={categoryBars} period={period} />

    <ExpensesToolbar filters={filters} resultCount={filteredExpenses.length} />

    <div class="panel reveal" style="--delay: 120ms">
      <ExpenseList expenses={filteredExpenses} allCount={expenses.length} onSelect={selectExpense} onCreateFirst={openCreate} onClearFilters={clearFiltersFromList} />
    </div>
  </div>
{:else}
  <div id="tabpanel-pending" role="tabpanel" aria-labelledby="tab-pending">
    <PendingPurchasesSummary summary={purchaseSummary} priorityBreakdown={purchasePriorityBreakdown} />

    <PendingPurchasesToolbar filters={purchaseFilters} resultCount={filteredPurchases.length} onCreate={openCreatePurchase} />

    <div class="panel reveal" style="--delay: 120ms">
      <PendingPurchaseList
        purchases={filteredPurchases}
        allCount={purchases.length}
        onSelect={selectPurchase}
        onCreateFirst={openCreatePurchase}
        onClearFilters={clearPurchaseFiltersFromList}
      />
    </div>
  </div>
{/if}

{#if formTarget}
  {#key formTarget}
    <ExpenseForm
      mode={formTarget.mode}
      initial={formTarget.mode === 'edit' ? formTarget.expense : null}
      prefill={formTarget.mode === 'convert' ? purchaseToPrefill(formTarget.purchase) : null}
      onSubmit={handleFormSubmit}
      onCancel={closeForm}
    />
  {/key}
{/if}

{#if selectedExpense}
  <ExpenseDetailDrawer expense={selectedExpense} onClose={closeDetail} onEdit={openEditFromDetail} onDelete={deleteExpense} />
{/if}

{#if exportOpen}
  <ExpenseExportDialog
    allExpenses={expenses}
    filteredExpenses={filteredExpenses}
    currentFilters={filters}
    currentPeriod={period}
    pendingPurchases={purchases}
    filteredPendingPurchases={filteredPurchases}
    onClose={closeExport}
    onExported={handleExported}
  />
{/if}

{#if purchaseFormTarget}
  {#key purchaseFormTarget}
    <PendingPurchaseForm
      mode={purchaseFormTarget.mode}
      initial={purchaseFormTarget.mode === 'edit' ? purchaseFormTarget.purchase : null}
      onSubmit={handlePurchaseFormSubmit}
      onCancel={closePurchaseForm}
    />
  {/key}
{/if}

{#if selectedPurchase}
  <PendingPurchaseDetailDrawer
    purchase={selectedPurchase}
    onClose={closePurchaseDetail}
    onEdit={openEditPurchaseFromDetail}
    onConvert={convertPurchase}
    onCancelPurchase={cancelPurchase}
    onChangeStatus={changePurchaseStatus}
  />
{/if}

{#if feedback}
  <div class="expenses-feedback" role="status" aria-live="polite">
    <KuboIcon name="check" size={16} />
    {feedback}
  </div>
{/if}
