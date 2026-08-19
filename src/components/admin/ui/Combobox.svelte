<script lang="ts" generics="T extends string">
  /**
   * Combobox.svelte
   * Select premium reutilizable (Categoría/Destino/Medio/Comprobante/Relacionado/Prioridad/
   * Estado/Unidad). Trigger claro sobre blanco; panel flotante carbón (ver FloatingPanel +
   * lib/ui/floating.ts, por eso nunca queda recortado). Búsqueda interna solo quando la lista es
   * larga (>7 opciones) — listas cortas (2-6 opciones) no la necesitan, per spec.
   * ARIA: patrón "select-only combobox" (trigger con role=combobox + aria-activedescendant) para
   * listas cortas; "editable combobox with list autocomplete" (input role=combobox) cuando hay
   * búsqueda — en ambos casos con role=listbox/option en el panel.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from './FloatingPanel.svelte';
  import type { Option } from '../../../data/admin/expenses.constants';

  interface Props {
    id: string;
    value: T | '';
    options: Option<T>[];
    onChange: (value: T) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    ariaLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
    searchThreshold?: number;
  }

  let {
    id,
    value,
    options,
    onChange,
    placeholder = 'Selecciona una opción',
    searchPlaceholder = 'Buscar…',
    ariaLabel = undefined,
    disabled = false,
    invalid = false,
    describedBy = undefined,
    searchThreshold = 7,
  }: Props = $props();

  const listboxId = `${id}-listbox`;
  const searchable = options.length > searchThreshold;

  let open = $state(false);
  let query = $state('');
  let activeIndex = $state(0);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let searchInputEl: HTMLInputElement | undefined = $state();
  let typeaheadBuffer = '';
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  let filteredOptions = $derived.by(() => {
    if (!searchable || !query.trim()) return options;
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  });

  let selectedOption = $derived(options.find((option) => option.value === value));

  $effect(() => {
    if (activeIndex > filteredOptions.length - 1) activeIndex = Math.max(0, filteredOptions.length - 1);
  });

  function optionId(index: number): string {
    return `${id}-option-${index}`;
  }

  async function openList() {
    if (disabled) return;
    query = '';
    const currentIndex = options.findIndex((option) => option.value === value);
    activeIndex = currentIndex >= 0 ? currentIndex : 0;
    open = true;
    await tick();
    if (searchable) searchInputEl?.focus();
  }

  function closeList(restoreFocus = true) {
    open = false;
    if (restoreFocus) triggerEl?.focus();
  }

  function selectOption(option: Option<T>) {
    onChange(option.value);
    closeList();
  }

  function runTypeahead(key: string) {
    clearTimeout(typeaheadTimer);
    typeaheadBuffer += key.toLowerCase();
    const match = filteredOptions.findIndex((option) => option.label.toLowerCase().startsWith(typeaheadBuffer));
    if (match >= 0) activeIndex = match;
    typeaheadTimer = setTimeout(() => (typeaheadBuffer = ''), 600);
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else activeIndex = Math.min(activeIndex + 1, filteredOptions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else activeIndex = Math.max(activeIndex - 1, 0);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          activeIndex = 0;
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          activeIndex = filteredOptions.length - 1;
        }
        break;
      case 'Enter':
      case ' ':
        if (event.key === ' ' && searchable) break;
        event.preventDefault();
        if (open && filteredOptions[activeIndex]) selectOption(filteredOptions[activeIndex]);
        else if (!open) openList();
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeList();
        }
        break;
      case 'Tab':
        // El panel vive en un portal fuera del modal (ver FloatingPanel) — si dejáramos que Tab
        // saliera de forma nativa desde el input de búsqueda, podría escapar del focus trap del
        // modal. Cerramos y devolvemos el foco al trigger (que sí vive dentro del modal) antes de
        // dejar que el usuario siga tabulando.
        if (open) {
          event.preventDefault();
          closeList(true);
        }
        break;
      default:
        if (!searchable && open && event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          runTypeahead(event.key);
        }
        break;
    }
  }
</script>

<button
  type="button"
  {id}
  class="combobox-trigger"
  class:is-invalid={invalid}
  class:is-placeholder={!selectedOption}
  bind:this={triggerEl}
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={open}
  aria-controls={listboxId}
  aria-activedescendant={open && !searchable && filteredOptions[activeIndex] ? optionId(activeIndex) : undefined}
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy}
  disabled={disabled}
  onclick={() => (open ? closeList() : openList())}
  onkeydown={!searchable ? handleKeydown : undefined}
>
  <span class="combobox-trigger-value">{selectedOption ? selectedOption.label : placeholder}</span>
  <KuboIcon name="nav-arrow-down" size={14} />
</button>

<FloatingPanel
  anchorEl={triggerEl}
  open={open}
  onClose={() => closeList(false)}
  variant="carbon"
  minWidth={220}
  maxHeightCap={220}
  panelClass="combobox-panel"
  role="presentation"
  ariaLabel={ariaLabel ?? placeholder}
>
  {#snippet children()}
    {#if searchable}
      <div class="combobox-search">
        <KuboIcon name="search" size={14} />
        <input
          type="text"
          class="combobox-search-input"
          bind:this={searchInputEl}
          bind:value={query}
          placeholder={searchPlaceholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={filteredOptions[activeIndex] ? optionId(activeIndex) : undefined}
          onkeydown={handleKeydown}
        />
      </div>
    {/if}
    <ul class="combobox-listbox" role="listbox" id={listboxId} aria-label={ariaLabel}>
      {#each filteredOptions as option, index (option.value)}
        <li
          id={optionId(index)}
          role="option"
          class="combobox-option"
          class:is-active={index === activeIndex}
          class:is-selected={option.value === value}
          aria-selected={option.value === value}
          onclick={() => selectOption(option)}
          onmouseenter={() => (activeIndex = index)}
        >
          <span>{option.label}</span>
          {#if option.value === value}<KuboIcon name="check" size={14} />{/if}
        </li>
      {:else}
        <li class="combobox-empty" aria-disabled="true">Sin resultados</li>
      {/each}
    </ul>
  {/snippet}
</FloatingPanel>
