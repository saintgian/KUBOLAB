<script lang="ts">
  /**
   * PendingPurchaseDetailDrawer.svelte
   * Detalle de una compra pendiente + acciones. "Registrar como gasto" es la acción central del
   * flujo de conversión (ver requisito "convertir compra → gasto") — abre ExpenseForm prefilleno
   * desde ExpensesWorkspace; esta pieza solo dispara el callback, no conoce el formulario de gasto.
   * "Cancelar compra" cambia el estado a `cancelled` (no es un delete duro) porque el modelo de
   * compras se basa en estados, no en eliminar filas.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { PendingPurchase, PurchaseStatus } from '../../../data/admin/pending-purchases.types';
  import {
    EXPENSE_DESTINATIONS,
    EXPENSE_RELATED_TYPES,
    EXPENSE_UNITS,
    EXPENSE_CATEGORIES,
    optionLabel,
  } from '../../../data/admin/expenses.constants';
  import { MANUAL_PURCHASE_STATUSES, PURCHASE_STATUSES } from '../../../data/admin/pending-purchases.constants';
  import { formatCurrency, formatDateLong } from '../../../lib/expenses/format';

  interface Props {
    purchase: PendingPurchase;
    onClose: () => void;
    onEdit: (purchase: PendingPurchase) => void;
    onConvert: (purchase: PendingPurchase) => void;
    onCancelPurchase: (purchase: PendingPurchase) => void;
    /** Cambio de estado manual (En revisión → Pendiente → Cotizando → Aprobada) — 'purchased'
     * queda fuera de este control, solo se llega ahí vía "Registrar como gasto" (ver onConvert). */
    onChangeStatus: (purchase: PendingPurchase, status: PurchaseStatus) => void;
  }

  let { purchase, onClose, onEdit, onConvert, onCancelPurchase, onChangeStatus }: Props = $props();

  let confirmingCancel = $state(false);

  const canConvert = $derived(purchase.status !== 'purchased' && purchase.status !== 'cancelled');
  const canCancel = $derived(purchase.status !== 'purchased' && purchase.status !== 'cancelled');

  function priorityLabel(priority: PendingPurchase['priority']): string {
    return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
  }
</script>

<div class="drawer-backdrop" onclick={(event) => event.target === event.currentTarget && onClose()} role="presentation">
  <div class="detail-drawer" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="purchase-detail-title">
    <header class="drawer-header">
      <div>
        <p class="drawer-eyebrow">COMPRA PENDIENTE</p>
        <h2 id="purchase-detail-title">{purchase.title}</h2>
      </div>
      <button type="button" class="icon-button" data-drawer-close onclick={onClose} aria-label="Cerrar detalle de compra">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <div class="drawer-body">
      <div class="total-breakdown">
        <div class="total-breakdown-row is-total">
          <span>Monto estimado</span>
          <span>{purchase.estimatedAmount !== undefined ? formatCurrency(purchase.estimatedAmount) : 'Sin estimar'}</span>
        </div>
      </div>

      <dl class="drawer-fields">
        <div class="drawer-field">
          <dt>Prioridad</dt>
          <dd>
            <span class="priority-chip priority-{purchase.priority}"><span class="priority-dot" aria-hidden="true"></span>{priorityLabel(purchase.priority)}</span>
          </dd>
        </div>
        <div class="drawer-field">
          <dt>Estado</dt>
          <dd>
            {#if purchase.status === 'purchased' || purchase.status === 'cancelled'}
              <span class="status-chip status-{purchase.status}">{optionLabel(PURCHASE_STATUSES, purchase.status)}</span>
            {:else}
              <Combobox
                id="purchase-status-{purchase.id}"
                value={purchase.status}
                options={MANUAL_PURCHASE_STATUSES}
                onChange={(value) => onChangeStatus(purchase, value)}
                ariaLabel="Cambiar estado de la compra"
              />
            {/if}
          </dd>
        </div>
        <div class="drawer-field">
          <dt>Categoría</dt>
          <dd>{optionLabel(EXPENSE_CATEGORIES, purchase.category)}</dd>
        </div>
        <div class="drawer-field">
          <dt>Destino</dt>
          <dd>{optionLabel(EXPENSE_DESTINATIONS, purchase.destination)}</dd>
        </div>
        {#if purchase.quantity}
          <div class="drawer-field">
            <dt>Cantidad</dt>
            <dd>{purchase.quantity}{purchase.unit ? ` · ${optionLabel(EXPENSE_UNITS, purchase.unit)}` : ''}</dd>
          </div>
        {/if}
        {#if purchase.neededBy}
          <div class="drawer-field">
            <dt>Fecha necesaria</dt>
            <dd>{formatDateLong(purchase.neededBy)}</dd>
          </div>
        {/if}
        {#if purchase.preferredSupplier}
          <div class="drawer-field">
            <dt>Proveedor sugerido</dt>
            <dd>{purchase.preferredSupplier}</dd>
          </div>
        {/if}
        {#if purchase.relatedType && purchase.relatedId}
          <div class="drawer-field">
            <dt>Relacionado con</dt>
            <dd>{optionLabel(EXPENSE_RELATED_TYPES, purchase.relatedType)} · {purchase.relatedId}</dd>
          </div>
        {/if}
        {#if purchase.notes}
          <div class="drawer-field">
            <dt>Notas</dt>
            <dd>{purchase.notes}</dd>
          </div>
        {/if}
        {#if purchase.status === 'purchased' && purchase.convertedExpenseId}
          <div class="drawer-field">
            <dt>Convertida en gasto</dt>
            <dd>Registrada como gasto real en esta sesión.</dd>
          </div>
        {/if}
      </dl>
    </div>

    <footer class="drawer-footer">
      <div class="expense-form-footer-actions">
        <button type="button" class="secondary-button" onclick={() => onEdit(purchase)}>
          <KuboIcon name="edit-pencil" size={16} />
          Editar
        </button>
        {#if canCancel}
          <button type="button" class="danger-button" onclick={() => (confirmingCancel = true)}>
            <KuboIcon name="xmark" size={16} />
            Cancelar compra
          </button>
        {/if}
      </div>
      {#if canConvert}
        <button type="button" class="primary-button" style="width:100%; margin-top: var(--space-2);" onclick={() => onConvert(purchase)}>
          <KuboIcon name="cart" size={16} />
          Registrar como gasto
        </button>
      {/if}
    </footer>
  </div>
</div>

{#if confirmingCancel}
  <Modal onClose={() => (confirmingCancel = false)} labelledBy="cancel-purchase-title" describedBy="cancel-purchase-desc" size="default">
    {#snippet children()}
      <header class="modal-header">
        <h2 id="cancel-purchase-title">Cancelar compra</h2>
        <button type="button" class="icon-button" data-modal-close onclick={() => (confirmingCancel = false)} aria-label="Cerrar confirmación">
          <KuboIcon name="xmark" size={20} />
        </button>
      </header>
      <div class="modal-body">
        <p id="cancel-purchase-desc">Esta compra pasará a estado "Cancelada" en esta sesión. Puedes volver a activarla editándola.</p>
      </div>
      <footer class="modal-footer">
        <button type="button" class="secondary-button" onclick={() => (confirmingCancel = false)}>Volver</button>
        <button
          type="button"
          class="danger-button"
          onclick={() => {
            confirmingCancel = false;
            onCancelPurchase(purchase);
          }}
        >
          Cancelar compra
        </button>
      </footer>
    {/snippet}
  </Modal>
{/if}
