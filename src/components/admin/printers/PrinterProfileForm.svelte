<script lang="ts">
  /**
   * PrinterProfileForm.svelte
   * Modal de "Editar perfil" / "Agregar impresora" (spec §4/§6/§14/§24). En modo `edit`,
   * `technicalSpecs` (ficha verificada del fabricante) y `costing` (Supuestos KUBO, editables en la
   * pestaña Costos) NO se tocan acá: cada bloque de datos tiene un único punto de edición, igual
   * criterio que Materiales separa perfil/stock. En modo `create`, ambos bloques se cargan enteros
   * desde el template del modelo elegido (PRINTER_MODEL_TEMPLATES) — el componente nunca hardcodea
   * specs de la A1, solo lee el template, así que agregar un modelo nuevo no requiere tocar este
   * archivo. La fecha de adquisición nunca se calcula — solo el usuario la escribe (spec §5); en
   * alta se pide explícitamente porque identifica la unidad física, pero sigue sin autocompletarse.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { NozzleMaterial, PrinterCostingDefaults, PrinterProfile, PrinterProfileFormValues, PrinterStatus, PrinterTechnicalSpecs } from '../../../data/admin/printers.types';
  import { NOZZLE_MATERIAL_OPTIONS, PRINTER_STATUS_OPTIONS } from '../../../data/admin/printers.constants';
  import { PRINTER_MODEL_TEMPLATES, type PrinterModelTemplate } from '../../../data/admin/printer-models';
  import { firstInvalidProfileField, hasErrors, validateProfileForm } from '../../../lib/printers/validate';
  import { suggestInternalName } from '../../../lib/printers/model';

  interface Props {
    mode: 'create' | 'edit';
    printer: PrinterProfile | null;
    existingPrinters?: PrinterProfile[];
    onSubmit: (values: PrinterProfileFormValues) => void;
    onCancel: () => void;
  }

  let { mode, printer, existingPrinters = [], onSubmit, onCancel }: Props = $props();

  const MODEL_TEMPLATE_OPTIONS = PRINTER_MODEL_TEMPLATES.map((t) => ({ value: t.id, label: `${t.manufacturer} ${t.model}` }));

  interface FormState {
    internalName: string;
    manufacturer: string;
    model: string;
    status: PrinterStatus;
    serialNumber: string;
    acquisitionDate: string;
    nozzleDiameterMm: string;
    nozzleMaterial: NozzleMaterial | '';
    buildPlate: string;
    hotendType: string;
    notes: string;
  }

  function stateFromPrinter(p: PrinterProfile): FormState {
    return {
      internalName: p.internalName,
      manufacturer: p.manufacturer,
      model: p.model,
      status: p.status,
      serialNumber: p.serialNumber ?? '',
      acquisitionDate: p.acquisitionDate ?? '',
      nozzleDiameterMm: String(p.installedConfiguration.nozzleDiameterMm),
      nozzleMaterial: p.installedConfiguration.nozzleMaterial,
      buildPlate: p.installedConfiguration.buildPlate ?? '',
      hotendType: p.installedConfiguration.hotendType ?? '',
      notes: p.notes ?? '',
    };
  }

  function blankState(): FormState {
    return {
      internalName: '',
      manufacturer: '',
      model: '',
      status: 'active',
      serialNumber: '',
      acquisitionDate: '',
      nozzleDiameterMm: '',
      nozzleMaterial: '',
      buildPlate: '',
      hotendType: '',
      notes: '',
    };
  }

  let state = $state<FormState>(mode === 'edit' && printer ? stateFromPrinter(printer) : blankState());
  let submitAttempted = $state(false);

  // Solo relevante en create: el template elegido es la ÚNICA fuente de technicalSpecs/costing
  // nuevos (spec "no pedir al usuario que vuelva a escribir datos técnicos conocidos"). En edit
  // esos bloques nunca se tocan — se preservan tal como están en `printer`.
  let selectedTemplateId = $state<string>('');
  let templateError = $state<string | null>(null);
  let technicalSpecsState = $state<PrinterTechnicalSpecs>({});
  let costingState = $state<PrinterCostingDefaults>({
    averagePowerW: 0,
    referenceValuePen: 0,
    referenceLifeHours: 0,
    depreciationPerHourPen: 0,
    maintenanceReservePerHourPen: 0,
  });
  let installedAtState: string | undefined = undefined;

  function applyTemplate(template: PrinterModelTemplate) {
    state.manufacturer = template.manufacturer;
    state.model = template.model;
    state.nozzleDiameterMm = String(template.installedConfiguration.nozzleDiameterMm);
    state.nozzleMaterial = template.installedConfiguration.nozzleMaterial;
    state.buildPlate = template.installedConfiguration.buildPlate ?? '';
    state.hotendType = template.installedConfiguration.hotendType ?? '';
    technicalSpecsState = template.technicalSpecs;
    costingState = template.costing;
    installedAtState = undefined;
    // Solo sugiere el nombre si el usuario todavía no escribió el suyo — nunca pisa una edición.
    if (!state.internalName.trim()) {
      state.internalName = suggestInternalName(existingPrinters, template.namePrefix);
    }
  }

  function handleTemplateChange(templateId: string) {
    selectedTemplateId = templateId;
    templateError = null;
    const template = PRINTER_MODEL_TEMPLATES.find((t) => t.id === templateId);
    if (template) applyTemplate(template);
  }

  function toFormValues(s: FormState): PrinterProfileFormValues {
    return {
      internalName: s.internalName.trim(),
      manufacturer: s.manufacturer.trim(),
      model: s.model.trim(),
      technology: mode === 'edit' && printer ? printer.technology : 'FDM',
      status: s.status,
      serialNumber: s.serialNumber.trim() || undefined,
      acquisitionDate: s.acquisitionDate.trim() || undefined,
      technicalSpecs: mode === 'edit' && printer ? printer.technicalSpecs : technicalSpecsState,
      installedConfiguration: {
        nozzleDiameterMm: s.nozzleDiameterMm.trim() === '' ? NaN : Number(s.nozzleDiameterMm),
        nozzleMaterial: (s.nozzleMaterial || 'stainless-steel') as NozzleMaterial,
        buildPlate: s.buildPlate.trim() || undefined,
        hotendType: s.hotendType.trim() || undefined,
        installedAt: mode === 'edit' && printer ? printer.installedConfiguration.installedAt : installedAtState,
      },
      costing: mode === 'edit' && printer ? printer.costing : costingState,
      notes: s.notes.trim() || undefined,
    };
  }

  let values = $derived(toFormValues(state));
  let errors = $derived(validateProfileForm(values, { requireAcquisitionDate: mode === 'create' }));
  let showErrors = $derived(submitAttempted);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    internalName: 'printer-internal-name',
    manufacturer: 'printer-manufacturer',
    model: 'printer-model',
    acquisitionDate: 'printer-acquisition-date',
    nozzleDiameterMm: 'printer-nozzle-diameter',
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (mode === 'create' && !selectedTemplateId) {
      templateError = 'Selecciona un modelo de impresora.';
      await tick();
      document.getElementById('printer-model-template')?.focus();
      return;
    }
    if (hasErrors(errors)) {
      await tick();
      const field = firstInvalidProfileField(errors);
      const id = field ? FIELD_ELEMENT_ID[field] : undefined;
      if (id) document.getElementById(id)?.focus();
      return;
    }
    onSubmit(values);
  }
</script>

<Modal onClose={onCancel} labelledBy="printer-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{mode === 'create' ? 'AGREGAR IMPRESORA' : 'EDITAR PERFIL'}</p>
        <h2 id="printer-form-title">{mode === 'create' ? 'Nueva impresora' : printer?.internalName}</h2>
        <p class="field-hint" style="margin-top: 4px;">
          {mode === 'create' ? 'Elige el modelo para cargar sus especificaciones y crea un perfil independiente.' : 'Identidad y configuración física instalada de la impresora.'}
        </p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de impresora">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="printer-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      {#if mode === 'create'}
        <section class="form-section">
          <h3 class="form-section-title">MODELO</h3>
          <div class="field">
            <label class="field-label" id="printer-model-template-label" for="printer-model-template">Marca / Modelo <span class="field-required">*</span></label>
            <Combobox
              id="printer-model-template"
              value={selectedTemplateId}
              options={MODEL_TEMPLATE_OPTIONS}
              onChange={handleTemplateChange}
              placeholder="Selecciona marca y modelo"
              ariaLabel="Marca y modelo de la impresora"
              invalid={showErrors && Boolean(templateError)}
              describedBy={showErrors && templateError ? 'printer-model-template-error' : undefined}
            />
            {#if showErrors && templateError}
              <p class="field-error" id="printer-model-template-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{templateError}</p>
            {/if}
            {#if selectedTemplateId}
              <p class="field-hint">Se cargaron las especificaciones oficiales, la configuración de fábrica y los Supuestos KUBO de este modelo.</p>
            {/if}
          </div>
        </section>
      {/if}

      <section class="form-section">
        <h3 class="form-section-title">IDENTIDAD</h3>

        <div class="field">
          <label class="field-label" for="printer-internal-name">Nombre interno <span class="field-required">*</span></label>
          <input
            id="printer-internal-name"
            class="text-input"
            type="text"
            bind:value={state.internalName}
            aria-invalid={showErrors && errors.internalName ? 'true' : undefined}
            aria-describedby={showErrors && errors.internalName ? 'printer-internal-name-error' : undefined}
          />
          {#if showErrors && errors.internalName}
            <p class="field-error" id="printer-internal-name-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.internalName}</p>
          {:else if mode === 'create'}
            <p class="field-hint">Sugerido según las impresoras existentes — puedes cambiarlo.</p>
          {/if}
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="printer-manufacturer">Fabricante <span class="field-required">*</span></label>
            <input
              id="printer-manufacturer"
              class="text-input"
              type="text"
              bind:value={state.manufacturer}
              readonly={mode === 'create'}
              aria-invalid={showErrors && errors.manufacturer ? 'true' : undefined}
              aria-describedby={showErrors && errors.manufacturer ? 'printer-manufacturer-error' : undefined}
            />
            {#if showErrors && errors.manufacturer}
              <p class="field-error" id="printer-manufacturer-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.manufacturer}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="printer-model">Modelo <span class="field-required">*</span></label>
            <input
              id="printer-model"
              class="text-input"
              type="text"
              bind:value={state.model}
              readonly={mode === 'create'}
              aria-invalid={showErrors && errors.model ? 'true' : undefined}
              aria-describedby={showErrors && errors.model ? 'printer-model-error' : undefined}
            />
            {#if showErrors && errors.model}
              <p class="field-error" id="printer-model-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.model}</p>
            {/if}
          </div>
        </div>

        <div class="field">
          <span class="field-label" id="printer-status-label">Estado</span>
          <div class="radio-group" role="radiogroup" aria-labelledby="printer-status-label">
            {#each PRINTER_STATUS_OPTIONS as option (option.value)}
              <label class="radio-field" for={`printer-status-${option.value}`}>
                <input id={`printer-status-${option.value}`} class="radio-native" type="radio" name="printer-status" checked={state.status === option.value} onchange={() => (state.status = option.value)} />
                {option.label}
              </label>
            {/each}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="printer-serial">Número de serie</label>
            <input id="printer-serial" class="text-input" type="text" bind:value={state.serialNumber} placeholder="Opcional" />
          </div>
          <div class="field">
            <label class="field-label" for="printer-acquisition-date">Fecha de adquisición{#if mode === 'create'} <span class="field-required">*</span>{/if}</label>
            <input
              id="printer-acquisition-date"
              class="text-input"
              type="date"
              bind:value={state.acquisitionDate}
              aria-invalid={showErrors && errors.acquisitionDate ? 'true' : undefined}
              aria-describedby={showErrors && errors.acquisitionDate ? 'printer-acquisition-date-error' : undefined}
            />
            {#if showErrors && errors.acquisitionDate}
              <p class="field-error" id="printer-acquisition-date-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.acquisitionDate}</p>
            {:else}
              <p class="field-hint">KUBO nunca la calcula sola — la escribes tú.</p>
            {/if}
          </div>
        </div>
      </section>

      <section class="form-section">
        <h3 class="form-section-title">CONFIGURACIÓN INSTALADA</h3>
        <p class="field-hint">Lo que la máquina tiene puesto realmente hoy — cambia esto solo cuando reemplazas la pieza física.</p>

        <div class="field-row" style="margin-top: var(--space-3);">
          <div class="field">
            <label class="field-label" for="printer-nozzle-diameter">Diámetro de boquilla (mm) <span class="field-required">*</span></label>
            <input
              id="printer-nozzle-diameter"
              class="text-input"
              type="text"
              inputmode="decimal"
              bind:value={state.nozzleDiameterMm}
              aria-invalid={showErrors && errors.nozzleDiameterMm ? 'true' : undefined}
              aria-describedby={showErrors && errors.nozzleDiameterMm ? 'printer-nozzle-diameter-error' : undefined}
            />
            {#if showErrors && errors.nozzleDiameterMm}
              <p class="field-error" id="printer-nozzle-diameter-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.nozzleDiameterMm}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="printer-nozzle-material">Material de boquilla</label>
            <Combobox
              id="printer-nozzle-material"
              value={state.nozzleMaterial}
              options={NOZZLE_MATERIAL_OPTIONS}
              onChange={(v) => (state.nozzleMaterial = v)}
              placeholder="Selecciona un material"
              ariaLabel="Material de boquilla"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="printer-build-plate">Placa de impresión</label>
            <input id="printer-build-plate" class="text-input" type="text" bind:value={state.buildPlate} placeholder="Ej. Bambu Textured PEI Plate" />
          </div>
          <div class="field">
            <label class="field-label" for="printer-hotend-type">Tipo de hotend</label>
            <input id="printer-hotend-type" class="text-input" type="text" bind:value={state.hotendType} placeholder="Ej. all-metal" />
          </div>
        </div>
      </section>

      {#if mode === 'create'}
        <section class="form-section">
          <h3 class="form-section-title">SEGUIMIENTO</h3>
          <p class="field-hint">Métricas registradas desde la activación del seguimiento en KUBO.</p>
        </section>
      {/if}

      <section class="form-section">
        <h3 class="form-section-title">NOTAS</h3>
        <div class="field">
          <label class="field-label" for="printer-notes">Notas del equipo</label>
          <textarea id="printer-notes" class="textarea-input" bind:value={state.notes} placeholder="Opcional"></textarea>
        </div>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="printer-form" class="primary-button">{mode === 'create' ? 'Agregar impresora' : 'Guardar cambios'}</button>
    </footer>
  {/snippet}
</Modal>
