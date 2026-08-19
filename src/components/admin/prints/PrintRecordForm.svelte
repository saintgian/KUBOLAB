<script lang="ts">
  /**
   * PrintRecordForm.svelte
   * Modal de "Registrar impresión" / "Editar impresión" (spec "Registro"). Único formulario para
   * create/edit/duplicate — el caller (PrintsWorkspace) decide qué `initial` pasar y qué hace
   * `onSubmit` con los valores; este componente no descuenta stock ni toca Equipos directamente
   * (eso vive en lib/prints/model.ts, spec "Centralizar estas mutaciones en store/service").
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { FilamentProfile, FilamentSpool } from '../../../data/admin/materials.types';
  import type { PrinterProfile } from '../../../data/admin/printers.types';
  import type { PrintGuidanceContext, PrintGuidanceRule, PrintMaterialLineFormValues, PrintPurpose, PrintRecordFormValues, PrintResult } from '../../../data/admin/prints.types';
  import { PRINT_PURPOSE_OPTIONS, PRINT_RESULT_OPTIONS } from '../../../data/admin/prints.constants';
  import { NOZZLE_MATERIAL_OPTIONS, optionLabel as printerOptionLabel } from '../../../data/admin/printers.constants';
  import { evaluateMaterialCompatibility } from '../../../lib/printers/compatibility';
  import { validatePrintForm, validateMaterialLines, firstInvalidPrintField, hasErrors } from '../../../lib/prints/validate';
  import { spoolOptionsForProfile } from '../../../lib/prints/spools';
  import { deriveMaterialFamily } from '../../../lib/prints/materialFamily';
  import { buildGuidanceForPhase } from '../../../lib/prints/guidance';
  import { todayIso } from '../../../lib/prints/format';

  interface Props {
    mode: 'create' | 'edit';
    initial: PrintRecordFormValues | null;
    printers: PrinterProfile[];
    profiles: FilamentProfile[];
    spools: FilamentSpool[];
    guidanceRules: PrintGuidanceRule[];
    maintenanceStatesForPrinter: (printerId: string) => string[];
    previousMaterialTypesForPrinter: (printerId: string) => string[];
    onSubmit: (values: PrintRecordFormValues) => void;
    onCancel: () => void;
  }

  let { mode, initial, printers, profiles, spools, guidanceRules, maintenanceStatesForPrinter, previousMaterialTypesForPrinter, onSubmit, onCancel }: Props = $props();

  function blankLine(): PrintMaterialLineFormValues {
    return { profileId: '', spoolId: '', consumedG: 0, wastedG: undefined };
  }

  function blankValues(): PrintRecordFormValues {
    return {
      date: todayIso(),
      name: '',
      purpose: 'sale',
      result: 'success',
      printerId: printers.length === 1 ? printers[0].id : '',
      durationMinutes: 0,
      plannedUnits: undefined,
      producedUnits: 0,
      materials: [blankLine()],
      relatedOrderId: undefined,
      relatedProjectId: undefined,
      issueNote: undefined,
      notes: undefined,
    };
  }

  let values = $state<PrintRecordFormValues>(initial ? { ...initial, materials: initial.materials.map((m) => ({ ...m })) } : blankValues());
  let submitAttempted = $state(false);
  let stockError = $state<string | null>(null);

  const PROFILE_OPTIONS = [...profiles].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((p) => ({ value: p.id, label: p.name }));
  const PRINTER_OPTIONS = printers.map((p) => ({ value: p.id, label: p.internalName }));

  let selectedPrinter = $derived(printers.find((p) => p.id === values.printerId) ?? null);

  let errors = $derived(validatePrintForm(values, spools));
  let lineErrors = $derived(validateMaterialLines(values, spools));
  let showErrors = $derived(submitAttempted);

  function errorForLine(index: number, field: 'profileId' | 'spoolId' | 'consumedG' | 'wastedG'): string | undefined {
    return lineErrors.find((e) => e.index === index && e.field === field)?.message;
  }

  function addLine() {
    values.materials = [...values.materials, blankLine()];
  }

  function removeLine(index: number) {
    values.materials = values.materials.filter((_, i) => i !== index);
  }

  function onProfileChange(index: number, profileId: string) {
    const spoolOptions = spoolOptionsForProfile(profileId, spools);
    values.materials = values.materials.map((line, i) => (i === index ? { ...line, profileId, spoolId: spoolOptions.length === 1 ? spoolOptions[0].value : '' } : line));
  }

  function onSpoolChange(index: number, spoolId: string) {
    values.materials = values.materials.map((line, i) => (i === index ? { ...line, spoolId } : line));
  }

  function onConsumedChange(index: number, raw: string) {
    const consumedG = raw.trim() === '' ? 0 : Number(raw);
    values.materials = values.materials.map((line, i) => (i === index ? { ...line, consumedG } : line));
  }

  function onWastedChange(index: number, raw: string) {
    const wastedG = raw.trim() === '' ? undefined : Number(raw);
    values.materials = values.materials.map((line, i) => (i === index ? { ...line, wastedG } : line));
  }

  function markAllAsWaste(index: number) {
    values.materials = values.materials.map((line, i) => (i === index ? { ...line, wastedG: line.consumedG } : line));
  }

  // ---------- Compatibilidad + consejos contextuales (spec "Antes de imprimir" / "Compatibilidad") ----------

  let lineFamilies = $derived(values.materials.map((line) => (line.profileId ? deriveMaterialFamily(profiles.find((p) => p.id === line.profileId)?.materialType ?? '') : null)));

  let compatibilityByLine = $derived(
    lineFamilies.map((derived) => (derived && selectedPrinter ? evaluateMaterialCompatibility(derived.family, derived.reinforcement, selectedPrinter.installedConfiguration) : null))
  );

  let guidanceContext = $derived<PrintGuidanceContext | null>(
    selectedPrinter
      ? {
          printerModel: selectedPrinter.model,
          purpose: values.purpose,
          materialTypes: lineFamilies.filter((f): f is NonNullable<typeof f> => Boolean(f)).map((f) => f.family),
          reinforcements: lineFamilies.filter((f): f is NonNullable<typeof f> => Boolean(f?.reinforcement)).map((f) => f!.reinforcement!),
          nozzleMaterial: selectedPrinter.installedConfiguration.nozzleMaterial,
          nozzleDiameterMm: selectedPrinter.installedConfiguration.nozzleDiameterMm,
          previousMaterialTypes: previousMaterialTypesForPrinter(selectedPrinter.id),
          maintenanceStates: maintenanceStatesForPrinter(selectedPrinter.id),
        }
      : null
  );

  let preGuidance = $derived(guidanceContext ? buildGuidanceForPhase(guidanceRules, 'pre-print', guidanceContext) : []);

  const FIELD_ELEMENT_ID: Record<string, string> = {
    date: 'print-date',
    name: 'print-name',
    purpose: 'print-purpose',
    result: 'print-result',
    printerId: 'print-printer',
    durationMinutes: 'print-duration',
    producedUnits: 'print-produced-units',
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    stockError = null;
    if (hasErrors(errors)) {
      await tick();
      const field = firstInvalidPrintField(errors);
      const id = field ? FIELD_ELEMENT_ID[field] : undefined;
      if (id) document.getElementById(id)?.focus();
      return;
    }
    try {
      onSubmit(values);
    } catch (err) {
      stockError = err instanceof Error ? err.message : 'No se pudo guardar la impresión.';
    }
  }
</script>

<Modal onClose={onCancel} labelledBy="print-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{mode === 'create' ? 'REGISTRAR IMPRESIÓN' : 'EDITAR IMPRESIÓN'}</p>
        <h2 id="print-form-title">{mode === 'create' ? 'Nueva impresión' : values.name || 'Editar impresión'}</h2>
        <p class="field-hint" style="margin-top: 4px;">Registra el trabajo real de fabricación — descuenta stock y acumula uso en Equipos al guardar.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de impresión">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="print-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      {#if stockError}
        <p class="field-error" role="alert" style="margin-bottom: var(--space-3);"><KuboIcon name="warning-triangle" size={14} />{stockError}</p>
      {/if}

      <section class="form-section">
        <h3 class="form-section-title">IDENTIFICACIÓN</h3>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="print-date">Fecha <span class="field-required">*</span></label>
            <input id="print-date" class="text-input" type="date" bind:value={values.date} aria-invalid={showErrors && errors.date ? 'true' : undefined} aria-describedby={showErrors && errors.date ? 'print-date-error' : undefined} />
            {#if showErrors && errors.date}<p class="field-error" id="print-date-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.date}</p>{/if}
          </div>
          <div class="field">
            <label class="field-label" for="print-name">Nombre del trabajo <span class="field-required">*</span></label>
            <input id="print-name" class="text-input" type="text" bind:value={values.name} aria-invalid={showErrors && errors.name ? 'true' : undefined} aria-describedby={showErrors && errors.name ? 'print-name-error' : undefined} />
            {#if showErrors && errors.name}<p class="field-error" id="print-name-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.name}</p>{/if}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="print-purpose">Finalidad <span class="field-required">*</span></label>
            <Combobox
              id="print-purpose"
              value={values.purpose}
              options={PRINT_PURPOSE_OPTIONS}
              onChange={(v: PrintPurpose) => (values.purpose = v)}
              placeholder="Selecciona una finalidad"
              ariaLabel="Finalidad de la impresión"
              invalid={showErrors && Boolean(errors.purpose)}
            />
            {#if showErrors && errors.purpose}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.purpose}</p>{/if}
          </div>
          <div class="field">
            <label class="field-label" for="print-result">Resultado <span class="field-required">*</span></label>
            <Combobox
              id="print-result"
              value={values.result}
              options={PRINT_RESULT_OPTIONS}
              onChange={(v: PrintResult) => (values.result = v)}
              placeholder="Selecciona un resultado"
              ariaLabel="Resultado de la impresión"
              invalid={showErrors && Boolean(errors.result)}
            />
            {#if showErrors && errors.result}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.result}</p>{/if}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="print-order">Pedido relacionado</label>
            <input id="print-order" class="text-input" type="text" bind:value={values.relatedOrderId} placeholder="Opcional — para futuro" />
          </div>
          <div class="field">
            <label class="field-label" for="print-project">Proyecto relacionado</label>
            <input id="print-project" class="text-input" type="text" bind:value={values.relatedProjectId} placeholder="Opcional — para futuro" />
          </div>
        </div>
      </section>

      <section class="form-section">
        <h3 class="form-section-title">EQUIPO</h3>
        <div class="field">
          <label class="field-label" for="print-printer">Impresora <span class="field-required">*</span></label>
          {#if printers.length <= 1}
            <p class="field-hint">{selectedPrinter ? selectedPrinter.internalName : 'Sin impresoras registradas todavía.'}</p>
          {:else}
            <Combobox
              id="print-printer"
              value={values.printerId}
              options={PRINTER_OPTIONS}
              onChange={(v: string) => (values.printerId = v)}
              placeholder="Selecciona una impresora"
              ariaLabel="Impresora usada"
              invalid={showErrors && Boolean(errors.printerId)}
            />
          {/if}
          {#if showErrors && errors.printerId}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.printerId}</p>{/if}
          {#if selectedPrinter}
            <p class="field-hint">
              {selectedPrinter.installedConfiguration.nozzleDiameterMm} mm · {printerOptionLabel(NOZZLE_MATERIAL_OPTIONS, selectedPrinter.installedConfiguration.nozzleMaterial)}
              {#if selectedPrinter.installedConfiguration.buildPlate} · {selectedPrinter.installedConfiguration.buildPlate}{/if}
            </p>
          {/if}
        </div>
      </section>

      <section class="form-section">
        <h3 class="form-section-title">PRODUCCIÓN</h3>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="print-duration">Tiempo real (minutos) <span class="field-required">*</span></label>
            <input
              id="print-duration"
              class="text-input"
              type="text"
              inputmode="numeric"
              value={values.durationMinutes}
              oninput={(e) => (values.durationMinutes = Number((e.target as HTMLInputElement).value) || 0)}
              aria-invalid={showErrors && errors.durationMinutes ? 'true' : undefined}
            />
            {#if showErrors && errors.durationMinutes}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.durationMinutes}</p>{/if}
          </div>
          <div class="field">
            <label class="field-label" for="print-produced-units">Piezas obtenidas <span class="field-required">*</span></label>
            <input
              id="print-produced-units"
              class="text-input"
              type="text"
              inputmode="numeric"
              value={values.producedUnits}
              oninput={(e) => (values.producedUnits = Number((e.target as HTMLInputElement).value) || 0)}
              aria-invalid={showErrors && errors.producedUnits ? 'true' : undefined}
            />
            {#if showErrors && errors.producedUnits}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errors.producedUnits}</p>{/if}
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="print-planned-units">Piezas planificadas</label>
          <input
            id="print-planned-units"
            class="text-input"
            type="text"
            inputmode="numeric"
            value={values.plannedUnits ?? ''}
            placeholder="Opcional"
            oninput={(e) => {
              const raw = (e.target as HTMLInputElement).value;
              values.plannedUnits = raw.trim() === '' ? undefined : Number(raw) || 0;
            }}
          />
        </div>
        {#if values.result === 'failed' || values.result === 'partial'}
          <div class="field">
            <label class="field-label" for="print-issue-note">Incidencia / notas</label>
            <textarea id="print-issue-note" class="textarea-input" bind:value={values.issueNote} placeholder="Qué falló, en qué momento"></textarea>
          </div>
        {/if}
      </section>

      <section class="form-section">
        <div class="panel-header" style="padding: 0 0 var(--space-3);">
          <h3 class="form-section-title" style="margin: 0;">MATERIALES</h3>
          <button type="button" class="secondary-button" onclick={addLine}>
            <KuboIcon name="plus" size={16} />
            Agregar línea
          </button>
        </div>
        {#if showErrors && errors.materials}<p class="field-error" role="alert" style="margin-bottom: var(--space-3);"><KuboIcon name="warning-triangle" size={14} />{errors.materials}</p>{/if}

        {#each values.materials as line, index (index)}
          {@const spoolOptions = line.profileId ? spoolOptionsForProfile(line.profileId, spools) : []}
          {@const compat = compatibilityByLine[index]}
          <div class="print-material-line">
            <div class="print-material-line-header">
              <span class="field-hint">Línea {index + 1}</span>
              {#if values.materials.length > 1}
                <button type="button" class="text-link" onclick={() => removeLine(index)}>Quitar</button>
              {/if}
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label" for={`print-material-profile-${index}`}>Perfil de filamento <span class="field-required">*</span></label>
                <Combobox
                  id={`print-material-profile-${index}`}
                  value={line.profileId}
                  options={PROFILE_OPTIONS}
                  onChange={(v: string) => onProfileChange(index, v)}
                  placeholder="Selecciona un perfil"
                  ariaLabel={`Perfil de material de la línea ${index + 1}`}
                  invalid={showErrors && Boolean(errorForLine(index, 'profileId'))}
                />
                {#if showErrors && errorForLine(index, 'profileId')}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errorForLine(index, 'profileId')}</p>{/if}
              </div>
              <div class="field">
                <label class="field-label" for={`print-material-spool-${index}`}>Bobina física <span class="field-required">*</span></label>
                {#if line.profileId && spoolOptions.length === 0}
                  <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />No hay una bobina con stock disponible para este perfil.</p>
                {:else}
                  <Combobox
                    id={`print-material-spool-${index}`}
                    value={line.spoolId}
                    options={spoolOptions}
                    onChange={(v: string) => onSpoolChange(index, v)}
                    placeholder="Selecciona una bobina"
                    ariaLabel={`Bobina física de la línea ${index + 1}`}
                    disabled={!line.profileId}
                    invalid={showErrors && Boolean(errorForLine(index, 'spoolId'))}
                  />
                  {#if showErrors && errorForLine(index, 'spoolId')}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errorForLine(index, 'spoolId')}</p>{/if}
                {/if}
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label" for={`print-material-consumed-${index}`}>Gramos consumidos <span class="field-required">*</span></label>
                <input
                  id={`print-material-consumed-${index}`}
                  class="text-input"
                  type="text"
                  inputmode="numeric"
                  value={line.consumedG || ''}
                  oninput={(e) => onConsumedChange(index, (e.target as HTMLInputElement).value)}
                  aria-invalid={showErrors && errorForLine(index, 'consumedG') ? 'true' : undefined}
                />
                {#if showErrors && errorForLine(index, 'consumedG')}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errorForLine(index, 'consumedG')}</p>{/if}
              </div>
              <div class="field">
                <label class="field-label" for={`print-material-wasted-${index}`}>Gramos desperdiciados</label>
                <input
                  id={`print-material-wasted-${index}`}
                  class="text-input"
                  type="text"
                  inputmode="numeric"
                  value={line.wastedG ?? ''}
                  placeholder="Opcional"
                  oninput={(e) => onWastedChange(index, (e.target as HTMLInputElement).value)}
                  aria-invalid={showErrors && errorForLine(index, 'wastedG') ? 'true' : undefined}
                />
                {#if showErrors && errorForLine(index, 'wastedG')}<p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{errorForLine(index, 'wastedG')}</p>{/if}
                {#if (values.result === 'failed' || values.result === 'partial') && line.consumedG > 0}
                  <button type="button" class="text-link" onclick={() => markAllAsWaste(index)}>Marcar todo el consumo como desperdicio</button>
                {/if}
              </div>
            </div>
            {#if compat}
              <div class="compatibility-note">
                <span class={`status-chip status-${compat.status}`}>{compat.status === 'compatible' ? 'Compatible' : compat.status === 'attention' ? 'Precaución' : 'No recomendado'}</span>
                <div>
                  <p>{compat.reason}</p>
                  {#if compat.additionalGuidance}<p class="field-hint">{compat.additionalGuidance}</p>{/if}
                  <span class="maintenance-source-tag" class:is-manufacturer={compat.source === 'manufacturer'}>{compat.source === 'manufacturer' ? 'Fuente: Bambu' : 'Fuente: KUBO'}</span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </section>

      {#if preGuidance.length > 0}
        <section class="form-section">
          <h3 class="form-section-title">ANTES DE IMPRIMIR</h3>
          <div class="maintenance-alert-list">
            {#each preGuidance as rule (rule.id)}
              <div class="maintenance-alert-row">
                <div class="maintenance-alert-main">
                  <strong>{rule.title}</strong>
                  <span class={`status-chip status-${rule.severity === 'attention' ? 'attention' : rule.severity === 'review' ? 'review' : 'info'}`}>
                    {rule.severity === 'attention' ? 'Atención' : rule.severity === 'review' ? 'Revisar' : 'Info'}
                  </span>
                </div>
                <p class="field-hint">{rule.message}</p>
                <span class="maintenance-source-tag" class:is-manufacturer={rule.source === 'manufacturer'}>{rule.source === 'manufacturer' ? 'Fuente: Bambu' : 'Fuente: KUBO'}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <section class="form-section">
        <h3 class="form-section-title">NOTAS</h3>
        <div class="field">
          <label class="field-label" for="print-notes">Notas del trabajo</label>
          <textarea id="print-notes" class="textarea-input" bind:value={values.notes} placeholder="Opcional"></textarea>
        </div>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="submit" form="print-form" class="primary-button">{mode === 'create' ? 'Registrar impresión' : 'Guardar cambios'}</button>
    </footer>
  {/snippet}
</Modal>

<style>
  .print-material-line {
    padding: var(--space-4) 0;
    border-top: 1px solid var(--admin-border);
  }
  .print-material-line:first-of-type {
    border-top: none;
    padding-top: 0;
  }
  .print-material-line-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
  }
</style>
