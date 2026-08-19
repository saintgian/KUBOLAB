<script lang="ts">
  /**
   * AddStockForm.svelte
   * Modal "+ Agregar stock" de un perfil existente (spec §9) — mismos campos que el bloque de
   * stock inicial de MaterialProfileForm, con resumen reactivo (peso total + costo total). Nunca
   * edita `stockDisponible` directo: crea bobinas + un movimiento de compra (ver
   * lib/materials/model.ts `buildStockEntry`), consistente con spec §2.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { FilamentProfile, StockEntryFormValues } from '../../../data/admin/materials.types';
  import { INITIAL_SPOOL_STATUS_OPTIONS } from '../../../data/admin/materials.constants';
  import { formatCurrency, formatWeightG, todayIso } from '../../../lib/materials/format';
  import { firstInvalidStockEntryField, hasErrors, validateStockEntryForm } from '../../../lib/materials/validate';

  interface Props {
    profile: FilamentProfile;
    onSubmit: (values: StockEntryFormValues) => void;
    onCancel: () => void;
  }

  let { profile, onSubmit, onCancel }: Props = $props();

  interface FormState {
    purchaseDate: string;
    supplier: string;
    spoolCount: string;
    netWeightPerSpoolG: string;
    unitCost: string;
    lot: string;
    initialStatus: 'sealed' | 'open';
    location: string;
    documentReference: string;
    notes: string;
  }

  let state = $state<FormState>({
    purchaseDate: todayIso(),
    supplier: profile.preferredSupplier ?? '',
    spoolCount: '1',
    netWeightPerSpoolG: profile.nominalSpoolWeightG !== undefined ? String(profile.nominalSpoolWeightG) : '1000',
    unitCost: '',
    lot: '',
    initialStatus: 'sealed',
    location: profile.defaultLocation ?? '',
    documentReference: '',
    notes: '',
  });
  let submitAttempted = $state(false);

  function toValues(s: FormState): StockEntryFormValues {
    return {
      purchaseDate: s.purchaseDate,
      supplier: s.supplier.trim() || undefined,
      spoolCount: s.spoolCount.trim() === '' ? NaN : Number(s.spoolCount),
      netWeightPerSpoolG: s.netWeightPerSpoolG.trim() === '' ? NaN : Number(s.netWeightPerSpoolG),
      unitCost: s.unitCost.trim() === '' ? undefined : Number(s.unitCost),
      lot: s.lot.trim() || undefined,
      initialStatus: s.initialStatus,
      location: s.location.trim() || undefined,
      documentReference: s.documentReference.trim() || undefined,
      notes: s.notes.trim() || undefined,
    };
  }

  let values = $derived(toValues(state));
  let errors = $derived(validateStockEntryForm(values));
  let showErrors = $derived(submitAttempted);

  let spoolCountNumber = $derived(Number(state.spoolCount) || 0);
  let netWeightNumber = $derived(Number(state.netWeightPerSpoolG) || 0);
  let totalWeightG = $derived(spoolCountNumber * netWeightNumber);
  let unitCostNumber = $derived(state.unitCost.trim() === '' ? 0 : Number(state.unitCost) || 0);
  let totalCost = $derived(spoolCountNumber * unitCostNumber);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    purchaseDate: 'stock-purchase-date',
    spoolCount: 'stock-spool-count',
    netWeightPerSpoolG: 'stock-net-weight',
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (hasErrors(errors)) {
      await tick();
      const firstField = firstInvalidStockEntryField(errors);
      if (firstField) document.getElementById(FIELD_ELEMENT_ID[firstField])?.focus();
      return;
    }
    onSubmit(values);
  }
</script>

<Modal onClose={onCancel} labelledBy="add-stock-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">AGREGAR STOCK</p>
        <h2 id="add-stock-title">Agregar stock · {profile.name}</h2>
        <p class="field-hint" style="margin-top: 4px;">Registra un ingreso de bobinas para este perfil.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de stock">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="add-stock-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      <section class="form-section">
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="stock-purchase-date">Fecha de compra <span class="field-required">*</span></label>
            <input
              id="stock-purchase-date"
              class="text-input"
              type="date"
              bind:value={state.purchaseDate}
              aria-invalid={showErrors && errors.purchaseDate ? 'true' : undefined}
              aria-describedby={showErrors && errors.purchaseDate ? 'stock-purchase-date-error' : undefined}
            />
            {#if showErrors && errors.purchaseDate}
              <p class="field-error" id="stock-purchase-date-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.purchaseDate}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="stock-supplier">Proveedor</label>
            <input id="stock-supplier" class="text-input" type="text" bind:value={state.supplier} placeholder="Ej. 3D Market Perú" />
          </div>
        </div>

        <div class="field-row" style="margin-top: var(--space-5);">
          <div class="field">
            <label class="field-label" for="stock-spool-count">Cantidad de bobinas <span class="field-required">*</span></label>
            <input
              id="stock-spool-count"
              class="text-input"
              type="text"
              inputmode="numeric"
              bind:value={state.spoolCount}
              aria-invalid={showErrors && errors.spoolCount ? 'true' : undefined}
              aria-describedby={showErrors && errors.spoolCount ? 'stock-spool-count-error' : undefined}
            />
            {#if showErrors && errors.spoolCount}
              <p class="field-error" id="stock-spool-count-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.spoolCount}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="stock-net-weight">Peso neto por bobina (g) <span class="field-required">*</span></label>
            <input
              id="stock-net-weight"
              class="text-input"
              type="text"
              inputmode="numeric"
              bind:value={state.netWeightPerSpoolG}
              aria-invalid={showErrors && errors.netWeightPerSpoolG ? 'true' : undefined}
              aria-describedby={showErrors && errors.netWeightPerSpoolG ? 'stock-net-weight-error' : undefined}
            />
            {#if showErrors && errors.netWeightPerSpoolG}
              <p class="field-error" id="stock-net-weight-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.netWeightPerSpoolG}</p>
            {/if}
          </div>
        </div>

        <div class="field-row" style="margin-top: var(--space-5);">
          <div class="field">
            <label class="field-label" for="stock-unit-cost">Costo unitario (S/)</label>
            <div class="money-input-wrap">
              <span class="money-prefix" aria-hidden="true">S/</span>
              <input id="stock-unit-cost" class="text-input" type="text" inputmode="decimal" bind:value={state.unitCost} placeholder="0.00" />
            </div>
          </div>
          <div class="field">
            <label class="field-label" for="stock-lot">Lote / batch</label>
            <input id="stock-lot" class="text-input" type="text" bind:value={state.lot} placeholder="Opcional" />
          </div>
        </div>

        <div class="field-row" style="margin-top: var(--space-5);">
          <div class="field">
            <span class="field-label" id="stock-status-label">Estado inicial</span>
            <div class="radio-group" role="radiogroup" aria-labelledby="stock-status-label">
              {#each INITIAL_SPOOL_STATUS_OPTIONS as option (option.value)}
                <label class="radio-field" for={`stock-status-${option.value}`}>
                  <input id={`stock-status-${option.value}`} class="radio-native" type="radio" name="stock-status" checked={state.initialStatus === option.value} onchange={() => (state.initialStatus = option.value)} />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>
          <div class="field">
            <label class="field-label" for="stock-location">Ubicación</label>
            <input id="stock-location" class="text-input" type="text" bind:value={state.location} placeholder="Opcional" />
          </div>
        </div>

        <div class="field" style="margin-top: var(--space-5);">
          <label class="field-label" for="stock-document-reference">Documento / referencia</label>
          <input id="stock-document-reference" class="text-input" type="text" bind:value={state.documentReference} placeholder="Ej. B001-004582" />
        </div>

        <div class="field" style="margin-top: var(--space-5);">
          <label class="field-label" for="stock-notes">Notas</label>
          <textarea id="stock-notes" class="textarea-input" bind:value={state.notes} placeholder="Opcional"></textarea>
        </div>

        <div class="total-breakdown" style="margin-top: var(--space-4);">
          <div class="total-breakdown-row is-total">
            <span>{spoolCountNumber} bobina{spoolCountNumber === 1 ? '' : 's'} × {netWeightNumber.toLocaleString('es-PE')} g</span>
            <span aria-live="polite">+{formatWeightG(totalWeightG)}</span>
          </div>
          {#if unitCostNumber > 0}
            <div class="total-breakdown-row">
              <span>Costo total</span>
              <span aria-live="polite">{formatCurrency(totalCost)}</span>
            </div>
          {/if}
        </div>

        <p class="field-hint">Este ingreso queda listo para enlazarse con un Gasto real cuando Finanzas esté conectado — por ahora no crea ningún gasto automáticamente.</p>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="add-stock-form" class="primary-button">Agregar stock</button>
    </footer>
  {/snippet}
</Modal>
