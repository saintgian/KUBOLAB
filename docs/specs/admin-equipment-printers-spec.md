# KUBO Admin — Producción / Equipos e impresoras

## 0. Propósito

Definir la base funcional de `Producción → Equipos` antes de implementar `Producción → Impresiones`.

Esta spec fija contratos de datos, contadores, mantenimiento, compatibilidad de material e integración futura. La UI general debe seguir `CLAUDE.md`, `docs/admin-ui-rules.md` y el skill `kubo-admin-ui`.

## 1. Objetivo

KUBO necesita perfiles de impresora que permitan:

- identificar cada máquina con un `printerId` estable;
- registrar su configuración física actual;
- acumular uso real desde que KUBO empiece a registrar impresiones;
- saber cuántas horas, impresiones y gramos ha procesado cada equipo;
- relacionar exposición a materiales con desgaste;
- mostrar qué revisar, limpiar, lubricar o reemplazar;
- diferenciar una recomendación oficial del fabricante de una regla preventiva interna KUBO;
- preparar la integración futura con `Producción → Impresiones`;
- preparar la integración futura con Calculadora sin implementarla todavía.

Primera máquina:

`Bambu Lab A1 #01`

Todos sus contadores comienzan en `0`.

## 2. Fuente de verdad y honestidad técnica

### Fuentes KUBO

Aplicar en este orden:

1. `01_KUBO_Brief_1.0.md`
2. `02_KUBO_Manual_de_Marca_1.0.md`
3. `03_KUBO_Manual_de_Identidad_Visual_1.0.md`
4. `brand-system.md`
5. `CLAUDE.md`
6. `QA_FINAL.md`

El brief confirma que KUBO actualmente opera con una sola impresora FDM. No inventar capacidad productiva adicional.

### Fuentes técnicas de fabricante

Los datos técnicos y recomendaciones de hardware de la Bambu Lab A1 deben verificarse con fuentes oficiales de Bambu Lab antes de codificarse.

Datos oficiales confirmados para A1:

- volumen de construcción: `256 × 256 × 256 mm`;
- hotend: all-metal;
- boquilla incluida: `0.4 mm`;
- material de boquilla incluida: acero inoxidable;
- diámetros disponibles: `0.2 / 0.4 / 0.6 / 0.8 mm`;
- temperatura máxima de hotend de la impresora: `300 °C`;
- temperatura máxima de cama: `100 °C`;
- placa incluida: Bambu Textured PEI Plate;
- PLA, PETG, TPU y PVA aparecen como materiales ideales en la ficha técnica;
- ABS, ASA, PC, PA, PET y polímeros reforzados con CF/GF aparecen como `Not Recommended` en la ficha técnica general de A1.

### Matiz importante de las fuentes Bambu

Las fuentes oficiales no son completamente equivalentes en el tratamiento de CF/GF:

- la ficha técnica general de A1 marca polímeros reforzados con carbono/vidrio como `Not Recommended`;
- la documentación/tienda de hotends indica que, si se imprimen materiales con partículas duras, se requiere boquilla de acero endurecido para evitar desgaste excesivo;
- Bambu indica que PLA-CF y PETG-CF han sido probados con boquilla endurecida de 0.4 mm;
- para varios CF/GF generales recomienda 0.6 mm endurecida para reducir riesgo de atasco y abrasión.

No reconciliar esto fingiendo que CF/GF es simplemente `Compatible`.

Contrato UX:

- A1 + PLA/PETG/TPU/PVA → `Compatible`;
- A1 + materiales que Bambu marca globalmente no recomendados → `No recomendado`;
- si además existe una guía de hardware específica, mostrarla como información adicional;
- ejemplo: `No recomendado para A1 · si se usa CF/GF, requiere boquilla endurecida`.

## 3. Alcance de v1

Implementar:

- listado de equipos;
- detalle de impresora;
- perfil inicial A1;
- configuración instalada;
- Supuestos KUBO de costeo;
- contadores de uso desde cero;
- catálogo básico de componentes/consumibles;
- motor de reglas de mantenimiento;
- eventos de mantenimiento;
- estado de mantenimiento;
- compatibilidad de filamento/configuración;
- contrato de integración para futura pantalla Impresiones.

No implementar todavía:

- pantalla `Producción → Impresiones`;
- descuento de stock;
- sincronización automática con Bambu Cloud/Handy/Studio;
- lectura automática de horas desde la impresora;
- conexión con Finanzas;
- compra de repuestos;
- sincronización Equipos → Calculadora;
- backend.

## 4. Perfil inicial: Bambu Lab A1 #01

### Identidad

- `id`: estable, no derivado del nombre;
- `internalName`: `Bambu Lab A1 #01`;
- `manufacturer`: `Bambu Lab`;
- `model`: `A1`;
- `technology`: `FDM`;
- `status`: `active`;
- `serialNumber`: vacío/opcional;
- `acquisitionDate`: vacío, editable por el usuario;
- `notes`: opcional.

### Configuración instalada inicial

Registrar explícitamente lo instalado de fábrica:

- nozzleDiameterMm: `0.4`;
- nozzleMaterial: `stainless-steel`;
- buildPlate: `Bambu Textured PEI Plate`;
- hotendType: `all-metal`.

No inferir que existe una boquilla endurecida hasta que el usuario la registre.

### Contadores iniciales

Todos comienzan en cero:

- `printMinutesTotal = 0`;
- `printsTotal = 0`;
- `printsSuccessful = 0`;
- `printsFailed = 0`;
- `filamentGramsTotal = 0`;
- `abrasiveFilamentGramsTotal = 0`;
- `maintenanceEventsTotal = 0`.

Mantener también acumulados por familia de material.

Microcopy:

`Métricas registradas desde la activación del seguimiento en KUBO.`

No intentar reconstruir uso anterior.

## 5. Supuestos KUBO de costeo

Estos valores NO son especificaciones oficiales de Bambu. Son defaults operativos KUBO, editables:

- potencia promedio de costeo: `120 W`;
- valor de referencia: `S/ 2,000`;
- vida operativa de referencia: `5,000 h`;
- depreciación derivada: `S/ 0.40/h`;
- reserva de mantenimiento: `S/ 0.25/h`;
- costo máquina sin electricidad: `S/ 0.65/h`.

Contrato:

`machineCostPerHour = depreciationPerHour + maintenanceReservePerHour`

No incluir electricidad dentro de `S/ 0.65/h`.

La fecha de adquisición no debe calcularse automáticamente.

## 6. Modelo de datos

### PrinterProfile

Campos mínimos:

- id
- internalName
- manufacturer
- model
- technology
- status
- serialNumber?
- acquisitionDate?
- technicalSpecs
- installedConfiguration
- costing
- counters
- notes?
- createdAt
- updatedAt

### PrinterTechnicalSpecs

Solo datos reales verificados:

- buildVolumeMm
- maxHotendTempC
- maxBedTempC
- supportedNozzleDiametersMm
- manufacturerMaterialGuidance

### InstalledPrinterConfiguration

- nozzleDiameterMm
- nozzleMaterial: stainless-steel | hardened-steel | other
- buildPlate?
- hotendType?
- installedAt?

### PrinterCostingDefaults

- averagePowerW
- referenceValuePen
- referenceLifeHours
- depreciationPerHourPen
- maintenanceReservePerHourPen

### PrinterCounters

- printMinutesTotal
- printsTotal
- printsSuccessful
- printsFailed
- filamentGramsTotal
- abrasiveFilamentGramsTotal
- filamentGramsByFamily
- maintenanceEventsTotal
- lastPrintAt?
- lastMaintenanceAt?

No usar `any`. Centralizar tipos/enums.

## 7. Catálogo de componentes de mantenimiento

Preparar como datos, no hardcodeados en la UI.

Componentes/consumibles oficiales relevantes para A1:

- hotend/nozzle;
- extruder unit/gears;
- filament cutter;
- purge wiper;
- heatbed nozzle wiper;
- PTFE tubes;
- hotend silicone sock;
- lubrication oil/grease points;
- build plate como elemento de inspección/estado.

La tienda oficial de Bambu comercializa un Essential Consumables Kit para A1 que incluye aceite, grasa, purge wiper, PTFE tubes, heatbed nozzle wiper, silicone sock y replacement filament cutter.

No interpretar que pertenecer al kit significa que Bambu exige cambio en un número específico de horas.

## 8. Regla central de mantenimiento

El sistema debe distinguir cuatro acciones:

- `inspect`;
- `clean`;
- `lubricate`;
- `replace`.

Una alerta por uso NO significa automáticamente que una pieza deba reemplazarse.

Preferencia:

1. si existe instrucción oficial explícita → mostrarla;
2. si existe exposición/riesgo pero no intervalo oficial → `Revisar`;
3. reemplazar cuando exista condición de desgaste, incompatibilidad de configuración o regla KUBO explícita;
4. nunca presentar una heurística KUBO como intervalo oficial Bambu.

## 9. MaintenanceRule

Campos mínimos:

- id
- printerModel/profileScope
- componentId
- action: inspect | clean | lubricate | replace
- triggers[]
- triggerLogic: any | all
- materialCondition?
- requiredConfiguration?
- source: manufacturer | kubo
- sourceLabel
- sourceReference?
- severity
- enabled

Triggers soportados:

- hours
- printCount
- filamentGrams
- abrasiveGrams
- calendarDays
- condition

Una regla puede combinar condiciones.

## 10. MaintenanceEvent

Campos mínimos:

- id
- printerId
- date
- componentId
- action
- conditionFound: ok | wear | damaged | dirty | other
- replacementPerformed
- installedPart?
- counterSnapshot
- notes?
- createdAt

Registrar mantenimiento nunca pone a cero los contadores globales de la impresora.

Sí debe guardar el snapshot y establecer el punto desde el que se evalúa el siguiente ciclo de esa regla/componente.

## 11. Reglas KUBO v1

Para que el sistema sea útil desde el inicio, se permiten heurísticas preventivas internas, claramente etiquetadas como `Regla preventiva KUBO`.

No deben presentarse como intervalos oficiales Bambu.

### Filosofía

Los defaults KUBO deben priorizar `inspect/clean/lubricate`.

`replace` debe depender principalmente de:

- estado encontrado;
- desgaste visible;
- calidad degradada;
- incompatibilidad del hardware instalado;
- exposición abrasiva relevante.

### Seeds iniciales

#### Lubricación general
- crear recordatorio preventivo por horas y/o calendario;
- acción preferida: `inspect` / `lubricate`;
- umbral editable por KUBO.

#### Wipers
- revisión periódica por número de impresiones;
- reemplazo solo si se registra desgaste/daño o limpieza deficiente.

#### PTFE
- revisión por gramos procesados y/o inspección;
- reemplazo si hay desgaste, deformación o fricción problemática.

#### Silicone sock
- revisión periódica;
- reemplazo si está deteriorado, roto o excesivamente contaminado.

#### Filament cutter
- revisión periódica;
- reemplazo por desgaste, cortes inconsistentes o condición registrada.

#### Nozzle
- materiales no abrasivos: inspección por horas/calidad;
- materiales abrasivos: evaluación inmediata de compatibilidad de hardware;
- si la configuración tiene boquilla de acero inoxidable y se intenta CF/GF/partículas duras, estado `Atención`.

No fijar en esta spec un `cambio obligatorio cada X horas` para la boquilla.

## 12. Compatibilidad y desgaste por filamento

La futura pantalla Impresiones debe enviar el material real utilizado.

Equipos debe evaluar:

### PLA / PETG / TPU / PVA
- compatibilidad A1: `Compatible` según ficha técnica general;
- acumular gramos y horas normales.

### ABS / ASA / PC / PA / PET
- estado general A1: `No recomendado`;
- mostrar motivo asociado a guía del fabricante;
- no convertir la alerta en bloqueo de datos históricos.

### CF/GF y partículas abrasivas
- estado general de A1: `No recomendado` según ficha técnica;
- adicionalmente verificar boquilla instalada;
- boquilla inoxidable → `Atención: requiere boquilla endurecida para partículas duras`;
- Bambu PLA-CF/PETG-CF con hardened 0.4 → mostrar guía específica del hotend, sin cambiar el estado global de A1 a `Ideal`;
- CF/GF generales → la guía oficial del hotend favorece hardened 0.6 para reducir atasco/abrasión;
- acumular `abrasiveFilamentGramsTotal`.

No usar el término genérico `fibra` como tipo de polímero.

El payload debe distinguir polímero base y refuerzo/aditivo.

## 13. Estado de mantenimiento

Estados UI:

- `Al día`
- `Próximo`
- `Revisar`
- `Atención`

Usar `StatusChip` global.

### Evaluación

`Al día`
- sin triggers cercanos o condiciones de riesgo.

`Próximo`
- regla KUBO acercándose a su umbral.

`Revisar`
- umbral alcanzado que pide inspección/limpieza/lubricación.

`Atención`
- incompatibilidad de configuración;
- condición registrada como dañada;
- uso abrasivo con hardware no adecuado;
- regla de reemplazo explícita activada por condición.

No depender solo del color: siempre mostrar motivo textual.

## 14. Qué debe responder el detalle de Equipos

La UI debe responder:

- ¿La máquina está operativa?
- ¿Cuántas horas ha registrado KUBO?
- ¿Cuántas impresiones?
- ¿Cuánto filamento ha procesado?
- ¿Cuánto material abrasivo?
- ¿Qué configuración tiene instalada?
- ¿Qué necesita revisión?
- ¿Qué repuesto/consumible puede necesitar atención?
- ¿Por qué?
- ¿La recomendación viene de Bambu o de una regla KUBO?
- ¿Cuándo fue la última intervención?

Ejemplo:

`Boquilla · Atención`

`Se registró material abrasivo con boquilla de acero inoxidable. Bambu requiere acero endurecido para filamentos con partículas duras.`

Ejemplo KUBO:

`Purge wiper · Revisar`

`Alcanzó el umbral preventivo KUBO de inspección. Revisa desgaste antes de reemplazar.`

## 15. UI mínima

### `/admin/equipos`

Listado preparado para varias impresoras.

Por equipo:

- nombre;
- modelo;
- estado;
- horas;
- impresiones;
- filamento procesado;
- estado de mantenimiento;
- última actividad.

Con una sola A1 no llenar la pantalla artificialmente.

### `/admin/equipos/[id]`

Header:
- nombre;
- fabricante/modelo;
- estado;
- fecha de adquisición;
- editar perfil.

KPIs:
- Horas registradas;
- Impresiones;
- Filamento procesado;
- Estado mantenimiento.

Tabs:

`Resumen | Mantenimiento | Costos`

#### Resumen
- configuración instalada;
- contadores;
- compatibilidad resumida;
- próxima revisión;
- microcopy del seguimiento desde cero.

#### Mantenimiento
- alertas activas;
- componente;
- acción;
- motivo;
- fuente `Bambu` / `KUBO`;
- progreso hacia trigger cuando aplique;
- `Registrar mantenimiento`;
- historial de eventos.

#### Costos
- Supuestos KUBO;
- costo máquina/h derivado;
- campos editables.

## 16. Registrar mantenimiento

Formulario:

- fecha;
- componente;
- acción;
- estado encontrado;
- `¿Se reemplazó repuesto?`;
- datos del repuesto/configuración si cambió;
- notas.

Si el mantenimiento cambia configuración instalada —por ejemplo inoxidable → hardened steel 0.4— actualizar `installedConfiguration` después de guardar el evento.

Mantener trazabilidad en el historial.

## 17. Integración futura con Producción → Impresiones

Cada registro real de impresión debe referenciar `printerId`.

Payload mínimo:

- printerId
- date
- durationMinutes
- result: success | failed | partial
- unitsProduced
- materials[]:
  - profileId
  - grams
  - materialType
  - reinforcement?: CF | GF | other-abrasive

Al procesarlo, Equipos debe poder derivar:

- `printMinutesTotal += durationMinutes`;
- `printsTotal += 1`;
- success/failure counters;
- gramos totales;
- gramos por material;
- gramos abrasivos;
- `lastPrintAt`;
- reevaluación de mantenimiento.

La futura feature Impresiones también será responsable de los movimientos reales de stock en Materiales.

Equipos NO debe descontar stock por sí mismo.

## 18. Contrato con Materiales

Equipos puede consumir metadata de un perfil de filamento:

- profileId;
- materialType;
- reinforcement/additive;
- nombre/SKU para display.

El desgaste se evalúa por metadata técnica, no por color o nombre comercial.

Ejemplos:

- `PETG Negro` → PETG, no abrasivo;
- `PETG-CF Negro` → PETG + CF, abrasivo.

No modificar el perfil de Materiales.

## 19. Contrato futuro con Calculadora

No implementarlo todavía.

El perfil de impresora debe exponer posteriormente:

- potencia promedio de costeo;
- depreciación/h;
- mantenimiento/h;
- costo máquina/h;
- nombre/modelo.

La Calculadora podrá seleccionar un `printerId` y leer esos defaults.

Por ahora no migrar ni alterar la Calculadora actual.

## 20. Persistencia v1

Seguir el patrón local/session que ya usa el Admin mientras no exista backend.

Separar:

- seed/modelo de impresora;
- configuración del usuario;
- contadores;
- reglas;
- eventos.

No mezclar todo en un único componente Svelte.

Preparar versionado básico del storage para futuras migraciones.

## 21. Accesibilidad y responsive

Seguir `docs/admin-ui-rules.md`.

Desktop:
- detalle técnico legible;
- un solo borde exterior por bloque;
- dividers internos;
- evitar card-in-card.

Mobile:
- rows deliberadas;
- no comprimir tablas;
- no usar ellipsis destructivo;
- componente → acción/motivo → estado;
- targets táctiles adecuados.

StatusChip:
- misma primitive global que Dashboard;
- misma semántica cromática desktop/mobile.

## 22. Datos que NO deben inventarse

No inventar como `oficial Bambu`:

- vida útil total de la A1;
- potencia promedio real de una impresión;
- intervalos obligatorios por horas;
- vida exacta de boquilla;
- vida exacta de wipers/cutter/PTFE;
- fecha de adquisición;
- uso previo;
- historial de mantenimiento previo.

Los defaults `120 W`, `5,000 h`, `S/2,000`, `S/0.40/h` y `S/0.25/h` son **Supuestos KUBO**, no datos del fabricante.

## 23. Fuentes oficiales técnicas a verificar durante implementación

Priorizar documentación/tienda oficial Bambu Lab:

- Bambu Lab A1 — ficha técnica oficial;
- Bambu Hotend — A1 Series — compatibilidad por filamento/boquilla;
- Essential Consumables Kit — A1;
- Bambu Lab Wiki / Support — mantenimiento y reemplazo de componentes A1.

Si una recomendación de mantenimiento no aparece claramente en una fuente oficial:

- no atribuirla a Bambu;
- modelarla como `source: kubo` si se decide usar como heurística preventiva.

## 24. Criterios de aceptación

- existe `Bambu Lab A1 #01`;
- acquisitionDate empieza vacía;
- contadores empiezan exactamente en 0;
- la UI explica que el tracking empieza desde KUBO;
- datos oficiales y Supuestos KUBO están separados;
- configuración inicial refleja 0.4 mm stainless steel;
- usuario puede cambiar configuración instalada;
- MaintenanceRule y MaintenanceEvent están centralizados;
- historial de mantenimiento conserva snapshots;
- registrar mantenimiento no pone contadores globales en cero;
- CF/GF produce advertencia coherente con hardware instalado;
- no se presenta CF/GF como simplemente compatible con A1;
- el sistema distingue manufacturer vs KUBO;
- una alerta explica motivo, no solo color;
- el payload futuro de Impresiones está definido;
- Equipos no descuenta Materiales;
- desktop / 390 / 360 sin overflow;
- `npm run check` pasa;
- `npm run build` pasa.
