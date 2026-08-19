<script lang="ts">
  /**
   * MaterialDetail.svelte
   * Workspace de detalle de un perfil (spec §13) — vista dentro del MISMO island de Materiales, no
   * una ruta `/admin/produccion/materiales/[id]` propia: KUBO todavía no tiene backend/store
   * compartido entre páginas (spec §16 "no simular persistencia entre rutas"), y cada página Astro
   * monta una isla Svelte nueva — navegar a otra URL perdería todo el estado de sesión (perfiles,
   * bobinas, movimientos). Mismo criterio ya usado por ExpenseDetailDrawer.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { FilamentProfile, FilamentSpool, MaterialMovement } from '../../../data/admin/materials.types';
  import type { MaterialListItem } from '../../../lib/materials/inventory';
  import { purchaseGroupsForProfile } from '../../../lib/materials/inventory';
  import {
    MATERIAL_TYPES,
    MATERIAL_USAGE_OPTIONS,
    MOVEMENT_TYPE_OPTIONS,
    PRESENTATION_OPTIONS,
    SPOOL_STATUS_OPTIONS,
    STOCK_STATUS_OPTIONS,
    VALIDATION_STATUS_OPTIONS,
    optionLabel,
  } from '../../../data/admin/materials.constants';
  import { formatCurrency, formatDateLong, formatWeightG } from '../../../lib/materials/format';

  interface Props {
    item: MaterialListItem;
    spools: FilamentSpool[];
    movements: MaterialMovement[];
    onBack: () => void;
    onEdit: (profile: FilamentProfile) => void;
    onAddStock: (profile: FilamentProfile) => void;
    onAdjustWeight: (spool: FilamentSpool) => void;
  }

  let { item, spools, movements, onBack, onEdit, onAddStock, onAdjustWeight }: Props = $props();

  type Tab = 'summary' | 'inventory' | 'print-profile' | 'purchases';
  let activeTab = $state<Tab>('summary');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Resumen' },
    { key: 'inventory', label: 'Inventario' },
    { key: 'print-profile', label: 'Perfil de impresión' },
    { key: 'purchases', label: 'Compras' },
  ];

  let profile = $derived(item.profile);
  let ownSpools = $derived([...spools].sort((a, b) => (a.purchaseDate < b.purchaseDate ? 1 : -1)));
  let ownMovements = $derived([...movements].sort((a, b) => (a.date < b.date ? 1 : -1)));
  let purchaseGroups = $derived(purchaseGroupsForProfile(profile.id, spools));

  function handleTabKeydown(event: KeyboardEvent) {
    const currentIndex = TABS.findIndex((t) => t.key === activeTab);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      activeTab = TABS[(currentIndex + 1) % TABS.length].key;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      activeTab = TABS[(currentIndex - 1 + TABS.length) % TABS.length].key;
    }
  }
</script>

<button type="button" class="material-detail-back" onclick={onBack}>
  <KuboIcon name="nav-arrow-left" size={14} />
  Volver a Materiales
</button>

<div class="material-detail-header reveal" style="--delay: 0ms">
  <div class="material-detail-heading">
    <span class="material-swatch" class:is-empty={!profile.colorHex} style={profile.colorHex ? `background:${profile.colorHex};` : ''} aria-hidden="true"></span>
    <div class="material-detail-title">
      <h1>{profile.name}</h1>
      <p>{[profile.manufacturer, optionLabel(MATERIAL_TYPES, profile.materialType), `${profile.diameterMm} mm`].filter(Boolean).join(' · ')}</p>
      {#if profile.internalCode}
        <p class="material-detail-sku mono-strong">{profile.internalCode}</p>
      {/if}
      <div class="material-detail-chips">
        <span class={`status-chip status-${profile.validationStatus}`}>{optionLabel(VALIDATION_STATUS_OPTIONS, profile.validationStatus)}</span>
        <span class={`status-chip status-${profile.usage}`}>{optionLabel(MATERIAL_USAGE_OPTIONS, profile.usage)}</span>
        <span class={`status-chip status-${item.stockStatus}`}>{optionLabel(STOCK_STATUS_OPTIONS, item.stockStatus)}</span>
      </div>
    </div>
  </div>
  <div class="material-detail-actions">
    <button type="button" class="secondary-button" onclick={() => onAddStock(profile)}>
      <KuboIcon name="plus" size={16} />
      Agregar stock
    </button>
    <button type="button" class="primary-button" onclick={() => onEdit(profile)}>
      <KuboIcon name="edit-pencil" size={16} />
      Editar perfil
    </button>
  </div>
</div>

<section class="materials-overview reveal" style="--delay: 40ms" aria-label="Indicadores del perfil">
  <div class="materials-summary">
    <div class="summary-metric">
      <p class="summary-metric-label">Stock disponible</p>
      <span class="summary-metric-value" aria-live="polite">{formatWeightG(item.stockG)}</span>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Bobinas</p>
      <span class="summary-metric-value">{item.spoolCounts.total}</span>
      <p class="summary-metric-meta">{item.spoolCounts.open} abierta{item.spoolCounts.open === 1 ? '' : 's'} · {item.spoolCounts.sealed} sellada{item.spoolCounts.sealed === 1 ? '' : 's'}</p>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Última compra</p>
      <span class="summary-metric-value">{formatDateLong(item.lastPurchaseDate)}</span>
    </div>
    <div class="summary-metric">
      <p class="summary-metric-label">Stock mínimo</p>
      <span class="summary-metric-value">{formatWeightG(profile.minimumStockG)}</span>
    </div>
  </div>
</section>

<div class="expenses-tabs reveal" style="--delay: 60ms" role="tablist" aria-label="Secciones del perfil" onkeydown={handleTabKeydown}>
  {#each TABS as tab (tab.key)}
    <button
      type="button"
      role="tab"
      id={`material-tab-${tab.key}`}
      aria-selected={activeTab === tab.key}
      aria-controls={`material-tabpanel-${tab.key}`}
      tabindex={activeTab === tab.key ? 0 : -1}
      class="expenses-tab"
      class:is-active={activeTab === tab.key}
      onclick={() => (activeTab = tab.key)}
    >
      {tab.label}
    </button>
  {/each}
</div>

{#if activeTab === 'summary'}
  <div id="material-tabpanel-summary" role="tabpanel" aria-labelledby="material-tab-summary" class="panel material-detail-panel reveal" style="--delay: 90ms">
    <div class="print-profile-columns">
      <div>
        <p class="filters-panel-title" style="margin-bottom: var(--space-3);">IDENTIDAD</p>
        <dl class="drawer-fields">
          <div class="drawer-field"><dt>Tipo de material</dt><dd>{optionLabel(MATERIAL_TYPES, profile.materialType)}</dd></div>
          {#if profile.manufacturer}<div class="drawer-field"><dt>Fabricante</dt><dd>{profile.manufacturer}</dd></div>{/if}
          {#if profile.productLine}<div class="drawer-field"><dt>Línea / familia</dt><dd>{profile.productLine}</dd></div>{/if}
          <div class="drawer-field"><dt>Color</dt><dd>{profile.colorName}{profile.colorHex ? ` · ${profile.colorHex}` : ''}</dd></div>
          <div class="drawer-field"><dt>Diámetro</dt><dd>{profile.diameterMm} mm</dd></div>
          {#if profile.manufacturerSku}<div class="drawer-field"><dt>SKU fabricante</dt><dd>{profile.manufacturerSku}</dd></div>{/if}
          {#if profile.internalCode}<div class="drawer-field"><dt>SKU interno KUBO</dt><dd class="mono-strong">{profile.internalCode}</dd></div>{/if}
          {#if profile.presentation}<div class="drawer-field"><dt>Presentación</dt><dd>{optionLabel(PRESENTATION_OPTIONS, profile.presentation)}</dd></div>{/if}
          {#if profile.nominalSpoolWeightG}<div class="drawer-field"><dt>Peso neto nominal</dt><dd>{formatWeightG(profile.nominalSpoolWeightG)}</dd></div>{/if}
          {#if profile.tareWeightG}<div class="drawer-field"><dt>Tara de bobina</dt><dd>{profile.tareWeightG} g</dd></div>{/if}
        </dl>
      </div>
      <div>
        <p class="filters-panel-title" style="margin-bottom: var(--space-3);">USO Y VALIDACIÓN</p>
        <dl class="drawer-fields">
          <div class="drawer-field"><dt>Uso permitido</dt><dd>{optionLabel(MATERIAL_USAGE_OPTIONS, profile.usage)}</dd></div>
          <div class="drawer-field"><dt>Estado de validación</dt><dd>{optionLabel(VALIDATION_STATUS_OPTIONS, profile.validationStatus)}</dd></div>
        </dl>
        <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">INVENTARIO ESENCIAL</p>
        <dl class="drawer-fields">
          <div class="drawer-field"><dt>Stock mínimo</dt><dd>{formatWeightG(profile.minimumStockG)}</dd></div>
          {#if profile.defaultLocation}<div class="drawer-field"><dt>Ubicación habitual</dt><dd>{profile.defaultLocation}</dd></div>{/if}
          {#if profile.preferredSupplier}<div class="drawer-field"><dt>Proveedor preferido</dt><dd>{profile.preferredSupplier}</dd></div>{/if}
        </dl>
        {#if profile.notes}
          <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">NOTAS</p>
          <p class="field-hint">{profile.notes}</p>
        {/if}
      </div>
    </div>
  </div>
{:else if activeTab === 'inventory'}
  <div id="material-tabpanel-inventory" role="tabpanel" aria-labelledby="material-tab-inventory" class="panel material-detail-panel reveal" style="--delay: 90ms">
    {#if ownSpools.length === 0}
      <div class="list-empty-panel">
        <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="box" size={22} /></span>
        <h3>Sin bobinas registradas.</h3>
        <p>Agrega stock para empezar a llevar el inventario real de este perfil.</p>
        <button type="button" class="primary-button" onclick={() => onAddStock(profile)}>
          <KuboIcon name="plus" size={16} />
          Agregar stock
        </button>
      </div>
    {:else}
      <div class="table-shell desktop-table">
        <table>
          <caption class="sr-only">Bobinas de {profile.name}</caption>
          <thead>
            <tr>
              <th scope="col">Lote</th>
              <th scope="col">Estado</th>
              <th scope="col">Restante</th>
              <th scope="col">Compra</th>
              <th scope="col">Proveedor</th>
              <th scope="col">Ubicación</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {#each ownSpools as spool (spool.id)}
              <tr>
                <td class="mono-strong">{spool.lot ?? '—'}</td>
                <td><span class={`status-chip status-${spool.status}`}>{optionLabel(SPOOL_STATUS_OPTIONS, spool.status)}</span></td>
                <td class="mono-strong">{formatWeightG(spool.remainingWeightG)} <span class="value-empty">/ {formatWeightG(spool.initialNetWeightG)}</span></td>
                <td>{formatDateLong(spool.purchaseDate)}</td>
                <td>{spool.supplier ?? '—'}</td>
                <td>{spool.location ?? '—'}</td>
                <td>
                  {#if spool.status === 'open'}
                    <button type="button" class="text-link" onclick={() => onAdjustWeight(spool)}>Actualizar peso</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="mobile-list mobile-only">
        {#each ownSpools as spool (spool.id)}
          <div class="mobile-data-card">
            <div class="material-card-top">
              <strong>{spool.lot ?? 'Sin lote'}</strong>
              <span class={`status-chip status-${spool.status}`}>{optionLabel(SPOOL_STATUS_OPTIONS, spool.status)}</span>
            </div>
            <span class="material-card-meta">{formatWeightG(spool.remainingWeightG)} restante de {formatWeightG(spool.initialNetWeightG)}</span>
            <span class="material-card-meta">{formatDateLong(spool.purchaseDate)} · {spool.supplier ?? 'Sin proveedor'}</span>
            {#if spool.status === 'open'}
              <button type="button" class="text-link" onclick={() => onAdjustWeight(spool)}>Actualizar peso</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if ownMovements.length > 0}
      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">MOVIMIENTOS</p>
      <div class="table-shell desktop-table">
        <table>
          <caption class="sr-only">Movimientos de inventario de {profile.name}</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Tipo</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Nota</th>
            </tr>
          </thead>
          <tbody>
            {#each ownMovements as movement (movement.id)}
              <tr>
                <td class="mono-strong">{formatDateLong(movement.date)}</td>
                <td>{optionLabel(MOVEMENT_TYPE_OPTIONS, movement.type)}</td>
                <td class="mono-strong">{movement.quantityG > 0 ? '+' : ''}{formatWeightG(movement.quantityG)}</td>
                <td>{movement.note ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="mobile-list mobile-only">
        {#each ownMovements as movement (movement.id)}
          <div class="mobile-data-card">
            <div class="material-card-top">
              <strong>{optionLabel(MOVEMENT_TYPE_OPTIONS, movement.type)}</strong>
              <span class="mono-strong">{movement.quantityG > 0 ? '+' : ''}{formatWeightG(movement.quantityG)}</span>
            </div>
            <span class="material-card-meta">{formatDateLong(movement.date)}</span>
            {#if movement.note}<span class="material-card-meta">{movement.note}</span>{/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else if activeTab === 'print-profile'}
  <div id="material-tabpanel-print-profile" role="tabpanel" aria-labelledby="material-tab-print-profile" class="panel material-detail-panel reveal" style="--delay: 90ms">
    <p class="field-hint" style="margin-bottom: var(--space-4);">Los parámetros técnicos solo se completan con ficha del fabricante o pruebas reales de KUBO — nunca se inventan.</p>
    <div class="print-profile-columns">
      <div>
        <p class="filters-panel-title" style="margin-bottom: var(--space-3);">ESPECIFICACIÓN DEL FABRICANTE</p>
        <dl class="drawer-fields">
          <div class="drawer-field"><dt>Rango temp. nozzle</dt><dd class="mono-strong">{#if profile.manufacturerSpecs?.nozzleTempRangeC}{profile.manufacturerSpecs.nozzleTempRangeC} °C{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Rango temp. cama</dt><dd class="mono-strong">{#if profile.manufacturerSpecs?.bedTempRangeC}{profile.manufacturerSpecs.bedTempRangeC} °C{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Densidad</dt><dd class="mono-strong">{#if profile.manufacturerSpecs?.densityGCm3}{profile.manufacturerSpecs.densityGCm3} g/cm³{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Secado recomendado</dt><dd>{#if profile.manufacturerSpecs?.dryingRecommendation}{profile.manufacturerSpecs.dryingRecommendation}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
        </dl>
      </div>
      <div>
        <p class="filters-panel-title" style="margin-bottom: var(--space-3);">PERFIL VALIDADO KUBO</p>
        <dl class="drawer-fields">
          <div class="drawer-field"><dt>Temp. nozzle</dt><dd class="mono-strong">{#if profile.kuboPrintProfile?.nozzleTempC !== undefined}{profile.kuboPrintProfile.nozzleTempC} °C{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Temp. cama</dt><dd class="mono-strong">{#if profile.kuboPrintProfile?.bedTempC !== undefined}{profile.kuboPrintProfile.bedTempC} °C{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Flow ratio</dt><dd class="mono-strong">{#if profile.kuboPrintProfile?.flowRatio !== undefined}{profile.kuboPrintProfile.flowRatio}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Max. volumetric speed</dt><dd class="mono-strong">{#if profile.kuboPrintProfile?.maxVolumetricSpeed !== undefined}{profile.kuboPrintProfile.maxVolumetricSpeed} mm³/s{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Impresora compatible</dt><dd>{#if profile.kuboPrintProfile?.printerCompatible}{profile.kuboPrintProfile.printerCompatible}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Nozzle compatible</dt><dd>{#if profile.kuboPrintProfile?.nozzleCompatible}{profile.kuboPrintProfile.nozzleCompatible}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Preset Bambu Studio</dt><dd>{#if profile.kuboPrintProfile?.bambuStudioPresetName}{profile.kuboPrintProfile.bambuStudioPresetName}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          <div class="drawer-field"><dt>Última calibración</dt><dd>{#if profile.kuboPrintProfile?.lastCalibrationDate}{formatDateLong(profile.kuboPrintProfile.lastCalibrationDate)}{:else}<span class="value-empty">Sin datos</span>{/if}</dd></div>
          {#if profile.kuboPrintProfile?.testNotes}<div class="drawer-field"><dt>Notas de prueba</dt><dd>{profile.kuboPrintProfile.testNotes}</dd></div>{/if}
        </dl>
      </div>
    </div>
  </div>
{:else}
  <div id="material-tabpanel-purchases" role="tabpanel" aria-labelledby="material-tab-purchases" class="panel material-detail-panel reveal" style="--delay: 90ms">
    {#if purchaseGroups.length === 0}
      <div class="list-empty-panel">
        <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="credit-card" size={22} /></span>
        <h3>Sin compras registradas.</h3>
        <p>El historial de compras aparecerá aquí cuando agregues stock a este perfil.</p>
      </div>
    {:else}
      <div class="table-shell desktop-table">
        <table>
          <caption class="sr-only">Historial de compras de {profile.name}</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Proveedor</th>
              <th scope="col">Bobinas</th>
              <th scope="col">Peso</th>
              <th scope="col">Costo unitario</th>
              <th scope="col">Costo total</th>
              <th scope="col">Lote</th>
            </tr>
          </thead>
          <tbody>
            {#each purchaseGroups as group (group.key)}
              <tr>
                <td class="mono-strong">{formatDateLong(group.date)}</td>
                <td>{group.supplier ?? '—'}</td>
                <td>{group.spoolCount}</td>
                <td class="mono-strong">{formatWeightG(group.totalWeightG)}</td>
                <td class="mono-strong">{group.unitCost !== null ? formatCurrency(group.unitCost) : '—'}</td>
                <td class="mono-strong">{group.totalCost !== null ? formatCurrency(group.totalCost) : '—'}</td>
                <td>{group.lot ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="mobile-list mobile-only">
        {#each purchaseGroups as group (group.key)}
          <div class="mobile-data-card">
            <div class="material-card-top">
              <strong>{formatDateLong(group.date)}</strong>
              <span class="mono-strong">{group.totalCost !== null ? formatCurrency(group.totalCost) : '—'}</span>
            </div>
            <span class="material-card-meta">{group.spoolCount} bobina{group.spoolCount === 1 ? '' : 's'} · {formatWeightG(group.totalWeightG)}</span>
            <span class="material-card-meta">{group.supplier ?? 'Sin proveedor'}{group.lot ? ` · ${group.lot}` : ''}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
