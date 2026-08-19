---
title: KUBO - Manual de Identidad Visual 1.0
status: Aprobado
version: 1.0
role: Fuente visual y de implementación
language: es-PE
---

# KUBO - Manual de Identidad Visual 1.0

## 1. Alcance

Este manual regula **cómo se ve KUBO** y cómo debe implementarse su sistema visual en digital, packaging, producto, presentaciones, redes y piezas corporativas.

La fuente válida del logotipo son exclusivamente los SVG oficiales. No se reconstruye, redibuja ni interpreta el símbolo.

## 2. Principios visuales

La identidad debe transmitir:
- orden;
- precisión;
- contemporaneidad;
- fabricación digital;
- funcionalidad;
- calidez suficiente para no sentirse industrial o clínica.

Principio rector:

**Todo tiene una razón.**

La geometría KUBO da identidad. La retícula da orden.

## 3. Sistema de logotipo

El sistema oficial incluye:
- composición horizontal;
- composición vertical;
- símbolo independiente.

Cada composición existe en las variantes cromáticas oficiales entregadas.

### Horizontal
Firma principal para contextos horizontales y digitales.

Uso prioritario:
- header desktop;
- footer;
- checkout;
- documentos digitales;
- zonas institucionales.

### Vertical
Para composiciones centradas o de mayor presencia editorial.

Uso prioritario:
- portadas;
- packaging;
- presentaciones;
- redes;
- composiciones centradas.

### Símbolo
Para espacios compactos.

Uso prioritario:
- favicon;
- avatar;
- header móvil compacto;
- loader;
- controles o contextos donde el wordmark no sea necesario.

## 4. Variantes cromáticas del logo

### Principal
Carbón `#141414` + rojo `#ED254E`.

Uso: fondos claros autorizados.

### Inversa color
Marfil `#FCF9F4` + rojo `#ED254E`.

Uso: carbón y fondos oscuros compatibles.

### Monocroma carbón
`#141414`.

Uso: fondos claros y reproducciones monocromáticas dentro de la paleta de marca.

### Monocroma marfil
`#FCF9F4`.

Uso: rojo, carbón u otros fondos oscuros permitidos cuando se necesite una sola tinta dentro de la paleta de marca.

### Positiva pura
Negro `#000000`.

### Negativa pura
Blanco `#FFFFFF`.

Negro y blanco puros forman parte del sistema oficial para contextos positivo/negativo o reproducciones estrictamente binarias. No sustituyen automáticamente al carbón y marfil en comunicación normal.

## 5. Fondos

Reglas aprobadas:
- principal carbón + rojo sobre fondos claros autorizados;
- inversa color sobre carbón / oscuro compatible;
- monocroma marfil sobre rojo u oscuro cuando corresponda;
- monocroma carbón sobre claro;
- negro/blanco puros cuando el contexto técnico requiera positivo/negativo puro.

**El celeste no se utiliza como fondo del logotipo.**

Nunca recolorear manualmente el logo para adaptarlo a un fondo.

## 6. Tamaños mínimos digitales

Valores recomendados a partir de las pruebas de estrés:
- horizontal: **120 px de ancho**;
- vertical: **96 px de ancho**;
- símbolo: **24 px**.

A 16 px, si fuera indispensable, preferir una versión monocromática.

Estos valores son mínimos de uso digital, no tamaños obligatorios de diseño.

## 7. Área de seguridad

KUBO dispone de un criterio de zona de protección en sus archivos de construcción.

No se documenta aquí un múltiplo exacto porque el archivo vectorial entregado para las variantes finales no incluye una relación explícita y verificable entre esa zona y el módulo X.

Regla:
- respetar la zona de protección del archivo de construcción original;
- no inferir una medida nueva sin validar ese archivo;
- evitar que textos, bordes, fotografías u otros logos invadan el espacio de respiración del conjunto.

Esta es una norma intencionalmente no cuantificada para no inventar una medida técnica.

## 8. Usos incorrectos del logo

No:
- cambiar colores fuera de las variantes oficiales;
- deformar horizontal o verticalmente;
- rotar;
- alterar el espaciado del wordmark;
- reconstruir el nombre con otra tipografía;
- cambiar el símbolo;
- añadir sombras, contornos o efectos;
- colocar la firma sobre celeste;
- usar una variante que pierda contraste con el fondo;
- generar versiones del logo mediante IA.

## 9. Geometría oficial

Extraída de los SVG oficiales:
- eje oblicuo principal: **30°**;
- ejes verticales: **90°**;
- caja visual aproximada del símbolo: `450 × 512.1` unidades vectoriales;
- relación ancho/alto aproximada: `0.879`;
- módulo X: `≈47.5` unidades vectoriales;
- banda central: `≈47.95 u`;
- separaciones internas: `≈47.45–47.46 u`.

La repetición de estas medidas confirma una estructura modular aproximada de **1X** en el canal y banda central.

## 10. Sistema de formas

### Bloque base
Rectángulo limpio. Es la forma predominante.

### Corte KUBO
Corte a **30°**, derivado del símbolo.

Uso:
- CTA destacados;
- encabezados;
- banners;
- transiciones;
- módulos de jerarquía.

### Muesca KUBO
Entrada o desplazamiento basado en la misma familia angular de 30°.

### Separación modular
Espacios ordenados inspirados en el módulo X y los canales internos del símbolo.

Regla: las formas especiales son **momentos de identidad**, no la forma por defecto de toda la interfaz.

## 11. Curvas y radios

Los remates del logotipo están construidos mediante curvas Bézier. No existe una regla aprobada que convierta esos remates en un único radio de UI.

Los radios de botones, cards e inputs se definen durante UX/UI según función y consistencia. No deben justificarse diciendo que son el radio del logo.

## 12. Paleta de color

### Carbón KUBO
- HEX: `#141414`
- RGB: `20, 20, 20`
- CMYK orientativo: `0, 0, 0, 92`
- Rol: estructura, texto, iconografía, CTA principal, fondos oscuros.

### Marfil KUBO
- HEX: `#FCF9F4`
- RGB: `252, 249, 244`
- CMYK orientativo: `0, 1, 3, 1`
- Rol: superficie principal y descanso visual.

### Rojo KUBO
- HEX: `#ED254E`
- RGB: `237, 37, 78`
- CMYK orientativo: `0, 84, 67, 7`
- Rol: identidad, selección, revisión, acento, foco, estados importantes.

### Celeste informativo
- HEX: `#98D7E0`
- RGB: `152, 215, 224`
- CMYK orientativo: `32, 4, 0, 12`
- Rol: construcción, retículas, cotas, diagramas, información secundaria y superficies informativas.

Los valores CMYK son conversiones orientativas y deben ajustarse al perfil real de impresión. No se define Pantone sin una prueba o equivalencia validada.

## 13. Jerarquía cromática

La identidad no necesita utilizar los cuatro colores en cada pieza.

Regla general:
- marfil + carbón dominan;
- rojo identifica y activa;
- celeste informa y construye.

El rojo y el celeste no compiten por ser el color principal.

## 14. Accesibilidad digital

Contrastes calculados:
- carbón / marfil: `17.54:1`;
- carbón / celeste: `11.52:1`;
- carbón / rojo: `4.36:1`;
- rojo / marfil: `4.02:1`;
- celeste / marfil: `1.52:1`.

Reglas:
- CTA principal estándar: **carbón + marfil**;
- rojo + marfil no se usa para texto normal pequeño;
- carbón + rojo no debe asumirse como combinación AA para texto normal;
- celeste + marfil no se usa para texto crítico;
- celeste estructura, carbón comunica el dato importante.

## 15. Tipografía principal: Space Grotesk

Rol: **comunicar**.

Usos:
- H1, H2, H3;
- nombres de producto;
- párrafos;
- descripciones;
- contenidos editoriales;
- mensajes principales.

Pesos recomendados:
- Regular: cuerpo;
- Medium: subtítulos / interfaz secundaria;
- Semibold: titulares y énfasis.

No se hace aquí una afirmación sobre licencia. Debe verificarse la licencia de distribución cuando se prepare producción final.

## 16. Tipografía técnica: JetBrains Mono

Rol: **estructurar**.

KUBO utiliza JetBrains Mono con mayor presencia que una marca técnica mínima.

Usos aprobados:
- navegación;
- botones;
- breadcrumbs;
- precios;
- SKU;
- categorías;
- numeración de secciones;
- labels de formularios;
- estados;
- materiales;
- dimensiones;
- metadata;
- especificaciones.

No utilizar JetBrains Mono para párrafos largos.

Principio:

**Space Grotesk comunica. JetBrains Mono estructura.**

## 17. Jerarquía digital orientativa

La siguiente escala es una referencia para iniciar UX/UI, no una retícula rígida.

### Desktop
- H1 Space Grotesk Semibold: `56–64 px`;
- H2 Space Grotesk Semibold: `38–44 px`;
- H3 Space Grotesk Medium: `26–30 px`;
- cuerpo grande: `18 px`;
- cuerpo: `16 px`;
- navegación JetBrains Mono Medium: `14–15 px`;
- botón JetBrains Mono Medium: `14–15 px`;
- label técnico JetBrains Mono: `11–12 px`;
- especificación JetBrains Mono: `12–14 px`.

### Mobile
- H1: `38–42 px`;
- H2: `30–34 px`;
- H3: `23–26 px`;
- cuerpo: `16–17 px`;
- navegación / botón: `14–15 px`;
- datos técnicos: `11–13 px`.

En implementación responsive se prefieren escalas fluidas y pruebas reales de legibilidad.

## 18. Mayúsculas

Usar mayúsculas principalmente en:
- navegación;
- labels;
- códigos;
- categorías;
- estados;
- información técnica.

Usar escritura normal en:
- titulares principales;
- slogan;
- párrafos;
- explicaciones.

Correcto:

`MATERIAL / PLA+`

**Todo, bien pensado.**

Evitar convertir toda la comunicación en mayúsculas.

## 19. Iconografía

Biblioteca oficial: **Iconoir**.

Reglas:
- estilo regular / lineal;
- una sola familia;
- no mezclar con Lucide, Tabler, Font Awesome, Heroicons u otras bibliotecas;
- no utilizar emojis como sustituto de iconos UI;
- selección concreta de iconos durante producción según necesidad real.

Color:
- carbón: estándar;
- celeste: información secundaria;
- rojo: estado o acción puntual cuando corresponda.

## 20. Implementación Iconoir en Astro

El proyecto debe centralizar iconos mediante:

`src/components/ui/KuboIcon.astro`

La biblioteca se instala como dependencia y los SVG se importan solo cuando la interfaz realmente los necesita.

No permitir que un constructor o agente añada una segunda librería por conveniencia.

El handoff incluye un componente base `KuboIcon.astro` y reglas en `CLAUDE.md`.

## 21. Cutting mat

Referencia conceptual: base de corte, medición, construcción y trabajo de precisión.

Regla central:

**El cutting mat organiza. No decora.**

Elementos posibles:
- retículas;
- escalas;
- cotas;
- numeración;
- líneas guía;
- cruces de registro;
- ángulos;
- diagramas.

Todo dato técnico debe ser real.

## 22. Intensidad del cutting mat

### Baja: producto / home / comunicación general
Utilizar uno o pocos recursos técnicos. El producto y la fotografía dominan.

### Media: Custom
Permitir retícula parcial, medidas, numeración o datos que ayuden a explicar el proyecto.

### Alta: Lab
Mayor densidad técnica: herramientas, procesos, materiales, cotas, pruebas y versiones.

Regla de compensación:

**Cuanto más fuerte sea una forma KUBO, más silencioso debe ser el cutting mat, y viceversa.**

## 23. Fotografía de producto

Dirección:
- clara;
- cálida;
- ordenada;
- contemporánea;
- fondos predominantemente claros;
- producto protagonista.

Materiales de apoyo permitidos:
- madera clara;
- vidrio;
- metal;
- superficies minerales;
- textiles neutros.

Evitar escenarios recargados o códigos de lujo artificial.

## 24. Fotografía ambientada

Contextos naturales:
- setup;
- escritorio;
- mesa auxiliar;
- espacios de trabajo;
- interiores contemporáneos.

La composición debe reforzar la idea de que **todo tiene un lugar**.

Presencia humana baja. Las manos o personas aparecen cuando ayudan a mostrar escala, función o interacción.

## 25. Lab y detrás de cámaras

Lab admite una fotografía más técnica y real.

Mostrar cuando aporte:
- impresora;
- filamento;
- herramientas;
- computadora;
- Fusion;
- Blender;
- Bambu Studio;
- montaje;
- pruebas;
- postprocesado;
- packaging.

Las redes sociales pueden mostrar más detrás de cámaras que la web institucional.

## 26. Custom y casos de estudio

La documentación visual recomendada es:
1. necesidad;
2. diseño;
3. visualización;
4. prototipo;
5. fabricación;
6. resultado.

Esto debe demostrar proceso y capacidad de desarrollo, no solo enseñar una pieza terminada.

## 27. Render 3D

Estilo: **técnico-conceptual**.

Uso:
- propuesta;
- visualización previa;
- aprobación;
- variantes;
- dimensiones;
- comparaciones.

No usar renders como sustituto habitual de fotografía cuando el producto terminado ya existe.

Relación cromática sugerida:
- objeto neutro;
- líneas y construcción en celeste;
- revisión o punto de atención en rojo;
- datos críticos en carbón.

## 28. Packaging

Dirección:
- minimalista;
- ordenada;
- información clara;
- base marfil/carbón;
- rojo como acento;
- celeste para información técnica puntual.

Evitar llenar cada cara con retículas, cotas o recursos del cutting mat.

El packaging debe sentirse medio-alto mediante orden, material y presentación, no mediante códigos de lujo.

## 29. Aplicación digital

Principios:
- la web debe sentirse primero como una marca de producto y estudio de diseño;
- la capacidad técnica se descubre al profundizar;
- formas KUBO solo en jerarquías relevantes;
- CTA principal accesible en carbón + marfil;
- rojo como acento;
- celeste informativo;
- JetBrains Mono puede tener presencia visible en navegación y sistema;
- datos técnicos siempre reales.

La arquitectura conceptual actualmente disponible es:
`Productos · Colecciones · Custom · Lab · Nosotros`.

No debe confundirse con una arquitectura UX final. Wireframes y flujos se desarrollan posteriormente.

## 30. SVG para web

Para producción digital utilizar los SVG optimizados ubicados en `/logos_web/`.

Estos archivos:
- conservan los mismos trazados;
- conservan los colores oficiales;
- tienen el `viewBox` ajustado al dibujo real;
- evitan el espacio vacío del artboard original.

Los SVG maestros se conservan intactos como fuente original.

## 31. Tokens de implementación

```css
:root {
  --kubo-carbon: #141414;
  --kubo-ivory: #FCF9F4;
  --kubo-red: #ED254E;
  --kubo-blue: #98D7E0;

  --font-kubo-sans: "Space Grotesk", system-ui, sans-serif;
  --font-kubo-mono: "JetBrains Mono", ui-monospace, monospace;

  --kubo-cut-angle: 30deg;
}
```

No repetir valores HEX aislados cuando exista un token de sistema.

## 32. Reglas para Claude Code

Claude Code debe:
- leer `brand-system.md` antes de diseñar componentes;
- usar logos de `/logos_web/`;
- no reconstruir logos;
- usar Iconoir mediante `KuboIcon.astro`;
- no instalar otra librería de iconos;
- usar Space Grotesk para comunicación y JetBrains Mono para estructura;
- respetar la jerarquía cromática;
- usar corte/muesca a 30°;
- controlar la intensidad del cutting mat;
- no inventar datos técnicos.

El archivo `CLAUDE.md` del handoff contiene estas reglas en formato directo para el constructor.

## 33. Checklist visual

Antes de aprobar una pieza:
- ¿se utilizó el SVG oficial correcto?
- ¿el fondo está autorizado para esa variante?
- ¿el logo conserva su proporción?
- ¿la pieza usa formas especiales solo donde aportan jerarquía?
- ¿el cutting mat organiza o solo decora?
- ¿los datos técnicos son reales?
- ¿el rojo está actuando como acento y no saturando la pieza?
- ¿el celeste se utiliza como información y no como texto crítico?
- ¿Space Grotesk y JetBrains Mono respetan sus roles?
- ¿la fotografía se siente clara, cálida y ordenada?
- ¿la interfaz mantiene contraste suficiente?
- ¿la pieza se siente KUBO sin necesitar repetir el logo constantemente?

## 34. Pendientes de producción

No bloquean la identidad 1.0:
- validar fotografía con la primera sesión real;
- seleccionar iconos específicos de Iconoir durante desarrollo;
- verificar licencias de fuentes en el contexto de distribución final;
- cuantificar el área de seguridad solo cuando se disponga del archivo vectorial de construcción que permita medirla sin inferencias.

## 35. Fuente de verdad

Este manual define la identidad visual de KUBO.

Para estrategia y tono, consultar el **Manual de Marca 1.0**.

Para implementación, consultar también:
- `brand-system.md`;
- `CLAUDE.md`;
- `brand-tokens.css`;
- `KuboIcon.astro`;
- `/logos_web/`.
