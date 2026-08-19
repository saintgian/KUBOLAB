<script lang="ts">
  /**
   * PendingPurchaseList.svelte
   * Listado de compras pendientes — mismo patrón que ExpenseList.svelte (tabla real en desktop,
   * cards en mobile, ambas activan `onSelect`). La prioridad nunca depende solo del color: el
   * texto ("Alta"/"Media"/"Baja") siempre está presente junto al rail/punto.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { PendingPurchase } from '../../../data/admin/pending-purchases.types';
  import { EXPENSE_CATEGORIES, EXPENSE_DESTINATIONS, EXPENSE_UNITS, optionLabel } from '../../../data/admin/expenses.constants';
  import { PURCHASE_STATUSES } from '../../../data/admin/pending-purchases.constants';
  import { formatCurrency, formatDateLong, formatDateShort } from '../../../lib/expenses/format';

  interface Props {
    purchases: PendingPurchase[];
    allCount: number;
    onSelect: (purchase: PendingPurchase) => void;
    onCreateFirst: () => void;
    onClearFilters: () => void;
  }

  let { purchases, allCount, onSelect, onCreateFirst, onClearFilters }: Props = $props();

  function handleRowKeydown(event: KeyboardEvent, purchase: PendingPurchase) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(purchase);
    }
  }

  function priorityLabel(priority: PendingPurchase['priority']): string {
    return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
  }

  function rowLabel(purchase: PendingPurchase): string {
    return `Ver detalle de ${purchase.title}, prioridad ${priorityLabel(purchase.priority)}`;
  }
</script>

{#if allCount === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="shopping-bag" size={22} /></span>
    <h3>Todavía no hay compras pendientes registradas.</h3>
    <p>Anota lo que KUBO necesita comprar para no perderlo de vista antes de que se convierta en un gasto.</p>
    <button type="button" class="primary-button" onclick={onCreateFirst}>
      <KuboIcon name="plus" size={16} />
      Añadir primera compra
    </button>
  </div>
{:else if purchases.length === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="search" size={22} /></span>
    <h3>No encontramos compras con estos filtros.</h3>
    <p>Prueba ajustando la prioridad, el estado o la categoría.</p>
    <button type="button" class="secondary-button" onclick={onClearFilters}>Limpiar filtros</button>
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Listado de compras pendientes de KUBO, prioridad alta primero</caption>
      <thead>
        <tr>
          <th scope="col">Prioridad</th>
          <th scope="col">Compra</th>
          <th scope="col">Categoría</th>
          <th scope="col">Cantidad</th>
          <th scope="col">Destino</th>
          <th scope="col">Necesario para</th>
          <th scope="col">Estimado</th>
          <th scope="col">Estado</th>
        </tr>
      </thead>
      <tbody>
        {#each purchases as purchase (purchase.id)}
          <tr class="expense-row purchase-row" tabindex="0" aria-label={rowLabel(purchase)} onclick={() => onSelect(purchase)} onkeydown={(event) => handleRowKeydown(event, purchase)}>
            <td>
              <span class="priority-chip priority-{purchase.priority}">
                <span class="priority-dot" aria-hidden="true"></span>
                {priorityLabel(purchase.priority)}
              </span>
            </td>
            <td><span class="expense-concept-cell"><strong>{purchase.title}</strong>{#if purchase.preferredSupplier}<span>{purchase.preferredSupplier}</span>{/if}</span></td>
            <td>{optionLabel(EXPENSE_CATEGORIES, purchase.category)}</td>
            <td class="mono-strong">{purchase.quantity ? `${purchase.quantity}${purchase.unit ? ' ' + optionLabel(EXPENSE_UNITS, purchase.unit) : ''}` : '—'}</td>
            <td>{optionLabel(EXPENSE_DESTINATIONS, purchase.destination)}</td>
            <td class="mono-strong">{purchase.neededBy ? formatDateLong(purchase.neededBy) : '—'}</td>
            <td class="expense-total-cell">{purchase.estimatedAmount !== undefined ? formatCurrency(purchase.estimatedAmount) : '—'}</td>
            <td><span class="status-chip status-{purchase.status}">{optionLabel(PURCHASE_STATUSES, purchase.status)}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each purchases as purchase (purchase.id)}
      <button type="button" class="mobile-data-card expense-card" onclick={() => onSelect(purchase)}>
        <div class="expense-mobile-top">
          <span class="expense-mobile-top-left">
            <span class="priority-chip priority-{purchase.priority}">
              <span class="priority-dot" aria-hidden="true"></span>
              {priorityLabel(purchase.priority)}
            </span>
            {#if purchase.neededBy}<span class="expense-mobile-date">{formatDateShort(purchase.neededBy)}</span>{/if}
          </span>
          <span class="expense-mobile-total">{purchase.estimatedAmount !== undefined ? `${formatCurrency(purchase.estimatedAmount)} est.` : 'Sin estimado'}</span>
        </div>
        <span class="expense-mobile-concept">{purchase.title}</span>
        <span class="expense-mobile-meta">{optionLabel(EXPENSE_CATEGORIES, purchase.category)} · {optionLabel(EXPENSE_DESTINATIONS, purchase.destination)}</span>
        <div class="expense-mobile-bottom">
          <span class="expense-mobile-meta">{purchase.quantity ? `${purchase.quantity}${purchase.unit ? ' ' + optionLabel(EXPENSE_UNITS, purchase.unit) : ''}` : '—'}</span>
          <span class="status-chip status-{purchase.status}">{optionLabel(PURCHASE_STATUSES, purchase.status)}</span>
        </div>
      </button>
    {/each}
  </div>
{/if}
