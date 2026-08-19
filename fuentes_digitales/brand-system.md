# KUBO — Sistema de marca digital

## Fuente de verdad
Este archivo define las reglas de interfaz de Kubo. No reinterpretar la identidad sin aprobación.

## Tokens
```css
--kubo-carbon: #141414;
--kubo-ivory: #FCF9F4;
--kubo-red: #ED254E;
--kubo-blue: #98D7E0;
```

## Jerarquía de color
- Base: marfil + carbón.
- Rojo: identidad, selección, revisión, acento, hover/focus puntual.
- Celeste: estructura e información.
- CTA principal: carbón con texto marfil.
- No usar rojo como fondo estándar de CTA con texto pequeño marfil.
- El logo nunca se coloca sobre celeste.

## Tipografía
### Space Grotesk
Comunicación:
- títulos
- nombres de producto
- párrafos
- contenidos editoriales

### JetBrains Mono
Estructura:
- navegación
- botones
- breadcrumbs
- precios
- metadata
- labels
- SKU
- dimensiones
- estados
- especificaciones

No usar JetBrains Mono en párrafos largos.

## Logo digital
- Desktop / firma normal: horizontal.
- Móvil compacto, favicon, avatar: símbolo.
- Vertical: composiciones centradas, portadas o aplicaciones especiales.
- Horizontal mínimo recomendado: 120px.
- Vertical mínimo recomendado: 96px.
- Símbolo mínimo recomendado: 24px.
- A 16px, preferir monocromático.

## Geometría de interfaz
- Forma normal: rectangular.
- Corte de identidad: 30°.
- Muescas: 30°.
- Formas Kubo solo en momentos de jerarquía.
- No cortar todos los botones o tarjetas.
- El sistema de radios de UI es independiente de las curvas Bézier del logo.

## Cutting mat
- Organiza, no decora.
- Producto/home: baja intensidad.
- Custom: media.
- Lab: alta.
- No acumular grid + cotas + cruces + coordenadas + numeración si no aportan información.
- Todo dato técnico mostrado debe ser real.

## Iconos
- Iconoir únicamente.
- Estilo regular / lineal.
- Importar SVG y centralizar en `KuboIcon.astro`.
- No instalar otra biblioteca.
- No usar emojis como sustituto.

## Accesibilidad
Contrastes de referencia:
- carbón / marfil: 17.54:1
- carbón / celeste: 11.52:1
- carbón / rojo: 4.36:1
- rojo / marfil: 4.02:1

Para texto normal AA, usar preferentemente carbón sobre marfil/celeste o marfil sobre carbón.


## Archivos SVG para web
Para interfaz y producción web usar exclusivamente los SVG de:

`/assets/logos/web/`

Estos archivos conservan exactamente los trazados y colores oficiales, pero su `viewBox` está ajustado al dibujo real para evitar el espacio vacío del artboard original de Illustrator.

Los SVG maestros de `/assets/logos/` se conservan sin alterar como archivos fuente.

No editar el `viewBox` de forma manual en componentes.
