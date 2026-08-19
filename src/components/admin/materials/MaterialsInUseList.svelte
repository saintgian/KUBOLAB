<script lang="ts">
  /**
   * MaterialsInUseList.svelte
   * Sección "Filamentos en uso" — una fila por bobina abierta/asignada (lib/materials/inventory.ts
   * `buildInUseSpoolItems`), no por perfil: dos bobinas abiertas del mismo perfil son dos
   * asignaciones físicas distintas. `assignedTo` solo se muestra cuando existe (nunca se inventa
   * una asignación a producción/pedido).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { InUseSpoolItem } from '../../../lib/materials/inventory';
  import { MATERIAL_TYPES, SPOOL_STATUS_OPTIONS, optionLabel } from '../../../data/admin/materials.constants';
  import { formatWeightG } from '../../../lib/materials/format';

  interface Props {
    items: InUseSpoolItem[];
    allCount: number;
    onSelect: (profileId: string) => void;
  }

  let { items, allCount, onSelect }: Props = $props();

  function rowLabel(item: InUseSpoolItem): string {
    return `Ver detalle de ${item.profile.name}, ${formatWeightG(item.spool.remainingWeightG)} restantes en esta bobina`;
  }

  function handleRowKeydown(event: KeyboardEvent, item: InUseSpoolItem) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item.profile.id);
    }
  }
</script>

{#if allCount === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="flask" size={22} /></span>
    <h3>No hay bobinas en uso.</h3>
    <p>Cuando abras una bobina desde Stock, aparecerá aquí mientras esté activa.</p>
  </div>
{:else if items.length === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="search" size={22} /></span>
    <h3>Ninguna bobina en uso coincide con estos filtros.</h3>
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Bobinas actualmente en uso, una fila por bobina</caption>
      <thead>
        <tr>
          <th scope="col">Material</th>
          <th scope="col">Peso restante</th>
          <th scope="col">Estado</th>
          <th scope="col">Ubicación</th>
          <th scope="col">Asignación</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.spool.id)}
          <tr class="material-row" tabindex="0" aria-label={rowLabel(item)} onclick={() => onSelect(item.profile.id)} onkeydown={(event) => handleRowKeydown(event, item)}>
            <td>
              <span class="material-name-cell">
                <span class="material-swatch" class:is-empty={!item.profile.colorHex} style={item.profile.colorHex ? `background:${item.profile.colorHex};` : ''}></span>
                <span class="material-name-cell-text">
                  <strong>{item.profile.name}</strong>
                  <span>{[item.profile.manufacturer, optionLabel(MATERIAL_TYPES, item.profile.materialType)].filter(Boolean).join(' · ')}</span>
                </span>
              </span>
            </td>
            <td class="mono-strong">{formatWeightG(item.spool.remainingWeightG)}</td>
            <td><span class={`status-chip status-${item.spool.status}`}>{optionLabel(SPOOL_STATUS_OPTIONS, item.spool.status)}</span></td>
            <td>{item.spool.location ?? item.profile.defaultLocation ?? '—'}</td>
            <td>{item.spool.assignedTo ?? '—'}</td>
            <td>
              <span class="row-action" aria-hidden="true"><KuboIcon name="nav-arrow-right" size={16} /></span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each items as item (item.spool.id)}
      <button type="button" class="mobile-data-card material-card" onclick={() => onSelect(item.profile.id)}>
        <div class="material-card-top">
          <span class="material-name-cell">
            <span class="material-swatch" class:is-empty={!item.profile.colorHex} style={item.profile.colorHex ? `background:${item.profile.colorHex};` : ''}></span>
            <strong>{item.profile.name}</strong>
          </span>
          <span class="material-stock-cell" style="text-align:right;">
            <strong>{formatWeightG(item.spool.remainingWeightG)}</strong>
          </span>
        </div>
        <span class="material-card-meta">{[item.profile.manufacturer, optionLabel(MATERIAL_TYPES, item.profile.materialType)].filter(Boolean).join(' · ')}</span>
        <span class="material-card-meta">
          {optionLabel(SPOOL_STATUS_OPTIONS, item.spool.status)} · {item.spool.location ?? item.profile.defaultLocation ?? 'Sin ubicación'}
        </span>
        <div class="material-card-bottom">
          <span class="material-card-meta">Asignación: {item.spool.assignedTo ?? 'Sin asignar'}</span>
        </div>
      </button>
    {/each}
  </div>
{/if}
