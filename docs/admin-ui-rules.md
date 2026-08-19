# KUBO Admin — reglas de interfaz

Fuente de verdad para cualquier pantalla, componente o flujo dentro de `/admin`. Complementa (no repite) `fuentes_digitales/brand-system.md`. Expresa contratos y resultados esperados, no pasos de implementación.

## Primitives compartidas
- Antes de crear un componente nuevo, revisa `src/components/admin/ui/` (`Modal.svelte`, `Combobox.svelte`, `FloatingPanel.svelte`) y `src/lib/ui/portal.ts`. Reutilízalos o extiéndelos; no dupliques su lógica en otro componente.
- Toda pieza de UI reutilizable entre módulos de `/admin` vive en `src/components/admin/ui/`, no dentro de la carpeta de un módulo específico.

## Estados (status)
- Todo estado (pedido, gasto, compra pendiente, etc.) usa la primitive compartida `.status-badge` / `.status-chip` de `src/styles/admin-dashboard.css` (cápsula compacta ~23px, fondo tintado, sin borde ni sombra, Space Grotesk 11.5px). No crees badges de estado locales por módulo (por ejemplo, no dupliques esta lógica solo para Finanzas); si un módulo nuevo necesita un tono, agrega su modificador `status-*` a esa primitive.
- Toda pantalla nueva de Admin que represente estado, prioridad o disponibilidad debe reutilizar esta primitive global (`.status-badge` / `.status-chip` + su modificador `status-*`); no se permiten colores de estado definidos localmente por feature (ni en el CSS global con selectores que solo afecten a un módulo, ni en `<style>` de un componente), y ningún selector de layout específico de un módulo (por ejemplo una tarjeta mobile) debe pisar el color/tipografía de la primitive — un mismo estado se ve igual en cualquier pantalla, breakpoint o módulo.
- Prioridad (Alta/Media/Baja) puede apoyarse en la misma primitive visual, pero se mantiene semánticamente distinta de los estados (no reutilices la etiqueta de un estado como prioridad ni viceversa).

## Formularios y FormGrid
- Los formularios de admin se estructuran en una grilla (`FormGrid`: `.field-row` con celdas `.field`) que alinea labels, inputs y mensajes de error/ayuda en columnas consistentes; no maquetes formularios ad hoc con flexbox suelto.
- Cada campo mantiene label, control y mensaje de error en la misma columna vertical en cualquier breakpoint.
- Contrato FormGrid: cada celda `.field` dentro de un `.field-row` contiene su FormField completo (label + control + hint/error) y ninguna celda lleva margen propio — el espaciado entre celdas lo da el `gap` de `.field-row`, nunca un `margin-top` individual. En desktop `.field-row` es `minmax(0, 1fr) minmax(0, 1fr)` (pareja 6/6) y ambas celdas arrancan en la misma baseline vertical; en mobile (`<1024px`) pasa a una columna. No uses márgenes negativos ni offsets manuales para "corregir" la alineación de un campo puntual — si dos campos no alinean, la causa está en la regla compartida del FormGrid, no en el campo.
- Los estados de error se comunican con color + icono + texto (nunca solo color), y el foco se mueve al primer campo inválido al fallar la validación.

## Modal
- `Modal.svelte` es el único mecanismo para diálogos modales; no montes overlays propios con `position: fixed` a mano.
- Contrato: bloquea el scroll del `body` mientras está abierto, atrapa el foco dentro del diálogo, cierra con `Escape` y con click en el overlay, y devuelve el foco al elemento que lo abrió al cerrarse.
- Breakpoints: en cualquier tamaño (escritorio, tablet y móvil) es un popup centrado con márgenes laterales fijos (~16px en móvil) y ancho máximo según el tamaño (`default`/`compact`/`form`); nunca ocupa la pantalla completa ni se ancla a un borde como bottom sheet — ese patrón queda reservado para `FloatingPanel` (Combobox/Popover/Calendar).

## Combobox / FloatingPanel / Portal
- `Combobox.svelte` es el único patrón para selección con búsqueda/autocompletado; no reimplementes su lógica de teclado (flechas, `Enter`, `Escape`) en otro componente.
- `FloatingPanel.svelte` posiciona cualquier panel flotante (dropdown, menú, tooltip interactivo) relativo a su elemento disparador y se reposiciona si no cabe en el viewport.
- Todo panel flotante o modal se monta vía `portal.ts` al final del `body`, para no heredar `overflow`/`transform`/`z-index` de contenedores padres.

## Ownership de scroll y overlays
- Solo un elemento controla el scroll bloqueado a la vez. Si un Modal abre un Combobox interno, el Combobox no vuelve a tocar el scroll del `body`.
- Los overlays (Modal, FloatingPanel, tooltips) usan una escala de `z-index` única y centralizada; no definas valores de `z-index` mágicos por componente.
- Cerrar un overlay padre cierra también sus overlays hijos.

## Sidebar global (siempre visible)
- En escritorio (`>=1024px`) la sidebar (`.admin-sidebar` en `AdminNavigation.svelte`) está siempre expandida (~240px, logo horizontal + labels + iconos) y es fija (`position: fixed`); `.admin-main` reserva ese mismo ancho con `margin-left`, así que es un push de layout, no un overlay ni un estado que dependa de `:hover`/`:focus-within`.
- El botón de navegación del topbar (`[data-sidebar-toggle]`) es exclusivo de mobile/tablet (`<1024px`): abre el drawer. En escritorio no existe control de colapso ni estado contraído.
- El estado activo (fondo rojo translúcido + riel `#ED254E` sólido) se mantiene visible junto con la label.
- En mobile/tablet (`<1024px`) se conserva el drawer existente (abre con el botón del topbar, cierra con `Escape`, click en el scrim, o al perder el foco tras navegar), siempre mostrando el layout expandido completo.
- No introduzcas un segundo mecanismo de colapso/expansión de sidebar en un módulo específico — este es el único contrato para todo `/admin`, heredado por el shell (`AdminLayout.astro`).

## Responsive
- Diseña mobile-first; el layout de escritorio es una expansión del layout móvil, no al revés.
- Tablas densas de admin deben tener una alternativa legible en móvil (scroll horizontal contenido o vista de tarjetas), nunca texto truncado sin acceso al valor completo.
- Ningún contenedor de `/admin` provoca scroll horizontal en el `body` de la página.
- Gutters/containers mobile: `.admin-content` fija el gutter lateral (`padding-inline` ~16px por lado bajo 768px) y es la única fuente de verdad del margen izquierdo/derecho — ningún módulo dentro del workspace lo reproduce con `100vw`, márgenes negativos ni cálculos propios de ancho. Todo hijo directo de un contenedor grid/flex responsive (`.expenses-header` y equivalentes) lleva `min-width: 0` (o `minmax(0, 1fr)` en la columna del grid): sin eso, contenido intrínsecamente ancho (botones, toggles, texto sin wrap) puede desbordar su celda y romper el gutter simétrico sin que aparezca scroll horizontal (el reset global usa `overflow-x: hidden` en `html`/`body`, así que el síntoma es contenido recortado, no una barra de scroll). No enmascares un desborde con `overflow-x: hidden` local nuevo: encuentra qué hijo excede su contenedor y corrígelo con `min-width: 0` / `flex-wrap` / `box-sizing: border-box`.

## Tipografía y contraste
- Usa Space Grotesk para contenido comunicacional y JetBrains Mono para datos estructurados (tablas, precios, SKU, estados), siguiendo `brand-system.md`.
- Todo texto de interfaz cumple AA (≥4.5:1 para texto normal, ≥3:1 para texto grande) usando las combinaciones de color ya validadas en `brand-system.md`; no introduzcas combinaciones de color nuevas para resolver contraste.

## Accesibilidad
- Todo control interactivo es alcanzable y operable por teclado, con estado de foco visible.
- Los inputs tienen `label` asociado (no placeholder como único label); los iconos-botón llevan `aria-label`.
- Los cambios de estado async (guardado, error, carga) se anuncian de forma que un lector de pantalla los detecte (`aria-live` o equivalente), no solo con un cambio visual.

## Svelte sin warnings
- Un cambio no se considera terminado si `npm run check` reporta warnings del compiler de Svelte o de accesibilidad (`a11y-*`) en los archivos tocados.

## QA visual y técnico
- Antes de dar por cerrado un cambio de UI en `/admin`: `npm run check` y `npm run build` pasan limpios, y la pantalla se validó en al menos un breakpoint de escritorio y uno móvil.
- Verifica que el cambio no rompe el contrato de scroll/overlay de una pantalla vecina (por ejemplo, un Modal abierto desde una tabla con Combobox).
