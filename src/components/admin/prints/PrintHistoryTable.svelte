<script lang="ts">
  /**
   * PrintHistoryTable.svelte
   * Historial de impresiones (spec "Historial"): tabla densa en desktop, rows deliberadas en
   * mobile — nunca la misma tabla comprimida (docs/admin-ui-rules.md "Responsive").
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { PrintRecord } from '../../../data/admin/prints.types';
  import { PRINT_PURPOSE_OPTIONS, PRINT_RESULT_OPTIONS, PRINT_RESULT_STATUS_CLASS, optionLabel } from '../../../data/admin/prints.constants';
  import { formatDateLong, formatMinutesAsHours, formatWeightG } from '../../../lib/prints/format';

  interface Props {
    records: PrintRecord[];
    allCount: number;
    onView: (record: PrintRecord) => void;
    onEdit: (record: PrintRecord) => void;
    onDuplicate: (record: PrintRecord) => void;
    onDelete: (record: PrintRecord) => void;
    onCreateFirst: () => void;
    onClearFilters: () => void;
  }

  let { records, allCount, onView, onEdit, onDuplicate, onDelete, onCreateFirst, onClearFilters }: Props = $props();

  function totalGrams(record: PrintRecord): number {
    return record.materials.reduce((sum, m) => sum + m.consumedG, 0);
  }

  function materialSummary(record: PrintRecord): string {
    return record.materials.map((m) => m.materialSnapshot.name).join(', ');
  }
</script>

{#if records.length === 0}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="printing-page" size={22} /></span>
    {#if allCount === 0}
      <h3>Aún no hay impresiones registradas.</h3>
      <p>Registra la primera para empezar a descontar stock real y acumular uso en Equipos.</p>
      <button type="button" class="primary-button" onclick={onCreateFirst}>
        <KuboIcon name="plus" size={16} />
        Registrar impresión
      </button>
    {:else}
      <h3>Sin resultados con estos filtros.</h3>
      <p>Ajusta los filtros o límpialos para ver el historial completo.</p>
      <button type="button" class="secondary-button" onclick={onClearFilters}>Limpiar filtros</button>
    {/if}
  </div>
{:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Historial de impresiones</caption>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Fecha</th>
          <th scope="col">Trabajo</th>
          <th scope="col">Impresora</th>
          <th scope="col">Finalidad</th>
          <th scope="col">Resultado</th>
          <th scope="col">Tiempo</th>
          <th scope="col">Material / gramos</th>
          <th scope="col">Piezas</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each records as record (record.id)}
          <tr>
            <td class="mono-strong">{record.displayId}</td>
            <td>{formatDateLong(record.date)}</td>
            <td>{record.name}</td>
            <td>{record.printerSnapshot.name}</td>
            <td>{optionLabel(PRINT_PURPOSE_OPTIONS, record.purpose)}</td>
            <td><span class={`status-chip ${PRINT_RESULT_STATUS_CLASS[record.result]}`}>{optionLabel(PRINT_RESULT_OPTIONS, record.result)}</span></td>
            <td class="mono-strong">{formatMinutesAsHours(record.durationMinutes)}</td>
            <td>
              <span>{materialSummary(record)}</span>
              <span class="field-hint">{formatWeightG(totalGrams(record))}</span>
            </td>
            <td class="mono-strong">{record.producedUnits}{#if record.plannedUnits !== undefined} / {record.plannedUnits}{/if}</td>
            <td>
              <div class="table-row-actions">
                <button type="button" class="icon-button" onclick={() => onView(record)} aria-label={`Ver impresión ${record.displayId}`}><KuboIcon name="nav-arrow-right" size={16} /></button>
                <button type="button" class="icon-button" onclick={() => onEdit(record)} aria-label={`Editar impresión ${record.displayId}`}><KuboIcon name="edit-pencil" size={16} /></button>
                <button type="button" class="icon-button" onclick={() => onDuplicate(record)} aria-label={`Duplicar impresión ${record.displayId}`}><KuboIcon name="copy" size={16} /></button>
                <button type="button" class="icon-button" onclick={() => onDelete(record)} aria-label={`Eliminar impresión ${record.displayId}`}><KuboIcon name="trash" size={16} /></button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each records as record (record.id)}
      <div class="mobile-data-card">
        <div class="material-card-top">
          <strong class="mono-strong">{record.displayId}</strong>
          <span class={`status-chip ${PRINT_RESULT_STATUS_CLASS[record.result]}`}>{optionLabel(PRINT_RESULT_OPTIONS, record.result)}</span>
        </div>
        <span class="material-card-meta">{record.name}</span>
        <span class="material-card-meta">{formatDateLong(record.date)} · {record.printerSnapshot.name}</span>
        <span class="material-card-meta">{optionLabel(PRINT_PURPOSE_OPTIONS, record.purpose)} · {formatMinutesAsHours(record.durationMinutes)}</span>
        <span class="material-card-meta">{materialSummary(record)} · {formatWeightG(totalGrams(record))}</span>
        <span class="material-card-meta">Piezas: {record.producedUnits}{#if record.plannedUnits !== undefined} / {record.plannedUnits}{/if}</span>
        <div class="table-row-actions" style="margin-top: var(--space-2);">
          <button type="button" class="icon-button" onclick={() => onView(record)} aria-label={`Ver impresión ${record.displayId}`}><KuboIcon name="nav-arrow-right" size={16} /></button>
          <button type="button" class="icon-button" onclick={() => onEdit(record)} aria-label={`Editar impresión ${record.displayId}`}><KuboIcon name="edit-pencil" size={16} /></button>
          <button type="button" class="icon-button" onclick={() => onDuplicate(record)} aria-label={`Duplicar impresión ${record.displayId}`}><KuboIcon name="copy" size={16} /></button>
          <button type="button" class="icon-button" onclick={() => onDelete(record)} aria-label={`Eliminar impresión ${record.displayId}`}><KuboIcon name="trash" size={16} /></button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .table-row-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
</style>
