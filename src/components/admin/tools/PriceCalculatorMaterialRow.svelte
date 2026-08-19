<script lang="ts">
  /**
   * PriceCalculatorMaterialRow.svelte
   * Una fila de "Materiales" del cálculo — Combobox de solo lectura sobre perfiles reales de
   * Producción → Materiales (spec §9). Nunca escribe en el perfil: el costo/kg mostrado es de
   * referencia (derivado de la última compra vía lib/materials/reference-cost.ts) y el override es
   * exclusivo de este cálculo.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { Option } from '../../../data/admin/expenses.constants';
  import type { FilamentProfile } from '../../../data/admin/materials.types';
  import { MATERIAL_TYPES, MATERIAL_USAGE_OPTIONS, VALIDATION_STATUS_OPTIONS, optionLabel } from '../../../data/admin/materials.constants';
  import type { CalculationMaterial } from '../../../data/admin/price-calculator.types';
  import { formatCurrency } from '../../../lib/pricing/format';
  import { parseNumberInput } from '../../../lib/pricing/input';

  interface Props {
    material: CalculationMaterial;
    index: number;
    profiles: FilamentProfile[];
    onChange: (patch: Partial<CalculationMaterial>) => void;
    onRemove: () => void;
    canRemove: boolean;
    showErrors: boolean;
  }

  let { material, index, profiles, onChange, onRemove, canRemove, showErrors }: Props = $props();

  let profileOptions = $derived<Option<string>[]>(profiles.map((profile) => ({ value: profile.id, label: `${profile.name} — ${profile.colorName}` })));
  let selectedProfile = $derived(profiles.find((profile) => profile.id === material.profileId) ?? null);

  let gramsInvalid = $derived(showErrors && (material.grams === null || material.grams <= 0));
  let costInvalid = $derived(
    showErrors && material.profileId !== '' && (material.useOverride ? material.costOverridePerKg === null : material.referenceCostPerKg === null)
  );

  const fieldId = (suffix: string) => `calc-material-${index}-${suffix}`;
</script>

<div class="calc-row">
  <div class="calc-row-header">
    <span class="calc-row-index">Material {index + 1}</span>
    {#if canRemove}
      <button type="button" class="icon-button" onclick={onRemove} aria-label={`Quitar material ${index + 1}`}>
        <KuboIcon name="trash" size={16} />
      </button>
    {/if}
  </div>

  <div class="field">
    <label class="field-label" for={fieldId('profile')}>Perfil de filamento <span class="field-required">*</span></label>
    <Combobox
      id={fieldId('profile')}
      value={material.profileId}
      options={profileOptions}
      onChange={(value) => onChange({ profileId: value, referenceCostPerKg: null, useOverride: false, costOverridePerKg: null })}
      placeholder="Selecciona un perfil"
      ariaLabel={`Perfil de filamento del material ${index + 1}`}
      invalid={showErrors && material.profileId === ''}
    />
    {#if showErrors && material.profileId === ''}
      <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />Selecciona un perfil.</p>
    {/if}
  </div>

  {#if selectedProfile}
    <dl class="calc-profile-meta">
      <div><dt>Tipo</dt><dd>{optionLabel(MATERIAL_TYPES, selectedProfile.materialType)}</dd></div>
      {#if selectedProfile.internalCode}<div><dt>SKU interno</dt><dd>{selectedProfile.internalCode}</dd></div>{/if}
      {#if selectedProfile.manufacturer}<div><dt>Fabricante</dt><dd>{selectedProfile.manufacturer}</dd></div>{/if}
      <div><dt>Uso</dt><dd>{optionLabel(MATERIAL_USAGE_OPTIONS, selectedProfile.usage)}</dd></div>
      <div><dt>Validación</dt><dd>{optionLabel(VALIDATION_STATUS_OPTIONS, selectedProfile.validationStatus)}</dd></div>
    </dl>
  {/if}

  <div class="field-row">
    <div class="field">
      <label class="field-label" for={fieldId('grams')}>Gramos utilizados <span class="field-required">*</span></label>
      <input
        id={fieldId('grams')}
        class="text-input"
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        value={material.grams ?? ''}
        oninput={(e) => onChange({ grams: parseNumberInput(e.currentTarget.value) })}
        aria-invalid={gramsInvalid ? 'true' : undefined}
      />
      {#if gramsInvalid}
        <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />Indica los gramos utilizados.</p>
      {/if}
    </div>
    <div class="field">
      <label class="field-label" for={fieldId('cost')}>Costo de referencia / kg</label>
      {#if material.useOverride}
        <input
          id={fieldId('cost')}
          class="text-input"
          type="number"
          inputmode="decimal"
          min="0"
          step="any"
          value={material.costOverridePerKg ?? ''}
          oninput={(e) => onChange({ costOverridePerKg: parseNumberInput(e.currentTarget.value) })}
          aria-invalid={costInvalid ? 'true' : undefined}
        />
      {:else}
        <input id={fieldId('cost')} class="text-input" type="text" readonly value={material.referenceCostPerKg !== null ? formatCurrency(material.referenceCostPerKg) : 'Sin costo en el perfil'} />
      {/if}
      {#if costInvalid}
        <p class="field-error" role="alert"><KuboIcon name="warning-triangle" size={14} />Este perfil no tiene costo/kg — usa un override.</p>
      {/if}
    </div>
  </div>

  <label class="checkbox-field" for={fieldId('override')}>
    <input
      id={fieldId('override')}
      class="checkbox-native"
      type="checkbox"
      checked={material.useOverride}
      onchange={(e) => onChange({ useOverride: e.currentTarget.checked })}
    />
    <span class="checkbox-field-copy">
      <strong>Usar otro costo para este cálculo</strong>
      <span>No modifica el perfil guardado en Materiales.</span>
    </span>
  </label>
</div>
