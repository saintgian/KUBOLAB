<script lang="ts">
  /**
   * PrintsWorkspace.svelte
   * Unidad reactiva de Producción → Impresiones (docs/specs/admin-production-prints-spec.md).
   * Orquesta tres datasets persistidos por separado — impresiones (lib/prints/storage.ts),
   * impresoras/eventos de mantenimiento (lib/printers/storage.ts) y materiales (lib/materials/
   * storage.ts) — y aplica SIEMPRE las mutaciones a través de lib/prints/model.ts (spec
   * "Centralizar estas mutaciones en store/service, no en componentes"): este componente nunca
   * calcula un `remainingWeightG` o un contador de impresora a mano.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import PrintRecordForm from './PrintRecordForm.svelte';
  import PrintDetailModal from './PrintDetailModal.svelte';
  import PrintDeleteConfirm from './PrintDeleteConfirm.svelte';
  import PrintsToolbar from './PrintsToolbar.svelte';
  import PrintHistoryTable from './PrintHistoryTable.svelte';
  import { DEMO_PRINTERS, DEMO_MAINTENANCE_RULES, DEMO_MAINTENANCE_EVENTS } from '../../../data/admin/printers.mock';
  import { DEMO_PROFILES, DEMO_SPOOLS, DEMO_MOVEMENTS } from '../../../data/admin/materials.mock';
  import { DEMO_PRINTS, DEMO_GUIDANCE_RULES } from '../../../data/admin/prints.mock';
  import type { PrinterProfile, MaintenanceEvent } from '../../../data/admin/printers.types';
  import type { FilamentProfile, FilamentSpool, MaterialMovement } from '../../../data/admin/materials.types';
  import type { PrintRecord, PrintRecordFormValues } from '../../../data/admin/prints.types';
  import { MAINTENANCE_STATUS_OPTIONS, NOZZLE_MATERIAL_OPTIONS, PRINTER_STATUS_OPTIONS, optionLabel as printerOptionLabel } from '../../../data/admin/printers.constants';
  import { loadStoredPrinters, persistPrinters, loadStoredMaintenanceEvents, persistMaintenanceEvents } from '../../../lib/printers/storage';
  import { loadStoredProfiles, loadStoredSpools, loadStoredMovements, persistProfiles, persistSpools, persistMovements } from '../../../lib/materials/storage';
  import { loadStoredPrints, persistPrints } from '../../../lib/prints/storage';
  import { formatMinutesAsHours, formatWeightG, formatDateLong, todayIso } from '../../../lib/prints/format';
  import { defaultPrintFilters, filterPrints, sortPrintsByDateDesc } from '../../../lib/prints/filters';
  import { buildMaintenanceAlerts, overallMaintenanceStatus, alertsNeedingAttention, type MaintenanceAlert } from '../../../lib/printers/maintenance';
  import { buildPrintRecord, deletePrintMaterialEffects, duplicatePrintDraft, reconcilePrinterCounters } from '../../../lib/prints/model';

  let printers = $state<PrinterProfile[]>(loadStoredPrinters() ?? DEMO_PRINTERS.map((p) => ({ ...p })));
  let maintenanceEvents = $state<MaintenanceEvent[]>(loadStoredMaintenanceEvents() ?? [...DEMO_MAINTENANCE_EVENTS]);
  let profiles = $state<FilamentProfile[]>(loadStoredProfiles() ?? [...DEMO_PROFILES]);
  let spools = $state<FilamentSpool[]>(loadStoredSpools() ?? [...DEMO_SPOOLS]);
  let movements = $state<MaterialMovement[]>(loadStoredMovements() ?? [...DEMO_MOVEMENTS]);
  let prints = $state<PrintRecord[]>(loadStoredPrints() ?? [...DEMO_PRINTS]);

  $effect(() => persistPrinters(printers));
  $effect(() => persistMaintenanceEvents(maintenanceEvents));
  $effect(() => persistProfiles(profiles));
  $effect(() => persistSpools(spools));
  $effect(() => persistMovements(movements));
  $effect(() => persistPrints(prints));

  let selectedPrinterId = $state<string>(printers[0]?.id ?? '');
  let selectedPrinter = $derived(printers.find((p) => p.id === selectedPrinterId) ?? null);

  let alerts = $derived<MaintenanceAlert[]>(selectedPrinter ? buildMaintenanceAlerts(selectedPrinter, DEMO_MAINTENANCE_RULES, maintenanceEvents) : []);
  let overallStatus = $derived(overallMaintenanceStatus(alerts));
  let pendingAlerts = $derived(alertsNeedingAttention(alerts));

  let filters = $state(defaultPrintFilters());
  let filteredPrints = $derived(sortPrintsByDateDesc(filterPrints(prints, filters)));
  let materialTypeOptions = $derived.by(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const record of prints) {
      for (const m of record.materials) {
        if (!seen.has(m.materialType)) {
          seen.add(m.materialType);
          options.push({ value: m.materialType, label: m.materialType });
        }
      }
    }
    return options;
  });

  function successRate(printer: PrinterProfile): string | null {
    const total = printer.counters.printsTotal;
    if (total === 0) return null;
    return `${Math.round((printer.counters.printsSuccessful / total) * 100)}%`;
  }

  function maintenanceStatesForPrinter(printerId: string): string[] {
    if (printerId !== selectedPrinterId) return [];
    return [...new Set(alerts.map((a) => a.status))];
  }

  function previousMaterialTypesForPrinter(printerId: string): string[] {
    const recent = prints
      .filter((p) => p.printerId === printerId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 3);
    return [...new Set(recent.flatMap((p) => p.materials.map((m) => m.materialType)))];
  }

  type FormTarget = { mode: 'create' | 'edit'; initial: PrintRecordFormValues | null; existing?: PrintRecord };
  let formTarget = $state<FormTarget | null>(null);
  let viewTarget = $state<PrintRecord | null>(null);
  let deleteTarget = $state<PrintRecord | null>(null);

  let feedbackLines = $state<string[] | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let returnFocusEl: HTMLElement | null = null;

  function captureFocus() {
    returnFocusEl = document.activeElement as HTMLElement | null;
  }
  function restoreFocus() {
    returnFocusEl?.focus();
    returnFocusEl = null;
  }
  function showFeedback(lines: string[]) {
    feedbackLines = lines;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedbackLines = null;
    }, 5200);
  }

  function openCreate() {
    captureFocus();
    formTarget = { mode: 'create', initial: null };
  }
  function openEdit(record: PrintRecord) {
    captureFocus();
    const initial: PrintRecordFormValues = {
      date: record.date,
      name: record.name,
      purpose: record.purpose,
      result: record.result,
      printerId: record.printerId,
      durationMinutes: record.durationMinutes,
      plannedUnits: record.plannedUnits,
      producedUnits: record.producedUnits,
      materials: record.materials.map((m) => ({ profileId: m.profileId, spoolId: m.spoolId, consumedG: m.consumedG, wastedG: m.wastedG })),
      relatedOrderId: record.relatedOrderId,
      relatedProjectId: record.relatedProjectId,
      issueNote: record.issueNote,
      notes: record.notes,
    };
    formTarget = { mode: 'edit', initial, existing: record };
  }
  function openDuplicate(record: PrintRecord) {
    captureFocus();
    formTarget = { mode: 'create', initial: duplicatePrintDraft(record, todayIso()) };
  }
  function closeForm() {
    formTarget = null;
    restoreFocus();
  }

  function openView(record: PrintRecord) {
    captureFocus();
    viewTarget = record;
  }
  function closeView() {
    viewTarget = null;
    restoreFocus();
  }

  function openDelete(record: PrintRecord) {
    captureFocus();
    deleteTarget = record;
  }
  function closeDelete() {
    deleteTarget = null;
    restoreFocus();
  }

  function alertsFor(printer: PrinterProfile): MaintenanceAlert[] {
    return buildMaintenanceAlerts(printer, DEMO_MAINTENANCE_RULES, maintenanceEvents);
  }

  function newlyTriggeredMessage(before: MaintenanceAlert[], after: MaintenanceAlert[]): string {
    const beforeByComponent = new Map(before.map((a) => [a.component.id, a.status]));
    const triggered = after.find((a) => (a.status === 'review' || a.status === 'attention') && beforeByComponent.get(a.component.id) !== a.status);
    if (!triggered) return 'Sin nuevas acciones de mantenimiento.';
    return `Nueva revisión: ${triggered.component.label} · ${printerOptionLabel(MAINTENANCE_STATUS_OPTIONS, triggered.status)}`;
  }

  function handleFormSubmit(values: PrintRecordFormValues) {
    const target = formTarget;
    if (!target) return;
    const printer = printers.find((p) => p.id === values.printerId);
    if (!printer) return;

    const beforeAlerts = alertsFor(printer);
    const beforeMinutes = printer.counters.printMinutesTotal;

    const result = buildPrintRecord(values, {
      profiles,
      spools,
      movements,
      printer,
      existing: target.existing,
      existingPrints: prints,
    });

    const { record, spools: nextSpools, movements: nextMovements } = result;
    spools = nextSpools;
    movements = nextMovements;
    prints = target.existing ? prints.map((p) => (p.id === record.id ? record : p)) : [...prints, record];

    const reconciled = reconcilePrinterCounters(printer, prints);
    printers = printers.map((p) => (p.id === reconciled.id ? reconciled : p));

    const afterAlerts = alertsFor(reconciled);
    const deltaMinutes = reconciled.counters.printMinutesTotal - beforeMinutes;
    const materialLines = record.materials.map((m) => `${m.materialSnapshot.name}: -${formatWeightG(m.consumedG)}`);

    formTarget = null;
    restoreFocus();
    showFeedback([
      target.existing ? 'Impresión actualizada' : 'Impresión registrada',
      ...materialLines,
      `${reconciled.internalName}: +${formatMinutesAsHours(deltaMinutes)}`,
      newlyTriggeredMessage(beforeAlerts, afterAlerts),
    ]);
  }

  function confirmDelete() {
    const record = deleteTarget;
    if (!record) return;
    const printer = printers.find((p) => p.id === record.printerId);
    const reverted = deletePrintMaterialEffects(record, spools, movements);
    spools = reverted.spools;
    movements = reverted.movements;
    prints = prints.filter((p) => p.id !== record.id);
    if (printer) {
      const reconciled = reconcilePrinterCounters(printer, prints);
      printers = printers.map((p) => (p.id === reconciled.id ? reconciled : p));
    }
    deleteTarget = null;
    restoreFocus();
    showFeedback(['Impresión eliminada — stock y uso revertidos.']);
  }

  function clearFilters() {
    Object.assign(filters, defaultPrintFilters());
  }
</script>

<div class="materials-header reveal" style="--delay: 0ms">
  <div class="page-heading">
    <div class="eyebrow-line">
      <span class="page-index">PRODUCCIÓN</span>
      <span class="demo-chip">DATOS DEMO</span>
    </div>
    <h1>Impresiones</h1>
    <p>Registro real de fabricación — descuenta Materiales y alimenta Equipos.</p>
  </div>
  <div class="materials-header-actions">
    <button type="button" class="primary-button" onclick={openCreate} disabled={!selectedPrinter}>
      <KuboIcon name="plus" size={16} />
      Registrar impresión
    </button>
  </div>
</div>

{#if !selectedPrinter}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="server" size={22} /></span>
    <h3>No hay impresoras registradas.</h3>
    <p>Registra una impresora en Producción → Equipos antes de comenzar a registrar impresiones.</p>
    <a class="primary-button" href="/admin/produccion/equipos/">Ir a Equipos</a>
  </div>
{:else}
  <section class="materials-overview reveal" style="--delay: 40ms" aria-label="Perfil de la impresora">
    {#if printers.length > 1}
      <div class="field" style="max-width: 320px; margin-bottom: var(--space-3);">
        <label class="field-label" for="prints-printer-select">Impresora</label>
        <Combobox
          id="prints-printer-select"
          value={selectedPrinterId}
          options={printers.map((p) => ({ value: p.id, label: p.internalName }))}
          onChange={(v: string) => (selectedPrinterId = v)}
          ariaLabel="Selecciona una impresora"
        />
      </div>
    {/if}
    <div class="materials-summary">
      <div class="summary-metric">
        <p class="summary-metric-label">{selectedPrinter.internalName}</p>
        <span class="summary-metric-meta">{selectedPrinter.manufacturer} {selectedPrinter.model} · {selectedPrinter.installedConfiguration.nozzleDiameterMm} mm {printerOptionLabel(NOZZLE_MATERIAL_OPTIONS, selectedPrinter.installedConfiguration.nozzleMaterial)}</span>
        <span class={`status-chip status-${selectedPrinter.status}`} style="margin-top: var(--space-2);">{printerOptionLabel(PRINTER_STATUS_OPTIONS, selectedPrinter.status)}</span>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Horas registradas</p>
        <span class="summary-metric-value">{formatMinutesAsHours(selectedPrinter.counters.printMinutesTotal)}</span>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Impresiones</p>
        <span class="summary-metric-value">{selectedPrinter.counters.printsTotal}</span>
        {#if successRate(selectedPrinter)}<p class="summary-metric-meta">{successRate(selectedPrinter)} de éxito</p>{/if}
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Filamento procesado</p>
        <span class="summary-metric-value">{formatWeightG(selectedPrinter.counters.filamentGramsTotal)}</span>
        <p class="summary-metric-meta">{formatWeightG(selectedPrinter.counters.abrasiveFilamentGramsTotal)} abrasivo</p>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Última actividad</p>
        <span class="summary-metric-value" style="font-size: 14px;">{selectedPrinter.counters.lastPrintAt ? formatDateLong(selectedPrinter.counters.lastPrintAt) : 'Sin registrar'}</span>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Estado mantenimiento</p>
        <span class={`status-chip status-${overallStatus}`}>{printerOptionLabel(MAINTENANCE_STATUS_OPTIONS, overallStatus)}</span>
      </div>
    </div>
    <p class="field-hint" style="margin-top: var(--space-3);">Métricas registradas desde la activación del seguimiento en KUBO.</p>
  </section>

  <section class="panel reveal materials-section" style="--delay: 80ms" aria-labelledby="prints-maintenance-heading">
    <div class="panel-header">
      <div>
        <h2 id="prints-maintenance-heading">Mantenimiento / componentes</h2>
        <p class="field-hint panel-header-meta">Progreso hacia el próximo trigger preventivo — no vida útil del repuesto.</p>
      </div>
    </div>
    {#if alerts.length === 0}
      <p class="field-hint">Sin reglas de mantenimiento configuradas para este modelo.</p>
    {:else}
      <div class="maintenance-alert-list">
        {#each alerts as alert (alert.rule.id)}
          <div class="maintenance-alert-row">
            <div class="maintenance-alert-main">
              <strong>{alert.component.label}</strong>
              <span class="field-hint">{alert.rule.triggers.length === 1 && alert.rule.triggers[0].type === 'condition' ? 'Revisión por condición' : ''}</span>
              <span class={`status-chip status-${alert.status}`}>{printerOptionLabel(MAINTENANCE_STATUS_OPTIONS, alert.status)}</span>
            </div>
            <p class="field-hint">{alert.reason}</p>
            {#if alert.progress}
              <div class="maintenance-progress-track" role="progressbar" aria-valuenow={Math.round(alert.progress.currentValue)} aria-valuemin={0} aria-valuemax={alert.progress.thresholdValue} aria-label={`Progreso de ${alert.component.label}`}>
                <div class="maintenance-progress-fill" style={`width:${Math.min(100, (alert.progress.currentValue / alert.progress.thresholdValue) * 100)}%`}></div>
              </div>
            {/if}
            <span class="maintenance-source-tag" class:is-manufacturer={alert.source === 'manufacturer'}>{alert.source === 'manufacturer' ? 'Fuente: Bambu' : 'Fuente: KUBO — regla preventiva'}</span>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <PrintsToolbar filters={filters} printers={printers} materialTypeOptions={materialTypeOptions} resultCount={filteredPrints.length} />

  <section class="panel reveal materials-section" style="--delay: 140ms" aria-labelledby="prints-history-heading">
    <div class="panel-header">
      <div>
        <h2 id="prints-history-heading">Historial</h2>
        <p class="field-hint panel-header-meta">Ver, editar, duplicar o eliminar impresiones registradas</p>
      </div>
    </div>
    <PrintHistoryTable records={filteredPrints} allCount={prints.length} onView={openView} onEdit={openEdit} onDuplicate={openDuplicate} onDelete={openDelete} onCreateFirst={openCreate} onClearFilters={clearFilters} />
  </section>
{/if}

{#if formTarget}
  {#key formTarget}
    <PrintRecordForm
      mode={formTarget.mode}
      initial={formTarget.initial}
      printers={printers}
      profiles={profiles}
      spools={spools}
      guidanceRules={DEMO_GUIDANCE_RULES}
      maintenanceStatesForPrinter={maintenanceStatesForPrinter}
      previousMaterialTypesForPrinter={previousMaterialTypesForPrinter}
      onSubmit={handleFormSubmit}
      onCancel={closeForm}
    />
  {/key}
{/if}

{#if viewTarget}
  <PrintDetailModal record={viewTarget} onClose={closeView} />
{/if}

{#if deleteTarget}
  <PrintDeleteConfirm record={deleteTarget} onConfirm={confirmDelete} onCancel={closeDelete} />
{/if}

{#if feedbackLines}
  <div class="expenses-feedback" role="status" aria-live="polite">
    <KuboIcon name="check" size={16} />
    <div>
      {#each feedbackLines as line, index (index)}
        <p style="margin: 0;">{line}</p>
      {/each}
    </div>
  </div>
{/if}
