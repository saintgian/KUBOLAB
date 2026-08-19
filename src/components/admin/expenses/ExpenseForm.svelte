<script lang="ts">
  /**
   * ExpenseForm.svelte
   * Modal centrado (antes drawer lateral) de "Registrar gasto" / "Editar gasto" / conversión de
   * una compra pendiente — un solo formulario para los tres casos, como pide el brief para no
   * duplicar UI. Estado 100% local (Svelte $state): los montos viven como texto mientras se
   * editan (evita el salto de cursor de un <input type=number> controlado) y se convierten a
   * número recién al validar/enviar vía `toFormValues`. La regla "categoría Movilidad => no
   * dupliques el monto de movilidad" se aplica en `toFormValues`, no en el estado bruto.
   *
   * `prefill` (modo conversión de compra pendiente → gasto) solo aporta valores de partida
   * editables (concepto/categoría/proveedor/monto/cantidad/unidad/destino/relación/notas) —
   * nunca fecha, medio de pago, comprobante ni un monto "definitivo": eso lo decide quien registra
   * el gasto real, per requisito explícito de no confundir estimado con gasto real.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import ExpenseDatePicker from './ExpenseDatePicker.svelte';
  import ExpenseFileUpload from './ExpenseFileUpload.svelte';
  import type {
    Expense,
    ExpenseCategory,
    ExpenseDestination,
    ExpenseDocumentType,
    ExpenseFormValues,
    ExpensePaymentMethod,
    ExpenseRelatedType,
    ExpenseUnit,
  } from '../../../data/admin/expenses.types';
  import {
    DEMO_RELATED_OPTIONS,
    EXPENSE_CATEGORIES,
    EXPENSE_DESTINATIONS,
    EXPENSE_DOCUMENT_TYPES,
    EXPENSE_PAYMENT_METHODS,
    EXPENSE_RELATED_TYPES,
    EXPENSE_UNITS,
  } from '../../../data/admin/expenses.constants';
  import { formatCurrency, todayIso } from '../../../lib/expenses/format';
  import { firstInvalidField, hasErrors, validateExpenseForm } from '../../../lib/expenses/validate';

  interface Props {
    mode: 'create' | 'edit' | 'convert';
    initial: Expense | null;
    prefill?: Partial<ExpenseFormValues> | null;
    onSubmit: (values: ExpenseFormValues) => void;
    onCancel: () => void;
  }

  let { mode, initial, prefill = null, onSubmit, onCancel }: Props = $props();

  interface FormState {
    date: string;
    category: ExpenseCategory | '';
    concept: string;
    supplier: string;
    purchaseAmount: string;
    quantity: string;
    unit: ExpenseUnit | '';
    hasMobility: boolean;
    mobilityAmount: string;
    mobilityReason: string;
    paymentMethod: ExpensePaymentMethod | '';
    paymentAccount: string;
    destination: ExpenseDestination | '';
    relatedType: ExpenseRelatedType;
    relatedId: string;
    documentType: ExpenseDocumentType;
    documentNumber: string;
    attachment: Expense['attachment'];
    notes: string;
  }

  function blankState(): FormState {
    return {
      date: todayIso(),
      category: '',
      concept: '',
      supplier: '',
      purchaseAmount: '',
      quantity: '',
      unit: '',
      hasMobility: false,
      mobilityAmount: '',
      mobilityReason: '',
      paymentMethod: '',
      paymentAccount: '',
      destination: '',
      relatedType: 'none',
      relatedId: '',
      documentType: 'none',
      documentNumber: '',
      attachment: undefined,
      notes: '',
    };
  }

  function stateFromExpense(expense: Expense): FormState {
    return {
      date: expense.date,
      category: expense.category,
      concept: expense.concept,
      supplier: expense.supplier ?? '',
      purchaseAmount: String(expense.purchaseAmount),
      quantity: expense.quantity !== undefined ? String(expense.quantity) : '',
      unit: expense.unit ?? '',
      hasMobility: expense.hasMobility,
      mobilityAmount: expense.mobilityAmount !== undefined ? String(expense.mobilityAmount) : '',
      mobilityReason: expense.mobilityReason ?? '',
      paymentMethod: expense.paymentMethod,
      paymentAccount: expense.paymentAccount ?? '',
      destination: expense.destination,
      relatedType: expense.related?.type ?? 'none',
      relatedId: expense.related?.id ?? '',
      documentType: expense.documentType,
      documentNumber: expense.documentNumber ?? '',
      attachment: expense.attachment,
      notes: expense.notes ?? '',
    };
  }

  function stateFromPrefill(base: FormState, values: Partial<ExpenseFormValues>): FormState {
    return {
      ...base,
      category: values.category ?? base.category,
      concept: values.concept ?? base.concept,
      supplier: values.supplier ?? base.supplier,
      purchaseAmount: values.purchaseAmount !== undefined ? String(values.purchaseAmount) : base.purchaseAmount,
      quantity: values.quantity !== undefined ? String(values.quantity) : base.quantity,
      unit: values.unit ?? base.unit,
      destination: values.destination ?? base.destination,
      relatedType: values.related?.type ?? base.relatedType,
      relatedId: values.related?.id ?? base.relatedId,
      notes: values.notes ?? base.notes,
    };
  }

  function initialState(): FormState {
    if (initial) return stateFromExpense(initial);
    if (prefill) return stateFromPrefill(blankState(), prefill);
    return blankState();
  }

  let state = $state<FormState>(initialState());
  let submitAttempted = $state(false);
  let panelBodyEl: HTMLElement | undefined = $state();

  function relatedLabelFor(type: ExpenseRelatedType, id: string): string {
    if (type === 'none') return '';
    return DEMO_RELATED_OPTIONS[type].find((option) => option.id === id)?.label ?? id;
  }

  function toFormValues(s: FormState): ExpenseFormValues {
    const isMobilityCategory = s.category === 'mobility';
    const includesMobility = !isMobilityCategory && s.hasMobility;
    return {
      date: s.date,
      category: s.category as ExpenseCategory,
      concept: s.concept.trim(),
      supplier: s.supplier.trim() || undefined,
      purchaseAmount: s.purchaseAmount.trim() === '' ? NaN : Number(s.purchaseAmount),
      quantity: s.quantity.trim() === '' ? undefined : Number(s.quantity),
      unit: s.unit || undefined,
      hasMobility: includesMobility,
      mobilityAmount: includesMobility ? (s.mobilityAmount.trim() === '' ? NaN : Number(s.mobilityAmount)) : undefined,
      mobilityReason: includesMobility ? s.mobilityReason.trim() || undefined : undefined,
      paymentMethod: s.paymentMethod as ExpensePaymentMethod,
      paymentAccount: s.paymentAccount.trim() || undefined,
      destination: s.destination as ExpenseDestination,
      related: s.relatedType !== 'none' && s.relatedId ? { type: s.relatedType, id: s.relatedId, label: relatedLabelFor(s.relatedType, s.relatedId) } : undefined,
      documentType: s.documentType,
      documentNumber: s.documentType !== 'none' ? s.documentNumber.trim() || undefined : undefined,
      attachment: s.documentType !== 'none' ? s.attachment : undefined,
      notes: s.notes.trim() || undefined,
    };
  }

  let formValues = $derived(toFormValues(state));
  let errors = $derived(validateExpenseForm(formValues));
  let showErrors = $derived(submitAttempted);

  let purchaseAmountNumber = $derived(Number(state.purchaseAmount.trim() === '' ? '0' : state.purchaseAmount) || 0);
  let mobilityAmountNumber = $derived(
    state.category !== 'mobility' && state.hasMobility ? Number(state.mobilityAmount.trim() === '' ? '0' : state.mobilityAmount) || 0 : 0
  );
  let totalAmount = $derived(purchaseAmountNumber + mobilityAmountNumber);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    date: 'expense-date',
    category: 'expense-category',
    concept: 'expense-concept',
    purchaseAmount: 'expense-purchase-amount',
    quantity: 'expense-quantity',
    mobilityAmount: 'expense-mobility-amount',
    paymentMethod: 'expense-payment-method',
    destination: 'expense-destination',
    attachment: 'expense-attachment',
  };

  function onCategoryChange(value: ExpenseCategory) {
    state.category = value;
    if (value === 'mobility') state.hasMobility = false;
  }

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

  const titleText = mode === 'create' ? 'Registrar gasto' : mode === 'edit' ? 'Editar gasto' : 'Registrar como gasto';
  const eyebrowText = mode === 'create' ? 'REGISTRAR GASTO' : mode === 'edit' ? 'EDITAR GASTO' : 'DESDE COMPRA PENDIENTE';
  const microcopy =
    mode === 'create'
      ? 'Añade un egreso de KUBO.'
      : mode === 'edit'
        ? 'Actualiza los datos de este egreso.'
        : 'Completa la fecha, el medio de pago y confirma el monto real antes de guardar.';
</script>

<Modal onClose={onCancel} labelledBy="expense-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{eyebrowText}</p>
        <h2 id="expense-form-title">{titleText}</h2>
        <p class="field-hint" style="margin-top: 4px;">{microcopy}</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de gasto">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="expense-form" class="modal-body expense-form-body" bind:this={panelBodyEl} onsubmit={handleSubmit} novalidate>
      <!-- A. Información -->
      <section class="form-section">
        <h3 class="form-section-title">INFORMACIÓN</h3>

        <div class="field">
          <label class="field-label" for="expense-date">Fecha del gasto <span class="field-required">*</span></label>
          <ExpenseDatePicker
            id="expense-date"
            value={state.date}
            onChange={(iso) => (state.date = iso)}
            invalid={showErrors && Boolean(errors.date)}
            describedBy={showErrors && errors.date ? 'expense-date-error' : undefined}
          />
          {#if showErrors && errors.date}
            <p class="field-error" id="expense-date-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.date}</p>
          {/if}
        </div>

        <div class="field">
          <label class="field-label" for="expense-category">Categoría <span class="field-required">*</span></label>
          <Combobox
            id="expense-category"
            value={state.category}
            options={EXPENSE_CATEGORIES}
            onChange={onCategoryChange}
            placeholder="Selecciona una categoría"
            ariaLabel="Categoría"
            invalid={showErrors && Boolean(errors.category)}
            describedBy={showErrors && errors.category ? 'expense-category-error' : undefined}
          />
          {#if showErrors && errors.category}
            <p class="field-error" id="expense-category-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.category}</p>
          {/if}
        </div>

        <div class="field">
          <label class="field-label" for="expense-concept">Concepto <span class="field-required">*</span></label>
          <input
            id="expense-concept"
            class="text-input"
            type="text"
            bind:value={state.concept}
            placeholder="Ej. Compra de PLA+ negro"
            aria-invalid={showErrors && errors.concept ? 'true' : undefined}
            aria-describedby={showErrors && errors.concept ? 'expense-concept-error' : undefined}
          />
          {#if showErrors && errors.concept}
            <p class="field-error" id="expense-concept-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.concept}</p>
          {/if}
        </div>

        <div class="field">
          <label class="field-label" for="expense-supplier">Proveedor / comercio</label>
          <input id="expense-supplier" class="text-input" type="text" bind:value={state.supplier} placeholder="Ej. 3D Market Perú" />
        </div>
      </section>

      <!-- B. Importe -->
      <section class="form-section">
        <h3 class="form-section-title">IMPORTE</h3>

        <div class="field">
          <label class="field-label" for="expense-purchase-amount">
            Monto de compra <span class="field-required">*</span>
            {#if mode === 'convert'}<span class="field-hint">(estimado, editable)</span>{/if}
          </label>
          <div class="money-input-wrap">
            <span class="money-prefix" aria-hidden="true">S/</span>
            <input
              id="expense-purchase-amount"
              class="text-input"
              type="text"
              inputmode="decimal"
              bind:value={state.purchaseAmount}
              placeholder="0.00"
              aria-invalid={showErrors && errors.purchaseAmount ? 'true' : undefined}
              aria-describedby={showErrors && errors.purchaseAmount ? 'expense-purchase-amount-error' : undefined}
            />
          </div>
          {#if showErrors && errors.purchaseAmount}
            <p class="field-error" id="expense-purchase-amount-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.purchaseAmount}</p>
          {/if}
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="expense-quantity">Cantidad comprada</label>
            <input
              id="expense-quantity"
              class="text-input"
              type="text"
              inputmode="decimal"
              bind:value={state.quantity}
              placeholder="Ej. 2"
              aria-invalid={showErrors && errors.quantity ? 'true' : undefined}
              aria-describedby={showErrors && errors.quantity ? 'expense-quantity-error' : undefined}
            />
            {#if showErrors && errors.quantity}
              <p class="field-error" id="expense-quantity-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.quantity}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="expense-unit">Unidad</label>
            <Combobox id="expense-unit" value={state.unit} options={EXPENSE_UNITS} onChange={(v) => (state.unit = v)} placeholder="Sin especificar" ariaLabel="Unidad" />
          </div>
        </div>

        {#if state.category === 'mobility'}
          <p class="field-hint" style="margin-top: var(--space-4);">
            La categoría ya es <strong>Movilidad / pasajes</strong> — no hace falta un monto de movilidad aparte, el monto de compra ya es el total.
          </p>
        {:else}
          <label class="checkbox-field" style="margin-top: var(--space-4);" for="expense-has-mobility">
            <input id="expense-has-mobility" class="checkbox-native" type="checkbox" bind:checked={state.hasMobility} />
            <span class="checkbox-field-copy">
              <strong>Incluir movilidad / pasaje</strong>
              <span>Súmalo al total cuando el gasto incluyó un traslado.</span>
            </span>
          </label>

          {#if state.hasMobility}
            <div class="conditional-fields">
              <div class="field">
                <label class="field-label" for="expense-mobility-amount">Monto de movilidad</label>
                <div class="money-input-wrap">
                  <span class="money-prefix" aria-hidden="true">S/</span>
                  <input
                    id="expense-mobility-amount"
                    class="text-input"
                    type="text"
                    inputmode="decimal"
                    bind:value={state.mobilityAmount}
                    placeholder="0.00"
                    aria-invalid={showErrors && errors.mobilityAmount ? 'true' : undefined}
                    aria-describedby={showErrors && errors.mobilityAmount ? 'expense-mobility-amount-error' : undefined}
                  />
                </div>
                {#if showErrors && errors.mobilityAmount}
                  <p class="field-error" id="expense-mobility-amount-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.mobilityAmount}</p>
                {/if}
              </div>
              <div class="field">
                <label class="field-label" for="expense-mobility-reason">Motivo de movilidad</label>
                <input id="expense-mobility-reason" class="text-input" type="text" bind:value={state.mobilityReason} placeholder="Ej. Taxi para recoger el pedido" />
              </div>
            </div>
          {/if}
        {/if}

        <div class="total-breakdown" style="margin-top: var(--space-4);">
          <div class="total-breakdown-row">
            <span>Compra</span>
            <span>{formatCurrency(purchaseAmountNumber)}</span>
          </div>
          <div class="total-breakdown-row">
            <span>Movilidad</span>
            <span>{formatCurrency(mobilityAmountNumber)}</span>
          </div>
          <div class="total-breakdown-row is-total">
            <span>Total del gasto</span>
            <span aria-live="polite">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </section>

      <!-- C. Comprobante -->
      <section class="form-section">
        <h3 class="form-section-title">COMPROBANTE</h3>

        <div class="field">
          <label class="field-label" for="expense-document-type">Tipo de comprobante</label>
          <Combobox
            id="expense-document-type"
            value={state.documentType}
            options={EXPENSE_DOCUMENT_TYPES}
            onChange={(v) => (state.documentType = v)}
            placeholder="Selecciona un tipo"
            ariaLabel="Tipo de comprobante"
          />
        </div>

        {#if state.documentType !== 'none'}
          <div class="conditional-fields">
            <div class="field">
              <label class="field-label" for="expense-document-number">N.º de documento</label>
              <input id="expense-document-number" class="text-input" type="text" bind:value={state.documentNumber} placeholder="Ej. B001-004582" />
            </div>
            <div class="field">
              <label class="field-label" for="expense-attachment">Adjuntar documento</label>
              <ExpenseFileUpload id="expense-attachment" attachment={state.attachment} onChange={(file) => (state.attachment = file)} />
            </div>
          </div>
        {/if}
      </section>

      <!-- D. Relación con el negocio -->
      <section class="form-section">
        <h3 class="form-section-title">RELACIÓN CON EL NEGOCIO</h3>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="expense-payment-method">Medio de pago <span class="field-required">*</span></label>
            <Combobox
              id="expense-payment-method"
              value={state.paymentMethod}
              options={EXPENSE_PAYMENT_METHODS}
              onChange={(v) => (state.paymentMethod = v)}
              placeholder="Selecciona un medio"
              ariaLabel="Medio de pago"
              invalid={showErrors && Boolean(errors.paymentMethod)}
              describedBy={showErrors && errors.paymentMethod ? 'expense-payment-method-error' : undefined}
            />
            {#if showErrors && errors.paymentMethod}
              <p class="field-error" id="expense-payment-method-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.paymentMethod}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="expense-payment-account">Cuenta / origen</label>
            <input id="expense-payment-account" class="text-input" type="text" bind:value={state.paymentAccount} placeholder="Ej. Yape empresa, BCP, efectivo" />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="expense-destination">Destino <span class="field-required">*</span></label>
          <Combobox
            id="expense-destination"
            value={state.destination}
            options={EXPENSE_DESTINATIONS}
            onChange={(v) => (state.destination = v)}
            placeholder="Selecciona un destino"
            ariaLabel="Destino"
            invalid={showErrors && Boolean(errors.destination)}
            describedBy={showErrors && errors.destination ? 'expense-destination-error' : undefined}
          />
          {#if showErrors && errors.destination}
            <p class="field-error" id="expense-destination-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.destination}</p>
          {/if}
        </div>

        <div class="field">
          <label class="field-label" for="expense-related-type">Relacionado con</label>
          <Combobox
            id="expense-related-type"
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
              <span class="field-label" id="expense-related-id-label">
                {state.relatedType === 'order' ? 'Pedido' : state.relatedType === 'custom-project' ? 'Proyecto Custom' : 'Producto'}
                <span class="field-hint">(referencia demo)</span>
              </span>
              <Combobox
                id="expense-related-id"
                value={state.relatedId}
                options={DEMO_RELATED_OPTIONS[state.relatedType].map((option) => ({ value: option.id, label: option.label }))}
                onChange={(v) => (state.relatedId = v)}
                placeholder="Selecciona una referencia"
                ariaLabel="Referencia relacionada"
              />
            </div>
          </div>
        {/if}
      </section>

      <!-- E. Notas -->
      <section class="form-section">
        <h3 class="form-section-title">NOTAS</h3>
        <div class="field">
          <label class="field-label" for="expense-notes">Notas</label>
          <textarea id="expense-notes" class="textarea-input" bind:value={state.notes} placeholder="Ej. PLA+ negro para Organizador M1"></textarea>
        </div>
      </section>
    </form>

    <footer class="modal-footer expense-form-footer">
      <div class="expense-form-footer-total">
        <span class="expense-form-footer-total-label">Total del gasto</span>
        <span class="expense-form-footer-total-value" aria-live="polite">{formatCurrency(totalAmount)}</span>
      </div>
      <div class="expense-form-footer-buttons">
        <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
        <button type="submit" form="expense-form" class="primary-button">
          {mode === 'edit' ? 'Guardar cambios' : 'Guardar gasto'}
        </button>
      </div>
    </footer>
  {/snippet}
</Modal>
