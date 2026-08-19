<script lang="ts">
  /**
   * KuboIcon.svelte
   * Mismo contrato público que KuboIcon.astro (name/size/class/label), pero consumible dentro
   * de islas Svelte hidratadas — KuboIcon.astro no puede usarse ahí porque `set:html` es una
   * directiva exclusiva de Astro. Reutiliza el mismo mapa `?raw` de icon-map.ts: no es una
   * segunda librería de iconos, es el mismo Iconoir con un envoltorio distinto.
   */
  import { sizedIconMarkup, type IconName } from './icon-map';

  interface Props {
    name: IconName;
    size?: number;
    class?: string;
    label?: string;
  }

  let { name, size = 20, class: className = '', label: ariaLabel = undefined }: Props = $props();

  let markup = $derived(sizedIconMarkup(name, size));
</script>

<span
  class={className}
  style={`display:inline-flex; width:${size}px; height:${size}px;`}
  aria-hidden={ariaLabel ? undefined : 'true'}
  aria-label={ariaLabel}
>{@html markup}</span>
