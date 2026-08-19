<script lang="ts">
  /**
   * ExpenseDetailDrawer.svelte
   * Detalle de un gasto + acciones Editar/Eliminar. No reutiliza AdminDetailDrawer.svelte
   * (primitiva genérica de solo-lectura con un único actionHref/actionLabel) porque acá hace
   * falta más: campos condicionales, dos acciones con lógica propia y una confirmación de
   * eliminar anidada — forzar eso dentro del payload genérico habría sido más frágil que un
   * componente propio con el mismo lenguaje visual (mismas clases .detail-drawer/.drawer-*).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { Expense } from '../../../data/admin/expenses.types';
  import {
    EXPENSE_CATEGORIES,
    EXPENSE_DESTINATIONS,
    EXPENSE_DOCUMENT_TYPES,
    EXPENSE_PAYMENT_METHODS,
    EXPENSE_RELATED_TYPES,
    EXPENSE_UNITS,
    optionLabel,
  } from '../../../data/admin/expenses.constants';
  import { formatCurrency, formatDateLong, formatFileSize } from '../../../lib/expenses/format';

  interface Props {
    expense: Expense;
    onClose: () => void;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
  }

  let { expense, onClose, onEdit, onDelete }: Props = $props();

  let confirmingDelete = $state(false);
  let panelEl: HTMLElement | undefined = $state();
  let confirmPanelEl: HTMLElement | undefined = $state();
  let deleteTriggerEl: HTMLButtonElement | undefined = $state();
  let confirmDialogMounted = false;

  $effect(() => {
    if (confirmingDelete) {
      confirmDialogMounted = true;
      const cancelBtn = confirmPanelEl?.querySelector<HTMLElement>('.secondary-button');
      cancelBtn?.focus();
    } else if (confirmDialogMounted) {
      deleteTriggerEl?.focus();
    }
  });

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (confirmingDelete) confirmingDelete = false;
      else onClose();
      return;
    }
    if (event.key === 'Tab' && !confirmingDelete) {
      const focusables = panelEl?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusables || !focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  $effect(() => {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown);
    const closeBtn = panelEl?.querySelector<HTMLElement>('[data-drawer-close]');
    closeBtn?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function confirmDelete() {
    onDelete(expense);
  }
</script>

<div class="drawer-backdrop" onclick={handleBackdropClick} role="presentation">
  <div class="detail-drawer" bind:this={panelEl} role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="expense-detail-title">
    <header class="drawer-header">
      <div>
        <p class="drawer-eyebrow">GASTO</p>
        <h2 id="expense-detail-title">{expense.concept}</h2>
      </div>
      <button type="button" class="icon-button" data-drawer-close onclick={onClose} aria-label="Cerrar detalle del gasto">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <div class="drawer-body">
      <div class="total-breakdown">
        <div class="total-breakdown-row is-total">
          <span>Total del gasto</span>
          <span>{formatCurrency(expense.totalAmount)}</span>
        </div>
        {#if expense.hasMobility}
          <div class="total-breakdown-row">
            <span>Compra</span>
            <span>{formatCurrency(expense.purchaseAmount)}</span>
          </div>
          <div class="total-breakdown-row">
            <span>Movilidad</span>
            <span>{formatCurrency(expense.mobilityAmount ?? 0)}</span>
          </div>
        {/if}
      </div>

      <dl class="drawer-fields">
        <div class="drawer-field">
          <dt>Fecha</dt>
          <dd>{formatDateLong(expense.date)}</dd>
        </div>
        <div class="drawer-field">
          <dt>Categoría</dt>
          <dd>{optionLabel(EXPENSE_CATEGORIES, expense.category)}</dd>
        </div>
        <div class="drawer-field">
          <dt>Destino</dt>
          <dd>{optionLabel(EXPENSE_DESTINATIONS, expense.destination)}</dd>
        </div>
        {#if expense.supplier}
          <div class="drawer-field">
            <dt>Proveedor / comercio</dt>
            <dd>{expense.supplier}</dd>
          </div>
        {/if}
        {#if expense.quantity}
          <div class="drawer-field">
            <dt>Cantidad</dt>
            <dd>{expense.quantity}{expense.unit ? ` · ${optionLabel(EXPENSE_UNITS, expense.unit)}` : ''}</dd>
          </div>
        {/if}
        {#if expense.hasMobility && expense.mobilityReason}
          <div class="drawer-field">
            <dt>Motivo de movilidad</dt>
            <dd>{expense.mobilityReason}</dd>
          </div>
        {/if}
        <div class="drawer-field">
          <dt>Medio de pago</dt>
          <dd>{optionLabel(EXPENSE_PAYMENT_METHODS, expense.paymentMethod)}</dd>
        </div>
        {#if expense.paymentAccount}
          <div class="drawer-field">
            <dt>Cuenta / origen</dt>
            <dd>{expense.paymentAccount}</dd>
          </div>
        {/if}
        <div class="drawer-field">
          <dt>Comprobante</dt>
          <dd>
            <span class="receipt-chip" class:has-receipt={expense.documentType !== 'none'}>
              <KuboIcon name={expense.documentType !== 'none' ? 'attachment' : 'page'} size={14} />
              {optionLabel(EXPENSE_DOCUMENT_TYPES, expense.documentType)}
            </span>
          </dd>
        </div>
        {#if expense.documentNumber}
          <div class="drawer-field">
            <dt>N.º de documento</dt>
            <dd>{expense.documentNumber}</dd>
          </div>
        {/if}
        {#if expense.attachment}
          <div class="drawer-field">
            <dt>Archivo adjunto</dt>
            <dd>
              <span class="attachment-row is-plain">
                <span class="attachment-icon"><KuboIcon name="page" size={16} /></span>
                <span class="attachment-meta">
                  <span class="attachment-name">{expense.attachment.fileName}</span>
                  {#if expense.attachment.fileSize}<span class="attachment-size">{formatFileSize(expense.attachment.fileSize)}</span>{/if}
                </span>
              </span>
            </dd>
          </div>
        {/if}
        {#if expense.related}
          <div class="drawer-field">
            <dt>Relacionado con</dt>
            <dd>{optionLabel(EXPENSE_RELATED_TYPES, expense.related.type)} · {expense.related.label}</dd>
          </div>
        {/if}
        {#if expense.notes}
          <div class="drawer-field">
            <dt>Notas</dt>
            <dd>{expense.notes}</dd>
          </div>
        {/if}
      </dl>
    </div>

    <footer class="drawer-footer">
      <div class="expense-form-footer-actions">
        <button type="button" class="secondary-button" onclick={() => onEdit(expense)}>
          <KuboIcon name="edit-pencil" size={16} />
          Editar
        </button>
        <button type="button" class="danger-button" bind:this={deleteTriggerEl} onclick={() => (confirmingDelete = true)}>
          <KuboIcon name="trash" size={16} />
          Eliminar
        </button>
      </div>
    </footer>
  </div>
</div>

{#if confirmingDelete}
  <div class="modal-backdrop" onclick={(event) => event.target === event.currentTarget && (confirmingDelete = false)} role="presentation">
    <div class="modal-panel" bind:this={confirmPanelEl} role="alertdialog" aria-modal="true" aria-labelledby="delete-expense-title" aria-describedby="delete-expense-desc">
      <header class="modal-header">
        <h2 id="delete-expense-title">Eliminar gasto</h2>
        <button type="button" class="icon-button" onclick={() => (confirmingDelete = false)} aria-label="Cerrar confirmación">
          <KuboIcon name="xmark" size={20} />
        </button>
      </header>
      <div class="modal-body">
        <p id="delete-expense-desc">Esta acción quitará el movimiento de esta sesión.</p>
      </div>
      <footer class="modal-footer">
        <button type="button" class="secondary-button" onclick={() => (confirmingDelete = false)}>Cancelar</button>
        <button type="button" class="danger-button" onclick={confirmDelete}>Eliminar</button>
      </footer>
    </div>
  </div>
{/if}
