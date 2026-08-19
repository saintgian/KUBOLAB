<script lang="ts">
  /**
   * PrintDeleteConfirm.svelte
   * Confirmación explícita antes de eliminar (spec "Eliminar": "Confirmación explícita. Revertir
   * stock y uso de Equipos antes de borrar."). El revert real ocurre en el caller
   * (PrintsWorkspace → lib/prints/model.ts) al confirmar; este modal solo pide la confirmación.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { PrintRecord } from '../../../data/admin/prints.types';
  import { formatWeightG } from '../../../lib/prints/format';

  interface Props {
    record: PrintRecord;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { record, onConfirm, onCancel }: Props = $props();

  let totalGrams = record.materials.reduce((sum, m) => sum + m.consumedG, 0);
</script>

<Modal onClose={onCancel} labelledBy="print-delete-title" size="compact">
  {#snippet children()}
    <header class="modal-header">
      <div>
        <p class="drawer-eyebrow">ELIMINAR IMPRESIÓN</p>
        <h2 id="print-delete-title">{record.displayId} · {record.name}</h2>
      </div>
      <button type="button" class="icon-button" data-modal-close onclick={onCancel} aria-label="Cerrar confirmación">
        <KuboIcon name="xmark" size={20} />
      </button>
    </header>
    <div class="modal-body">
      <p>Esta acción devuelve {formatWeightG(totalGrams)} de material al stock y quita el uso acumulado de esta impresión en Equipos. No se puede deshacer.</p>
    </div>
    <footer class="modal-footer">
      <button type="button" class="secondary-button" onclick={onCancel}>Cancelar</button>
      <button type="button" class="primary-button" onclick={onConfirm}>
        <KuboIcon name="trash" size={16} />
        Eliminar impresión
      </button>
    </footer>
  {/snippet}
</Modal>
