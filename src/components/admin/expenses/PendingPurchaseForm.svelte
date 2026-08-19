<script lang="ts">
  /**
   * PendingPurchaseForm.svelte
   * Modal "Añadir compra" / "Editar compra" — más compacto que ExpenseForm (menos campos, sin
   * comprobante ni medio de pago: una compra pendiente todavía no es un gasto real). Mismo
   * patrón de un solo formulario para create/edit, estado local, montos como texto mientras se
   * editan.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import ExpenseDatePicker from './ExpenseDatePicker.svelte';
  import type { PendingPurchase, PendingPurchaseFormValues, PurchasePriority } from '../../../data/admin/pending-purchases.types';
  import type { ExpenseCategory, ExpenseDestination, ExpenseRelatedType, ExpenseUnit } from '../../../data/admin/expenses.types';
  import { DEMO_RELATED_OPTIONS, EXPENSE_CATEGORIES, EXPENSE_DESTINATIONS, EXPENSE_RELATED_TYPES, EXPENSE_UNITS } from '../../../data/admin/expenses.constants';
  import { PURCHASE_PRIORITIES } from '../../../data/admin/pending-purchases.constants';
  import { firstInvalidField, hasErrors, validatePendingPurchaseForm } from '../../../lib/pending-purchases/validate';

  interface Props {
    mode: 'create' | 'edit';
    initial: PendingPurchase | null;
    onSubmit: (values: PendingPurchaseFormValues) => void;
    onCancel: () => void;
  }

  let { mode, initial, onSubmit, onCancel }: Props = $props();

  interface FormState {
    title: string;
    category: ExpenseCategory | '';
    priority: PurchasePriority;
    quantity: string;
    unit: ExpenseUnit | '';
    estimatedAmount: string;
    neededBy: string;
    destination: ExpenseDestination | '';
    relatedType: ExpenseRelatedType;
    relatedId: string;
    preferredSupplier: string;
    notes: string;
  }

  function blankState(): FormState {
    return {
      title: '',
      category: '',
      priority: 'medium',
      quantity: '',
      unit: '',
      estimatedAmount: '',
      neededBy: '',
      destination: '',
      relatedType: 'none',
      relatedId: '',
      preferredSupplier: '',
      notes: '',
    };
  }

  function stateFromPurchase(purchase: PendingPurchase): FormState {
    return {
      title: purchase.title,
      category: purchase.category,
      priority: purchase.priority,
      quantity: purchase.quantity !== undefined ? String(purchase.quantity) : '',
      unit: purchase.unit ?? '',
      estimatedAmount: purchase.estimatedAmount !== undefined ? String(purchase.estimatedAmount) : '',
      neededBy: purchase.neededBy ?? '',
      destination: purchase.destination,
      relatedType: purchase.relatedType ?? 'none',
      relatedId: purchase.relatedId ?? '',
      preferredSupplier: purchase.preferredSupplier ?? '',
      notes: purchase.notes ?? '',
    };
  }

  let state = $state<FormState>(initial ? stateFromPurchase(initial) : blankState());
  let submitAttempted = $state(false);

  function relatedLabelFor(type: ExpenseRelatedType, id: string): string {
    if (type === 'none') return '';
    return DEMO_RELATED_OPTIONS[type].find((option) => option.id === id)?.label ?? id;
  }

  function toFormValues(s: FormState): PendingPurchaseFormValues {
    return {
      title: s.title.trim(),
      category: s.category as ExpenseCategory,
      priority: s.priority,
      quantity: s.quantity.trim() === '' ? undefined : Number(s.quantity),
      unit: s.unit || undefined,
      estimatedAmount: s.estimatedAmount.trim() === '' ? undefined : Number(s.estimatedAmount),
      neededBy: s.neededBy || undefined,
      destination: s.destination as ExpenseDestination,
      relatedType: s.relatedType !== 'none' ? s.relatedType : undefined,
      relatedId: s.relatedType !== 'none' && s.relatedId ? s.relatedId : undefined,
      preferredSupplier: s.preferredSupplier.trim() || undefined,
      notes: s.notes.trim() || undefined,
    };
  }

  let formValues = $derived(toFormValues(state));
  let errors = $derived(validatePendingPurchaseForm(formValues));
  let showErrors = $derived(submitAttempted);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    title: 'purchase-title',
    category: 'purchase-category',
    priority: 'purchase-priority',
    destination: 'purchase-destination',
    quantity: 'purchase-quantity',
    estimatedAmount: 'purchase-estimated-amount',
  };

  function onRelatedTypeChange(value: ExpenseRelatedType) {
    state.relatedType = value;
    state.relatedId = '';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (hasErrors(errors)) {
      await tick();
      const firstField = firstInvalidField(errors);
      if (firstField) {
        const id = FIELD_ELEMENT_ID[firstField];
        document.getElementById(id)?.focus();
      }
      return;
    }
    onSubmit(formValues);
  }
</script>

<Modal onClose={onCancel} labelledBy="purchase-form-title" size="compact" panelClass="purchase-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{mode === 'create' ? 'AÑADIR COMPRA' : 'EDITAR COMPRA'}</p>
        <h2 id="purchase-form-title">{mode === 'create' ? 'Añadir compra' : 'Editar compra'}</h2>
        <p class="field-hint" style="margin-top: 4px;">Registra qué necesita comprar KUBO antes de que sea un gasto real.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de compra">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="purchase-form" class="modal-body" onsubmit={handleSubmit} novalidate>
      <div class="field">
        <label class="field-label" for="purchase-title">Qué necesitamos <span class="field-required">*</span></label>
        <input
          id="purchase-title"
          class="text-input"
          type="text"
          bind:value={state.title}
          placeholder="Ej. PLA+ negro"
          aria-invalid={showErrors && errors.title ? 'true' : undefined}
          aria-describedby={showErrors && errors.title ? 'purchase-title-error' : undefined}
        />
        {#if showErrors && errors.title}
          <p class="field-error" id="purchase-title-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.title}</p>
        {/if}
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label" for="purchase-category">Categoría <span class="field-required">*</span></label>
          <Combobox
            id="purchase-category"
            value={state.category}
            options={EXPENSE_CATEGORIES}
            onChange={(v) => (state.category = v)}
            placeholder="Selecciona"
            ariaLabel="Categoría"
            invalid={showErrors && Boolean(errors.category)}
            describedBy={showErrors && errors.category ? 'purchase-category-error' : undefined}
          />
          {#if showErrors && errors.category}
            <p class="field-error" id="purchase-category-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.category}</p>
          {/if}
        </div>
        <div class="field">
          <label class="field-label" for="purchase-priority">Prioridad <span class="field-required">*</span></label>
          <Combobox id="purchase-priority" value={state.priority} options={PURCHASE_PRIORITIES} onChange={(v) => (state.priority = v)} ariaLabel="Prioridad" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label" for="purchase-quantity">Cantidad</label>
          <input
            id="purchase-quantity"
            class="text-input"
            type="text"
            inputmode="decimal"
            bind:value={state.quantity}
            placeholder="Ej. 2"
            aria-invalid={showErrors && errors.quantity ? 'true' : undefined}
            aria-describedby={showErrors && errors.quantity ? 'purchase-quantity-error' : undefined}
          />
          {#if showErrors && errors.quantity}
            <p class="field-error" id="purchase-quantity-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.quantity}</p>
          {/if}
        </div>
        <div class="field">
          <label class="field-label" for="purchase-unit">Unidad</label>
          <Combobox id="purchase-unit" value={state.unit} options={EXPENSE_UNITS} onChange={(v) => (state.unit = v)} placeholder="Sin especificar" ariaLabel="Unidad" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label" for="purchase-estimated-amount">Monto estimado <span class="field-hint">(estimado, no es un gasto)</span></label>
          <div class="money-input-wrap">
            <span class="money-prefix" aria-hidden="true">S/</span>
            <input
              id="purchase-estimated-amount"
              class="text-input"
              type="text"
              inputmode="decimal"
              bind:value={state.estimatedAmount}
              placeholder="0.00"
              aria-invalid={showErrors && errors.estimatedAmount ? 'true' : undefined}
              aria-describedby={showErrors && errors.estimatedAmount ? 'purchase-estimated-amount-error' : undefined}
            />
          </div>
          {#if showErrors && errors.estimatedAmount}
            <p class="field-error" id="purchase-estimated-amount-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.estimatedAmount}</p>
          {/if}
        </div>

        <div class="field">
          <span class="field-label" id="purchase-needed-by-label">Fecha necesaria</span>
          <ExpenseDatePicker id="purchase-needed-by" value={state.neededBy} onChange={(iso) => (state.neededBy = iso)} />
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="purchase-destination">Destino <span class="field-required">*</span></label>
        <Combobox
          id="purchase-destination"
          value={state.destination}
          options={EXPENSE_DESTINATIONS}
          onChange={(v) => (state.destination = v)}
          placeholder="Selecciona un destino"
          ariaLabel="Destino"
          invalid={showErrors && Boolean(errors.destination)}
          describedBy={showErrors && errors.destination ? 'purchase-destination-error' : undefined}
        />
        {#if showErrors && errors.destination}
          <p class="field-error" id="purchase-destination-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.destination}</p>
        {/if}
      </div>

      <div class="field">
        <label class="field-label" for="purchase-related-type">Relacionado con</label>
        <Combobox
          id="purchase-related-type"
          value={state.relatedType}
          options={EXPENSE_RELATED_TYPES}
          onChange={onRelatedTypeChange}
          placeholder="Ninguno"
          ariaLabel="Relacionado con"
        />
      </div>

      {#if state.relatedType !== 'none'}
        <div class="conditional-fields">
          <div class="field">
            <span class="field-label" id="purchase-related-id-label">
              {state.relatedType === 'order' ? 'Pedido' : state.relatedType === 'custom-project' ? 'Proyecto Custom' : 'Producto'}
              <span class="field-hint">(referencia demo)</span>
            </span>
            <Combobox
              id="purchase-related-id"
              value={state.relatedId}
              options={DEMO_RELATED_OPTIONS[state.relatedType].map((option) => ({ value: option.id, label: option.label }))}
              onChange={(v) => (state.relatedId = v)}
              placeholder="Selecciona una referencia"
              ariaLabel="Referencia relacionada"
            />
          </div>
        </div>
      {/if}

      <div class="field">
        <label class="field-label" for="purchase-supplier">Proveedor sugerido</label>
        <input id="purchase-supplier" class="text-input" type="text" bind:value={state.preferredSupplier} placeholder="Ej. 3D Market Perú" />
      </div>

      <div class="field">
        <label class="field-label" for="purchase-notes">Notas</label>
        <textarea id="purchase-notes" class="textarea-input" bind:value={state.notes} placeholder="Detalles adicionales"></textarea>
      </div>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="purchase-form" class="primary-button">{mode === 'create' ? 'Guardar compra' : 'Guardar cambios'}</button>
    </footer>
  {/snippet}
</Modal>
