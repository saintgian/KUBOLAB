<script lang="ts">
  /**
   * MaterialsWorkspace.svelte
   * Unidad reactiva de Producción → Materiales (spec completa en docs/specs/admin-materials-spec.md).
   * Dueña de TODO el estado de sesión — perfiles, bobinas, movimientos, filtros, qué vista está
   * activa (listado o detalle de un perfil) y qué overlay está abierto — sin store global, mismo
   * patrón que ExpensesWorkspace.svelte. Los tres datasets arrancan en DEMO_PROFILES/DEMO_SPOOLS/
   * DEMO_MOVEMENTS y solo viven en memoria de esta sesión — no hay backend todavía (spec §22).
   */
  import MaterialsSummary from './MaterialsSummary.svelte';
  import MaterialsToolbar from './MaterialsToolbar.svelte';
  import MaterialsInUseList from './MaterialsInUseList.svelte';
  import MaterialList from './MaterialList.svelte';
  import MaterialProfilesList from './MaterialProfilesList.svelte';
  import MaterialDetail from './MaterialDetail.svelte';
  import MaterialProfileForm from './MaterialProfileForm.svelte';
  import AddStockForm from './AddStockForm.svelte';
  import SelectProfileForStock from './SelectProfileForStock.svelte';
  import AdjustSpoolWeightForm from './AdjustSpoolWeightForm.svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import { DEMO_MOVEMENTS, DEMO_PROFILES, DEMO_SPOOLS } from '../../../data/admin/materials.mock';
  import type { FilamentProfile, FilamentProfileFormValues, FilamentSpool, MaterialMovement, SpoolWeightUpdateValues, StockEntryFormValues } from '../../../data/admin/materials.types';
  import { buildInUseSpoolItems, buildMaterialListItems } from '../../../lib/materials/inventory';
  import { defaultMaterialFilters, filterMaterials, sortMaterials, summarizeMaterials } from '../../../lib/materials/filters';
  import { buildProfile, buildStockEntry, applySpoolWeightUpdate } from '../../../lib/materials/model';
  import { loadStoredProfiles, loadStoredSpools, loadStoredMovements, persistProfiles, persistSpools, persistMovements } from '../../../lib/materials/storage';

  /** Persistido en localStorage (no solo memoria de sesión) desde que Producción → Impresiones
   * necesita descontar stock real y que ese descuento sobreviva a la navegación entre pantallas
   * (docs/specs/admin-production-prints-spec.md). */
  let profiles = $state<FilamentProfile[]>(loadStoredProfiles() ?? [...DEMO_PROFILES]);
  let spools = $state<FilamentSpool[]>(loadStoredSpools() ?? [...DEMO_SPOOLS]);
  let movements = $state<MaterialMovement[]>(loadStoredMovements() ?? [...DEMO_MOVEMENTS]);
  let filters = $state(defaultMaterialFilters());

  $effect(() => {
    persistProfiles(profiles);
  });
  $effect(() => {
    persistSpools(spools);
  });
  $effect(() => {
    persistMovements(movements);
  });

  let allItems = $derived(buildMaterialListItems(profiles, spools, movements));
  let filteredItems = $derived(sortMaterials(filterMaterials(allItems, filters)));
  let summary = $derived(summarizeMaterials(filteredItems));

  let allInUseItems = $derived(buildInUseSpoolItems(profiles, spools));
  let filteredProfileIds = $derived(new Set(filteredItems.map((item) => item.profile.id)));
  let filteredInUseItems = $derived(allInUseItems.filter((item) => filteredProfileIds.has(item.profile.id)));

  let selectedProfileId = $state<string | null>(null);
  let selectedItem = $derived(selectedProfileId ? (allItems.find((item) => item.profile.id === selectedProfileId) ?? null) : null);
  let selectedSpools = $derived(selectedProfileId ? spools.filter((spool) => spool.profileId === selectedProfileId) : []);
  let selectedMovements = $derived(selectedProfileId ? movements.filter((movement) => movement.profileId === selectedProfileId) : []);

  type FormTarget = { mode: 'create' } | { mode: 'edit'; profile: FilamentProfile };
  let formTarget = $state<FormTarget | null>(null);
  let addStockTarget = $state<FilamentProfile | null>(null);
  let stockPickerOpen = $state(false);
  let adjustWeightTarget = $state<FilamentSpool | null>(null);

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

  function openCreate() {
    captureFocus();
    formTarget = { mode: 'create' };
  }

  function openEdit(profile: FilamentProfile) {
    captureFocus();
    formTarget = { mode: 'edit', profile };
  }

  function closeForm() {
    formTarget = null;
    restoreFocus();
  }

  function handleProfileFormSubmit(values: FilamentProfileFormValues, andAddStock: boolean) {
    const target = formTarget;
    if (!target) return;
    if (target.mode === 'edit') {
      const updated = buildProfile(values, profiles, target.profile);
      profiles = profiles.map((profile) => (profile.id === updated.id ? updated : profile));
      formTarget = null;
      restoreFocus();
      showFeedback('Cambios guardados.');
      return;
    }
    const created = buildProfile(values, profiles);
    profiles = [...profiles, created];
    formTarget = null;
    if (andAddStock) {
      // Mismo flujo que "+ Agregar stock"/"+ Registrar stock": abre AddStockForm con el perfil
      // recién creado ya seleccionado — el foco se restaura cuando ese modal se cierre.
      addStockTarget = created;
    } else {
      restoreFocus();
    }
    showFeedback('Perfil creado.');
  }

  function selectItem(item: { profile: FilamentProfile }) {
    captureFocus();
    selectedProfileId = item.profile.id;
  }

  function selectProfileById(profileId: string) {
    captureFocus();
    selectedProfileId = profileId;
  }

  function backToList() {
    selectedProfileId = null;
    restoreFocus();
  }

  function clearFiltersFromList() {
    Object.assign(filters, defaultMaterialFilters());
  }

  function openAddStock(profile: FilamentProfile) {
    captureFocus();
    addStockTarget = profile;
  }

  function closeAddStock() {
    addStockTarget = null;
    restoreFocus();
  }

  function openRegisterStock() {
    captureFocus();
    stockPickerOpen = true;
  }

  function closeStockPicker() {
    stockPickerOpen = false;
    restoreFocus();
  }

  function chooseProfileForStock(profile: FilamentProfile) {
    // No restoreFocus() acá: seguimos dentro del mismo flujo, AddStockForm mantiene el foco
    // capturado y lo restaura recién cuando el usuario termine o cancele.
    stockPickerOpen = false;
    addStockTarget = profile;
  }

  function handleAddStockSubmit(values: StockEntryFormValues) {
    const target = addStockTarget;
    if (!target) return;
    const { spools: newSpools, movement } = buildStockEntry(target.id, values);
    spools = [...spools, ...newSpools];
    movements = [...movements, movement];
    addStockTarget = null;
    restoreFocus();
    showFeedback('Stock agregado.');
  }

  function openAdjustWeight(spool: FilamentSpool) {
    captureFocus();
    adjustWeightTarget = spool;
  }

  function closeAdjustWeight() {
    adjustWeightTarget = null;
    restoreFocus();
  }

  function handleAdjustWeightSubmit(values: SpoolWeightUpdateValues) {
    const target = adjustWeightTarget;
    if (!target) return;
    const { spool: updatedSpool, movement } = applySpoolWeightUpdate(target, values);
    spools = spools.map((spool) => (spool.id === updatedSpool.id ? updatedSpool : spool));
    movements = [...movements, movement];
    adjustWeightTarget = null;
    restoreFocus();
    showFeedback('Peso actualizado.');
  }
</script>

{#if selectedItem}
  <MaterialDetail
    item={selectedItem}
    spools={selectedSpools}
    movements={selectedMovements}
    onBack={backToList}
    onEdit={openEdit}
    onAddStock={openAddStock}
    onAdjustWeight={openAdjustWeight}
  />
{:else}
  <div class="materials-header reveal" style="--delay: 0ms">
    <div class="page-heading">
      <div class="eyebrow-line">
        <span class="page-index">PRODUCCIÓN</span>
        <span class="demo-chip">DATOS DEMO</span>
      </div>
      <h1>Materiales</h1>
      <p>Perfiles, stock y parámetros de los filamentos de KUBO.</p>
    </div>
    <div class="materials-header-actions">
      <button type="button" class="primary-button" onclick={openCreate}>
        <KuboIcon name="plus" size={16} />
        Crear perfil
      </button>
    </div>
  </div>

  <MaterialsSummary summary={summary} />

  <MaterialsToolbar filters={filters} resultCount={filteredItems.length} />

  <section class="panel reveal materials-section" style="--delay: 100ms" aria-labelledby="materials-section-in-use">
    <div class="panel-header">
      <div>
        <h2 id="materials-section-in-use">Filamentos en uso</h2>
        <p class="field-hint panel-header-meta">Bobinas abiertas o asignadas actualmente</p>
      </div>
    </div>
    <MaterialsInUseList items={filteredInUseItems} allCount={allInUseItems.length} onSelect={selectProfileById} />
  </section>

  <section class="panel reveal materials-section" style="--delay: 140ms" aria-labelledby="materials-section-stock">
    <div class="panel-header">
      <div>
        <h2 id="materials-section-stock">Stock de filamentos</h2>
        <p class="field-hint panel-header-meta">Inventario físico completo por perfil</p>
      </div>
      <button type="button" class="secondary-button" onclick={openRegisterStock}>
        <KuboIcon name="plus" size={16} />
        Registrar stock
      </button>
    </div>
    <MaterialList items={filteredItems} allCount={allItems.length} onSelect={selectItem} onCreateFirst={openCreate} onClearFilters={clearFiltersFromList} />
  </section>

  <section class="panel reveal materials-section" style="--delay: 180ms" aria-labelledby="materials-section-profiles">
    <div class="panel-header">
      <div>
        <h2 id="materials-section-profiles">Perfiles de filamento</h2>
        <p class="field-hint panel-header-meta">Identidad y configuración de cada material</p>
      </div>
    </div>
    <MaterialProfilesList items={filteredItems} allCount={allItems.length} onSelect={selectItem} onCreateFirst={openCreate} onClearFilters={clearFiltersFromList} />
  </section>
{/if}

{#if formTarget}
  {#key formTarget}
    <MaterialProfileForm mode={formTarget.mode} initial={formTarget.mode === 'edit' ? formTarget.profile : null} onSubmit={handleProfileFormSubmit} onCancel={closeForm} />
  {/key}
{/if}

{#if stockPickerOpen}
  <SelectProfileForStock profiles={profiles} onContinue={chooseProfileForStock} onCancel={closeStockPicker} />
{/if}

{#if addStockTarget}
  <AddStockForm profile={addStockTarget} onSubmit={handleAddStockSubmit} onCancel={closeAddStock} />
{/if}

{#if adjustWeightTarget}
  <AdjustSpoolWeightForm spool={adjustWeightTarget} onSubmit={handleAdjustWeightSubmit} onCancel={closeAdjustWeight} />
{/if}

{#if feedback}
  <div class="expenses-feedback" role="status" aria-live="polite">
    <KuboIcon name="check" size={16} />
    {feedback}
  </div>
{/if}
