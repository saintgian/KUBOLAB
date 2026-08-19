<script lang="ts">
  /**
   * PrintDetailModal.svelte
   * "Ver" del historial — solo lectura, muestra el snapshot histórico guardado (spec "Snapshot
   * histórico"), no el estado actual de impresora/material si estos cambiaron después.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { PrintRecord } from '../../../data/admin/prints.types';
  import { PRINT_PURPOSE_OPTIONS, PRINT_RESULT_OPTIONS, PRINT_RESULT_STATUS_CLASS, optionLabel } from '../../../data/admin/prints.constants';
  import { formatDateLong, formatMinutesAsHours, formatWeightG } from '../../../lib/prints/format';

  interface Props {
    record: PrintRecord;
    onClose: () => void;
  }

  let { record, onClose }: Props = $props();
</script>

<Modal onClose={onClose} labelledBy="print-detail-title" size="default">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">{record.displayId}</p>
        <h2 id="print-detail-title">{record.name}</h2>
        <span class={`status-chip ${PRINT_RESULT_STATUS_CLASS[record.result]}`} style="margin-top: var(--space-2);">{optionLabel(PRINT_RESULT_OPTIONS, record.result)}</span>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onClose} aria-label="Cerrar detalle de impresión">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <div class="modal-body">
      <p class="filters-panel-title" style="margin-bottom: var(--space-3);">IDENTIFICACIÓN</p>
      <dl class="drawer-fields">
        <div class="drawer-field"><dt>Fecha</dt><dd>{formatDateLong(record.date)}</dd></div>
        <div class="drawer-field"><dt>Finalidad</dt><dd>{optionLabel(PRINT_PURPOSE_OPTIONS, record.purpose)}</dd></div>
        {#if record.relatedOrderId}<div class="drawer-field"><dt>Pedido relacionado</dt><dd>{record.relatedOrderId}</dd></div>{/if}
        {#if record.relatedProjectId}<div class="drawer-field"><dt>Proyecto relacionado</dt><dd>{record.relatedProjectId}</dd></div>{/if}
      </dl>

      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">EQUIPO (SNAPSHOT AL MOMENTO)</p>
      <dl class="drawer-fields">
        <div class="drawer-field"><dt>Impresora</dt><dd>{record.printerSnapshot.name} · {record.printerSnapshot.model}</dd></div>
        <div class="drawer-field"><dt>Configuración instalada</dt><dd class="mono-strong">{record.printerSnapshot.nozzleDiameterMm} mm · {record.printerSnapshot.nozzleMaterial}</dd></div>
        {#if record.printerSnapshot.buildPlate}<div class="drawer-field"><dt>Placa</dt><dd>{record.printerSnapshot.buildPlate}</dd></div>{/if}
      </dl>

      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">PRODUCCIÓN</p>
      <dl class="drawer-fields">
        <div class="drawer-field"><dt>Tiempo real</dt><dd class="mono-strong">{formatMinutesAsHours(record.durationMinutes)}</dd></div>
        <div class="drawer-field"><dt>Piezas obtenidas</dt><dd class="mono-strong">{record.producedUnits}{#if record.plannedUnits !== undefined} / {record.plannedUnits} planificadas{/if}</dd></div>
        {#if record.issueNote}<div class="drawer-field"><dt>Incidencia</dt><dd>{record.issueNote}</dd></div>{/if}
      </dl>

      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">MATERIALES</p>
      <dl class="drawer-fields">
        {#each record.materials as usage, index (index)}
          <div class="drawer-field">
            <dt>{usage.materialSnapshot.name}</dt>
            <dd class="mono-strong">
              {formatWeightG(usage.consumedG)}
              {#if usage.wastedG}· {formatWeightG(usage.wastedG)} desperdicio{/if}
            </dd>
          </div>
        {/each}
      </dl>

      {#if record.notes}
        <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">NOTAS</p>
        <p class="field-hint">{record.notes}</p>
      {/if}
    </div>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onClose}>Cerrar</button>
    </footer>
  {/snippet}
</Modal>
