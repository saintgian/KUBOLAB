<script lang="ts">
  /**
   * MaterialProfileForm.svelte
   * Modal de "Crear perfil" / "Editar perfil" (spec §4-§7, §14) — un solo formulario con
   * secciones claras (Información / Uso KUBO / Presentación / Inventario / Perfil técnico
   * opcional), sin wizard. El stock nunca se toca acá directamente (spec §2): al crear, el botón
   * "Guardar y agregar stock" crea el perfil y abre el MISMO AddStockForm.svelte que usan
   * "+ Registrar stock" y "+ Agregar stock" — un solo flujo reutilizable, sin duplicar sus campos
   * en un bloque inline. El SKU interno (`internalCode`) se genera solo (lib/materials/sku.ts vía
   * model.ts) y nunca es un campo editable de este formulario. Todos los campos numéricos viven
   * como texto mientras se editan (mismo criterio que ExpenseForm, evita el salto de cursor de
   * `<input type=number>` controlado) y se convierten recién al validar/enviar.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { FilamentProfile, FilamentProfileFormValues, MaterialUsage, SpoolPresentation, ValidationStatus } from '../../../data/admin/materials.types';
  import { MATERIAL_TYPES, MATERIAL_USAGE_OPTIONS, PRESENTATION_OPTIONS, VALIDATION_STATUS_OPTIONS } from '../../../data/admin/materials.constants';
  import { firstInvalidProfileField, hasErrors, validateProfileForm } from '../../../lib/materials/validate';

  interface Props {
    mode: 'create' | 'edit';
    initial: FilamentProfile | null;
    onSubmit: (values: FilamentProfileFormValues, andAddStock: boolean) => void;
    onCancel: () => void;
  }

  let { mode, initial, onSubmit, onCancel }: Props = $props();

  interface FormState {
    name: string;
    materialType: string;
    manufacturer: string;
    productLine: string;
    colorName: string;
    colorHex: string;
    diameterMm: string;
    manufacturerSku: string;
    usage: MaterialUsage | '';
    validationStatus: ValidationStatus | '';
    nominalSpoolWeightG: string;
    tareWeightG: string;
    presentation: SpoolPresentation | '';
    presentationNotes: string;
    minimumStockG: string;
    defaultLocation: string;
    preferredSupplier: string;
    specNozzleTempRangeC: string;
    specBedTempRangeC: string;
    specDensityGCm3: string;
    specDryingRecommendation: string;
    kuboNozzleTempC: string;
    kuboBedTempC: string;
    kuboFlowRatio: string;
    kuboMaxVolumetricSpeed: string;
    kuboPrinterCompatible: string;
    kuboNozzleCompatible: string;
    kuboBambuPresetName: string;
    kuboLastCalibrationDate: string;
    kuboTestNotes: string;
    notes: string;
  }

  function blankState(): FormState {
    return {
      name: '',
      materialType: '',
      manufacturer: '',
      productLine: '',
      colorName: '',
      colorHex: '',
      diameterMm: '1.75',
      manufacturerSku: '',
      usage: '',
      validationStatus: 'evaluation',
      nominalSpoolWeightG: '1000',
      tareWeightG: '',
      presentation: 'spool',
      presentationNotes: '',
      minimumStockG: '',
      defaultLocation: '',
      preferredSupplier: '',
      specNozzleTempRangeC: '',
      specBedTempRangeC: '',
      specDensityGCm3: '',
      specDryingRecommendation: '',
      kuboNozzleTempC: '',
      kuboBedTempC: '',
      kuboFlowRatio: '',
      kuboMaxVolumetricSpeed: '',
      kuboPrinterCompatible: '',
      kuboNozzleCompatible: '',
      kuboBambuPresetName: '',
      kuboLastCalibrationDate: '',
      kuboTestNotes: '',
      notes: '',
    };
  }

  function stateFromProfile(profile: FilamentProfile): FormState {
    const base = blankState();
    return {
      ...base,
      name: profile.name,
      materialType: profile.materialType,
      manufacturer: profile.manufacturer ?? '',
      productLine: profile.productLine ?? '',
      colorName: profile.colorName,
      colorHex: profile.colorHex ?? '',
      diameterMm: String(profile.diameterMm),
      manufacturerSku: profile.manufacturerSku ?? '',
      usage: profile.usage,
      validationStatus: profile.validationStatus,
      nominalSpoolWeightG: profile.nominalSpoolWeightG !== undefined ? String(profile.nominalSpoolWeightG) : '',
      tareWeightG: profile.tareWeightG !== undefined ? String(profile.tareWeightG) : '',
      presentation: profile.presentation ?? '',
      presentationNotes: profile.presentationNotes ?? '',
      minimumStockG: String(profile.minimumStockG),
      defaultLocation: profile.defaultLocation ?? '',
      preferredSupplier: profile.preferredSupplier ?? '',
      specNozzleTempRangeC: profile.manufacturerSpecs?.nozzleTempRangeC ?? '',
      specBedTempRangeC: profile.manufacturerSpecs?.bedTempRangeC ?? '',
      specDensityGCm3: profile.manufacturerSpecs?.densityGCm3 !== undefined ? String(profile.manufacturerSpecs.densityGCm3) : '',
      specDryingRecommendation: profile.manufacturerSpecs?.dryingRecommendation ?? '',
      kuboNozzleTempC: profile.kuboPrintProfile?.nozzleTempC !== undefined ? String(profile.kuboPrintProfile.nozzleTempC) : '',
      kuboBedTempC: profile.kuboPrintProfile?.bedTempC !== undefined ? String(profile.kuboPrintProfile.bedTempC) : '',
      kuboFlowRatio: profile.kuboPrintProfile?.flowRatio !== undefined ? String(profile.kuboPrintProfile.flowRatio) : '',
      kuboMaxVolumetricSpeed: profile.kuboPrintProfile?.maxVolumetricSpeed !== undefined ? String(profile.kuboPrintProfile.maxVolumetricSpeed) : '',
      kuboPrinterCompatible: profile.kuboPrintProfile?.printerCompatible ?? '',
      kuboNozzleCompatible: profile.kuboPrintProfile?.nozzleCompatible ?? '',
      kuboBambuPresetName: profile.kuboPrintProfile?.bambuStudioPresetName ?? '',
      kuboLastCalibrationDate: profile.kuboPrintProfile?.lastCalibrationDate ?? '',
      kuboTestNotes: profile.kuboPrintProfile?.testNotes ?? '',
      notes: profile.notes ?? '',
    };
  }

  let state = $state<FormState>(initial ? stateFromProfile(initial) : blankState());
  let submitAttempted = $state(false);

  function toProfileValues(s: FormState): FilamentProfileFormValues {
    const hasSpecs = Boolean(s.specNozzleTempRangeC.trim() || s.specBedTempRangeC.trim() || s.specDensityGCm3.trim() || s.specDryingRecommendation.trim());
    const hasKuboProfile = Boolean(
      s.kuboNozzleTempC.trim() ||
        s.kuboBedTempC.trim() ||
        s.kuboFlowRatio.trim() ||
        s.kuboMaxVolumetricSpeed.trim() ||
        s.kuboPrinterCompatible.trim() ||
        s.kuboNozzleCompatible.trim() ||
        s.kuboBambuPresetName.trim() ||
        s.kuboLastCalibrationDate.trim() ||
        s.kuboTestNotes.trim()
    );
    return {
      name: s.name.trim(),
      materialType: s.materialType,
      manufacturer: s.manufacturer.trim() || undefined,
      productLine: s.productLine.trim() || undefined,
      colorName: s.colorName.trim(),
      colorHex: s.colorHex.trim() || undefined,
      diameterMm: s.diameterMm.trim() === '' ? NaN : Number(s.diameterMm),
      manufacturerSku: s.manufacturerSku.trim() || undefined,
      usage: s.usage as MaterialUsage,
      validationStatus: s.validationStatus as ValidationStatus,
      nominalSpoolWeightG: s.nominalSpoolWeightG.trim() === '' ? undefined : Number(s.nominalSpoolWeightG),
      tareWeightG: s.tareWeightG.trim() === '' ? undefined : Number(s.tareWeightG),
      presentation: s.presentation || undefined,
      presentationNotes: s.presentationNotes.trim() || undefined,
      minimumStockG: s.minimumStockG.trim() === '' ? NaN : Number(s.minimumStockG),
      defaultLocation: s.defaultLocation.trim() || undefined,
      preferredSupplier: s.preferredSupplier.trim() || undefined,
      manufacturerSpecs: hasSpecs
        ? {
            nozzleTempRangeC: s.specNozzleTempRangeC.trim() || undefined,
            bedTempRangeC: s.specBedTempRangeC.trim() || undefined,
            densityGCm3: s.specDensityGCm3.trim() === '' ? undefined : Number(s.specDensityGCm3),
            dryingRecommendation: s.specDryingRecommendation.trim() || undefined,
          }
        : undefined,
      kuboPrintProfile: hasKuboProfile
        ? {
            nozzleTempC: s.kuboNozzleTempC.trim() === '' ? undefined : Number(s.kuboNozzleTempC),
            bedTempC: s.kuboBedTempC.trim() === '' ? undefined : Number(s.kuboBedTempC),
            flowRatio: s.kuboFlowRatio.trim() === '' ? undefined : Number(s.kuboFlowRatio),
            maxVolumetricSpeed: s.kuboMaxVolumetricSpeed.trim() === '' ? undefined : Number(s.kuboMaxVolumetricSpeed),
            printerCompatible: s.kuboPrinterCompatible.trim() || undefined,
            nozzleCompatible: s.kuboNozzleCompatible.trim() || undefined,
            bambuStudioPresetName: s.kuboBambuPresetName.trim() || undefined,
            lastCalibrationDate: s.kuboLastCalibrationDate.trim() || undefined,
            testNotes: s.kuboTestNotes.trim() || undefined,
          }
        : undefined,
      notes: s.notes.trim() || undefined,
    };
  }

  let profileValues = $derived(toProfileValues(state));
  let profileErrors = $derived(validateProfileForm(profileValues));
  let showErrors = $derived(submitAttempted);

  /** Qué botón de footer disparó el submit — se fija en el `onclick` de cada botón, sincrónico y
   * anterior al evento `submit` nativo, así que `handleSubmit` siempre lo lee ya actualizado. */
  let pendingAction = $state<'save' | 'save-and-stock'>('save');

  const PROFILE_FIELD_ELEMENT_ID: Record<string, string> = {
    name: 'profile-name',
    materialType: 'profile-material-type',
    colorName: 'profile-color-name',
    diameterMm: 'profile-diameter',
    usage: 'profile-usage-commercial',
    validationStatus: 'profile-validation-evaluation',
    minimumStockG: 'profile-minimum-stock',
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitAttempted = true;
    if (hasErrors(profileErrors)) {
      await tick();
      const firstProfileField = firstInvalidProfileField(profileErrors);
      const id = firstProfileField ? PROFILE_FIELD_ELEMENT_ID[firstProfileField] : undefined;
      if (id) document.getElementById(id)?.focus();
      return;
    }
    onSubmit(profileValues, mode === 'create' && pendingAction === 'save-and-stock');
  }

  const titleText = mode === 'create' ? 'Crear perfil' : 'Editar perfil';
</script>

<Modal onClose={onCancel} labelledBy="profile-form-title" size="form" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{mode === 'create' ? 'CREAR PERFIL' : 'EDITAR PERFIL'}</p>
        <h2 id="profile-form-title">{titleText}</h2>
        <p class="field-hint" style="margin-top: 4px;">Perfil de filamento: qué material es y cómo lo usa KUBO.</p>
        {#if mode === 'edit' && initial?.internalCode}
          <p class="field-hint" style="margin-top: 4px;">SKU interno: <span class="mono-strong">{initial.internalCode}</span></p>
        {/if}
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar formulario de perfil">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <form id="profile-form" class="modal-body expense-form-body" onsubmit={handleSubmit} novalidate>
      <!-- 1. Información -->
      <section class="form-section">
        <h3 class="form-section-title">INFORMACIÓN</h3>

        <div class="field">
          <label class="field-label" for="profile-name">Nombre interno <span class="field-required">*</span></label>
          <input
            id="profile-name"
            class="text-input"
            type="text"
            bind:value={state.name}
            placeholder="Ej. PLA+ Negro mate"
            aria-invalid={showErrors && profileErrors.name ? 'true' : undefined}
            aria-describedby={showErrors && profileErrors.name ? 'profile-name-error' : undefined}
          />
          {#if showErrors && profileErrors.name}
            <p class="field-error" id="profile-name-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.name}</p>
          {/if}
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="profile-material-type">Tipo de material <span class="field-required">*</span></label>
            <Combobox
              id="profile-material-type"
              value={state.materialType}
              options={MATERIAL_TYPES}
              onChange={(v) => (state.materialType = v)}
              placeholder="Selecciona un tipo"
              ariaLabel="Tipo de material"
              invalid={showErrors && Boolean(profileErrors.materialType)}
              describedBy={showErrors && profileErrors.materialType ? 'profile-material-type-error' : undefined}
            />
            {#if showErrors && profileErrors.materialType}
              <p class="field-error" id="profile-material-type-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.materialType}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="profile-diameter">Diámetro (mm) <span class="field-required">*</span></label>
            <input
              id="profile-diameter"
              class="text-input"
              type="text"
              inputmode="decimal"
              bind:value={state.diameterMm}
              placeholder="1.75"
              aria-invalid={showErrors && profileErrors.diameterMm ? 'true' : undefined}
              aria-describedby={showErrors && profileErrors.diameterMm ? 'profile-diameter-error' : undefined}
            />
            {#if showErrors && profileErrors.diameterMm}
              <p class="field-error" id="profile-diameter-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.diameterMm}</p>
            {/if}
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="profile-manufacturer">Fabricante / marca</label>
            <input id="profile-manufacturer" class="text-input" type="text" bind:value={state.manufacturer} placeholder="Ej. Bambu Lab" />
          </div>
          <div class="field">
            <label class="field-label" for="profile-product-line">Línea / familia</label>
            <input id="profile-product-line" class="text-input" type="text" bind:value={state.productLine} placeholder="Ej. Basic" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="profile-color-name">Nombre del color <span class="field-required">*</span></label>
            <input
              id="profile-color-name"
              class="text-input"
              type="text"
              bind:value={state.colorName}
              placeholder="Ej. Negro"
              aria-invalid={showErrors && profileErrors.colorName ? 'true' : undefined}
              aria-describedby={showErrors && profileErrors.colorName ? 'profile-color-name-error' : undefined}
            />
            {#if showErrors && profileErrors.colorName}
              <p class="field-error" id="profile-color-name-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.colorName}</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="profile-color-hex">Color (referencia visual)</label>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="material-swatch" class:is-empty={!state.colorHex} style={state.colorHex ? `background:${state.colorHex};` : ''} aria-hidden="true"></span>
              <input id="profile-color-hex" class="text-input" type="text" bind:value={state.colorHex} placeholder="#1A1A1A" />
            </div>
            <p class="field-hint">Referencia de inventario — no representa exactamente el resultado impreso.</p>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="profile-manufacturer-sku">SKU fabricante</label>
          <input id="profile-manufacturer-sku" class="text-input" type="text" bind:value={state.manufacturerSku} placeholder="Opcional" />
        </div>
        {#if mode === 'create'}
          <p class="field-hint" style="margin-top: var(--space-3);">El SKU interno de KUBO se genera automáticamente al crear el perfil.</p>
        {/if}
      </section>

      <!-- 2. Uso KUBO -->
      <section class="form-section">
        <h3 class="form-section-title">USO KUBO</h3>

        <div class="field">
          <span class="field-label" id="profile-usage-label">Uso permitido <span class="field-required">*</span></span>
          <div class="radio-group" role="radiogroup" aria-labelledby="profile-usage-label">
            {#each MATERIAL_USAGE_OPTIONS as option (option.value)}
              <label class="radio-field" for={`profile-usage-${option.value}`}>
                <input id={`profile-usage-${option.value}`} class="radio-native" type="radio" name="profile-usage" checked={state.usage === option.value} onchange={() => (state.usage = option.value)} />
                {option.label}
              </label>
            {/each}
          </div>
          {#if showErrors && profileErrors.usage}
            <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.usage}</p>
          {/if}
        </div>

        <div class="field">
          <span class="field-label" id="profile-validation-label">Estado de validación <span class="field-required">*</span></span>
          <div class="radio-group" role="radiogroup" aria-labelledby="profile-validation-label">
            {#each VALIDATION_STATUS_OPTIONS as option (option.value)}
              <label class="radio-field" for={`profile-validation-${option.value}`}>
                <input
                  id={`profile-validation-${option.value}`}
                  class="radio-native"
                  type="radio"
                  name="profile-validation"
                  checked={state.validationStatus === option.value}
                  onchange={() => (state.validationStatus = option.value)}
                />
                {option.label}
              </label>
            {/each}
          </div>
          {#if showErrors && profileErrors.validationStatus}
            <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.validationStatus}</p>
          {/if}
        </div>
      </section>

      <!-- 3. Presentación -->
      <section class="form-section">
        <h3 class="form-section-title">PRESENTACIÓN / BOBINA</h3>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="profile-nominal-weight">Peso neto nominal (g)</label>
            <input id="profile-nominal-weight" class="text-input" type="text" inputmode="numeric" bind:value={state.nominalSpoolWeightG} placeholder="1000" />
          </div>
          <div class="field">
            <label class="field-label" for="profile-tare-weight">Tara de bobina (g)</label>
            <input id="profile-tare-weight" class="text-input" type="text" inputmode="numeric" bind:value={state.tareWeightG} placeholder="Ej. 245" />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="profile-presentation">Presentación</label>
          <Combobox id="profile-presentation" value={state.presentation} options={PRESENTATION_OPTIONS} onChange={(v) => (state.presentation = v)} placeholder="Selecciona una presentación" ariaLabel="Presentación" />
        </div>

        <div class="field">
          <label class="field-label" for="profile-presentation-notes">Notas de presentación</label>
          <textarea id="profile-presentation-notes" class="textarea-input" bind:value={state.presentationNotes} placeholder="Opcional"></textarea>
        </div>
      </section>

      <!-- 4. Inventario -->
      <section class="form-section">
        <h3 class="form-section-title">CONTROL DE INVENTARIO</h3>

        <div class="field">
          <label class="field-label" for="profile-minimum-stock">Stock mínimo (g) <span class="field-required">*</span></label>
          <input
            id="profile-minimum-stock"
            class="text-input"
            type="text"
            inputmode="numeric"
            bind:value={state.minimumStockG}
            placeholder="Ej. 1000"
            aria-invalid={showErrors && profileErrors.minimumStockG ? 'true' : undefined}
            aria-describedby={showErrors && profileErrors.minimumStockG ? 'profile-minimum-stock-error' : undefined}
          />
          {#if showErrors && profileErrors.minimumStockG}
            <p class="field-error" id="profile-minimum-stock-error" role="alert"><KuboIcon name="warning-triangle" size={14} />{profileErrors.minimumStockG}</p>
          {/if}
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="profile-location">Ubicación habitual</label>
            <input id="profile-location" class="text-input" type="text" bind:value={state.defaultLocation} placeholder="Ej. Estante A · Dry box 01" />
          </div>
          <div class="field">
            <label class="field-label" for="profile-supplier">Proveedor preferido</label>
            <input id="profile-supplier" class="text-input" type="text" bind:value={state.preferredSupplier} placeholder="Ej. 3D Market Perú" />
          </div>
        </div>
      </section>

      <!-- 5. Perfil técnico opcional -->
      <section class="form-section">
        <h3 class="form-section-title">PERFIL TÉCNICO (OPCIONAL)</h3>
        <p class="field-hint">Solo completa lo que venga de ficha del fabricante o de una prueba real de KUBO — nunca inventes un valor.</p>

        <div class="print-profile-columns" style="margin-top: var(--space-4);">
          <div>
            <p class="filters-panel-title" style="margin-bottom: var(--space-3);">ESPECIFICACIÓN DEL FABRICANTE</p>
            <div class="field-row">
              <div class="field">
                <label class="field-label" for="profile-spec-nozzle">Rango temp. nozzle (°C)</label>
                <input id="profile-spec-nozzle" class="text-input" type="text" bind:value={state.specNozzleTempRangeC} placeholder="Ej. 200-220" />
              </div>
              <div class="field">
                <label class="field-label" for="profile-spec-bed">Rango temp. cama (°C)</label>
                <input id="profile-spec-bed" class="text-input" type="text" bind:value={state.specBedTempRangeC} placeholder="Ej. 55-65" />
              </div>
            </div>
            <div class="field" style="margin-top: var(--space-5);">
              <label class="field-label" for="profile-spec-density">Densidad (g/cm³)</label>
              <input id="profile-spec-density" class="text-input" type="text" inputmode="decimal" bind:value={state.specDensityGCm3} placeholder="Según ficha" />
            </div>
            <div class="field" style="margin-top: var(--space-5);">
              <label class="field-label" for="profile-spec-drying">Secado recomendado</label>
              <input id="profile-spec-drying" class="text-input" type="text" bind:value={state.specDryingRecommendation} placeholder="Según ficha" />
            </div>
          </div>

          <div>
            <p class="filters-panel-title" style="margin-bottom: var(--space-3);">PERFIL VALIDADO KUBO</p>
            <div class="field-row">
              <div class="field">
                <label class="field-label" for="profile-kubo-nozzle">Temp. nozzle (°C)</label>
                <input id="profile-kubo-nozzle" class="text-input" type="text" inputmode="numeric" bind:value={state.kuboNozzleTempC} placeholder="Probado en KUBO" />
              </div>
              <div class="field">
                <label class="field-label" for="profile-kubo-bed">Temp. cama (°C)</label>
                <input id="profile-kubo-bed" class="text-input" type="text" inputmode="numeric" bind:value={state.kuboBedTempC} placeholder="Probado en KUBO" />
              </div>
            </div>
            <div class="field-row" style="margin-top: var(--space-5);">
              <div class="field">
                <label class="field-label" for="profile-kubo-flow">Flow ratio</label>
                <input id="profile-kubo-flow" class="text-input" type="text" inputmode="decimal" bind:value={state.kuboFlowRatio} placeholder="Probado en KUBO" />
              </div>
              <div class="field">
                <label class="field-label" for="profile-kubo-speed">Max. volumetric speed (mm³/s)</label>
                <input id="profile-kubo-speed" class="text-input" type="text" inputmode="decimal" bind:value={state.kuboMaxVolumetricSpeed} placeholder="Probado en KUBO" />
              </div>
            </div>
            <div class="field-row" style="margin-top: var(--space-5);">
              <div class="field">
                <label class="field-label" for="profile-kubo-printer">Impresora compatible</label>
                <input id="profile-kubo-printer" class="text-input" type="text" bind:value={state.kuboPrinterCompatible} placeholder="Ej. Bambu Lab X1C" />
              </div>
              <div class="field">
                <label class="field-label" for="profile-kubo-nozzle-compat">Nozzle compatible</label>
                <input id="profile-kubo-nozzle-compat" class="text-input" type="text" bind:value={state.kuboNozzleCompatible} placeholder="Ej. 0.4 mm" />
              </div>
            </div>
            <div class="field" style="margin-top: var(--space-5);">
              <label class="field-label" for="profile-kubo-preset">Preset en Bambu Studio</label>
              <input id="profile-kubo-preset" class="text-input" type="text" bind:value={state.kuboBambuPresetName} placeholder="Nombre del preset" />
            </div>
            <div class="field" style="margin-top: var(--space-5);">
              <label class="field-label" for="profile-kubo-calibration">Última calibración</label>
              <input id="profile-kubo-calibration" class="text-input" type="date" bind:value={state.kuboLastCalibrationDate} />
            </div>
            <div class="field" style="margin-top: var(--space-5);">
              <label class="field-label" for="profile-kubo-test-notes">Notas de prueba</label>
              <textarea id="profile-kubo-test-notes" class="textarea-input" bind:value={state.kuboTestNotes} placeholder="Opcional"></textarea>
            </div>
          </div>
        </div>
      </section>

      <!-- Notas -->
      <section class="form-section">
        <h3 class="form-section-title">NOTAS</h3>
        <div class="field">
          <label class="field-label" for="profile-notes">Notas del perfil</label>
          <textarea id="profile-notes" class="textarea-input" bind:value={state.notes} placeholder="Opcional"></textarea>
        </div>
      </section>
    </form>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      {#if mode === 'create'}
        <button type="submit" form="profile-form" class="secondary-button" onclick={() => (pendingAction = 'save-and-stock')}>Guardar y agregar stock</button>
      {/if}
      <button type="submit" form="profile-form" class="primary-button" onclick={() => (pendingAction = 'save')}>
        {mode === 'edit' ? 'Guardar cambios' : 'Crear perfil'}
      </button>
    </footer>
  {/snippet}
</Modal>
