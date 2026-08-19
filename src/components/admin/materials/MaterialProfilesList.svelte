<script lang="ts">
  /**
   * MaterialProfilesList.svelte
   * Sección "Perfiles de filamento" — listado orientado a identidad/configuración (material,
   * fabricante, tipo, uso, validación, acceso al perfil). El stock físico vive en
   * MaterialList.svelte ("Stock de filamentos"); esta lista no repite esas columnas.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { MaterialListItem } from '../../../lib/materials/inventory';
  import { MATERIAL_TYPES, MATERIAL_USAGE_OPTIONS, VALIDATION_STATUS_OPTIONS, optionLabel } from '../../../data/admin/materials.constants';

  interface Props {
    items: MaterialListItem[];
    allCount: number;
    onSelect: (item: MaterialListItem) => void;
    onCreateFirst: () => void;
    onClearFilters: () => void;
  }

  let { items, allCount, onSelect, onCreateFirst, onClearFilters }: Props = $props();

  function rowLabel(item: MaterialListItem): string {
    return `Ver perfil de ${item.profile.name}`;
  }

  function handleRowKeydown(event: KeyboardEvent, item: MaterialListItem) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item);
    }
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
    <h3>No encontramos perfiles con estos filtros.</h3>
    <p>Prueba ajustando el tipo, el uso o la validación.</p>
    <button type="button" class="secondary-button" onclick={onClearFilters}>Limpiar filtros</button>
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Perfiles de filamento de KUBO, orden alfabético</caption>
      <thead>
        <tr>
          <th scope="col">Material</th>
          <th scope="col">Fabricante</th>
          <th scope="col">Tipo</th>
          <th scope="col">Uso</th>
          <th scope="col">Validación</th>
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
                  {#if item.profile.internalCode}<span class="mono-strong">{item.profile.internalCode}</span>{/if}
                </span>
              </span>
            </td>
            <td>{[item.profile.manufacturer, item.profile.productLine].filter(Boolean).join(' · ') || '—'}</td>
            <td>{optionLabel(MATERIAL_TYPES, item.profile.materialType)}</td>
            <td>{optionLabel(MATERIAL_USAGE_OPTIONS, item.profile.usage)}</td>
            <td><span class={`status-chip status-${item.profile.validationStatus}`}>{optionLabel(VALIDATION_STATUS_OPTIONS, item.profile.validationStatus)}</span></td>
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
        </div>
        <span class="material-card-meta">{[item.profile.manufacturer, item.profile.productLine].filter(Boolean).join(' · ') || 'Sin fabricante'}</span>
        <span class="material-card-meta">{optionLabel(MATERIAL_TYPES, item.profile.materialType)} · {optionLabel(MATERIAL_USAGE_OPTIONS, item.profile.usage)}</span>
        <div class="material-card-bottom">
          <span class={`status-chip status-${item.profile.validationStatus}`}>{optionLabel(VALIDATION_STATUS_OPTIONS, item.profile.validationStatus)}</span>
        </div>
      </button>
    {/each}
  </div>
{/if}
