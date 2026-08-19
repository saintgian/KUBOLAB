<script lang="ts">
  /**
   * ExpenseList.svelte
   * Listado de gastos — tabla real en desktop (`.table-shell`, mismo patrón que RecentOrders.astro),
   * tarjetas en mobile (`.mobile-data-card`, oculta por CSS ≥768px). Ambas vistas activan el mismo
   * callback `onSelect`; no hay dos fuentes de verdad para qué fila está "abierta".
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { Expense } from '../../../data/admin/expenses.types';
  import {
    EXPENSE_CATEGORIES,
    EXPENSE_DESTINATIONS,
    EXPENSE_DOCUMENT_TYPES,
    EXPENSE_PAYMENT_METHODS,
    optionLabel,
  } from '../../../data/admin/expenses.constants';
  import { formatCurrency, formatDateLong, formatDateShort } from '../../../lib/expenses/format';

  interface Props {
    expenses: Expense[];
    allCount: number;
    onSelect: (expense: Expense) => void;
    onCreateFirst: () => void;
    onClearFilters: () => void;
  }

  let { expenses, allCount, onSelect, onCreateFirst, onClearFilters }: Props = $props();

  function handleRowKeydown(event: KeyboardEvent, expense: Expense) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(expense);
    }
  }

  function rowLabel(expense: Expense): string {
    return `Ver detalle de ${expense.concept}, ${formatDateLong(expense.date)}, ${formatCurrency(expense.totalAmount)}`;
  }
</script>

{#if allCount === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="wallet" size={22} /></span>
    <h3>Todavía no hay gastos registrados.</h3>
    <p>Registra compras, materiales y otros egresos para tener claro cuánto cuesta operar KUBO.</p>
    <button type="button" class="primary-button" onclick={onCreateFirst}>
      <KuboIcon name="plus" size={16} />
      Registrar primer gasto
    </button>
  </div>
{:else if expenses.length === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="search" size={22} /></span>
    <h3>No encontramos gastos con estos filtros.</h3>
    <p>Prueba ajustando el periodo, la categoría o el texto buscado.</p>
    <button type="button" class="secondary-button" onclick={onClearFilters}>Limpiar filtros</button>
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Listado de gastos de KUBO, más reciente primero</caption>
      <thead>
        <tr>
          <th scope="col">Fecha</th>
          <th scope="col">Concepto</th>
          <th scope="col">Categoría</th>
          <th scope="col">Destino</th>
          <th scope="col">Medio</th>
          <th scope="col">Comprobante</th>
          <th scope="col">Total</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each expenses as expense (expense.id)}
          <tr
            class="expense-row"
            tabindex="0"
            aria-label={rowLabel(expense)}
            onclick={() => onSelect(expense)}
            onkeydown={(event) => handleRowKeydown(event, expense)}
          >
            <td class="mono-strong">{formatDateLong(expense.date)}</td>
            <td>
              <span class="expense-concept-cell">
                <strong>{expense.concept}</strong>
                {#if expense.supplier}<span>{expense.supplier}</span>{/if}
              </span>
            </td>
            <td>{optionLabel(EXPENSE_CATEGORIES, expense.category)}</td>
            <td>{optionLabel(EXPENSE_DESTINATIONS, expense.destination)}</td>
            <td>{optionLabel(EXPENSE_PAYMENT_METHODS, expense.paymentMethod)}</td>
            <td>
              <span class="receipt-chip" class:has-receipt={expense.documentType !== 'none'}>
                <KuboIcon name={expense.documentType !== 'none' ? 'attachment' : 'page'} size={14} />
                {optionLabel(EXPENSE_DOCUMENT_TYPES, expense.documentType)}
              </span>
            </td>
            <td class="expense-total-cell">{formatCurrency(expense.totalAmount)}</td>
            <td>
              <span class="row-action" aria-hidden="true"><KuboIcon name="nav-arrow-right" size={16} /></span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each expenses as expense (expense.id)}
      <button type="button" class="mobile-data-card expense-card" onclick={() => onSelect(expense)}>
        <div class="expense-mobile-top">
          <span class="expense-mobile-date">{formatDateShort(expense.date)}</span>
          <span class="expense-mobile-total">{formatCurrency(expense.totalAmount)}</span>
        </div>
        <span class="expense-mobile-concept">{expense.concept}</span>
        <span class="expense-mobile-meta">{optionLabel(EXPENSE_CATEGORIES, expense.category)} · {optionLabel(EXPENSE_DESTINATIONS, expense.destination)}</span>
        <div class="expense-mobile-bottom">
          <span class="expense-mobile-meta">{optionLabel(EXPENSE_PAYMENT_METHODS, expense.paymentMethod)}</span>
          <span class="receipt-chip" class:has-receipt={expense.documentType !== 'none'}>
            <KuboIcon name={expense.documentType !== 'none' ? 'attachment' : 'page'} size={13} />
            {optionLabel(EXPENSE_DOCUMENT_TYPES, expense.documentType)}
          </span>
        </div>
      </button>
    {/each}
  </div>
{/if}
