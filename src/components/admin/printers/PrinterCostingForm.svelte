<script lang="ts">
  /**
   * PrinterCostingForm.svelte
   * Modal "Editar supuestos KUBO" (spec §5/§6/§14 Costos) — únicos campos editables de
   * `PrinterCostingDefaults`. Nunca incluye electricidad dentro del costo derivado: la fórmula
   * mostrada es siempre `machineCostPerHour = depreciationPerHour + maintenanceReservePerHour`.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { PrinterCostingDefaults } from '../../../data/admin/printers.types';
  import { formatCurrencyPerHour } from '../../../lib/printers/format';

  interface Props {
    costing: PrinterCostingDefaults;
    onSubmit: (values: PrinterCostingDefaults) => void;
    onCancel: () => void;
  }

  let { costing, onSubmit, onCancel }: Props = $props();

  let state = $state({
    averagePowerW: String(costing.averagePowerW),
    referenceValuePen: String(costing.referenceValuePen),
    referenceLifeHours: String(costing.referenceLifeHours),
    depreciationPerHourPen: String(costing.depreciationPerHourPen),
    maintenanceReservePerHourPen: String(costing.maintenanceReservePerHourPen),
  });
  let submitAttempted = $state(false);

  function toValues(): PrinterCostingDefaults {
    return {
      averagePowerW: Number(state.averagePowerW) || 0,
      referenceValuePen: Number(state.referenceValuePen) || 0,
      referenceLifeHours: Number(state.referenceLifeHours) || 0,
      depreciationPerHourPen: Number(state.depreciationPerHourPen) || 0,
      maintenanceReservePerHourPen: Number(state.maintenanceReservePerHourPen) || 0,
    };
  }

  let values = $derived(toValues());
  let machineCostPerHour = $derived(values.depreciationPerHourPen + values.maintenanceReservePerHourPen);
  let isValid = $derived(
    Number.isFinite(values.averagePowerW) && values.averagePowerW > 0 &&
    Number.isFinite(values.referenceValuePen) && values.referenceValuePen >= 0 &&
    Number.isFinite(values.referenceLifeHours) && values.referenceLifeHours > 0 &&
    Number.isFinite(values.depreciationPerHourPen) && values.depreciationPerHourPen >= 0 &&
    Number.isFinite(values.maintenanceReservePerHourPen) && values.maintenanceReservePerHourPen >= 0
  );

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (!isValid) {
      await tick();
      document.getElementById('costing-power')?.focus();
      return;
    }
    onSubmit(values);
  }
</script>

<Modal onClose={onCancel} labelledBy="costing-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">EDITAR SUPUESTOS KUBO</p>
        <h2 id="costing-form-title">Supuestos de costeo</h2>
        <p class="field-hint" style="margin-top: 4px;">Defaults operativos internos — no son especificaciones oficiales de Bambu.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de supuestos">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="costing-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      <section class="form-section">
        <h3 class="form-section-title">SUPUESTOS KUBO</h3>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="costing-power">Potencia promedio de costeo (W)</label>
            <input id="costing-power" class="text-input" type="text" inputmode="decimal" bind:value={state.averagePowerW} />
          </div>
          <div class="field">
            <label class="field-label" for="costing-reference-value">Valor de referencia (S/)</label>
            <input id="costing-reference-value" class="text-input" type="text" inputmode="decimal" bind:value={state.referenceValuePen} />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="costing-reference-life">Vida operativa de referencia (h)</label>
            <input id="costing-reference-life" class="text-input" type="text" inputmode="numeric" bind:value={state.referenceLifeHours} />
          </div>
          <div class="field">
            <label class="field-label" for="costing-depreciation">Depreciación derivada (S/ /h)</label>
            <input id="costing-depreciation" class="text-input" type="text" inputmode="decimal" bind:value={state.depreciationPerHourPen} />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="costing-maintenance-reserve">Reserva de mantenimiento (S/ /h)</label>
          <input id="costing-maintenance-reserve" class="text-input" type="text" inputmode="decimal" bind:value={state.maintenanceReservePerHourPen} />
        </div>

        <div class="field">
          <p class="field-label">Costo máquina/h derivado (sin electricidad)</p>
          <p class="summary-metric-value mono-strong">{formatCurrencyPerHour(machineCostPerHour)}</p>
          <p class="field-hint">= depreciación/h + reserva de mantenimiento/h. No incluye electricidad.</p>
        </div>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="costing-form" class="primary-button">Guardar supuestos</button>
    </footer>
  {/snippet}
</Modal>
