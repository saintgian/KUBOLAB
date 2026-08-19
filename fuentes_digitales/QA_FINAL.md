# KUBO — Control de Calidad Final de Identidad

**Resultado general: APROBADO CON CORRECCIONES TÉCNICAS APLICADAS**

Fecha de revisión: 2026-08-16

## 1. Coherencia estratégica — APROBADO
La identidad visual es coherente con el posicionamiento definido:
- orden y precisión sin caer en una estética industrial dominante;
- diseño funcional y fabricación como núcleo;
- lenguaje medio-alto sin códigos de lujo;
- capacidad de convivir entre producto B2C y Custom B2B.

No se detectan contradicciones estratégicas que obliguen a replantear la identidad.

## 2. Logotipo y reproducción — APROBADO
Se validaron **18 SVG oficiales**.

### Hallazgo corregido
Los SVG maestros conservaban un artboard cuadrado de 1080 × 1080 con espacio vacío alrededor del arte. Eso no altera el logo, pero sí podía generar problemas de tamaño, alineación y responsive al usarlos directamente en Astro.

**Corrección aplicada:** se crearon copias de producción web en `/assets/logos/web/` con el mismo trazado y color, pero `viewBox` ajustado al dibujo real.

Los maestros originales permanecen intactos.

### Tamaños mínimos digitales
- Horizontal: 120 px de ancho.
- Vertical: 96 px de ancho.
- Símbolo: 24 px.
- A 16 px, usar monocromático solo cuando sea indispensable.

### Uso por composición
- Horizontal: firma normal, header desktop, footer, checkout.
- Símbolo: móvil compacto, avatar, favicon, espacios reducidos.
- Vertical: portadas, packaging, redes y composiciones centradas.

## 3. Variantes cromáticas — APROBADO
Variantes de marca:
- principal carbón + rojo;
- inversa marfil + rojo;
- monocroma carbón;
- monocroma marfil.

Versiones positivo / negativo puro:
- negro puro #000000: positivo monocromático;
- blanco puro #FFFFFF: negativo monocromático.

Ambas forman parte del sistema oficial del logotipo. Se usan cuando corresponde una reproducción estrictamente negra o blanca, sin sustituir automáticamente a las variantes de marca en carbón y marfil.

El celeste **no se utiliza como fondo del logotipo**.

## 4. Color y accesibilidad — APROBADO CON REGLAS
El rojo oficial es **#ED254E**.

No se encontró el rojo anterior `#F5322C` en los SVG actualizados: **NO**.

Contrastes WCAG calculados:
- Carbón / Marfil: **17.54:1**
- Carbón / Celeste: **11.52:1**
- Carbón / Rojo: **4.36:1**
- Rojo / Marfil: **4.02:1**
- Celeste / Marfil: **1.52:1**

Reglas:
- CTA estándar: carbón + marfil.
- Rojo: acento, selección, estado, revisión, focus/hover puntual.
- Rojo + marfil no se usa para texto normal pequeño.
- Celeste + marfil no se usa para texto.
- Celeste estructura; carbón comunica la información crítica.

## 5. Geometría — APROBADO
Extraída de los SVG oficiales:
- eje oblicuo: 30°;
- módulo X ≈ 47.5 u;
- banda central ≈ 1X;
- separaciones internas ≈ 1X.

Aplicación:
- bloque normal como forma dominante;
- corte Kubo a 30°;
- muesca Kubo a 30°;
- separación modular derivada de X.

Las curvas Bézier del logo no se traducen a un radio de UI.

## 6. Tipografía — APROBADO
### Space Grotesk
Comunica: titulares, nombres de producto, párrafos y contenidos editoriales.

### JetBrains Mono
Estructura: navegación, botones, breadcrumbs, precios, SKU, labels, metadata, estados y especificaciones.

La mayor presencia de JetBrains Mono es coherente con Kubo siempre que no se use para párrafos largos.

**Pendiente no bloqueante:** verificar licencias/fuentes de distribución cuando se prepare producción final. No se hace ninguna afirmación de licencia en el sistema actual.

## 7. Sistema gráfico / cutting mat — APROBADO
Regla central:
**El cutting mat organiza. No decora.**

- Producto/home: intensidad baja.
- Custom: media.
- Lab: alta.
- Datos técnicos: siempre reales.
- No acumular recursos técnicos cuando una forma Kubo ya aporta suficiente identidad.

No se detecta necesidad de añadir más recursos gráficos.

## 8. Fotografía y render — APROBADO A NIVEL DE DIRECCIÓN
Producto:
- clara;
- cálida;
- fondos predominantemente claros;
- producto protagonista;
- presencia humana baja.

Lab:
- puede ser más técnico y documental.

Custom:
- documentar como caso de estudio.

Render:
- técnico-conceptual;
- para desarrollo y aprobación;
- no sustituye habitualmente la fotografía final.

**Pendiente de producción:** la dirección está aprobada, pero deberá validarse con las primeras fotografías reales de Kubo.

## 9. Iconografía — APROBADO
- Biblioteca: Iconoir.
- Estilo: regular / lineal.
- Una sola familia.
- Selección de iconos concretos durante producción.
- Componente central: `KuboIcon.astro`.

No es necesario elegir ahora un catálogo artificial de iconos.

## 10. Preparación digital — APROBADO
El handoff ya contiene:
- tokens de color;
- roles tipográficos;
- regla angular;
- componente de iconos;
- SVG web optimizados;
- reglas para Claude Code;
- sistema de marca digital.

La identidad está preparada para pasar a Astro sin requerir reinterpretar el branding.

## 11. Revisión de contradicciones
No se detectaron contradicciones críticas entre:
- brief;
- paleta;
- logo;
- tipografía;
- geometría;
- cutting mat;
- Custom;
- Lab;
- fotografía;
- reglas digitales.

### Única corrección estructural encontrada
Los SVG maestros no estaban optimizados para uso directo en layout web debido al artboard cuadrado. La corrección ya está aplicada mediante exportaciones web independientes.

## Conclusión
**KUBO · IDENTIDAD 1.0 puede considerarse congelada.**

A partir de este punto:
- no se buscan nuevas rutas visuales;
- no se agregan nuevos colores o familias tipográficas sin una necesidad demostrable;
- los cambios futuros deben ser de implementación, producción o evolución controlada.

## Siguiente etapa
1. Manual de Marca.
2. Manual de Identidad Visual.
3. Después, implementación web como proyecto independiente.
