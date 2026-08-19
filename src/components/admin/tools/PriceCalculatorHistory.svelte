<script lang="ts">
  /**
   * PriceCalculatorHistory.svelte
   * Calculadora → Historial (spec §36). Lista snapshots ya guardados vía "Guardar cálculo" — nunca
   * crea ni edita uno: solo lee `snapshots` y delega Abrir/Duplicar/Eliminar al padre
   * (PriceCalculatorWorkspace.svelte), que es quien controla el estado del formulario. "Copiar
   * resumen" es autónomo acá porque no toca el formulario, reutilizando `buildSummaryText` (mismo
   * texto que el cálculo actual, spec §36) con la fecha/hora congelada del snapshot.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import { PURPOSE_OPTIONS, optionLabel } from '../../../data/admin/price-calculator.constants';
  import type { CalculatorPurpose, PricingSnapshot } from '../../../data/admin/price-calculator.types';
  import { formatCurrency, formatDateTime, formatPercent } from '../../../lib/pricing/format';
  import { buildSaleSummaryText, buildSummaryText, hasValidSaleSummary } from '../../../lib/pricing/summary';

  interface Props {
    snapshots: PricingSnapshot[];
    onOpen: (snapshot: PricingSnapshot) => void;
    onDuplicate: (snapshot: PricingSnapshot) => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
  }

  let { snapshots, onOpen, onDuplicate, onDelete, onDeleteAll }: Props = $props();

  let search = $state('');
  let purposeFilter = $state<CalculatorPurpose | 'all'>('all');
  let copyFeedback = $state<string | null>(null);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let deleteAllOpen = $state(false);

  function matchesSearch(snapshot: PricingSnapshot, term: string): boolean {
    if (!term) return true;
    const haystack = [snapshot.name, ...Object.values(snapshot.materialLabels)].join(' ').toLowerCase();
    return haystack.includes(term);
  }

  let filtered = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return snapshots.filter((snapshot) => matchesSearch(snapshot, term) && (purposeFilter === 'all' || snapshot.calculation.purpose === purposeFilter));
  });

  function materialSummary(snapshot: PricingSnapshot): string {
    const labels = Object.values(snapshot.materialLabels);
    if (labels.length === 0) return 'Sin material';
    if (labels.length === 1) return labels[0];
    return `${labels[0]} +${labels.length - 1}`;
  }

  function showFeedback(message: string) {
    copyFeedback = message;
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => {
      copyFeedback = null;
    }, 3200);
  }

  async function copySnapshotSummary(snapshot: PricingSnapshot) {
    const text = buildSummaryText({
      name: snapshot.name,
      calc: snapshot.calculation,
      materialLabels: snapshot.materialLabels,
      cost: snapshot.result.cost,
      price: snapshot.result.price,
      isComplete: snapshot.result.isComplete,
      missing: snapshot.result.missing,
      showCommercial: snapshot.showCommercial,
      totalPrintHours: snapshot.result.totalPrintHours,
      consultDate: snapshot.createdAt,
    });
    try {
      await navigator.clipboard.writeText(text);
      showFeedback('Resumen copiado.');
    } catch {
      showFeedback('No se pudo copiar el resumen.');
    }
  }

  function canCopyForSale(snapshot: PricingSnapshot): boolean {
    return hasValidSaleSummary({
      name: snapshot.name,
      calc: snapshot.calculation,
      price: snapshot.result.price,
      isComplete: snapshot.result.isComplete,
      showCommercial: snapshot.showCommercial,
    });
  }

  async function copySnapshotForSale(snapshot: PricingSnapshot) {
    const text = buildSaleSummaryText({
      name: snapshot.name,
      calc: snapshot.calculation,
      price: snapshot.result.price,
      isComplete: snapshot.result.isComplete,
      showCommercial: snapshot.showCommercial,
    });
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showFeedback('Resumen de venta copiado');
    } catch {
      showFeedback('No se pudo copiar el resumen de venta.');
    }
  }

  function confirmDeleteAll() {
    onDeleteAll();
    deleteAllOpen = false;
  }
</script>

<div class="calc-history-toolbar reveal" style="--delay: 20ms">
  <div class="toolbar-search">
    <span class="search-icon" aria-hidden="true"><KuboIcon name="search" size={16} /></span>
    <input type="search" bind:value={search} placeholder="Buscar por nombre o material" aria-label="Buscar en el historial" />
  </div>
  <div class="calc-history-purpose-filter">
    <label class="sr-only" for="calc-history-purpose">Filtrar por finalidad</label>
    <Combobox
      id="calc-history-purpose"
      value={purposeFilter}
      options={[{ value: 'all', label: 'Todas las finalidades' }, ...PURPOSE_OPTIONS]}
      onChange={(value) => (purposeFilter = value)}
      ariaLabel="Filtrar por finalidad"
    />
  </div>
  {#if snapshots.length > 0}
    <button type="button" class="danger-button calc-history-delete-all" onclick={() => (deleteAllOpen = true)}>
      <KuboIcon name="trash" size={16} />
      Eliminar todo el historial
    </button>
  {/if}
</div>

{#if copyFeedback}
  <p class="field-hint" role="status" aria-live="polite">{copyFeedback}</p>
{/if}

{#if snapshots.length === 0}
  <div class="list-empty-panel reveal" style="--delay: 40ms">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="graph-up" size={22} /></span>
    <h3>Todavía no guardaste ninguna consulta.</h3>
    <p>Usa "Guardar cálculo" en la Calculadora para conservar un cálculo completo con su costo, precio y supuestos.</p>
  </div>
{:else if filtered.length === 0}
  <div class="list-empty-panel reveal" style="--delay: 40ms">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="search" size={22} /></span>
    <h3>No encontramos consultas con estos filtros.</h3>
    <p>Prueba ajustando el texto buscado o la finalidad.</p>
  </div>
{:else}
  <div class="table-shell desktop-table reveal" style="--delay: 60ms">
    <table>
      <caption class="sr-only">Historial de consultas de la Calculadora de precios, más reciente primero</caption>
      <thead>
        <tr>
          <th scope="col">Nombre</th>
          <th scope="col">Fecha / Finalidad</th>
          <th scope="col">Material</th>
          <th scope="col">Costo / Precio</th>
          <th scope="col">Margen</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as snapshot (snapshot.id)}
          <tr>
            <td>
              <span class="calc-history-name-cell">
                <strong>{snapshot.name}</strong>
              </span>
            </td>
            <td>
              <span class="calc-history-meta-cell">
                <span class="mono-strong">{formatDateTime(snapshot.createdAt)}</span>
                <span>{optionLabel(PURPOSE_OPTIONS, snapshot.calculation.purpose)}</span>
              </span>
            </td>
            <td>{materialSummary(snapshot)}</td>
            <td>
              <span class="calc-history-price-cell">
                <span class="mono-strong">{formatCurrency(snapshot.result.cost.unitCost)}<span class="calc-history-price-unit">/u costo</span></span>
                {#if snapshot.showCommercial && snapshot.result.price}
                  <span class="mono-strong">{formatCurrency(snapshot.result.price.roundedFinalPricePerUnit)}<span class="calc-history-price-unit">/u precio</span></span>
                {/if}
              </span>
            </td>
            <td>{snapshot.showCommercial && snapshot.result.price ? formatPercent(snapshot.result.price.roundedEffectiveMargin) : '—'}</td>
            <td>
              <div class="calc-history-actions">
                <button type="button" class="icon-button" onclick={() => onOpen(snapshot)} aria-label={`Abrir ${snapshot.name}`} title="Abrir">
                  <KuboIcon name="open-new-window" size={16} />
                </button>
                <button type="button" class="icon-button" onclick={() => onDuplicate(snapshot)} aria-label={`Duplicar ${snapshot.name}`} title="Duplicar">
                  <KuboIcon name="copy" size={16} />
                </button>
                <button type="button" class="icon-button" onclick={() => copySnapshotSummary(snapshot)} aria-label={`Copiar resumen de ${snapshot.name}`} title="Copiar resumen">
                  <KuboIcon name="page" size={16} />
                </button>
                <button type="button" class="icon-button" onclick={() => copySnapshotForSale(snapshot)} disabled={!canCopyForSale(snapshot)} aria-label={`Copiar para venta ${snapshot.name}`} title="Copiar para venta">
                  <KuboIcon name="cart" size={16} />
                </button>
                <button type="button" class="icon-button" onclick={() => onDelete(snapshot.id)} aria-label={`Eliminar ${snapshot.name}`} title="Eliminar">
                  <KuboIcon name="trash" size={16} />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each filtered as snapshot (snapshot.id)}
      <div class="mobile-data-card calc-history-card">
        <div class="calc-history-card-top">
          <strong>{snapshot.name}</strong>
        </div>
        <span class="calc-history-card-meta">{formatDateTime(snapshot.createdAt)} · {optionLabel(PURPOSE_OPTIONS, snapshot.calculation.purpose)}</span>
        <span class="calc-history-card-meta">{materialSummary(snapshot)}</span>
        <div class="calc-history-card-bottom">
          <span class="mono-strong">{formatCurrency(snapshot.result.cost.unitCost)} costo/u</span>
          {#if snapshot.showCommercial && snapshot.result.price}
            <span class="mono-strong">{formatCurrency(snapshot.result.price.roundedFinalPricePerUnit)} precio/u</span>
            <span>{formatPercent(snapshot.result.price.roundedEffectiveMargin)} margen</span>
          {/if}
        </div>
        <div class="calc-history-actions calc-history-actions-mobile">
          <button type="button" class="secondary-button" onclick={() => onOpen(snapshot)}>
            <KuboIcon name="open-new-window" size={15} />
            Abrir
          </button>
          <button type="button" class="secondary-button" onclick={() => onDuplicate(snapshot)}>
            <KuboIcon name="copy" size={15} />
            Duplicar
          </button>
          <button type="button" class="secondary-button" onclick={() => copySnapshotSummary(snapshot)}>
            <KuboIcon name="page" size={15} />
            Copiar
          </button>
          <button type="button" class="secondary-button" onclick={() => copySnapshotForSale(snapshot)} disabled={!canCopyForSale(snapshot)}>
            <KuboIcon name="cart" size={15} />
            Copiar para venta
          </button>
          <button type="button" class="icon-button" onclick={() => onDelete(snapshot.id)} aria-label={`Eliminar ${snapshot.name}`}>
            <KuboIcon name="trash" size={16} />
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if deleteAllOpen}
  <Modal onClose={() => (deleteAllOpen = false)} labelledBy="calc-history-delete-all-title" describedBy="calc-history-delete-all-desc" size="compact">
    {#snippet children()}
      <header class="modal-header">
        <h2 id="calc-history-delete-all-title">Eliminar todo el historial</h2>
        <button type="button" class="icon-button" data-modal-close onclick={() => (deleteAllOpen = false)} aria-label="Cerrar confirmación">
          <KuboIcon name="xmark" size={20} />
        </button>
      </header>
      <div class="modal-body">
        <p id="calc-history-delete-all-desc">
          Se eliminará{snapshots.length === 1 ? '' : 'n'} la{snapshots.length === 1 ? '' : 's'} {snapshots.length} consulta{snapshots.length === 1 ? '' : 's'} guardada{snapshots.length === 1 ? '' : 's'} en este navegador. Esta acción no se puede deshacer.
        </p>
      </div>
      <footer class="modal-footer">
        <button type="button" class="secondary-button" onclick={() => (deleteAllOpen = false)}>Cancelar</button>
        <button type="button" class="danger-button" onclick={confirmDeleteAll}>Eliminar todo</button>
      </footer>
    {/snippet}
  </Modal>
{/if}
