<script lang="ts">
  /**
   * ExpenseFileUpload.svelte
   * Dropzone de comprobante. No sube nada a ningún servidor — conserva el `File` en memoria
   * mientras dure la sesión (ver ExpenseAttachment.file en expenses.types.ts) y lo pierde al
   * recargar, a propósito: no hay backend todavía y no queremos simular una URL persistente que
   * no existe. La validación de tipo/tamaño vive centralizada en lib/expenses/validate.ts para
   * que este componente no invente su propio criterio.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import type { ExpenseAttachment } from '../../../data/admin/expenses.types';
  import { ATTACHMENT_ACCEPT } from '../../../data/admin/expenses.constants';
  import { validateAttachmentFile } from '../../../lib/expenses/validate';
  import { formatFileSize } from '../../../lib/expenses/format';

  interface Props {
    id: string;
    attachment: ExpenseAttachment | undefined;
    onChange: (attachment: ExpenseAttachment | undefined) => void;
  }

  let { id, attachment, onChange }: Props = $props();

  let inputEl: HTMLInputElement | undefined = $state();
  let isDragActive = $state(false);
  let dragDepth = 0;
  let localError = $state<string | null>(null);

  function openPicker() {
    inputEl?.click();
  }

  function handleFile(file: File) {
    const error = validateAttachmentFile(file);
    if (error) {
      localError = error;
      return;
    }
    localError = null;
    onChange({ fileName: file.name, fileSize: file.size, fileType: file.type, file });
  }

  function handleInputChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
    if (inputEl) inputEl.value = '';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragActive = false;
    dragDepth = 0;
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    dragDepth += 1;
    isDragActive = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragDepth -= 1;
    if (dragDepth <= 0) {
      dragDepth = 0;
      isDragActive = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }

  function removeAttachment() {
    localError = null;
    onChange(undefined);
  }

  function attachmentIcon(fileType: string | undefined): 'page' | 'media-image' {
    return fileType?.startsWith('image/') ? 'media-image' : 'page';
  }
</script>

<input
  bind:this={inputEl}
  type="file"
  id={id}
  class="sr-only"
  accept={ATTACHMENT_ACCEPT}
  onchange={handleInputChange}
  aria-describedby={localError ? `${id}-error` : undefined}
/>

{#if attachment}
  <div class="attachment-row">
    <span class="attachment-icon" aria-hidden="true">
      <KuboIcon name={attachmentIcon(attachment.fileType)} size={18} />
    </span>
    <div class="attachment-meta">
      <span class="attachment-name">{attachment.fileName}</span>
      {#if attachment.fileSize}
        <span class="attachment-size">{formatFileSize(attachment.fileSize)}</span>
      {/if}
    </div>
    <div class="attachment-actions">
      <button type="button" class="row-action" onclick={openPicker} aria-label="Reemplazar archivo adjunto">
        <KuboIcon name="upload" size={16} />
      </button>
      <button type="button" class="row-action" onclick={removeAttachment} aria-label="Eliminar archivo adjunto">
        <KuboIcon name="trash" size={16} />
      </button>
    </div>
  </div>
{:else}
  <div
    class="dropzone"
    class:is-drag-active={isDragActive}
    class:is-error={Boolean(localError)}
    role="button"
    tabindex="0"
    aria-label="Adjuntar documento — arrastra un archivo o presiona Enter para seleccionar"
    aria-describedby={localError ? `${id}-error` : undefined}
    onclick={openPicker}
    onkeydown={handleKeydown}
    ondrop={handleDrop}
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
  >
    <span class="dropzone-icon" aria-hidden="true">
      <KuboIcon name="upload" size={18} />
    </span>
    <p class="dropzone-title">Arrastra un archivo acá</p>
    <p class="dropzone-hint">o selecciona desde tu equipo · PDF, JPG o PNG</p>
  </div>
{/if}

{#if localError}
  <p class="field-error" id={`${id}-error`} role="alert">
    <KuboIcon name="warning-triangle" size={14} />
    {localError}
  </p>
{/if}
