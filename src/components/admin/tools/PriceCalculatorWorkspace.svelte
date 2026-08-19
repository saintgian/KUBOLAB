<script lang="ts">
  /**
   * PriceCalculatorWorkspace.svelte
   * Herramientas → Calculadora de precios (docs/specs/admin-price-calculator-spec.md). Calculadora
   * frontend independiente: todo el estado vive en memoria de este componente (sin backend, sin
   * store global — mismo patrón que MaterialsWorkspace/ExpensesWorkspace). La única integración
   * real es de solo lectura hacia perfiles de Producción → Materiales (para leer nombre/tipo/SKU/
   * costo de referencia) — nunca descuenta stock, nunca escribe en Materiales/Finanzas/Pedidos.
   *
   * El uso normal solo pide finalidad, cantidad, impresora, tiempo, material y gramos: el resto de
   * costos (electricidad, máquina, hora-hombre, packaging, merma, fallos, comisiones, indirectos,
   * redondeo) llega precargado con los "Supuestos KUBO" (KUBO_DEFAULTS) y vive plegado bajo
   * "Supuestos y costos avanzados" — siempre editable ahí, nunca oculto para siempre.
   *
   * Recalcula en tiempo real: `result` es un `$derived` de `calc`, sin botón "Calcular" (spec §28).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import PriceCalculatorMaterialRow from './PriceCalculatorMaterialRow.svelte';
  import PriceCalculatorBreakdown from './PriceCalculatorBreakdown.svelte';
  import PriceCalculatorHistory from './PriceCalculatorHistory.svelte';
  import { DEMO_PROFILES, DEMO_SPOOLS } from '../../../data/admin/materials.mock';
  import {
    COST_SCOPE_OPTIONS,
    ELECTRICITY_MODE_OPTIONS,
    INDIRECT_MODE_OPTIONS,
    KUBO_MACHINE_HOURLY_RATE,
    PURPOSE_OPTIONS,
    ROUNDING_OPTIONS,
    SLICER_SCOPE_OPTIONS,
    purposeShowsCommercialByDefault,
  } from '../../../data/admin/price-calculator.constants';
  import type { AdditionalCostRow, CalculationMaterial, CostScope, ElectricityMode, PricingCalculation, PricingSnapshot, RoundingMode, SlicerScope } from '../../../data/admin/price-calculator.types';
  import { calculatePricing } from '../../../lib/pricing/engine';
  import { formatCurrency, formatPercent, nowIso } from '../../../lib/pricing/format';
  import { parseNumberInput } from '../../../lib/pricing/input';
  import { applyKuboDefaults, blankAdditionalRow, blankCalculation, blankMaterialRow, defaultBatches } from '../../../lib/pricing/model';
  import { referenceCostPerKgForProfile } from '../../../lib/materials/reference-cost';
  import { buildMaterialLabels, buildSnapshot, cloneCalculation } from '../../../lib/pricing/snapshot';
  import { buildSaleSummaryText, buildSummaryText, hasValidSaleSummary } from '../../../lib/pricing/summary';
  import { loadHistorySnapshots, persistHistorySnapshots } from '../../../lib/pricing/storage';

  const profiles = DEMO_PROFILES;
  const spools = DEMO_SPOOLS;

  type Tab = 'calculator' | 'history';
  let activeTab = $state<Tab>('calculator');

  let calc = $state<PricingCalculation>(blankCalculation());
  /** Fecha/hora de inicio de la consulta actual — fuente de "Fecha de consulta" en Copiar resumen y
   * de `createdAt` al Guardar cálculo (spec §36). Se renueva en Restablecer/Abrir/Duplicar porque
   * cada una de esas acciones arranca una consulta distinta. */
  let calcStartedAt = $state(nowIso());
  let batchesTouched = $state(false);
  let copyFeedback = $state<string | null>(null);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let kuboResetFeedback = $state<string | null>(null);
  let kuboResetFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let saveFeedback = $state<string | null>(null);
  let saveFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  let history = $state<PricingSnapshot[]>(loadHistorySnapshots());

  let result = $derived(calculatePricing(calc));
  let showCommercial = $derived(purposeShowsCommercialByDefault(calc.purpose) || calc.simulateSalePrice);
  let canCopyForSale = $derived(hasValidSaleSummary({ name: calc.name, calc, price: result.price, isComplete: result.isComplete, showCommercial }));

  let approvedProfiles = $derived(profiles.filter((profile) => profile.validationStatus === 'approved' && (profile.usage === 'commercial' || profile.usage === 'both')));
  let visibleProfiles = $derived(
    (calc.purpose === 'sale' || calc.purpose === 'custom') && calc.approvedForCommercialOnly ? approvedProfiles : profiles
  );

  $effect(() => {
    if (calc.slicerScope === 'batch' && !batchesTouched) {
      const suggested = defaultBatches(calc.quantity, calc.unitsPerBatch);
      if (suggested !== calc.batches) calc.batches = suggested;
    }
  });

  /** "Restablecer cálculo" — limpia los datos específicos del trabajo actual (identificación,
   * cantidad, materiales, tiempos) y vuelve a cargar los defaults vigentes (`blankCalculation` ya
   * los toma de KUBO_DEFAULTS, nunca los deja vacíos). Nunca toca `history` — el historial y los
   * Supuestos KUBO son independientes de este botón (spec §36). */
  function resetAll() {
    calc = blankCalculation();
    batchesTouched = false;
    calcStartedAt = nowIso();
  }

  function resetKuboDefaults() {
    calc = applyKuboDefaults(calc);
    kuboResetFeedback = 'Supuestos KUBO restablecidos.';
    clearTimeout(kuboResetFeedbackTimer);
    kuboResetFeedbackTimer = setTimeout(() => {
      kuboResetFeedback = null;
    }, 3200);
  }

  function setPurpose(value: PricingCalculation['purpose']) {
    calc.purpose = value;
  }

  function setSlicerScope(value: SlicerScope) {
    calc.slicerScope = value;
    if (value === 'unit') {
      calc.unitsPerBatch = null;
      calc.batches = null;
      batchesTouched = false;
    }
  }

  function updateMaterial(id: string, patch: Partial<CalculationMaterial>) {
    calc.materials = calc.materials.map((material) => {
      if (material.id !== id) return material;
      const merged = { ...material, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, 'profileId')) {
        merged.referenceCostPerKg = merged.profileId ? referenceCostPerKgForProfile(merged.profileId, spools) : null;
        merged.useOverride = false;
        merged.costOverridePerKg = null;
      }
      return merged;
    });
  }

  function addMaterial() {
    calc.materials = [...calc.materials, blankMaterialRow()];
  }

  function removeMaterial(id: string) {
    calc.materials = calc.materials.filter((material) => material.id !== id);
  }

  function updateAdditional(id: string, patch: Partial<AdditionalCostRow>) {
    calc.additionalRows = calc.additionalRows.map((row) => (row.id === id ? { ...row, ...patch } : row));
  }

  function addAdditional() {
    calc.additionalRows = [...calc.additionalRows, blankAdditionalRow()];
  }

  function removeAdditional(id: string) {
    calc.additionalRows = calc.additionalRows.filter((row) => row.id !== id);
  }

  async function copySummary() {
    const materialLabels = buildMaterialLabels(calc, profiles);
    const text = buildSummaryText({
      name: calc.name.trim() || 'Cálculo de precio KUBO',
      calc,
      materialLabels,
      cost: result.cost,
      price: result.price,
      isComplete: result.isComplete,
      missing: result.missing,
      showCommercial,
      totalPrintHours: result.totalPrintHours,
      consultDate: calcStartedAt,
    });
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback = 'Resumen copiado.';
    } catch {
      copyFeedback = 'No se pudo copiar el resumen.';
    }
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => {
      copyFeedback = null;
    }, 3200);
  }

  async function copyForSale() {
    const text = buildSaleSummaryText({
      name: calc.name.trim() || 'Cálculo de precio KUBO',
      calc,
      price: result.price,
      isComplete: result.isComplete,
      showCommercial,
    });
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback = 'Resumen de venta copiado';
    } catch {
      copyFeedback = 'No se pudo copiar el resumen de venta.';
    }
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => {
      copyFeedback = null;
    }, 3200);
  }

  /** "Guardar cálculo" — único punto que crea un snapshot de Historial (spec §36). Nunca se llama
   * desde un `$effect`/reactividad de inputs: solo desde este botón. */
  function saveCalculation() {
    const snapshot = buildSnapshot({
      calc,
      profiles,
      createdAt: calcStartedAt,
      showCommercial,
      result,
    });
    history = [snapshot, ...history];
    persistHistorySnapshots(history);
    saveFeedback = `Cálculo guardado: ${snapshot.name}.`;
    clearTimeout(saveFeedbackTimer);
    saveFeedbackTimer = setTimeout(() => {
      saveFeedback = null;
    }, 3200);
  }

  /** "Abrir" — carga una copia editable del snapshot en el formulario. Nunca muta `snapshot` (viene
   * de `cloneCalculation`), así que el registro histórico queda intacto (spec §36). */
  function openSnapshot(snapshot: PricingSnapshot) {
    calc = cloneCalculation(snapshot.calculation);
    batchesTouched = true;
    calcStartedAt = nowIso();
    activeTab = 'calculator';
  }

  /** "Duplicar" — igual que Abrir, pero deja explícito que es un cálculo nuevo derivado del
   * snapshot (nombre marcado como copia) en vez de continuar exactamente ese mismo trabajo. */
  function duplicateSnapshot(snapshot: PricingSnapshot) {
    calc = cloneCalculation(snapshot.calculation);
    calc.name = snapshot.calculation.name.trim() ? `${snapshot.calculation.name.trim()} (copia)` : '';
    batchesTouched = true;
    calcStartedAt = nowIso();
    activeTab = 'calculator';
  }

  function deleteSnapshot(id: string) {
    history = history.filter((snapshot) => snapshot.id !== id);
    persistHistorySnapshots(history);
  }

  function deleteAllHistory() {
    history = [];
    persistHistorySnapshots(history);
  }
</script>

<div class="calc-page-heading page-heading reveal" style="--delay: 0ms">
  <div>
    <div class="eyebrow-line">
      <span class="page-index">HERRAMIENTAS</span>
    </div>
    <h1>Calculadora de precios</h1>
    <p>Costea una pieza o una tanda de impresión 3D y define el precio de venta.</p>
  </div>
  {#if activeTab === 'calculator'}
    <div class="material-detail-actions">
      <button type="button" class="secondary-button" onclick={copySummary}>
        <KuboIcon name="page" size={16} />
        Copiar resumen
      </button>
      <button type="button" class="secondary-button" onclick={copyForSale} disabled={!canCopyForSale}>
        <KuboIcon name="cart" size={16} />
        Copiar para venta
      </button>
      <button type="button" class="secondary-button" onclick={saveCalculation}>
        <KuboIcon name="check" size={16} />
        Guardar cálculo
      </button>
      <button type="button" class="secondary-button" onclick={resetAll}>
        <KuboIcon name="refresh-double" size={16} />
        Restablecer cálculo
      </button>
    </div>
  {/if}
</div>

<div class="expenses-tabs" role="tablist" aria-label="Vistas de la Calculadora">
  <button
    type="button"
    role="tab"
    id="calc-tab-calculator"
    aria-selected={activeTab === 'calculator'}
    aria-controls="calc-tabpanel-calculator"
    tabindex={activeTab === 'calculator' ? 0 : -1}
    class="expenses-tab"
    class:is-active={activeTab === 'calculator'}
    onclick={() => (activeTab = 'calculator')}
  >
    Calculadora
  </button>
  <button
    type="button"
    role="tab"
    id="calc-tab-history"
    aria-selected={activeTab === 'history'}
    aria-controls="calc-tabpanel-history"
    tabindex={activeTab === 'history' ? 0 : -1}
    class="expenses-tab"
    class:is-active={activeTab === 'history'}
    onclick={() => (activeTab = 'history')}
  >
    Historial <span class="expenses-tab-count">{history.length}</span>
  </button>
</div>

{#if activeTab === 'calculator'}
{#if copyFeedback}
  <p class="field-hint" role="status" aria-live="polite">{copyFeedback}</p>
{/if}
{#if saveFeedback}
  <p class="field-hint" role="status" aria-live="polite">{saveFeedback}</p>
{/if}

<div id="calc-tabpanel-calculator" role="tabpanel" aria-labelledby="calc-tab-calculator" class="calc-grid">
  <div class="calc-config">
    <!-- Identificación -->
    <section class="panel reveal" style="--delay: 20ms" aria-labelledby="calc-identity-title">
      <div class="panel-header">
        <div><h2 id="calc-identity-title">Identificación</h2></div>
      </div>
      <div class="calc-section-body">
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-name">Nombre</label>
            <input id="calc-name" class="text-input" type="text" bind:value={calc.name} placeholder="Ej. Organizador M1" />
          </div>
          <div class="field">
            <label class="field-label" for="calc-notes">Notas</label>
            <input id="calc-notes" class="text-input" type="text" bind:value={calc.notes} placeholder="Ej. Versión con insertos M3" />
          </div>
        </div>
      </div>
    </section>

    <!-- Finalidad -->
    <section class="panel reveal" style="--delay: 40ms" aria-labelledby="calc-purpose-title">
      <div class="panel-header">
        <div><h2 id="calc-purpose-title">Finalidad</h2></div>
      </div>
      <div class="calc-section-body">
        <div class="field">
          <span class="field-label" id="calc-purpose-label">Finalidad del trabajo <span class="field-required">*</span></span>
          <div class="radio-group" role="radiogroup" aria-labelledby="calc-purpose-label">
            {#each PURPOSE_OPTIONS as option (option.value)}
              <label class="radio-field" for={`calc-purpose-${option.value}`}>
                <input id={`calc-purpose-${option.value}`} class="radio-native" type="radio" name="calc-purpose" checked={calc.purpose === option.value} onchange={() => setPurpose(option.value)} />
                {option.label}
              </label>
            {/each}
          </div>
        </div>
        {#if !purposeShowsCommercialByDefault(calc.purpose)}
          <label class="checkbox-field" for="calc-simulate-sale">
            <input id="calc-simulate-sale" class="checkbox-native" type="checkbox" bind:checked={calc.simulateSalePrice} />
            <span class="checkbox-field-copy">
              <strong>Simular precio de venta</strong>
              <span>Muestra margen, comisión, IGV y precio final aunque esta pieza no sea para vender.</span>
            </span>
          </label>
        {/if}
      </div>
    </section>

    <!-- Cantidad, impresora y alcance del slicer -->
    <section class="panel reveal" style="--delay: 60ms" aria-labelledby="calc-scope-title">
      <div class="panel-header">
        <div><h2 id="calc-scope-title">Cantidad, impresora y alcance del slicer</h2></div>
      </div>
      <div class="calc-section-body">
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-quantity">Cantidad final <span class="field-required">*</span></label>
            <input
              id="calc-quantity"
              class="text-input"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              value={calc.quantity ?? ''}
              oninput={(e) => (calc.quantity = parseNumberInput(e.currentTarget.value))}
              aria-invalid={calc.quantity === null || calc.quantity <= 0 ? 'true' : undefined}
            />
            {#if calc.quantity === null || calc.quantity <= 0}
              <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />La cantidad final debe ser mayor a 0.</p>
            {/if}
          </div>
          <div class="field">
            <label class="field-label" for="calc-printer">Impresora</label>
            <input id="calc-printer" class="text-input" type="text" bind:value={calc.printerName} placeholder="Ej. Bambu Lab A1" />
            <p class="field-hint">Supuesto KUBO editable — más adelante podrá venir de perfiles de Equipos.</p>
          </div>
        </div>

        <div class="field">
          <span class="field-label" id="calc-slicer-scope-label">Los datos del slicer corresponden a <span class="field-required">*</span></span>
          <div class="radio-group" role="radiogroup" aria-labelledby="calc-slicer-scope-label">
            {#each SLICER_SCOPE_OPTIONS as option (option.value)}
              <label class="radio-field" for={`calc-slicer-scope-${option.value}`}>
                <input
                  id={`calc-slicer-scope-${option.value}`}
                  class="radio-native"
                  type="radio"
                  name="calc-slicer-scope"
                  checked={calc.slicerScope === option.value}
                  onchange={() => setSlicerScope(option.value)}
                />
                {option.label}
              </label>
            {/each}
          </div>
        </div>

        {#if calc.slicerScope === 'batch'}
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="calc-units-per-batch">Unidades producidas por tanda <span class="field-required">*</span></label>
              <input
                id="calc-units-per-batch"
                class="text-input"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                value={calc.unitsPerBatch ?? ''}
                oninput={(e) => (calc.unitsPerBatch = parseNumberInput(e.currentTarget.value))}
              />
            </div>
            <div class="field">
              <label class="field-label" for="calc-batches">Tandas necesarias <span class="field-required">*</span></label>
              <input
                id="calc-batches"
                class="text-input"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                value={calc.batches ?? ''}
                oninput={(e) => {
                  batchesTouched = true;
                  calc.batches = parseNumberInput(e.currentTarget.value);
                }}
              />
              <p class="field-hint">Sugerido automáticamente; edítalo si necesitas corregir la estimación.</p>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- Tiempo de impresión -->
    <section class="panel reveal" style="--delay: 80ms" aria-labelledby="calc-time-title">
      <div class="panel-header">
        <div><h2 id="calc-time-title">Tiempo de impresión</h2></div>
      </div>
      <div class="calc-section-body">
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-print-hours">Horas <span class="field-required">*</span></label>
            <input
              id="calc-print-hours"
              class="text-input"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              value={calc.printHours ?? ''}
              oninput={(e) => (calc.printHours = parseNumberInput(e.currentTarget.value))}
            />
          </div>
          <div class="field">
            <label class="field-label" for="calc-print-minutes">Minutos <span class="field-required">*</span></label>
            <input
              id="calc-print-minutes"
              class="text-input"
              type="number"
              inputmode="numeric"
              min="0"
              max="59"
              step="1"
              value={calc.printMinutes ?? ''}
              oninput={(e) => (calc.printMinutes = parseNumberInput(e.currentTarget.value))}
            />
          </div>
        </div>
        <p class="field-hint">Tiempo reportado por el slicer para {calc.slicerScope === 'unit' ? 'una unidad' : 'una tanda completa'}.</p>
      </div>
    </section>

    <!-- Materiales -->
    <section class="panel reveal" style="--delay: 100ms" aria-labelledby="calc-materials-title">
      <div class="panel-header">
        <div><h2 id="calc-materials-title">Materiales</h2></div>
      </div>
      <div class="calc-section-body">
        {#if calc.purpose === 'sale' || calc.purpose === 'custom'}
          <label class="checkbox-field" for="calc-approved-only">
            <input id="calc-approved-only" class="checkbox-native" type="checkbox" bind:checked={calc.approvedForCommercialOnly} />
            <span class="checkbox-field-copy">
              <strong>Solo materiales aprobados para comercial</strong>
              <span>Filtra el perfil a materiales con validación aprobada y uso comercial.</span>
            </span>
          </label>
        {/if}

        {#each calc.materials as material, index (material.id)}
          <PriceCalculatorMaterialRow
            {material}
            {index}
            profiles={visibleProfiles}
            onChange={(patch) => updateMaterial(material.id, patch)}
            onRemove={() => removeMaterial(material.id)}
            canRemove={calc.materials.length > 1}
            showErrors={true}
          />
        {/each}

        <button type="button" class="calc-add-row-button" onclick={addMaterial}>
          <KuboIcon name="plus" size={16} />
          Añadir material
        </button>
      </div>
    </section>

    <!-- Trabajo manual -->
    <section class="panel reveal" style="--delay: 120ms" aria-labelledby="calc-labor-title">
      <div class="panel-header">
        <div><h2 id="calc-labor-title">Trabajo manual</h2></div>
      </div>
      <div class="calc-section-body">
        <p class="field-hint">Diseño/preparación y acabado/ensamblaje comparten la misma hora-hombre ({formatCurrency(calc.laborHourlyRate)}/h, editable en Supuestos y costos avanzados).</p>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-design-minutes">Diseño / preparación (min)</label>
            <input
              id="calc-design-minutes"
              class="text-input"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              value={calc.designMinutes}
              oninput={(e) => (calc.designMinutes = parseNumberInput(e.currentTarget.value) ?? 0)}
            />
            <p class="field-hint">Aplica una vez por proyecto/tanda.</p>
          </div>
          <div class="field">
            <label class="field-label" for="calc-finishing-minutes">Acabado / ensamblaje (min)</label>
            <input
              id="calc-finishing-minutes"
              class="text-input"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              value={calc.finishingMinutes}
              oninput={(e) => (calc.finishingMinutes = parseNumberInput(e.currentTarget.value) ?? 0)}
            />
            <p class="field-hint">Se multiplica por la cantidad final (por unidad).</p>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-packaging-amount">Packaging</label>
            <div class="money-input-wrap">
              <span class="money-prefix" aria-hidden="true">S/</span>
              <input
                id="calc-packaging-amount"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.packagingAmount}
                oninput={(e) => (calc.packagingAmount = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
            <p class="field-hint">Siempre un costo monetario — el packaging nunca se cobra como tiempo.</p>
          </div>
          <div class="field">
            <span class="field-label" id="calc-packaging-scope-label">Aplicación</span>
            <div class="radio-group" role="radiogroup" aria-labelledby="calc-packaging-scope-label">
              {#each COST_SCOPE_OPTIONS as option (option.value)}
                <label class="radio-field" for={`calc-packaging-scope-${option.value}`}>
                  <input
                    id={`calc-packaging-scope-${option.value}`}
                    class="radio-native"
                    type="radio"
                    name="calc-packaging-scope"
                    checked={calc.packagingScope === option.value}
                    onchange={() => (calc.packagingScope = option.value as CostScope)}
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Costos adicionales -->
    <section class="panel reveal" style="--delay: 140ms" aria-labelledby="calc-additional-title">
      <div class="panel-header">
        <div><h2 id="calc-additional-title">Costos adicionales</h2></div>
      </div>
      <div class="calc-section-body">
        {#each calc.additionalRows as row, index (row.id)}
          <div class="calc-row">
            <div class="calc-row-header">
              <span class="calc-row-index">Adicional {index + 1}</span>
              <button type="button" class="icon-button" onclick={() => removeAdditional(row.id)} aria-label={`Quitar costo adicional ${index + 1}`}>
                <KuboIcon name="trash" size={16} />
              </button>
            </div>
            <div class="field">
              <label class="field-label" for={`calc-add-concept-${row.id}`}>Concepto</label>
              <input id={`calc-add-concept-${row.id}`} class="text-input" type="text" value={row.concept} oninput={(e) => updateAdditional(row.id, { concept: e.currentTarget.value })} placeholder="Ej. Insertos / tornillos" />
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label" for={`calc-add-amount-${row.id}`}>Monto</label>
                <div class="money-input-wrap">
                  <span class="money-prefix" aria-hidden="true">S/</span>
                  <input
                    id={`calc-add-amount-${row.id}`}
                    class="text-input"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    value={row.amount ?? ''}
                    oninput={(e) => updateAdditional(row.id, { amount: parseNumberInput(e.currentTarget.value) })}
                  />
                </div>
              </div>
              <div class="field">
                <span class="field-label" id={`calc-add-scope-label-${row.id}`}>Aplicación</span>
                <div class="radio-group" role="radiogroup" aria-labelledby={`calc-add-scope-label-${row.id}`}>
                  <label class="radio-field">
                    <input class="radio-native" type="radio" name={`calc-add-scope-${row.id}`} checked={row.scope === 'project'} onchange={() => updateAdditional(row.id, { scope: 'project' })} />
                    Una vez / proyecto
                  </label>
                  <label class="radio-field">
                    <input class="radio-native" type="radio" name={`calc-add-scope-${row.id}`} checked={row.scope === 'unit'} onchange={() => updateAdditional(row.id, { scope: 'unit' })} />
                    Por unidad
                  </label>
                </div>
              </div>
            </div>
          </div>
        {/each}
        <button type="button" class="calc-add-row-button" onclick={addAdditional}>
          <KuboIcon name="plus" size={16} />
          Añadir costo
        </button>
      </div>
    </section>

    {#if showCommercial}
      <!-- Margen e IGV -->
      <section class="panel reveal" style="--delay: 160ms" aria-labelledby="calc-commercial-title">
        <div class="panel-header">
          <div><h2 id="calc-commercial-title">Precio de venta</h2></div>
        </div>
        <div class="calc-section-body">
          <div class="field">
            <label class="field-label" for="calc-target-margin">Margen objetivo % <span class="field-required">*</span></label>
            <div class="calc-slider-row">
              <input
                id="calc-target-margin-range"
                type="range"
                min="0"
                max="99"
                step="1"
                value={calc.targetMargin}
                oninput={(e) => (calc.targetMargin = Number(e.currentTarget.value))}
                aria-label="Margen objetivo (slider)"
              />
              <input
                id="calc-target-margin"
                class="text-input calc-slider-number"
                type="number"
                inputmode="decimal"
                min="0"
                max="99"
                step="any"
                value={calc.targetMargin}
                oninput={(e) => (calc.targetMargin = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
          </div>
          {#if calc.targetMargin + calc.commissionRate >= 100}
            <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />Margen + comisión no puede llegar a 100% o más — no hay precio posible.</p>
          {/if}

          <label class="checkbox-field" for="calc-apply-igv">
            <input id="calc-apply-igv" class="checkbox-native" type="checkbox" bind:checked={calc.applyIgv} />
            <span class="checkbox-field-copy">
              <strong>Aplicar IGV (18%)</strong>
              <span>Activa IGV solo cuando corresponda a la operación.</span>
            </span>
          </label>
        </div>
      </section>
    {/if}

    <!-- Supuestos y costos avanzados -->
    <details class="panel calc-advanced reveal" style="--delay: 180ms">
      <summary class="calc-advanced-summary">
        <span class="calc-advanced-summary-title">
          <KuboIcon name="nav-arrow-right" size={16} class="calc-advanced-chevron" />
          Supuestos y costos avanzados
        </span>
        <span class="status-badge status-info">Supuestos KUBO</span>
      </summary>
      <div class="calc-section-body">
        <p class="field-hint">
          Estos valores son supuestos operativos editables (no tarifas oficiales ni mediciones reales). Puedes ajustarlos aquí sin cambiar
          configuración global del proyecto, o restaurarlos a los defaults KUBO v1.
        </p>
        <div>
          <button type="button" class="secondary-button" onclick={resetKuboDefaults}>
            <KuboIcon name="refresh-double" size={16} />
            Restablecer valores KUBO
          </button>
          {#if kuboResetFeedback}
            <p class="field-hint" role="status" aria-live="polite">{kuboResetFeedback}</p>
          {/if}
        </div>

        <!-- Electricidad -->
        <div class="calc-row">
          <span class="calc-row-index">Electricidad</span>
          <p class="field-hint">Proveedor: {calc.electricity.provider} · Zona: {calc.electricity.location}</p>
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="calc-tariff">Tarifa de energía (S/kWh)</label>
              <input
                id="calc-tariff"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.electricity.tariffPerKWh}
                oninput={(e) => (calc.electricity.tariffPerKWh = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
            <div class="field">
              <span class="field-label" id="calc-electricity-mode-label">Modo</span>
              <div class="radio-group" role="radiogroup" aria-labelledby="calc-electricity-mode-label">
                {#each ELECTRICITY_MODE_OPTIONS as option (option.value)}
                  <label class="radio-field" for={`calc-electricity-mode-${option.value}`}>
                    <input
                      id={`calc-electricity-mode-${option.value}`}
                      class="radio-native"
                      type="radio"
                      name="calc-electricity-mode"
                      checked={calc.electricity.mode === option.value}
                      onchange={() => (calc.electricity.mode = option.value as ElectricityMode)}
                    />
                    {option.label}
                  </label>
                {/each}
              </div>
            </div>
          </div>

          {#if calc.electricity.mode === 'estimated'}
            <div class="field">
              <label class="field-label" for="calc-power">Potencia promedio de impresora (W)</label>
              <input
                id="calc-power"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.electricity.averagePowerW}
                oninput={(e) => (calc.electricity.averagePowerW = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
          {:else}
            <div class="field">
              <label class="field-label" for="calc-measured-kwh">Consumo medido (kWh) <span class="field-required">*</span></label>
              <input
                id="calc-measured-kwh"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.electricity.measuredKWh ?? ''}
                oninput={(e) => (calc.electricity.measuredKWh = parseNumberInput(e.currentTarget.value))}
              />
            </div>
          {/if}
        </div>

        <!-- Máquina -->
        <div class="calc-row">
          <span class="calc-row-index">Máquina</span>
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="calc-depreciation">Depreciación (S/h)</label>
              <input
                id="calc-depreciation"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.machineDepreciationPerHour}
                oninput={(e) => (calc.machineDepreciationPerHour = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
            <div class="field">
              <label class="field-label" for="calc-maintenance">Reserva de mantenimiento (S/h)</label>
              <input
                id="calc-maintenance"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.machineMaintenancePerHour}
                oninput={(e) => (calc.machineMaintenancePerHour = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
          </div>
          <p class="field-hint">Costo de máquina sin electricidad: {formatCurrency(calc.machineDepreciationPerHour + calc.machineMaintenancePerHour)}/h (depreciación + mantenimiento). Default KUBO: {formatCurrency(KUBO_MACHINE_HOURLY_RATE)}/h.</p>
        </div>

        <!-- Hora-hombre -->
        <div class="field">
          <label class="field-label" for="calc-labor-rate">Hora-hombre (S/h)</label>
          <input
            id="calc-labor-rate"
            class="text-input"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            value={calc.laborHourlyRate}
            oninput={(e) => (calc.laborHourlyRate = parseNumberInput(e.currentTarget.value) ?? 0)}
          />
          <p class="field-hint">Tarifa única para Diseño/preparación y Acabado/ensamblaje (Trabajo manual).</p>
        </div>

        <!-- Merma -->
        <div class="field">
          <label class="field-label" for="calc-waste-rate">Merma adicional %</label>
          <input
            id="calc-waste-rate"
            class="text-input"
            type="number"
            inputmode="decimal"
            min="0"
            max="100"
            step="any"
            value={calc.materialWasteRate}
            oninput={(e) => (calc.materialWasteRate = parseNumberInput(e.currentTarget.value) ?? 0)}
          />
          <p class="field-hint">Úsalo solo si los gramos del slicer no contemplan esta pérdida.</p>
        </div>

        <!-- Fallos -->
        <div class="field">
          <label class="field-label" for="calc-failure-rate">Provisión por fallos %</label>
          <input
            id="calc-failure-rate"
            class="text-input"
            type="number"
            inputmode="decimal"
            min="0"
            max="100"
            step="any"
            value={calc.failureRate}
            oninput={(e) => (calc.failureRate = parseNumberInput(e.currentTarget.value) ?? 0)}
          />
          <p class="field-hint">Se aplica sobre material, electricidad y máquina — no sobre trabajo manual ni IGV.</p>
        </div>

        <!-- Comisiones -->
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="calc-commission-rate">Comisión porcentual</label>
            <input
              id="calc-commission-rate"
              class="text-input"
              type="number"
              inputmode="decimal"
              min="0"
              max="100"
              step="any"
              value={calc.commissionRate}
              oninput={(e) => (calc.commissionRate = parseNumberInput(e.currentTarget.value) ?? 0)}
            />
          </div>
          <div class="field">
            <label class="field-label" for="calc-commission-fixed">Costo fijo por transacción</label>
            <div class="money-input-wrap">
              <span class="money-prefix" aria-hidden="true">S/</span>
              <input
                id="calc-commission-fixed"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.commissionFixed}
                oninput={(e) => (calc.commissionFixed = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
          </div>
        </div>
        <p class="field-hint">La comisión porcentual se calcula sobre el precio neto antes de IGV.</p>

        <!-- Indirectos -->
        <div class="field">
          <span class="field-label" id="calc-indirect-mode-label">Costos indirectos — Modo</span>
          <div class="radio-group" role="radiogroup" aria-labelledby="calc-indirect-mode-label">
            {#each INDIRECT_MODE_OPTIONS as option (option.value)}
              <label class="radio-field" for={`calc-indirect-mode-${option.value}`}>
                <input
                  id={`calc-indirect-mode-${option.value}`}
                  class="radio-native"
                  type="radio"
                  name="calc-indirect-mode"
                  checked={calc.indirectMode === option.value}
                  onchange={() => (calc.indirectMode = option.value)}
                />
                {option.label}
              </label>
            {/each}
          </div>
        </div>
        {#if calc.indirectMode === 'percentage'}
          <div class="field">
            <label class="field-label" for="calc-indirect-percentage">Porcentaje sobre costo directo</label>
            <input
              id="calc-indirect-percentage"
              class="text-input"
              type="number"
              inputmode="decimal"
              min="0"
              step="any"
              value={calc.indirectPercentage}
              oninput={(e) => (calc.indirectPercentage = parseNumberInput(e.currentTarget.value) ?? 0)}
            />
          </div>
        {:else}
          <div class="field">
            <label class="field-label" for="calc-indirect-fixed">Monto fijo</label>
            <div class="money-input-wrap">
              <span class="money-prefix" aria-hidden="true">S/</span>
              <input
                id="calc-indirect-fixed"
                class="text-input"
                type="number"
                inputmode="decimal"
                min="0"
                step="any"
                value={calc.indirectFixedAmount}
                oninput={(e) => (calc.indirectFixedAmount = parseNumberInput(e.currentTarget.value) ?? 0)}
              />
            </div>
          </div>
        {/if}

        <!-- Redondeo -->
        <div class="field">
          <label class="field-label" for="calc-rounding">Redondeo comercial</label>
          <Combobox
            id="calc-rounding"
            value={calc.roundingMode}
            options={ROUNDING_OPTIONS}
            onChange={(value) => (calc.roundingMode = value as RoundingMode)}
            ariaLabel="Redondeo comercial"
          />
        </div>
      </div>
    </details>
  </div>

  <div class="calc-result-col">
    <section class="panel reveal" style="--delay: 40ms" aria-labelledby="calc-result-title">
      <div class="panel-header">
        <div><h2 id="calc-result-title">Resultado</h2></div>
        {#if result.isComplete}
          <span class="status-badge status-success">Cálculo completo</span>
        {:else}
          <span class="status-badge status-danger">Cálculo incompleto</span>
        {/if}
      </div>

      {#if !result.isComplete}
        <div class="calc-result-section">
          <div class="calc-incomplete-banner">
            <KuboIcon name="warning-triangle" size={18} />
            <div>
              <strong>Cálculo incompleto</strong>
              <ul>
                {#each result.missing as item (item)}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      {/if}

      <div class="calc-result-primary">
        {#if showCommercial && result.price}
          <p class="calc-result-primary-label">Precio final / unidad</p>
          <p class="calc-result-primary-value">{formatCurrency(result.price.roundedFinalPricePerUnit)}</p>
          {#if result.price.roundedFinalPricePerUnit !== result.price.finalPricePerUnit}
            <p class="calc-result-primary-sub">Precio calculado sin redondeo: {formatCurrency(result.price.finalPricePerUnit)}</p>
          {/if}
        {:else}
          <p class="calc-result-primary-label">Costo / unidad</p>
          <p class="calc-result-primary-value">{formatCurrency(result.cost.unitCost)}</p>
        {/if}
      </div>

      <div class="calc-result-section">
        <p class="calc-result-section-title">Costo</p>
        <div class="calc-result-row"><span>Material</span><span>{formatCurrency(result.cost.totalMaterialCost)}</span></div>
        <div class="calc-result-row"><span>Merma</span><span>{formatCurrency(result.cost.materialWithWaste - result.cost.totalMaterialCost)}</span></div>
        <div class="calc-result-row"><span>Electricidad</span><span>{formatCurrency(result.cost.electricityCost)}</span></div>
        <div class="calc-result-row"><span>Depreciación</span><span>{formatCurrency(result.cost.depreciationCost)}</span></div>
        <div class="calc-result-row"><span>Mantenimiento</span><span>{formatCurrency(result.cost.maintenanceCost)}</span></div>
        <div class="calc-result-row"><span>Provisión por fallos</span><span>{formatCurrency(result.cost.failureProvision)}</span></div>
        <div class="calc-result-row"><span>Trabajo manual</span><span>{formatCurrency(result.cost.laborTotal)}</span></div>
        <div class="calc-result-row"><span>Packaging</span><span>{formatCurrency(result.cost.packagingCost)}</span></div>
        <div class="calc-result-row"><span>Adicionales</span><span>{formatCurrency(result.cost.additionalTotal)}</span></div>
        <div class="calc-result-row"><span>Indirectos</span><span>{formatCurrency(result.cost.indirectCost)}</span></div>
        <div class="calc-result-row is-total"><span>Costo total</span><span>{formatCurrency(result.cost.totalCost)}</span></div>
        <div class="calc-result-row"><span>Costo por unidad</span><span>{formatCurrency(result.cost.unitCost)}</span></div>
        <p class="field-hint">Costo máquina: {formatCurrency(result.cost.machineHourlyRate)}/h (depreciación + mantenimiento, sin electricidad).</p>
      </div>

      <div class="calc-result-section">
        <p class="calc-result-section-title">Breakdown</p>
        <PriceCalculatorBreakdown cost={result.cost} />
      </div>

      {#if showCommercial && result.price}
        <div class="calc-result-section">
          <p class="calc-result-section-title">Precio</p>
          <div class="calc-result-row"><span>Margen objetivo</span><span>{formatPercent(calc.targetMargin / 100)}</span></div>
          <div class="calc-result-row"><span>Comisión estimada</span><span>{formatCurrency(result.price.commissionAmount)}</span></div>
          <div class="calc-result-row"><span>Precio sin IGV</span><span>{formatCurrency(result.price.netPriceBeforeTax)}</span></div>
          <div class="calc-result-row"><span>IGV</span><span>{formatCurrency(result.price.igvAmount)}</span></div>
          <div class="calc-result-row is-total"><span>Precio final / unidad</span><span>{formatCurrency(result.price.roundedFinalPricePerUnit)}</span></div>
          <div class="calc-result-row"><span>Precio total / tanda</span><span>{formatCurrency(result.price.totalOrderPrice)}</span></div>
          <div class="calc-result-row"><span>Ganancia estimada</span><span>{formatCurrency(result.price.roundedProfit)}</span></div>
          <div class="calc-result-row"><span>Margen efectivo</span><span>{formatPercent(result.price.roundedEffectiveMargin)}</span></div>
          <div class="calc-result-row"><span>Markup (informativo)</span><span>{formatPercent(result.price.markup)}</span></div>
        </div>
      {/if}
    </section>
  </div>
</div>
{/if}

{#if activeTab === 'history'}
  <div id="calc-tabpanel-history" role="tabpanel" aria-labelledby="calc-tab-history">
    <PriceCalculatorHistory snapshots={history} onOpen={openSnapshot} onDuplicate={duplicateSnapshot} onDelete={deleteSnapshot} onDeleteAll={deleteAllHistory} />
  </div>
{/if}
