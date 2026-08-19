<script lang="ts">
  /**
   * PrintersListWorkspace.svelte
   * Listado de Producción → Equipos (spec §15) — preparado para varias impresoras, pero con una
   * sola A1 no llena la pantalla artificialmente: una fila, sin paginación ni filtros todavía.
   * A diferencia de Materiales (estado puro de sesión), Equipos persiste a localStorage (spec §20)
   * porque el detalle vive en una ruta Astro real (`/admin/equipos/[id]`) — sin persistencia,
   * navegar ahí perdería todo lo que el usuario editó en esta página.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import PrinterProfileForm from './PrinterProfileForm.svelte';
  import { DEMO_MAINTENANCE_RULES, DEMO_PRINTERS } from '../../../data/admin/printers.mock';
  import { PRINTER_STATUS_OPTIONS, MAINTENANCE_STATUS_OPTIONS, optionLabel } from '../../../data/admin/printers.constants';
  import type { PrinterProfile, PrinterProfileFormValues, MaintenanceEvent } from '../../../data/admin/printers.types';
  import { loadStoredPrinters, persistPrinters, loadStoredMaintenanceEvents } from '../../../lib/printers/storage';
  import { formatDateLong, formatMinutesAsHours, formatWeightG } from '../../../lib/printers/format';
  import { buildMaintenanceAlerts, overallMaintenanceStatus } from '../../../lib/printers/maintenance';
  import { buildPrinterProfile } from '../../../lib/printers/model';

  let printers = $state<PrinterProfile[]>(loadStoredPrinters() ?? DEMO_PRINTERS.map((p) => ({ ...p })));
  let events = $state<MaintenanceEvent[]>(loadStoredMaintenanceEvents() ?? []);

  $effect(() => {
    persistPrinters(printers);
  });

  let rows = $derived(
    printers.map((printer) => {
      const alerts = buildMaintenanceAlerts(printer, DEMO_MAINTENANCE_RULES, events);
      return { printer, maintenanceStatus: overallMaintenanceStatus(alerts) };
    })
  );

  let createFormOpen = $state(false);
  let feedback = $state<string | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  function showFeedback(message: string) {
    feedback = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, 3200);
  }

  function openCreate() {
    createFormOpen = true;
  }

  function closeCreate() {
    createFormOpen = false;
  }

  function handleCreateSubmit(values: PrinterProfileFormValues) {
    // Impresora independiente y nueva: buildPrinterProfile arranca sus contadores en 0 y nunca
    // copia historial/mantenimiento de otra máquina (spec §4/§24) — no se toca nada más.
    const created = buildPrinterProfile(values);
    printers = [...printers, created];
    createFormOpen = false;
    showFeedback('Impresora agregada.');
  }
</script>

<div class="materials-header reveal" style="--delay: 0ms">
  <div class="page-heading">
    <div class="eyebrow-line">
      <span class="page-index">PRODUCCIÓN</span>
    </div>
    <h1>Equipos</h1>
    <p>Perfiles de impresora, uso registrado por KUBO y estado de mantenimiento.</p>
  </div>
  <div class="materials-header-actions">
    <button type="button" class="primary-button" onclick={openCreate}>
      <KuboIcon name="plus" size={16} />
      Agregar impresora
    </button>
  </div>
</div>

<section class="panel reveal materials-section" style="--delay: 60ms" aria-labelledby="printers-section-list">
  <div class="panel-header">
    <div>
      <h2 id="printers-section-list">Impresoras</h2>
      <p class="field-hint panel-header-meta">{rows.length} equipo{rows.length === 1 ? '' : 's'} registrado{rows.length === 1 ? '' : 's'}</p>
    </div>
  </div>

  {#if rows.length === 0}
    <div class="list-empty-panel">
      <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="server" size={22} /></span>
      <h3>Todavía no hay impresoras registradas.</h3>
      <p>Agrega la primera impresora para empezar a registrar uso y mantenimiento en KUBO.</p>
      <button type="button" class="primary-button" onclick={openCreate}>
        <KuboIcon name="plus" size={16} />
        Agregar primera impresora
      </button>
    </div>
  {:else}
  <div class="table-shell desktop-table">
    <table>
      <caption class="sr-only">Impresoras registradas en KUBO</caption>
      <thead>
        <tr>
          <th scope="col">Equipo</th>
          <th scope="col">Estado</th>
          <th scope="col">Horas</th>
          <th scope="col">Impresiones</th>
          <th scope="col">Filamento</th>
          <th scope="col">Mantenimiento</th>
          <th scope="col">Última actividad</th>
          <th scope="col"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.printer.id)}
          <tr>
            <td>
              <strong>{row.printer.internalName}</strong>
              <div class="field-hint">{row.printer.manufacturer} {row.printer.model}</div>
            </td>
            <td><span class={`status-chip status-${row.printer.status}`}>{optionLabel(PRINTER_STATUS_OPTIONS, row.printer.status)}</span></td>
            <td class="mono-strong">{formatMinutesAsHours(row.printer.counters.printMinutesTotal)}</td>
            <td class="mono-strong">{row.printer.counters.printsTotal}</td>
            <td class="mono-strong">{formatWeightG(row.printer.counters.filamentGramsTotal)}</td>
            <td><span class={`status-chip status-${row.maintenanceStatus}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, row.maintenanceStatus)}</span></td>
            <td>{row.printer.counters.lastPrintAt ? formatDateLong(row.printer.counters.lastPrintAt) : 'Sin actividad registrada'}</td>
            <td>
              <a class="text-link" href={`/admin/produccion/equipos/${row.printer.id}/`}>Ver detalle</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="mobile-list mobile-only">
    {#each rows as row (row.printer.id)}
      <a class="mobile-data-card" href={`/admin/produccion/equipos/${row.printer.id}/`}>
        <div class="material-card-top">
          <strong>{row.printer.internalName}</strong>
          <span class={`status-chip status-${row.printer.status}`}>{optionLabel(PRINTER_STATUS_OPTIONS, row.printer.status)}</span>
        </div>
        <span class="material-card-meta">{row.printer.manufacturer} {row.printer.model}</span>
        <span class="material-card-meta">{formatMinutesAsHours(row.printer.counters.printMinutesTotal)} · {row.printer.counters.printsTotal} impresiones · {formatWeightG(row.printer.counters.filamentGramsTotal)}</span>
        <div class="material-card-top">
          <span class={`status-chip status-${row.maintenanceStatus}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, row.maintenanceStatus)}</span>
          <span class="text-link">Ver detalle <KuboIcon name="nav-arrow-right" size={14} /></span>
        </div>
      </a>
    {/each}
  </div>
  {/if}
</section>

{#if createFormOpen}
  <PrinterProfileForm mode="create" printer={null} existingPrinters={printers} onSubmit={handleCreateSubmit} onCancel={closeCreate} />
{/if}

{#if feedback}
  <div class="expenses-feedback" role="status" aria-live="polite">
    <KuboIcon name="check" size={16} />
    {feedback}
  </div>
{/if}
