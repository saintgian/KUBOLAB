<script lang="ts">
  /**
   * MaterialList.svelte
   * Sección "Stock de filamentos" — inventario físico completo (spec: stock disponible por peso,
   * bobinas abiertas/selladas, stock mínimo, última compra derivada, estado). No repite
   * tipo/uso/validación: esas columnas viven en MaterialProfilesList.svelte ("Perfiles de
   * filamento"). Tabla real en desktop (`.table-shell`), tarjetas en mobile (`.mobile-data-card`,
   * oculto por CSS >=768px) con anatomía apilada fija (nunca comprimida en fila, spec responsive).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { MaterialListItem } from '../../../lib/materials/inventory';
  import { STOCK_STATUS_OPTIONS, optionLabel } from '../../../data/admin/materials.constants';
  import { formatDateLong, formatDateShort, formatWeightG } from '../../../lib/materials/format';

  interface Props {
    items: MaterialListItem[];
    allCount: number;
    onSelect: (item: MaterialListItem) => void;
    onCreateFirst: () => void;
    onClearFilters: () => void;
  }

  let { items, allCount, onSelect, onCreateFirst, onClearFilters }: Props = $props();

  function handleRowKeydown(event: KeyboardEvent, item: MaterialListItem) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item);
    }
  }

  function rowLabel(item: MaterialListItem): string {
    return `Ver detalle de ${item.profile.name}, ${formatWeightG(item.stockG)} disponibles`;
  }

  function spoolMeta(item: MaterialListItem): string {
    const { total, open, sealed } = item.spoolCounts;
    if (total === 0) return 'Sin bobinas';
    const parts = [`${total} bobina${total === 1 ? '' : 's'}`];
    if (open > 0) parts.push(`${open} abierta${open === 1 ? '' : 's'}`);
    if (sealed > 0) parts.push(`${sealed} sellada${sealed === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }
</script>

{#if allCount === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="flask" size={22} /></span>
    <h3>Todavía no hay perfiles de filamento.</h3>
    <p>Crea el primer perfil para empezar a controlar stock, compras y parámetros de impresión.</p>
    <button type="button" class="primary-button" onclick={onCreateFirst}>
      <KuboIcon name="plus" size={16} />
      Crear primer perfil
    </button>
  </div>
{:else if items.length === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="search" size={22} /></span>
    <h3>No encontramos materiales con estos filtros.</h3>
    <p>Prueba ajustando el tipo, el uso, la validación o el estado de stock.</p>
    <button type="button" class="secondary-button" onclick={onClearFilters}>Limpiar filtros</button>
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Stock de filamentos de KUBO, orden alfabético</caption>
      <thead>
        <tr>
          <th scope="col">Material</th>
          <th scope="col">Stock disponible</th>
          <th scope="col">Bobinas</th>
          <th scope="col">Stock mínimo</th>
          <th scope="col">Última compra</th>
          <th scope="col">Estado stock</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.profile.id)}
          <tr class="material-row" tabindex="0" aria-label={rowLabel(item)} onclick={() => onSelect(item)} onkeydown={(event) => handleRowKeydown(event, item)}>
            <td>
              <span class="material-name-cell">
                <span class="material-swatch" class:is-empty={!item.profile.colorHex} style={item.profile.colorHex ? `background:${item.profile.colorHex};` : ''}></span>
                <span class="material-name-cell-text">
                  <strong>{item.profile.name}</strong>
                  {#if item.profile.manufacturer || item.profile.productLine}
                    <span>{[item.profile.manufacturer, item.profile.productLine].filter(Boolean).join(' · ')}</span>
                  {/if}
                </span>
              </span>
            </td>
            <td class="mono-strong">{formatWeightG(item.stockG)}</td>
            <td>{spoolMeta(item)}</td>
            <td class="mono-strong">{formatWeightG(item.profile.minimumStockG)}</td>
            <td class="mono-strong">{formatDateLong(item.lastPurchaseDate)}</td>
            <td><span class={`status-chip status-${item.stockStatus}`}>{optionLabel(STOCK_STATUS_OPTIONS, item.stockStatus)}</span></td>
            <td>
              <span class="row-action" aria-hidden="true"><KuboIcon name="nav-arrow-right" size={16} /></span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each items as item (item.profile.id)}
      <button type="button" class="mobile-data-card material-card" onclick={() => onSelect(item)}>
        <div class="material-card-top">
          <span class="material-name-cell">
            <span class="material-swatch" class:is-empty={!item.profile.colorHex} style={item.profile.colorHex ? `background:${item.profile.colorHex};` : ''}></span>
            <strong>{item.profile.name}</strong>
          </span>
          <span class="material-stock-cell" style="text-align:right;">
            <strong>{formatWeightG(item.stockG)}</strong>
          </span>
        </div>
        <span class="material-card-meta">{[item.profile.manufacturer, item.profile.productLine].filter(Boolean).join(' · ') || 'Sin fabricante'}</span>
        <span class="material-card-meta">{spoolMeta(item)}</span>
        <div class="material-card-bottom">
          <span class="material-card-meta">Últ. compra: {formatDateShort(item.lastPurchaseDate)}</span>
          <span class={`status-chip status-${item.stockStatus}`}>{optionLabel(STOCK_STATUS_OPTIONS, item.stockStatus)}</span>
        </div>
      </button>
    {/each}
  </div>
{/if}
