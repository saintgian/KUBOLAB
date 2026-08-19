<script lang="ts">
  /**
   * PrinterDetailWorkspace.svelte
   * Detalle de una impresora (spec §14/§15). Persiste a localStorage (lib/printers/storage.ts) —
   * a diferencia de Materiales, esta pantalla SÍ es una ruta Astro propia (`/admin/equipos/[id]`),
   * así que sin persistencia perdería todo al navegar desde el listado (ver comentario en
   * PrintersListWorkspace.svelte). `DEMO_MAINTENANCE_RULES` (seed KUBO) no se persiste todavía —
   * no hay UI para editar reglas en esta iteración (spec §20).
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import PrinterProfileForm from './PrinterProfileForm.svelte';
  import MaintenanceEventForm from './MaintenanceEventForm.svelte';
  import PrinterCostingForm from './PrinterCostingForm.svelte';
  import { DEMO_MAINTENANCE_RULES, DEMO_PRINTERS, MAINTENANCE_COMPONENTS } from '../../../data/admin/printers.mock';
  import {
    MAINTENANCE_ACTION_OPTIONS,
    MAINTENANCE_CONDITION_OPTIONS,
    MAINTENANCE_STATUS_OPTIONS,
    NOZZLE_MATERIAL_OPTIONS,
    POLYMER_FAMILIES,
    PRINTER_STATUS_OPTIONS,
    optionLabel,
    polymerFamilyLabel,
  } from '../../../data/admin/printers.constants';
  import type { MaintenanceEvent, MaintenanceEventFormValues, PrinterCostingDefaults, PrinterProfile, PrinterProfileFormValues } from '../../../data/admin/printers.types';
  import { loadStoredPrinters, persistPrinters, loadStoredMaintenanceEvents, persistMaintenanceEvents } from '../../../lib/printers/storage';
  import { formatCurrency, formatCurrencyPerHour, formatDateLong, formatMinutesAsHours, formatWeightG } from '../../../lib/printers/format';
  import { buildMaintenanceAlerts, overallMaintenanceStatus, alertsNeedingAttention, type MaintenanceAlert } from '../../../lib/printers/maintenance';
  import { evaluateMaterialCompatibility } from '../../../lib/printers/compatibility';
  import { buildMaintenanceEvent, buildPrinterProfile } from '../../../lib/printers/model';

  interface Props {
    printerId: string;
  }

  let { printerId }: Props = $props();

  let printers = $state<PrinterProfile[]>(loadStoredPrinters() ?? DEMO_PRINTERS.map((p) => ({ ...p })));
  let events = $state<MaintenanceEvent[]>(loadStoredMaintenanceEvents() ?? []);

  $effect(() => {
    persistPrinters(printers);
  });
  $effect(() => {
    persistMaintenanceEvents(events);
  });

  let printer = $derived(printers.find((p) => p.id === printerId) ?? null);
  let alerts = $derived<MaintenanceAlert[]>(printer ? buildMaintenanceAlerts(printer, DEMO_MAINTENANCE_RULES, events) : []);
  let overallStatus = $derived(overallMaintenanceStatus(alerts));
  let pendingAlerts = $derived(alertsNeedingAttention(alerts));
  let nextReview = $derived(pendingAlerts[0] ?? null);
  let printerEvents = $derived(printer ? [...events].filter((e) => e.printerId === printer.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : []);

  type Tab = 'summary' | 'maintenance' | 'costs';
  let activeTab = $state<Tab>('summary');
  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Resumen' },
    { key: 'maintenance', label: 'Mantenimiento' },
    { key: 'costs', label: 'Costos' },
  ];

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

  let editProfileOpen = $state(false);
  let maintenanceFormTarget = $state<{ prefillComponentId?: string } | null>(null);
  let costingFormOpen = $state(false);
  let feedback = $state<string | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let returnFocusEl: HTMLElement | null = null;

  function captureFocus() {
    returnFocusEl = document.activeElement as HTMLElement | null;
  }
  function restoreFocus() {
    returnFocusEl?.focus();
    returnFocusEl = null;
  }
  function showFeedback(message: string) {
    feedback = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, 3200);
  }

  function openEditProfile() {
    captureFocus();
    editProfileOpen = true;
  }
  function closeEditProfile() {
    editProfileOpen = false;
    restoreFocus();
  }
  function handleProfileSubmit(values: PrinterProfileFormValues) {
    if (!printer) return;
    const updated = buildPrinterProfile(values, printer);
    printers = printers.map((p) => (p.id === updated.id ? updated : p));
    editProfileOpen = false;
    restoreFocus();
    showFeedback('Cambios guardados.');
  }

  function openMaintenanceForm(prefillComponentId?: string) {
    captureFocus();
    maintenanceFormTarget = { prefillComponentId };
  }
  function closeMaintenanceForm() {
    maintenanceFormTarget = null;
    restoreFocus();
  }
  function handleMaintenanceSubmit(values: MaintenanceEventFormValues) {
    if (!printer) return;
    const { event, printer: updatedPrinter } = buildMaintenanceEvent(printer, values);
    events = [...events, event];
    printers = printers.map((p) => (p.id === updatedPrinter.id ? updatedPrinter : p));
    maintenanceFormTarget = null;
    restoreFocus();
    showFeedback('Mantenimiento registrado.');
  }

  function openCostingForm() {
    captureFocus();
    costingFormOpen = true;
  }
  function closeCostingForm() {
    costingFormOpen = false;
    restoreFocus();
  }
  function handleCostingSubmit(values: PrinterCostingDefaults) {
    if (!printer) return;
    printers = printers.map((p) => (p.id === printer!.id ? { ...p, costing: values, updatedAt: new Date().toISOString() } : p));
    costingFormOpen = false;
    restoreFocus();
    showFeedback('Supuestos actualizados.');
  }

  function componentLabel(componentId: string): string {
    return MAINTENANCE_COMPONENTS.find((c) => c.id === componentId)?.label ?? componentId;
  }
</script>

{#if !printer}
  <div class="list-empty-panel">
    <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="server" size={22} /></span>
    <h3>Impresora no encontrada.</h3>
    <p>Puede que el enlace sea antiguo o que los datos locales se hayan limpiado.</p>
    <a class="primary-button" href="/admin/produccion/equipos/">Volver a Equipos</a>
  </div>
{:else}
  <a class="material-detail-back" href="/admin/produccion/equipos/">
    <KuboIcon name="nav-arrow-left" size={14} />
    Volver a Equipos
  </a>

  <div class="material-detail-header reveal" style="--delay: 0ms">
    <div class="material-detail-heading">
      <div class="material-detail-title">
        <h1>{printer.internalName}</h1>
        <p>{printer.manufacturer} {printer.model} · {printer.technology}</p>
        <p class="field-hint" style="margin-top: 2px;">Adquisición: {printer.acquisitionDate ? formatDateLong(printer.acquisitionDate) : 'Sin registrar'}</p>
        <div class="material-detail-chips">
          <span class={`status-chip status-${printer.status}`}>{optionLabel(PRINTER_STATUS_OPTIONS, printer.status)}</span>
          <span class={`status-chip status-${overallStatus}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, overallStatus)}</span>
        </div>
      </div>
    </div>
    <div class="material-detail-actions">
      <button type="button" class="primary-button" onclick={openEditProfile}>
        <KuboIcon name="edit-pencil" size={16} />
        Editar perfil
      </button>
    </div>
  </div>

  <section class="materials-overview reveal" style="--delay: 40ms" aria-label="Indicadores de la impresora">
    <div class="materials-summary">
      <div class="summary-metric">
        <p class="summary-metric-label">Horas registradas</p>
        <span class="summary-metric-value" aria-live="polite">{formatMinutesAsHours(printer.counters.printMinutesTotal)}</span>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Impresiones</p>
        <span class="summary-metric-value">{printer.counters.printsTotal}</span>
        <p class="summary-metric-meta">{printer.counters.printsSuccessful} ok · {printer.counters.printsFailed} fallidas</p>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Filamento procesado</p>
        <span class="summary-metric-value">{formatWeightG(printer.counters.filamentGramsTotal)}</span>
        <p class="summary-metric-meta">{formatWeightG(printer.counters.abrasiveFilamentGramsTotal)} abrasivo</p>
      </div>
      <div class="summary-metric">
        <p class="summary-metric-label">Estado mantenimiento</p>
        <span class={`status-chip status-${overallStatus}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, overallStatus)}</span>
      </div>
    </div>
    <p class="field-hint" style="margin-top: var(--space-3);">Métricas registradas desde la activación del seguimiento en KUBO — no se reconstruye uso anterior a esta impresora.</p>
  </section>

  <div class="expenses-tabs reveal" style="--delay: 60ms" role="tablist" aria-label="Secciones de la impresora" onkeydown={handleTabKeydown}>
    {#each TABS as tab (tab.key)}
      <button
        type="button"
        role="tab"
        id={`printer-tab-${tab.key}`}
        aria-selected={activeTab === tab.key}
        aria-controls={`printer-tabpanel-${tab.key}`}
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
    <div id="printer-tabpanel-summary" role="tabpanel" aria-labelledby="printer-tab-summary" class="panel material-detail-panel reveal" style="--delay: 90ms">
      <div class="print-profile-columns">
        <div>
          <p class="filters-panel-title" style="margin-bottom: var(--space-3);">CONFIGURACIÓN INSTALADA</p>
          <dl class="drawer-fields">
            <div class="drawer-field"><dt>Diámetro de boquilla</dt><dd class="mono-strong">{printer.installedConfiguration.nozzleDiameterMm} mm</dd></div>
            <div class="drawer-field"><dt>Material de boquilla</dt><dd>{optionLabel(NOZZLE_MATERIAL_OPTIONS, printer.installedConfiguration.nozzleMaterial)}</dd></div>
            {#if printer.installedConfiguration.buildPlate}<div class="drawer-field"><dt>Placa de impresión</dt><dd>{printer.installedConfiguration.buildPlate}</dd></div>{/if}
            {#if printer.installedConfiguration.hotendType}<div class="drawer-field"><dt>Tipo de hotend</dt><dd>{printer.installedConfiguration.hotendType}</dd></div>{/if}
            <div class="drawer-field"><dt>Última instalación registrada</dt><dd>{printer.installedConfiguration.installedAt ? formatDateLong(printer.installedConfiguration.installedAt) : 'De fábrica — sin cambios registrados'}</dd></div>
          </dl>

          <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">FICHA TÉCNICA DEL FABRICANTE</p>
          <dl class="drawer-fields">
            {#if printer.technicalSpecs.buildVolumeMm}
              <div class="drawer-field"><dt>Volumen de construcción</dt><dd class="mono-strong">{printer.technicalSpecs.buildVolumeMm.x} × {printer.technicalSpecs.buildVolumeMm.y} × {printer.technicalSpecs.buildVolumeMm.z} mm</dd></div>
            {/if}
            {#if printer.technicalSpecs.maxHotendTempC}<div class="drawer-field"><dt>Temp. máx. hotend</dt><dd class="mono-strong">{printer.technicalSpecs.maxHotendTempC} °C</dd></div>{/if}
            {#if printer.technicalSpecs.maxBedTempC}<div class="drawer-field"><dt>Temp. máx. cama</dt><dd class="mono-strong">{printer.technicalSpecs.maxBedTempC} °C</dd></div>{/if}
            {#if printer.technicalSpecs.supportedNozzleDiametersMm?.length}
              <div class="drawer-field"><dt>Boquillas disponibles</dt><dd class="mono-strong">{printer.technicalSpecs.supportedNozzleDiametersMm.join(' / ')} mm</dd></div>
            {/if}
          </dl>
        </div>

        <div>
          <p class="filters-panel-title" style="margin-bottom: var(--space-3);">CONTADORES KUBO</p>
          <dl class="drawer-fields">
            <div class="drawer-field"><dt>Minutos totales</dt><dd class="mono-strong">{printer.counters.printMinutesTotal}</dd></div>
            <div class="drawer-field"><dt>Impresiones totales</dt><dd class="mono-strong">{printer.counters.printsTotal}</dd></div>
            <div class="drawer-field"><dt>Eventos de mantenimiento</dt><dd class="mono-strong">{printer.counters.maintenanceEventsTotal}</dd></div>
            <div class="drawer-field"><dt>Última impresión</dt><dd>{printer.counters.lastPrintAt ? formatDateLong(printer.counters.lastPrintAt) : 'Sin registrar'}</dd></div>
            <div class="drawer-field"><dt>Último mantenimiento</dt><dd>{printer.counters.lastMaintenanceAt ? formatDateLong(printer.counters.lastMaintenanceAt) : 'Sin registrar'}</dd></div>
          </dl>
          {#if Object.keys(printer.counters.filamentGramsByFamily).length > 0}
            <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">FILAMENTO POR FAMILIA</p>
            <dl class="drawer-fields">
              {#each Object.entries(printer.counters.filamentGramsByFamily) as [family, grams] (family)}
                <div class="drawer-field"><dt>{polymerFamilyLabel(family) || family}</dt><dd class="mono-strong">{formatWeightG(grams)}</dd></div>
              {/each}
            </dl>
          {/if}

          <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">PRÓXIMA REVISIÓN</p>
          {#if nextReview}
            <div class="maintenance-alert-row">
              <div class="maintenance-alert-main">
                <strong>{nextReview.component.label}</strong>
                <span class={`status-chip status-${nextReview.status}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, nextReview.status)}</span>
              </div>
              <p class="field-hint">{nextReview.reason}</p>
              <span class="maintenance-source-tag" class:is-manufacturer={nextReview.source === 'manufacturer'}>{nextReview.source === 'manufacturer' ? 'Fuente: Bambu' : 'Fuente: KUBO'}</span>
            </div>
          {:else}
            <p class="field-hint">Sin revisiones pendientes por ahora.</p>
          {/if}
        </div>
      </div>

      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">COMPATIBILIDAD RESUMIDA</p>
      <p class="field-hint" style="margin-bottom: var(--space-3);">Evaluada contra la configuración instalada actual ({printer.installedConfiguration.nozzleDiameterMm} mm · {optionLabel(NOZZLE_MATERIAL_OPTIONS, printer.installedConfiguration.nozzleMaterial)}).</p>
      <div class="compatibility-grid">
        {#each POLYMER_FAMILIES.filter((f) => f.value !== 'other') as family (family.value)}
          {@const result = evaluateMaterialCompatibility(family.value, undefined, printer.installedConfiguration)}
          <div class="compatibility-chip-row">
            <span class="compatibility-chip-label">{family.label}</span>
            <span class={`status-chip status-${result.status}`}>{result.status === 'compatible' ? 'Compatible' : result.status === 'not-recommended' ? 'No recomendado' : 'Atención'}</span>
          </div>
        {/each}
      </div>
      {#each ['CF', 'GF'] as reinforcement (reinforcement)}
        {@const cfResult = evaluateMaterialCompatibility('PETG', reinforcement === 'CF' ? 'CF' : 'GF', printer.installedConfiguration)}
        <div class="compatibility-note">
          <span class={`status-chip status-${cfResult.status}`}>{cfResult.status === 'attention' ? 'Atención' : 'No recomendado'}</span>
          <div>
            <p><strong>{reinforcement}</strong> — {cfResult.reason}</p>
            {#if cfResult.additionalGuidance}<p class="field-hint">{cfResult.additionalGuidance}</p>{/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if activeTab === 'maintenance'}
    <div id="printer-tabpanel-maintenance" role="tabpanel" aria-labelledby="printer-tab-maintenance" class="panel material-detail-panel reveal" style="--delay: 90ms">
      <div class="panel-header" style="padding: 0 0 var(--space-4);">
        <div>
          <h2 style="font-size:15px;">Alertas activas</h2>
          <p class="field-hint panel-header-meta">Qué revisar, limpiar, lubricar o reemplazar — y por qué.</p>
        </div>
        <button type="button" class="secondary-button" onclick={() => openMaintenanceForm()}>
          <KuboIcon name="wrench" size={16} />
          Registrar mantenimiento
        </button>
      </div>

      {#if alerts.length === 0}
        <p class="field-hint">Sin reglas de mantenimiento configuradas para este modelo.</p>
      {:else}
        <div class="maintenance-alert-list">
          {#each alerts as alert (alert.rule.id)}
            <div class="maintenance-alert-row">
              <div class="maintenance-alert-main">
                <strong>{alert.component.label}</strong>
                <span class="field-hint">{optionLabel(MAINTENANCE_ACTION_OPTIONS, alert.rule.action)}</span>
                <span class={`status-chip status-${alert.status}`}>{optionLabel(MAINTENANCE_STATUS_OPTIONS, alert.status)}</span>
              </div>
              <p class="field-hint">{alert.reason}</p>
              {#if alert.progress}
                <div class="maintenance-progress-track" role="progressbar" aria-valuenow={Math.round(alert.progress.currentValue)} aria-valuemin={0} aria-valuemax={alert.progress.thresholdValue} aria-label={`Progreso hacia ${optionLabel(MAINTENANCE_ACTION_OPTIONS, alert.rule.action)} de ${alert.component.label}`}>
                  <div class="maintenance-progress-fill" style={`width:${Math.min(100, (alert.progress.currentValue / alert.progress.thresholdValue) * 100)}%`}></div>
                </div>
              {/if}
              <div class="maintenance-alert-footer">
                <span class="maintenance-source-tag" class:is-manufacturer={alert.source === 'manufacturer'}>{alert.source === 'manufacturer' ? 'Fuente: Bambu' : 'Fuente: KUBO — regla preventiva'}</span>
                {#if alert.sourceReference}<span class="field-hint">{alert.sourceReference}</span>{/if}
                <button type="button" class="text-link" onclick={() => openMaintenanceForm(alert.rule.componentId)}>Registrar mantenimiento de este componente</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <p class="filters-panel-title" style="margin: var(--space-5) 0 var(--space-3);">HISTORIAL DE EVENTOS</p>
      {#if printerEvents.length === 0}
        <div class="list-empty-panel">
          <span class="list-empty-icon" aria-hidden="true"><KuboIcon name="wrench" size={22} /></span>
          <h3>Sin mantenimiento registrado.</h3>
          <p>El historial aparecerá aquí cuando registres el primer evento — incluso con los contadores en 0.</p>
        </div>
      {:else}
        <div class="table-shell desktop-table">
          <table>
            <caption class="sr-only">Historial de mantenimiento de {printer.internalName}</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Componente</th>
                <th scope="col">Acción</th>
                <th scope="col">Estado encontrado</th>
                <th scope="col">Repuesto</th>
                <th scope="col">Notas</th>
              </tr>
            </thead>
            <tbody>
              {#each printerEvents as event (event.id)}
                <tr>
                  <td class="mono-strong">{formatDateLong(event.date)}</td>
                  <td>{componentLabel(event.componentId)}</td>
                  <td>{optionLabel(MAINTENANCE_ACTION_OPTIONS, event.action)}</td>
                  <td>{optionLabel(MAINTENANCE_CONDITION_OPTIONS, event.conditionFound)}</td>
                  <td>{event.replacementPerformed ? 'Sí' : 'No'}</td>
                  <td>{event.notes ?? '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="mobile-list mobile-only">
          {#each printerEvents as event (event.id)}
            <div class="mobile-data-card">
              <div class="material-card-top">
                <strong>{componentLabel(event.componentId)}</strong>
                <span class="mono-strong">{formatDateLong(event.date)}</span>
              </div>
              <span class="material-card-meta">{optionLabel(MAINTENANCE_ACTION_OPTIONS, event.action)} · {optionLabel(MAINTENANCE_CONDITION_OPTIONS, event.conditionFound)}</span>
              <span class="material-card-meta">Repuesto: {event.replacementPerformed ? 'Sí' : 'No'}</span>
              {#if event.notes}<span class="material-card-meta">{event.notes}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div id="printer-tabpanel-costs" role="tabpanel" aria-labelledby="printer-tab-costs" class="panel material-detail-panel reveal" style="--delay: 90ms">
      <p class="field-hint" style="margin-bottom: var(--space-4);">Estos valores son Supuestos operativos de KUBO — no son especificaciones oficiales de Bambu.</p>
      <div class="print-profile-columns">
        <div>
          <p class="filters-panel-title" style="margin-bottom: var(--space-3);">SUPUESTOS KUBO</p>
          <dl class="drawer-fields">
            <div class="drawer-field"><dt>Potencia promedio de costeo</dt><dd class="mono-strong">{printer.costing.averagePowerW} W</dd></div>
            <div class="drawer-field"><dt>Valor de referencia</dt><dd class="mono-strong">{formatCurrency(printer.costing.referenceValuePen)}</dd></div>
            <div class="drawer-field"><dt>Vida operativa de referencia</dt><dd class="mono-strong">{printer.costing.referenceLifeHours.toLocaleString('es-PE')} h</dd></div>
            <div class="drawer-field"><dt>Depreciación derivada</dt><dd class="mono-strong">{formatCurrencyPerHour(printer.costing.depreciationPerHourPen)}</dd></div>
            <div class="drawer-field"><dt>Reserva de mantenimiento</dt><dd class="mono-strong">{formatCurrencyPerHour(printer.costing.maintenanceReservePerHourPen)}</dd></div>
          </dl>
        </div>
        <div>
          <p class="filters-panel-title" style="margin-bottom: var(--space-3);">COSTO DERIVADO</p>
          <div class="summary-metric">
            <p class="summary-metric-label">Costo máquina/h (sin electricidad)</p>
            <span class="summary-metric-value mono-strong">{formatCurrencyPerHour(printer.costing.depreciationPerHourPen + printer.costing.maintenanceReservePerHourPen)}</span>
            <p class="summary-metric-meta">= depreciación/h + reserva de mantenimiento/h</p>
          </div>
          <button type="button" class="secondary-button" style="margin-top: var(--space-4);" onclick={openCostingForm}>
            <KuboIcon name="edit-pencil" size={16} />
            Editar supuestos
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}

{#if editProfileOpen && printer}
  <PrinterProfileForm mode="edit" printer={printer} onSubmit={handleProfileSubmit} onCancel={closeEditProfile} />
{/if}

{#if maintenanceFormTarget}
  <MaintenanceEventForm prefillComponentId={maintenanceFormTarget.prefillComponentId} onSubmit={handleMaintenanceSubmit} onCancel={closeMaintenanceForm} />
{/if}

{#if costingFormOpen && printer}
  <PrinterCostingForm costing={printer.costing} onSubmit={handleCostingSubmit} onCancel={closeCostingForm} />
{/if}

{#if feedback}
  <div class="expenses-feedback" role="status" aria-live="polite">
    <KuboIcon name="check" size={16} />
    {feedback}
  </div>
{/if}
