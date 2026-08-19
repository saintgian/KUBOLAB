# KUBO Admin — Herramientas / Calculadora de precios

## 1. Objetivo
Construir una calculadora independiente de costeo y precio para impresión 3D de KUBO.

Debe responder:
- cuánto cuesta fabricar una pieza o una tanda;
- cuánto cuesta cada unidad;
- qué componentes explican el costo;
- qué precio sin IGV permite alcanzar un margen objetivo;
- cuánto IGV corresponde cuando se activa;
- cuál es el precio final por unidad y por tanda;
- cuál es la ganancia estimada y el margen efectivo.

## 2. Integración permitida
La única conexión funcional con otra área del Admin es de solo lectura hacia:

`Producción → Materiales → Perfiles de filamento`

Puede leer perfiles y costos de referencia disponibles.

NO debe:
- descontar stock;
- crear movimientos de material;
- crear gastos;
- modificar perfiles;
- crear productos, pedidos o cotizaciones;
- afectar Finanzas.

## 3. Principios del cálculo
Separar:
1. Costo directo de fabricación
2. Costos humanos
3. Costos adicionales/indirectos
4. Comisiones
5. Margen comercial
6. IGV
7. Redondeo comercial

Terminología:
- Costo: dinero necesario para producir.
- Ganancia: precio neto antes de IGV menos costos y comisiones.
- Margen: ganancia / precio neto de venta.
- Markup: ganancia / costo.

El usuario controla Margen objetivo. No tratar markup y margen como equivalentes.

## 4. Layout

### Desktop >=1024
Dos zonas:
- izquierda: configuración;
- derecha: resultado sticky.

Proporción aproximada 7/5 según el sistema Admin existente.

### Tablet/mobile
Una columna. El resultado debe mantenerse accesible sin duplicar contenido ni tapar campos.

## 5. UI principal y Supuestos avanzados
El uso normal de la calculadora solo debe pedir **finalidad, cantidad, impresora, tiempo, material y
gramos**. Todo lo demás llega precargado con los "Supuestos KUBO" (§27) para no forzar al usuario a
llenar un formulario contable completo cada vez.

### Vista principal (siempre visible)
- Finalidad
- Cantidad
- Impresora
- Tiempo de impresión
- Filamento (material)
- Gramos
- Trabajo manual: Diseño / preparación, Acabado / ensamblaje
- Packaging
- Margen (cuando el bloque comercial está visible, spec §6)
- Aplicar IGV (cuando el bloque comercial está visible, spec §6)

`Costos adicionales` también vive en la vista principal como lista dinámica opcional (vacía por
defecto, no exige interacción).

### `Supuestos y costos avanzados` (plegado por defecto)
Un único bloque plegable (nativo `<details>`/`<summary>`, sin acordeón propio) agrupa:
- tarifa eléctrica;
- modo de electricidad (Estimado/Medido) y sus campos según modo;
- potencia promedio;
- depreciación;
- mantenimiento;
- hora-hombre (Trabajo manual);
- merma;
- fallos;
- comisiones;
- indirectos;
- redondeo.

Cada valor sigue siendo editable ahí sin tocar configuración global del proyecto — plegarlo es solo
una cuestión de jerarquía visual, nunca de permisos ni de alcance. El bloque muestra la etiqueta
`Supuestos KUBO` (primitive `.status-badge`/`.status-chip` compartida, spec `admin-ui-rules.md`) y un
botón `Restablecer valores KUBO` que repone únicamente estos supuestos operativos a los defaults KUBO
v1 (§27), sin tocar cantidad, materiales, tiempos de impresión ni identificación del cálculo en curso.

## 6. Finalidad del trabajo
Campo obligatorio `Finalidad`:

- Venta
- Custom
- Prueba / prototipo
- Interno
- Muestra / marketing

Venta/Custom:
mostrar costo, margen, comisiones, IGV, precio final y ganancia.

Prueba/Interno/Muestra:
priorizar costo real. El bloque comercial puede ocultarse por defecto o abrirse con `Simular precio de venta`.

La finalidad no modifica artificialmente costos físicos.

## 7. Identificación
Campos opcionales:
- Nombre
- Notas

Ejemplos:
- `Organizador M1`
- `Versión con insertos M3`

El cálculo en curso no persiste campo a campo — solo se conserva completo al pulsar `Guardar
cálculo` (§36). Si el usuario deja `Nombre` vacío al guardar, el snapshot recibe un nombre generado
a partir de material + finalidad + fecha/hora (§36).

## 8. Cantidad, impresora y alcance del slicer

### Cantidad final *
Número de unidades a costear.

### Impresora
Texto libre, Supuesto KUBO editable (default `Bambu Lab A1`, §27). No es un campo obligatorio para
calcular: es identificación del trabajo y referencia para la potencia promedio de §13.

Estructura preparada para que a futuro venga de perfiles de `Producción → Equipos`; esa integración
**no está implementada todavía** (§34).

### Los datos del slicer corresponden a *
- Una unidad
- Una tanda completa

Si es tanda:
- Unidades producidas por tanda *
- Tandas necesarias

Default de tandas:
`ceil(cantidadFinal / unidadesPorTanda)`

Debe ser editable si el usuario necesita corregir la estimación.

## 9. Tiempo de impresión
Campos:
- Horas *
- Minutos *

Convertir internamente a horas decimales.

Ejemplo:
`6 h 20 min = 6.3333 h`

Normalizar según si el tiempo corresponde a unidad o tanda.

No permitir negativos.

## 10. Materiales
Permitir uno o varios materiales.

Cada fila:

### Perfil de filamento *
Combobox read-only sobre perfiles existentes.

Mostrar si existe:
- nombre;
- tipo;
- SKU interno;
- fabricante;
- uso/validación;
- costo de referencia por kg.

### Gramos utilizados *
Peso reportado por el slicer según el alcance seleccionado.

### Costo de referencia / kg
Prioridad:
1. costo disponible en el perfil;
2. si falta, override manual obligatorio;
3. nunca asumir S/0 silenciosamente.

Permitir `Usar otro costo para este cálculo` sin modificar Materiales.

### Múltiples materiales
`+ Añadir material`

Ejemplo:
- PLA+ Negro — 160 g
- PETG soporte — 24 g

No descontar stock.

### Fórmula
`materialCost = normalizedGrams / 1000 × costPerKg`

`totalMaterialCost = sum(materialCost)`

## 11. Merma de material
Campo opcional (Supuestos y costos avanzados):
`Merma adicional %`

Supuesto KUBO editable, default `3%` (§27).

Aplicar solo al costo de material:

`materialWithWaste = materialCost × (1 + wasteRate)`

Microcopy:
`Úsalo solo si los gramos del slicer no contemplan esta pérdida.`

No sumar otra vez soportes/purga si el slicer ya los incluyó.

## 12. Electricidad
Vive en `Supuestos y costos avanzados` (§5) — el uso normal no necesita tocarla.

Mostrar referencia:
- Proveedor: Luz del Sur
- Zona: San Juan de Miraflores, Lima

### Tarifa de energía (S/kWh)
Supuesto KUBO editable, default `S/ 0.75/kWh` (§27). Se identifica como supuesto operativo, no como
tarifa oficial verificada — el usuario la ajusta con su recibo real cuando lo necesite.

### Modo
- Estimado
- Medido

#### Estimado
Campos:
- Potencia promedio de impresora (W) — Supuesto KUBO editable, default `120 W` (potencia de costeo
  de la Bambu Lab A1, §27).
- Tiempo total de impresión

Fórmula:
`kWh = (W / 1000) × horasTotales`
`electricityCost = kWh × tariffPerKWh`

#### Medido
Campo (sin default — medición real del trabajo, no un supuesto):
`Consumo medido (kWh)`

`electricityCost = measuredKWh × tariffPerKWh`

### Cargo fijo
No repartir automáticamente el cargo fijo mensual en cada impresión.
Si se desea asignarlo, usar Costos indirectos.

## 13. Máquina
Vive en `Supuestos y costos avanzados` (§5). Separado de electricidad — nunca se suman entre sí.

Dos campos, ambos Supuestos KUBO editables (§27):
- `Depreciación (S/h)` — default `S/ 0.40/h`.
- `Reserva de mantenimiento (S/h)` — default `S/ 0.25/h`.

`depreciationCost = totalPrintHours × machineDepreciationPerHour`
`maintenanceCost = totalPrintHours × machineMaintenancePerHour`
`machineCost = depreciationCost + maintenanceCost`

Puede mostrarse además la tarifa combinada como referencia derivada (nunca como campo editable
propio ni sumada a electricidad):
`Costo máquina: S/ 0.65/h` = `machineDepreciationPerHour + machineMaintenancePerHour`.

El breakdown de costo mantiene Electricidad, Depreciación y Mantenimiento como líneas separadas
(§25).

## 14. Provisión por fallos / reimpresión
Campo opcional (Supuestos y costos avanzados):
`Provisión por fallos %`

Supuesto KUBO editable, default `5%` (§27).

Aplicar a:
- material;
- electricidad;
- máquina.

`failureBase = materialWithWaste + electricityCost + machineCost`
`failureProvision = failureBase × failureRate`

No aplicarlo automáticamente a trabajo manual, packaging ni IGV.

## 15. Trabajo manual
No es una lista dinámica: son exactamente dos conceptos fijos, porque tienen scopes distintos y
comparten una única tarifa hora-hombre (Supuesto KUBO editable en Supuestos y costos avanzados,
default `S/ 20.00/h`, §27). No cobra tiempo de packaging (§16).

1. **Diseño / preparación** — minutos, default `0 min`, aplica **proyecto/tanda** (no se multiplica
   por cantidad):
   `designCost = (designMinutes / 60) × laborHourlyRate`
2. **Acabado / ensamblaje** — minutos, default `0 min`, aplica **por unidad**:
   `finishingCost = (finishingMinutes / 60) × laborHourlyRate × quantity`

`laborTotal = designCost + finishingCost`

No hay filas "Postprocesado" ni "Diseño / modelado" separadas del diseño original de la calculadora:
se consolidaron en estos dos conceptos para simplificar el uso normal. No hay `+ Añadir trabajo` — no
es una lista, es un par de campos fijos en la vista principal.

## 16. Packaging
Packaging es **únicamente un costo monetario** — nunca se cobra como tiempo. Vive junto a Trabajo
manual en la UI porque ambos son costos de la etapa de acabado, pero es un campo propio (no una fila
de "Costos adicionales", §17).

- Monto — Supuesto KUBO editable, default `S/ 2.00` (§27).
- Aplicación: `proyecto/tanda` | `por unidad` — Supuesto KUBO editable, default **Por unidad**.

`packagingCost = scope === 'unit' ? packagingAmount × quantity : packagingAmount`

## 17. Costos adicionales
Lista dinámica en la vista principal, vacía por defecto. Filas sugeridas (Packaging queda fuera —
tiene su propio campo, §16):
- Insertos / tornillos / imanes
- Consumibles
- Servicio externo
- Envío / logística
- Otro

Cada fila:
- Concepto
- Monto
- Aplicación: una vez/proyecto | por unidad

No imponer valores.

## 18. Costos indirectos
Bloque opcional (Supuestos y costos avanzados).

Modo:
- Monto fijo
- Porcentaje

Monto fijo: sumar directamente.

Porcentaje:
aplicar sobre costo directo antes de margen e impuestos.

Default `0` (§27).

No repartir automáticamente gastos mensuales de Finanzas.

## 19. Costo total

`directProductionCost = materialWithWaste + electricityCost + machineCost + failureProvision`

`laborTotal = designCost + finishingCost` (§15)

`baseBeforeIndirect = directProductionCost + laborTotal + packagingCost + additionalTotal`

Si indirectos son porcentaje:
`indirectCost = baseBeforeIndirect × indirectRate`

Si son fijos:
`indirectCost = fixedIndirectAmount`

`totalCost = baseBeforeIndirect + indirectCost`

`unitCost = totalCost / quantity`

No dividir entre cero.

## 20. Comisión de venta
Campos opcionales (Supuestos y costos avanzados):
- Comisión porcentual
- Costo fijo por transacción

Default `0` (§27).

En v1, la comisión porcentual se calcula sobre el precio neto antes de IGV.

Mostrar esta premisa como ayuda/tooltip.

## 21. Margen objetivo
Control principal (vista principal, spec §5):
- input numérico;
- slider opcional complementario.

Supuesto KUBO editable, default `35%` (§27).

Validación:
`0 <= margen < 100`

Advertir si:
`margen + comisiónPorcentual >= 100%`

Sea:
- C = totalCost
- F = comisión fija
- c = comisión porcentual
- m = margen objetivo

`netPriceBeforeTax = (C + F) / (1 - c - m)`

Sin comisión:
`netPriceBeforeTax = C / (1 - m)`

`commissionAmount = netPriceBeforeTax × c + F`

`profit = netPriceBeforeTax - commissionAmount - totalCost`

`effectiveMargin = profit / netPriceBeforeTax`

Mostrar markup solo como dato secundario:

`markup = profit / totalCost`

## 22. IGV
Control (vista principal, spec §5):
`Aplicar IGV`

Tasa:
`18%` (IGV disponible — §27)

Centralizarla como configuración, no repetir magic numbers.

`igvAmount = netPriceBeforeTax × 0.18`

`finalPrice = netPriceBeforeTax + igvAmount`

Si está apagado:
`igvAmount = 0`
`finalPrice = netPriceBeforeTax`

La calculadora modela precio; no decide la obligación tributaria de KUBO.

Microcopy:
`Activa IGV solo cuando corresponda a la operación.`

## 23. Redondeo comercial
Opciones:
- Sin redondeo
- S/ 0.10
- S/ 0.50
- S/ 1.00
- S/ 5.00

Supuesto KUBO editable, default `S/ 0.50` hacia arriba (§27).

Preferir redondeo hacia arriba para no reducir accidentalmente el margen.

Mostrar:
- Precio calculado
- Precio redondeado
- Margen efectivo resultante

Nunca ocultar el efecto del redondeo.

## 24. Resultado

### Costo
Mostrar:
- Material
- Merma
- Electricidad
- Depreciación
- Mantenimiento
- Provisión por fallos
- Trabajo manual
- Packaging
- Adicionales
- Indirectos
- Costo total
- Costo por unidad

Electricidad, Depreciación y Mantenimiento se muestran siempre por separado (§13) — nunca colapsadas
en una única línea "Máquina". Puede mostrarse además, como referencia informativa (no como línea de
costo total), `Costo máquina: S/ 0.65/h` = depreciación/h + mantenimiento/h, sin electricidad.

### Precio
Para Venta/Custom o simulación:
- Margen objetivo
- Comisión estimada
- Precio sin IGV
- IGV
- Precio final/unidad
- Precio total/tanda
- Ganancia estimada
- Margen efectivo
- Markup informativo

En Venta/Custom, la cifra principal es:
`Precio final / unidad`

En Interno/Prueba:
`Costo / unidad`

## 25. Breakdown visual
Añadir un breakdown compacto del costo sin chart library.

Puede usar barras geométricas/proporcionales con:
- carbón;
- celeste informativo;
- rojo solo para selección/atención.

Nunca sustituir montos numéricos por la visualización.

## 26. Cálculo incompleto
Detectar faltantes que hacen el cálculo poco confiable:

- perfil sin costo/kg ni override;
- consumo medido faltante cuando electricidad está en modo Medido;
- cantidad 0;
- tiempo inválido;
- margen/comisión sin solución.

Tarifa eléctrica, potencia promedio, depreciación, mantenimiento, hora-hombre y packaging **ya no
generan estado de faltante**: llegan precargados con los Supuestos KUBO (§27) y siempre tienen un
valor numérico, aunque el usuario los deje en `0`.

Mostrar:
`Cálculo incompleto`

y lista corta de faltantes.

No convertir datos obligatorios faltantes en cero.

## 27. Defaults — Supuestos KUBO v1
Se precargan como **supuestos operativos editables**, nunca como datos oficiales ni mediciones
reales. Fuente única de verdad: `KUBO_DEFAULTS` en `price-calculator.constants.ts`, consumida tanto
por el estado inicial (`blankCalculation`) como por el botón `Restablecer valores KUBO`
(`applyKuboDefaults`, ambos en `lib/pricing/model.ts`) — nunca se repiten estos números sueltos en la
UI o el motor.

| Supuesto | Default |
| --- | --- |
| Impresora | `Bambu Lab A1` |
| Proveedor eléctrico | `Luz del Sur` |
| Zona | `San Juan de Miraflores, Lima` |
| Tarifa eléctrica estimada | `S/ 0.75/kWh` |
| Potencia promedio de costeo A1 | `120 W` |
| Depreciación máquina | `S/ 0.40/h` |
| Reserva de mantenimiento | `S/ 0.25/h` |
| Costo máquina sin electricidad | `S/ 0.65/h` (derivado: depreciación + mantenimiento) |
| Hora-hombre | `S/ 20.00/h` |
| Packaging | `S/ 2.00/unidad` (scope `Por unidad`) |
| Merma adicional | `3%` |
| Provisión por fallos | `5%` |
| Margen objetivo | `35%` |
| Comisión porcentual | `0%` |
| Comisión fija | `S/ 0.00` |
| Indirectos | `0%` |
| IGV disponible | `18%` |
| Redondeo | `S/ 0.50` hacia arriba |

Todos son editables sin restricción, tanto durante el uso normal como desde `Supuestos y costos
avanzados` (§5). `Restablecer valores KUBO` los repone sin tocar cantidad, materiales, tiempos de
impresión, identificación ni el toggle de IGV del cálculo en curso.

### No inventar
- costo/kg si Materiales no lo tiene (nunca hay un Supuesto KUBO de costo de material — sale de
  Materiales o de un override explícito, §10);
- consumo medido (kWh) en modo Medido — es una lectura real del trabajo, no un supuesto operativo;
- margen recomendado más allá del default editable de §27.

## 28. Modelo sugerido

### PricingCalculation
- name?
- purpose
- quantity
- printerName — Supuesto KUBO editable (§27), estructura preparada para Equipos a futuro (§8, §34)
- slicerScope
- unitsPerBatch?
- batches?
- printHours
- printMinutes
- materials[]
- materialWasteRate — Supuesto KUBO editable
- electricity
- machineDepreciationPerHour — Supuesto KUBO editable
- machineMaintenancePerHour — Supuesto KUBO editable
- failureRate — Supuesto KUBO editable
- designMinutes — Trabajo manual › Diseño/preparación, scope proyecto/tanda
- finishingMinutes — Trabajo manual › Acabado/ensamblaje, scope por unidad
- laborHourlyRate — Supuesto KUBO editable, tarifa única de Trabajo manual
- packagingAmount — Supuesto KUBO editable
- packagingScope
- additionalRows[]
- indirectMode
- indirectFixedAmount
- indirectPercentage — Supuesto KUBO editable
- targetMargin — Supuesto KUBO editable
- commissionRate
- commissionFixed
- applyIgv
- roundingMode — Supuesto KUBO editable
- notes?

### CalculationMaterial
- profileId
- grams
- referenceCostPerKg
- costOverridePerKg?
- source: profile | override

### ElectricityInput
- provider
- location
- tariffPerKWh — Supuesto KUBO editable, sin `?` (siempre numérico)
- mode: estimated | measured
- averagePowerW — Supuesto KUBO editable, sin `?` (siempre numérico)
- measuredKWh? — sin default, exclusivo del modo Medido

### AdditionalCostRow
- id
- concept
- amount
- scope: project | unit

No hay `LaborRow[]`: Trabajo manual dejó de ser una lista dinámica (§15) — son dos campos fijos
(`designMinutes`, `finishingMinutes`) más una tarifa compartida (`laborHourlyRate`).

### PricingSnapshot (Historial, §36)
- id, schemaVersion, createdAt (fecha/hora de inicio de la consulta)
- name (nunca vacío)
- calculation: PricingCalculation (copia congelada e independiente)
- materialLabels: Record<profileId, "Nombre — Color"> resuelto al guardar
- result: { cost: CostBreakdown, price: PriceBreakdown | null, isComplete, missing, totalPrintHours }
  — congelado, no se recalcula al leer el historial
- showCommercial

No usar `any`.
Centralizar enums/options.

## 29. Integración con Materiales
Leer perfiles existentes.

No exigir stock disponible para simular un cálculo.

Cuando finalidad = Venta/Custom puede existir filtro:
`Solo materiales aprobados para comercial`

No modificar stock, bobinas, movimientos, perfil ni costos guardados.

## 30. Interacción
Svelte puede coordinar el workspace porque existe estado reactivo compartido.

Recalcular en tiempo real.

No usar botón obligatorio `Calcular`.

Acciones:
- `Restablecer cálculo` (limpia los datos específicos del trabajo actual — identificación, cantidad,
  materiales, tiempos — y vuelve a cargar los defaults vigentes; nunca deja un Supuesto KUBO vacío;
  nunca toca Historial ni configuración, spec §5, §36)
- `Restablecer valores KUBO` (repone solo los Supuestos KUBO, spec §5, §27, separado del reset normal)
- `Copiar resumen` (spec §36)
- `Guardar cálculo` (crea un snapshot en Historial, spec §36 — única acción que persiste algo; nunca
  ocurre automáticamente en cada cambio reactivo)

No añadir:
- Guardar producto
- Crear cotización
- Crear pedido
- Registrar gasto

## 31. Responsive

### Desktop >=1024
- configuración + resultado sticky;
- FormGrid según reglas Admin.

### Tablet 640–1023
- una columna;
- resultado después de configuración o resumen sticky discreto.

### Mobile <640
- una columna;
- inputs cómodos;
- resultado separado;
- slider nunca como único input del margen;
- sin overflow horizontal;
- `Supuestos y costos avanzados` sigue siendo un `<details>` plegable de ancho completo, sin
  reimplementar el patrón de acordeón por breakpoint.

Validar 390 y 360.

## 32. Accesibilidad
- labels persistentes;
- unidades visibles;
- inputmode numérico/decimal;
- errores inline;
- resultado reactivo accesible;
- slider acompañado por input;
- no depender solo del color;
- focus/keyboard en Combobox y en el `<summary>` de Supuestos y costos avanzados (foco visible,
  operable con teclado igual que cualquier disclosure nativo);
- reduced motion;
- touch targets adecuados.

## 33. Diseño KUBO
Reutilizar el Admin existente:

- workspace blanco;
- sidebar negra;
- Connected Bento;
- Space Grotesk dominante;
- JetBrains Mono para unidades/metadata técnica;
- Iconoir;
- rojo `#ED254E`;
- celeste `#98D7E0`;
- StatusChip global (usado también para la etiqueta `Supuestos KUBO`, §5);
- Construction Grid bajo/medio para Herramientas.

Debe sentirse como herramienta técnica profesional, no como formulario contable pesado.

## 34. Fuera de alcance
No implementar:
- backend (el Historial persiste solo en `localStorage` del navegador, spec §36 — no hay sync entre
  dispositivos ni usuarios);
- descuento de stock;
- Gastos;
- Pedidos;
- Cotizaciones;
- Productos;
- recomendaciones automáticas de margen;
- actualización online automática de tarifa eléctrica;
- cálculo tributario más allá del toggle simple de IGV;
- depreciación contable automática;
- integración funcional con perfiles de `Producción → Equipos` para el campo Impresora (§8) — la
  estructura queda preparada, pero la lectura real de perfiles de Equipos no está implementada.

## 35. Criterios de aceptación
- independiente;
- solo lee perfiles de Materiales;
- no descuenta stock;
- uno o varios filamentos;
- cálculo por unidad/tanda;
- costo de material y merma;
- electricidad estimada/medida, precargada con Supuestos KUBO y editable;
- electricidad, depreciación y mantenimiento separados en el breakdown (nunca electricidad sumada a
  los S/0.65/h de máquina);
- Trabajo manual son dos conceptos fijos (Diseño/preparación por proyecto, Acabado/ensamblaje por
  unidad) con una hora-hombre compartida — sin lista dinámica de mano de obra;
- Packaging es únicamente un costo monetario, nunca tiempo;
- vista principal limitada a finalidad/cantidad/impresora/tiempo/material/gramos/trabajo
  manual/packaging/margen/IGV; el resto vive plegado en Supuestos y costos avanzados;
- `Restablecer valores KUBO` repone los Supuestos KUBO sin tocar cantidad, materiales ni tiempos;
- adicionales e indirectos;
- provisión por fallos;
- margen real, no markup;
- comisión incorporada correctamente;
- IGV 18% opcional;
- redondeo recalcula margen efectivo;
- costo y precio unitario/total;
- estado de cálculo incompleto;
- responsive 390/360;
- primitives Admin reutilizadas (incluida `.status-badge`/`.status-chip` para `Supuestos KUBO`);
- sin dependencias innecesarias;
- `npm run check` y `npm run build` sin warnings del scope;
- margen objetivo por defecto 35% al abrir la Calculadora sin datos previos;
- `Restablecer cálculo` nunca deja un Supuesto KUBO vacío y nunca borra Historial, configuración ni
  Supuestos KUBO;
- Historial persiste en `localStorage` y sobrevive a un refresh del navegador;
- cambios posteriores a `KUBO_DEFAULTS` no alteran snapshots ya guardados;
- `Guardar cálculo` crea exactamente un snapshot por click, nunca en cada cambio reactivo;
- `Abrir` carga una copia editable sin mutar el snapshot original; `Duplicar` inicia un cálculo
  independiente a partir del snapshot;
- Eliminar un snapshot funciona sin confirmación; `Eliminar todo el historial` exige confirmación
  explícita;
- búsqueda por nombre/material y filtro por finalidad en Historial;
- estado vacío de Historial cuando no hay consultas guardadas;
- `Copiar resumen` disponible en el cálculo actual y en cada consulta de Historial, sin duplicar la
  lógica de armado del texto entre ambos lugares;
- ambos resúmenes incluyen `Fecha de consulta` — la del inicio de esa consulta, nunca la fecha en que
  se copia, en formato legible para Perú.

## 36. Historial
Calculadora → Historial: pestaña `Calculadora | Historial` en el mismo workspace (no una página
nueva). Un snapshot de Historial se crea únicamente al pulsar `Guardar cálculo` — nunca en cada
cambio reactivo del formulario (spec §30).

### Persistencia
Sin backend: el Historial persiste en `localStorage` del navegador (clave
`kubo:calculator:history:v1`, ver `lib/pricing/storage.ts`), tolerante a datos corruptos o de otra
versión (se descartan sin romper el resto del historial). No hay sync entre dispositivos ni usuarios.

### Snapshot (`PricingSnapshot`, `data/admin/price-calculator.types.ts`)
Congela, en el momento de `Guardar cálculo`:
- fecha y hora de inicio de esa consulta (`createdAt`, no la hora de guardado si son distintas);
- nombre (el ingresado, o uno generado desde material + finalidad + fecha/hora si estaba vacío);
- la `PricingCalculation` completa (identificación, cantidad, alcance, tiempo, materiales, supuestos
  usados, margen, comisión, IGV, redondeo);
- `materialLabels` — nombre de perfil resuelto al guardar, para que el registro siga siendo legible
  si el perfil cambia o se elimina después en Materiales;
- el resultado ya calculado (`cost`, `price`, `isComplete`, `missing`, `totalPrintHours`) — breakdown,
  costo total/unitario, precio final total/unitario, ganancia y margen efectivo quedan congelados: un
  cambio futuro en `KUBO_DEFAULTS` o en el motor de cálculo nunca altera un snapshot ya guardado.

### Acciones por consulta
- **Abrir** — carga una copia editable (`cloneCalculation`) en el formulario y cambia a la pestaña
  Calculadora; nunca modifica el snapshot original.
- **Duplicar** — igual que Abrir, pero deja explícito que es un cálculo nuevo (nombre marcado como
  copia) en vez de continuar ese mismo trabajo.
- **Copiar resumen** — mismo formato que el cálculo actual (`lib/pricing/summary.ts`), usando la
  fecha/hora congelada del snapshot, nunca la fecha actual.
- **Eliminar** — quita ese snapshot; sin confirmación.

### Historial (toolbar y lista)
- Búsqueda por nombre o material.
- Filtro por finalidad.
- `Eliminar todo el historial` — exige confirmación explícita vía `Modal.svelte` (no un `confirm()`
  nativo ni un overlay propio).
- Estado vacío distinto cuando no hay ninguna consulta guardada vs. cuando los filtros no encuentran
  resultados.
- Desktop: tabla (`.table-shell`, mismo patrón que Finanzas → Gastos). Mobile: tarjetas
  (`.mobile-data-card`), nunca la tabla comprimida ni texto recortado.
- Prioridad visual por registro: nombre → fecha/finalidad → material → costo/precio → margen →
  acciones.

### Copiar resumen (compartido)
`lib/pricing/summary.ts` centraliza el texto de "Copiar resumen" para el cálculo actual y para cada
consulta de Historial — ninguno de los dos lugares reimplementa el armado del texto. Incluye siempre:
fecha de consulta (formato legible para Perú), nombre/finalidad, cantidad, impresora, tiempo de
impresión, material(es) y gramos, costo total y costo/unidad, margen utilizado, precio sin IGV cuando
corresponde, IGV cuando está activo, precio final/unidad, precio total, ganancia estimada y los
supuestos más relevantes (hora-hombre, packaging, merma, fallos, redondeo). Tras copiar, feedback
discreto ("Resumen copiado.") vía `role="status"`/`aria-live="polite"`.

### Defaults y `Restablecer cálculo`
`Restablecer cálculo` (antes solo "Restablecer") limpia los datos específicos del trabajo en curso
(identificación, cantidad, materiales, tiempo) y vuelve a cargar los Supuestos KUBO vigentes —
`blankCalculation()` sigue siendo la única fábrica de ese estado inicial (spec §27), así que un campo
recién restablecido nunca queda vacío cuando tiene un default. Nunca toca Historial ni
`Restablecer valores KUBO`, que sigue siendo una acción separada (spec §5, §27).
