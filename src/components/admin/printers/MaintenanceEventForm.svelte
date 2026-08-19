<script lang="ts">
  /**
   * MaintenanceEventForm.svelte
   * Modal "Registrar mantenimiento" (spec §16). Guarda un `MaintenanceEvent` con snapshot de
   * contadores — nunca reinicia `counters` de la impresora (spec §10). Si `replacementPerformed`
   * cambia la configuración instalada (p. ej. boquilla inoxidable → endurecida), el bloque
   * "Repuesto instalado" queda disponible para que `installedConfiguration` se actualice al guardar
   * (lib/printers/model.ts `buildMaintenanceEvent`).
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import { MAINTENANCE_COMPONENTS } from '../../../data/admin/printers.mock';
  import { MAINTENANCE_ACTION_OPTIONS, MAINTENANCE_CONDITION_OPTIONS, NOZZLE_MATERIAL_OPTIONS } from '../../../data/admin/printers.constants';
  import type { MaintenanceAction, MaintenanceConditionFound, MaintenanceEventFormValues, NozzleMaterial } from '../../../data/admin/printers.types';
  import { firstInvalidMaintenanceEventField, hasErrors, validateMaintenanceEventForm } from '../../../lib/printers/validate';
  import { todayIso } from '../../../lib/printers/format';

  interface Props {
    prefillComponentId?: string;
    onSubmit: (values: MaintenanceEventFormValues) => void;
    onCancel: () => void;
  }

  let { prefillComponentId = '', onSubmit, onCancel }: Props = $props();

  const COMPONENT_OPTIONS = MAINTENANCE_COMPONENTS.map((c) => ({ value: c.id, label: c.label }));

  interface FormState {
    date: string;
    componentId: string;
    action: MaintenanceAction | '';
    conditionFound: MaintenanceConditionFound | '';
    replacementPerformed: boolean;
    partNozzleMaterial: NozzleMaterial | '';
    partNozzleDiameterMm: string;
    partBuildPlate: string;
    partHotendType: string;
    notes: string;
  }

  let state = $state<FormState>({
    date: todayIso(),
    componentId: prefillComponentId,
    action: 'inspect',
    conditionFound: 'ok',
    replacementPerformed: false,
    partNozzleMaterial: '',
    partNozzleDiameterMm: '',
    partBuildPlate: '',
    partHotendType: '',
    notes: '',
  });
  let submitAttempted = $state(false);

  function toValues(s: FormState): MaintenanceEventFormValues {
    const hasPartData = Boolean(s.partNozzleMaterial || s.partNozzleDiameterMm.trim() || s.partBuildPlate.trim() || s.partHotendType.trim());
    return {
      date: s.date,
      componentId: s.componentId,
      action: (s.action || 'inspect') as MaintenanceAction,
      conditionFound: (s.conditionFound || 'ok') as MaintenanceConditionFound,
      replacementPerformed: s.replacementPerformed,
      installedPart:
        s.replacementPerformed && hasPartData
          ? {
              nozzleMaterial: s.partNozzleMaterial || undefined,
              nozzleDiameterMm: s.partNozzleDiameterMm.trim() === '' ? undefined : Number(s.partNozzleDiameterMm),
              buildPlate: s.partBuildPlate.trim() || undefined,
              hotendType: s.partHotendType.trim() || undefined,
            }
          : undefined,
      notes: s.notes.trim() || undefined,
    };
  }

  let values = $derived(toValues(state));
  let errors = $derived(validateMaintenanceEventForm(values));
  let showErrors = $derived(submitAttempted);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    date: 'maintenance-date',
    componentId: 'maintenance-component',
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (hasErrors(errors)) {
      await tick();
      const field = firstInvalidMaintenanceEventField(errors);
      const id = field ? FIELD_ELEMENT_ID[field] : undefined;
      if (id) document.getElementById(id)?.focus();
      return;
    }
    onSubmit(values);
  }
</script>

<Modal onClose={onCancel} labelledBy="maintenance-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">REGISTRAR MANTENIMIENTO</p>
        <h2 id="maintenance-form-title">Nuevo evento de mantenimiento</h2>
        <p class="field-hint" style="margin-top: 4px;">Esto no reinicia los contadores de uso de la impresora.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de mantenimiento">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="maintenance-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      <section class="form-section">
        <h3 class="form-section-title">EVENTO</h3>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="maintenance-date">Fecha <span class="field-required">*</span></label>
            <input
              id="maintenance-date"
              class="text-input"
              type="date"
              bind:value={state.date}
              aria-invalid={showErrors && errors.date ? 'true' : undefined}
              aria-describedby={showErrors && errors.date ? 'maintenance-date-error' : undefined}
            />
            {#if showErrors && errors.date}
              <p class="field-error" id="maintenance-date-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.date}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="maintenance-component">Componente <span class="field-required">*</span></label>
            <Combobox
              id="maintenance-component"
              value={state.componentId}
              options={COMPONENT_OPTIONS}
              onChange={(v) => (state.componentId = v)}
              placeholder="Selecciona un componente"
              ariaLabel="Componente"
              invalid={showErrors && Boolean(errors.componentId)}
              describedBy={showErrors && errors.componentId ? 'maintenance-component-error' : undefined}
            />
            {#if showErrors && errors.componentId}
              <p class="field-error" id="maintenance-component-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.componentId}</p>
            {/if}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="maintenance-action">Acción realizada</label>
            <Combobox id="maintenance-action" value={state.action} options={MAINTENANCE_ACTION_OPTIONS} onChange={(v) => (state.action = v)} placeholder="Selecciona una acción" ariaLabel="Acción realizada" />
          </div>
          <div class="field">
            <label class="field-label" for="maintenance-condition">Estado encontrado</label>
            <Combobox id="maintenance-condition" value={state.conditionFound} options={MAINTENANCE_CONDITION_OPTIONS} onChange={(v) => (state.conditionFound = v)} placeholder="Selecciona un estado" ariaLabel="Estado encontrado" />
          </div>
        </div>

        <div class="field">
          <label class="checkbox-field" for="maintenance-replacement">
            <input id="maintenance-replacement" class="checkbox-native" type="checkbox" bind:checked={state.replacementPerformed} />
            ¿Se reemplazó repuesto?
          </label>
        </div>
      </section>

      {#if state.replacementPerformed}
        <section class="form-section">
          <h3 class="form-section-title">REPUESTO INSTALADO</h3>
          <p class="field-hint">Completa solo lo que corresponda al repuesto — actualiza la configuración instalada de la impresora al guardar.</p>

          <div class="field-row" style="margin-top: var(--space-3);">
            <div class="field">
              <label class="field-label" for="maintenance-part-nozzle-material">Material de boquilla</label>
              <Combobox
                id="maintenance-part-nozzle-material"
                value={state.partNozzleMaterial}
                options={NOZZLE_MATERIAL_OPTIONS}
                onChange={(v) => (state.partNozzleMaterial = v)}
                placeholder="Sin cambio"
                ariaLabel="Material de boquilla instalada"
              />
            </div>
            <div class="field">
              <label class="field-label" for="maintenance-part-nozzle-diameter">Diámetro de boquilla (mm)</label>
              <input id="maintenance-part-nozzle-diameter" class="text-input" type="text" inputmode="decimal" bind:value={state.partNozzleDiameterMm} placeholder="Sin cambio" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="maintenance-part-build-plate">Placa de impresión</label>
              <input id="maintenance-part-build-plate" class="text-input" type="text" bind:value={state.partBuildPlate} placeholder="Sin cambio" />
            </div>
            <div class="field">
              <label class="field-label" for="maintenance-part-hotend-type">Tipo de hotend</label>
              <input id="maintenance-part-hotend-type" class="text-input" type="text" bind:value={state.partHotendType} placeholder="Sin cambio" />
            </div>
          </div>
        </section>
      {/if}

      <section class="form-section">
        <h3 class="form-section-title">NOTAS</h3>
        <div class="field">
          <label class="field-label" for="maintenance-notes">Notas del mantenimiento</label>
          <textarea id="maintenance-notes" class="textarea-input" bind:value={state.notes} placeholder="Opcional"></textarea>
        </div>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="maintenance-form" class="primary-button">Registrar mantenimiento</button>
    </footer>
  {/snippet}
</Modal>
