# KUBO - Guía de fuentes para ChatGPT y Claude

## Objetivo del flujo

El flujo definido para KUBO es:

1. **ChatGPT Project** actúa como estratega, prompter y experto UX/UI.
2. ChatGPT consulta los documentos fuente de KUBO antes de proponer arquitectura, interfaces, copy o componentes.
3. ChatGPT entrega especificaciones y prompts de implementación.
4. **Claude Code** actúa como constructor dentro del proyecto Astro.
5. Claude Code implementa respetando `CLAUDE.md`, `brand-system.md`, tokens, Iconoir y los SVG oficiales.

## Archivos recomendados como fuentes del proyecto ChatGPT

Subir como mínimo:
1. `01_KUBO_Brief_1.0.md`
2. `02_KUBO_Manual_de_Marca_1.0.md`
3. `03_KUBO_Manual_de_Identidad_Visual_1.0.md`

También es útil subir:
4. `brand-system.md`
5. `CLAUDE.md`
6. `QA_FINAL.md`

Los PDF son para lectura humana e interna. Los `.md` son la fuente más fácil de consultar, citar y transformar para un agente.

## Prioridad cuando haya dudas

1. **Brief**: hechos del negocio, alcance, capacidades y decisiones estratégicas.
2. **Manual de Marca**: posicionamiento, personalidad, voz, mensajes y comportamiento de marca.
3. **Manual de Identidad Visual**: reglas visuales, color, tipografía, logo, sistema gráfico y digital.
4. **brand-system.md / CLAUDE.md**: implementación web concreta.
5. **QA_FINAL.md**: validaciones y límites técnicos.

Si dos documentos parecen contradecirse, no inventar una reconciliación. Identificar el conflicto y pedir decisión.

## Reglas para el ChatGPT Project

El experto UX/UI debe:
- no cambiar logo, paleta, tipografías o sistema gráfico sin solicitud explícita;
- no reemplazar `Custom` o `Lab` por otros nombres sin decisión del proyecto;
- recordar que la navegación `Productos · Colecciones · Custom · Lab · Nosotros` es conceptual y no equivale todavía a arquitectura de información final;
- diseñar con enfoque medio-alto, limpio, cálido y técnico sin volverse industrial;
- utilizar JetBrains Mono con presencia visible en estructura, navegación y datos;
- priorizar accesibilidad y usabilidad sobre decoración;
- usar la geometría KUBO a 30° solo en elementos jerárquicos;
- aplicar cutting mat con intensidad baja/media/alta según contexto;
- no usar celeste como fondo del logo;
- no utilizar rojo #ED254E como CTA estándar con texto pequeño marfil;
- proponer Iconoir únicamente;
- no inventar capacidad industrial;
- mantener copy corto, directo y entendible;
- distinguir claramente recomendación UX de decisión de marca ya aprobada.

## Reglas para Claude Code

Claude Code debe tratar `CLAUDE.md` como contrato de implementación.

La regla práctica es:

**ChatGPT decide y especifica. Claude construye. Los documentos de KUBO limitan a ambos.**

## Archivos visuales

Para web utilizar `/logos_web/`, no los SVG maestros con artboard completo.

Los PDF no deben utilizarse como fuente para extraer logos o colores si existen SVG/tokens oficiales.
