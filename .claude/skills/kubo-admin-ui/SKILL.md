---
name: kubo-admin-ui
description: Usar al crear o modificar cualquier interfaz bajo /admin en el proyecto KUBO (páginas, componentes, formularios, modales, comboboxes, layouts de admin). Carga los contratos de UI de admin antes de tocar código.
---

# KUBO Admin UI

1. Lee `docs/admin-ui-rules.md` completo antes de escribir o editar código de `/admin`. Esos son los contratos vigentes (primitives, formularios, Modal, Combobox/FloatingPanel/Portal, scroll/overlays, responsive, tipografía/contraste, accesibilidad).
2. Antes de crear un componente, revisa `src/components/admin/ui/` y `src/lib/ui/portal.ts`. Reutiliza lo existente; no reimplementes Modal, Combobox ni FloatingPanel.
3. Implementa siguiendo los contratos leídos, no supuestos propios.
4. Antes de cerrar el cambio, valida contra la sección "QA visual y técnico" de `docs/admin-ui-rules.md`: corre `npm run check` y `npm run build`, y revisa al menos un breakpoint de escritorio y uno móvil.
