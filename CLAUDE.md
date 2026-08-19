# KUBO — Reglas obligatorias para Claude Code

## Stack
- Astro 7 + Svelte 5 (`@astrojs/svelte`) + TypeScript.
- Astro-first: páginas y layouts en `.astro`. Usa un componente Svelte (island) solo cuando la interfaz necesita estado o interactividad reactiva en cliente; todo lo demás se queda en Astro.
- Iconos: exclusivamente Iconoir vía `KuboIcon.astro`. No instales otras librerías de iconos ni uses emojis como icono.

## Fuentes de verdad
- Marca e identidad visual: `/docs/brand-system.md` (o `fuentes_digitales/brand-system.md`).
- Reglas de interfaz para todo `/admin`: `docs/admin-ui-rules.md`. Cualquier trabajo dentro de `/admin` debe seguir ese documento; consúltalo cuando corresponda en vez de asumir el contenido.
- QA de identidad ya aprobado: `QA_FINAL.md` (no modificar).

## Reglas de marca (resumen — detalle completo en brand-system.md)
- Logo: usa solo los SVG de `/assets/logos/web/`; nunca reconstruyas, recolorees ni coloques el logo sobre celeste.
- Color: tokens del sistema únicamente (carbón, marfil, rojo `#ED254E`, celeste). No uses rojo con texto marfil pequeño como CTA por defecto.
- Tipografía: Space Grotesk para comunicación; JetBrains Mono para estructura (nav, botones, precios, labels, metadata) — no en párrafos largos.
- Geometría: rectángulo como forma base; corte/muesca Kubo a 30° solo para marcar jerarquía, no en todo.
- Redacción: español claro, tuteo, técnico pero entendible, frases cortas, sin sobreprometer.

## Validación antes de dar por terminado un cambio
```bash
npm run check   # astro check (tipos + diagnósticos Svelte)
npm run build   # build de producción
```
Un componente Svelte no debe dejar warnings del compiler ni de accesibilidad.

## Restricciones críticas
- No modifiques los SVG maestros de `/assets/logos/` (solo lectura, son fuente).
- No reinterpretes la identidad de marca sin aprobación explícita.
- No dupliques aquí el contenido de `brand-system.md`, `admin-ui-rules.md` o `QA_FINAL.md`: referencia esos documentos en vez de copiarlos.
