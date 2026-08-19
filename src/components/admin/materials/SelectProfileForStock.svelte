<script lang="ts">
  /**
   * SelectProfileForStock.svelte
   * Primer paso del flujo "+ Registrar stock" desde la pantalla general de Materiales (spec:
   * "primero selecciona el perfil y después registra el ingreso"). Solo elige el perfil — el
   * ingreso en sí lo registra AddStockForm.svelte, el MISMO componente que usan "+ Agregar stock"
   * (desde el perfil) y "Guardar y agregar stock" (al crear un perfil). No dupliques los campos de
   * inventario acá.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import Combobox from '../ui/Combobox.svelte';
  import type { FilamentProfile } from '../../../data/admin/materials.types';

  interface Props {
    profiles: FilamentProfile[];
    onContinue: (profile: FilamentProfile) => void;
    onCancel: () => void;
  }

  let { profiles, onContinue, onCancel }: Props = $props();

  let selectedId = $state('');

  let options = $derived(
    profiles.map((profile) => ({
      value: profile.id,
      label: [profile.name, profile.manufacturer].filter(Boolean).join(' · '),
    }))
  );

  function handleContinue() {
    const profile = profiles.find((p) => p.id === selectedId);
    if (profile) onContinue(profile);
  }
</script>

<Modal onClose={onCancel} labelledBy="register-stock-title" size="compact" panelClass="expense-form-panel">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">REGISTRAR STOCK</p>
        <h2 id="register-stock-title">Elige un perfil</h2>
        <p class="field-hint" style="margin-top: 4px;">Selecciona a qué perfil de filamento se agrega este ingreso.</p>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar selección de perfil">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>

    <div class="modal-body expense-form-body">
      {#if profiles.length === 0}
        <p class="field-hint">Todavía no hay perfiles de filamento creados. Crea un perfil primero para poder registrar stock.</p>
      {:else}
        <div class="field">
          <label class="field-label" for="register-stock-profile">Perfil de filamento</label>
          <Combobox
            id="register-stock-profile"
            value={selectedId}
            options={options}
            onChange={(v) => (selectedId = v)}
            placeholder="Busca por nombre o fabricante"
            ariaLabel="Selecciona un perfil de filamento"
          />
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="button" class="primary-button" disabled={!selectedId} onclick={handleContinue}>Continuar</button>
    </footer>
  {/snippet}
</Modal>
