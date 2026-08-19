# KUBO Admin — Login

## Objetivo
Implementar `/admin/login` como puerta de entrada visual al Admin KUBO. Debe comunicar precisión, calma y confianza. En esta etapa se implementa solo la UI y el contrato de estados; la autenticación real se conectará después.

## Fuentes
Respetar `CLAUDE.md`, `brand-system.md`, `docs/admin-ui-rules.md` y los SVG oficiales del logo. La referencia visual adjunta define composición y atmósfera, no debe usarse como asset.

## Layout

### Desktop
Split layout a altura completa.

Panel izquierdo (36–40%):
- fondo carbón/negro aprobado para Admin;
- logo KUBO oficial inverso;
- `ADMIN SYSTEM`;
- `[ TODO, BIEN PENSADO. ]`;
- `LIMA, PERÚ`;
- cutting mat / construction lines muy discretas;
- geometría KUBO mínima, sin ilustraciones inventadas.

Panel derecho:
- fondo marfil/blanco;
- formulario centrado verticalmente;
- ancho contenido aprox. 480–560 px;
- sin card flotante;
- espacio negativo generoso.

No añadir footer, barra inferior ni `Acceso restringido`.

### Tablet
Si el split pierde proporción, usar la composición mobile.

### Mobile <640
Una sola columna:
- fondo marfil;
- logo arriba;
- metadata `ADMIN SYSTEM`;
- formulario;
- CTA a ancho completo;
- detalle rojo mínimo;
- sin panel negro decorativo.

Validar 768, 390 y 360 px.

## Contenido
Heading: `INICIA SESIÓN`

Copy: `Ingresa tus credenciales para continuar.`

Campos:
- Correo electrónico: `type=email`, `autocomplete=email`.
- Contraseña: `type=password`, `autocomplete=current-password`.
- Show/hide password con Iconoir y aria-label dinámico.

CTA:
`Ingresar al Admin`

Usar CTA KUBO habitual: carbón + marfil, rectangular, limpio. ArrowRight opcional. Sin bevels, glow ni estilo futurista.

## Estados
Preparar:
- default;
- hover;
- focus-visible;
- password visible/oculta;
- loading;
- disabled;
- error inline.

Loading: `Ingresando…`

Error genérico:
`No pudimos iniciar sesión. Revisa tus credenciales.`

Sesión expirada, cuando exista backend:
`Tu sesión terminó. Ingresa nuevamente para continuar.`

No revelar si un correo existe.

## Interacción
Motion mínimo:
- entrada suave del panel/logo;
- formulario con fade/translate corto;
- focus preciso;
- hover discreto en CTA.

No usar typing, pulso continuo, loaders decorativos ni animaciones permanentes.

Respetar `prefers-reduced-motion`.

## Accesibilidad
- labels persistentes;
- orden de tab natural;
- focus visible;
- show/hide accesible;
- errores asociados al formulario;
- contraste correcto;
- no depender solo del rojo;
- CTA disabled durante submit;
- no bloquear password managers.

## Seguridad / contrato futuro
Esta pantalla no autentica por sí sola.

No implementar:
- credenciales hardcodeadas;
- password en frontend;
- `localStorage.loggedIn`;
- bypass visual;
- login simulado que dé acceso real.

El submit debe quedar desacoplado y preparado para un futuro servicio/backend de autenticación.

## Restricciones de marca
- Space Grotesk: comunicación.
- JetBrains Mono: metadata/labels estructurales.
- Iconoir únicamente.
- logo solo desde SVG oficial.
- rojo `#ED254E` como acento/focus.
- CTA carbón + marfil.
- sin gradients;
- sin card-in-card;
- cutting mat sutil.

## Fuera de alcance
- backend;
- sesiones reales;
- recuperación de contraseña;
- registro;
- OAuth;
- roles/permisos;
- MFA.

No mostrar controles para funciones inexistentes.

## Criterios de aceptación
- `/admin/login` existe y no usa el shell normal del Admin;
- desktop reproduce el split aprobado;
- mobile usa una columna limpia;
- no aparece `Acceso restringido`;
- no existe barra decorativa inferior;
- logo oficial;
- show/hide password funciona;
- loading/error/disabled preparados;
- teclado y focus correctos;
- reduced motion;
- no hay autenticación falsa;
- `/` y el resto de `/admin` no cambian visualmente;
- 768/390/360 sin overflow;
- `npm run check`;
- `npm run build`.
