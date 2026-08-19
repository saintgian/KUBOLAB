<script lang="ts">
  /**
   * ExpenseDatePicker.svelte
   * Date picker accesible para "Fecha del gasto" / "Fecha necesaria". El popover ahora usa
   * FloatingPanel (portal a document.body + posicionamiento fixed con flip) en vez de un
   * `.mini-popover` posicionado contra un ancestro — así nunca queda recortado, ni dentro de un
   * modal con `overflow-y:auto`. La navegación de teclado dentro de la grilla (roving tabindex)
   * es propia de este componente porque acá sí hace falta moverse entre 42 celdas con flechas.
   */
  import { tick } from 'svelte';
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import FloatingPanel from '../ui/FloatingPanel.svelte';
  import { dateToIso, formatDateLong, formatMonthYear, parseIsoDate, todayIso } from '../../../lib/expenses/format';

  interface Props {
    id: string;
    value: string;
    onChange: (iso: string) => void;
    invalid?: boolean;
    describedBy?: string;
  }

  let { id, value, onChange, invalid = false, describedBy = undefined }: Props = $props();

  let open = $state(false);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let gridEl: HTMLElement | undefined = $state();
  let viewMonth = $state(parseIsoDate(value || todayIso()));
  let focusedIso = $state(value || todayIso());

  const WEEKDAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

  let days = $derived.by(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { iso: dateToIso(date), inMonth: date.getMonth() === month };
    });
  });

  const todayIsoValue = todayIso();

  async function openPicker() {
    const base = value && value.length ? value : todayIsoValue;
    viewMonth = parseIsoDate(base);
    focusedIso = base;
    open = true;
    await tick();
    focusDay(focusedIso);
  }

  function closePicker(restoreFocus = true) {
    open = false;
    if (restoreFocus) triggerEl?.focus();
  }

  function toggle() {
    if (open) closePicker();
    else openPicker();
  }

  function focusDay(iso: string) {
    const btn = gridEl?.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
    btn?.focus();
  }

  function selectDay(iso: string) {
    onChange(iso);
    closePicker();
  }

  function selectToday() {
    onChange(todayIsoValue);
    closePicker();
  }

  function shiftMonth(delta: number) {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
  }

  async function moveFocus(deltaDays: number) {
    const current = parseIsoDate(focusedIso);
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + deltaDays);
    focusedIso = dateToIso(next);
    if (next.getMonth() !== viewMonth.getMonth() || next.getFullYear() !== viewMonth.getFullYear()) {
      viewMonth = new Date(next.getFullYear(), next.getMonth(), 1);
      await tick();
    }
    focusDay(focusedIso);
  }

  function handleGridKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(7);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-7);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDay(focusedIso);
        break;
      default:
        break;
    }
  }
</script>

<button
  type="button"
  id={id}
  class="date-trigger"
  bind:this={triggerEl}
  onclick={toggle}
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy}
>
  <KuboIcon name="calendar" size={17} />
  <span class="date-trigger-value">{value ? formatDateLong(value) : 'Selecciona una fecha'}</span>
  <KuboIcon name="nav-arrow-down" size={14} />
</button>

<FloatingPanel anchorEl={triggerEl} open={open} onClose={() => closePicker(false)} width={280} panelClass="date-popover" ariaLabel="Seleccionar fecha">
  {#snippet children()}
    <div class="calendar-header">
      <button type="button" class="panel-action" onclick={() => shiftMonth(-1)} aria-label="Mes anterior">
        <KuboIcon name="nav-arrow-left" size={16} />
      </button>
      <span class="calendar-month-label">{formatMonthYear(viewMonth)}</span>
      <button type="button" class="panel-action" onclick={() => shiftMonth(1)} aria-label="Mes siguiente">
        <KuboIcon name="nav-arrow-right" size={16} />
      </button>
    </div>

    <div class="calendar-grid" role="grid" aria-label={formatMonthYear(viewMonth)} bind:this={gridEl} onkeydown={handleGridKeydown}>
      {#each WEEKDAYS as day (day)}
        <span class="calendar-weekday" aria-hidden="true">{day}</span>
      {/each}
      {#each days as day (day.iso)}
        <button
          type="button"
          class="calendar-day"
          class:is-outside={!day.inMonth}
          class:is-today={day.iso === todayIsoValue}
          class:is-selected={day.iso === value}
          data-iso={day.iso}
          tabindex={day.iso === focusedIso ? 0 : -1}
          aria-label={formatDateLong(day.iso)}
          aria-selected={day.iso === value}
          aria-current={day.iso === todayIsoValue ? 'date' : undefined}
          onclick={() => selectDay(day.iso)}
          onfocus={() => (focusedIso = day.iso)}
        >
          {parseIsoDate(day.iso).getDate()}
        </button>
      {/each}
    </div>

    <div class="calendar-footer">
      <button type="button" class="text-link" onclick={selectToday}>Hoy</button>
    </div>
  {/snippet}
</FloatingPanel>
