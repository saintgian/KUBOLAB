<script lang="ts">
  /**
   * AdjustSpoolWeightForm.svelte
   * Modal "Actualizar peso" de una bobina abierta (spec §11) — dos métodos: peso neto restante
   * directo, o peso bruto de balanza (se resta la tara conocida). El resultado nunca es negativo
   * (se clampa en lib/materials/model.ts `applySpoolWeightUpdate`) y siempre registra un
   * movimiento de ajuste, nunca edita el peso "a mano" sin dejar rastro.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { FilamentSpool, SpoolWeightUpdateValues, WeightUpdateMethod } from '../../../data/admin/materials.types';
  import { formatWeightG } from '../../../lib/materials/format';
  import { validateWeightUpdateForm, hasErrors } from '../../../lib/materials/validate';

  interface Props {
    spool: FilamentSpool;
    onSubmit: (values: SpoolWeightUpdateValues) => void;
    onCancel: () => void;
  }

  let { spool, onSubmit, onCancel }: Props = $props();

  let method = $state<WeightUpdateMethod>('net');
  let weightInput = $state('');
  let note = $state('');
  let submitAttempted = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();

  const hasKnownTare = spool.tareWeightG !== undefined;

  function toValues(): SpoolWeightUpdateValues {
    return {
      method,
      weightG: weightInput.trim() === '' ? NaN : Number(weightInput),
      note: note.trim() || undefined,
    };
  }

  let values = $derived(toValues());
  let errors = $derived(validateWeightUpdateForm(values));
  let showErrors = $derived(submitAttempted);

  let previewRemainingG = $derived.by(() => {
    if (!Number.isFinite(values.weightG)) return null;
    const raw = method === 'gross' ? values.weightG - (spool.tareWeightG ?? 0) : values.weightG;
    return Math.max(0, Math.round(raw));
  });

  function setMethod(next: WeightUpdateMethod) {
    method = next;
    weightInput = '';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (hasErrors(errors)) {
      await tick();
      inputEl?.focus();
      return;
    }
    onSubmit(values);
  }
</script>

<Modal onClose={onCancel} labelledBy="adjust-weight-title" size="compact">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">ACTUALIZAR PESO</p>
        <h2 id="adjust-weight-title">Actualizar peso restante</h2>
        <p class="field-hint" style="margin-top: 4px;">Bobina actual: {formatWeightG(spool.remainingWeightG)} de {formatWeightG(spool.initialNetWeightG)} nominal.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar actualización de peso">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="adjust-weight-form" class="modal-body" onsubmit={handleSubmit} novalidate>
      <div class="field">
        <span class="field-label" id="adjust-weight-method-label">Método</span>
        <div class="radio-group" role="radiogroup" aria-labelledby="adjust-weight-method-label">
          <label class="radio-field" for="adjust-weight-method-net">
            <input id="adjust-weight-method-net" class="radio-native" type="radio" name="adjust-weight-method" checked={method === 'net'} onchange={() => setMethod('net')} />
            Peso neto restante
          </label>
          <label class="radio-field" for="adjust-weight-method-gross">
            <input
              id="adjust-weight-method-gross"
              class="radio-native"
              type="radio"
              name="adjust-weight-method"
              checked={method === 'gross'}
              disabled={!hasKnownTare}
              onchange={() => setMethod('gross')}
            />
            Peso bruto de balanza
          </label>
        </div>
        {#if !hasKnownTare}
          <p class="field-hint">Esta bobina no tiene tara registrada — solo puedes ingresar el peso neto restante.</p>
        {/if}
      </div>

      <div class="field">
        <label class="field-label" for="adjust-weight-value">
          {method === 'gross' ? 'Peso bruto (g)' : 'Peso neto restante (g)'} <span class="field-required">*</span>
        </label>
        <input
          id="adjust-weight-value"
          class="text-input"
          type="text"
          inputmode="numeric"
          bind:value={weightInput}
          bind:this={inputEl}
          placeholder={method === 'gross' ? 'Peso mostrado en la balanza' : 'Ej. 430'}
          aria-invalid={showErrors && errors.weightG ? 'true' : undefined}
          aria-describedby={showErrors && errors.weightG ? 'adjust-weight-value-error' : undefined}
        />
        {#if showErrors && errors.weightG}
          <p class="field-error" id="adjust-weight-value-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.weightG}</p>
        {/if}
        {#if method === 'gross' && hasKnownTare}
          <p class="field-hint">Tara conocida: {spool.tareWeightG} g. Restante = peso bruto − tara.</p>
        {/if}
      </div>

      {#if previewRemainingG !== null}
        <div class="total-breakdown">
          <div class="total-breakdown-row is-total">
            <span>Nuevo peso restante</span>
            <span aria-live="polite">{formatWeightG(previewRemainingG)}</span>
          </div>
        </div>
      {/if}

      <div class="field">
        <label class="field-label" for="adjust-weight-note">Nota</label>
        <input id="adjust-weight-note" class="text-input" type="text" bind:value={note} placeholder="Opcional" />
      </div>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="adjust-weight-form" class="primary-button">Guardar ajuste</button>
    </footer>
  {/snippet}
</Modal>
