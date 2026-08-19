# KUBO Admin — Producción / Impresiones

## Objetivo

`Producción → Impresiones` será el registro operativo real de fabricación.

Conecta:

`Impresiones → Materiales (stock real) + Equipos (uso y mantenimiento)`

La Calculadora permanece independiente: simula costos, no crea impresiones ni descuenta stock.

La UI debe seguir `CLAUDE.md`, `docs/admin-ui-rules.md`, `docs/specs/admin-equipment-printers.md` y `kubo-admin-ui`.

## Alcance v1

Implementar:

- `/admin/impresiones`;
- perfil de impresora seleccionado arriba;
- estado y progreso de mantenimiento;
- registro de impresión;
- consejos contextuales pre/post impresión;
- descuento real de bobinas;
- acumulación de uso en Equipos;
- historial;
- ver/editar/duplicar/eliminar;
- reversión segura de stock y uso;
- filtros;
- persistencia frontend según el patrón actual.

No implementar Bambu Cloud/Studio API, backend, Finanzas, Pedidos automáticos, ni sincronización con Calculadora.

## Jerarquía

1. Header `Impresiones`
2. Perfil de impresora
3. Mantenimiento / componentes
4. Consejos y compatibilidad relevantes
5. `+ Registrar impresión`
6. Historial

Si existe una sola impresora activa, queda preseleccionada. Con varias, mostrar selector.

## Perfil superior de impresora

Mostrar:

- nombre;
- marca/modelo;
- boquilla/configuración instalada;
- estado;
- horas registradas;
- impresiones;
- filamento procesado;
- tasa de éxito cuando exista data;
- última actividad;
- estado de mantenimiento.

Microcopy:

`Métricas registradas desde la activación del seguimiento en KUBO.`

## Progreso de mantenimiento

Mostrar componentes con reglas activas.

Ejemplo conceptual:

- Lubricación — 72% — Próximo
- Purge wiper — 51% — Al día
- Filament cutter — 43% — Al día
- PTFE — 31% — Al día
- Boquilla — Revisar

La barra significa **progreso hacia el próximo trigger preventivo**, no “vida restante del repuesto”.

Solo mostrar porcentaje cuando exista trigger cuantificable: horas, impresiones, gramos, gramos abrasivos o días.

Para reglas por condición mostrar `Revisión por condición`.

Cada elemento indica componente, acción, estado, motivo y fuente `Bambu` o `KUBO`.

## Finalidad

Campo obligatorio:

- Venta
- Custom
- Calibración
- Prueba / prototipo
- Interno
- Muestra / marketing

`Calibración` queda separada de `Prueba`.

La finalidad sirve para análisis; no modifica gramos descontados ni horas acumuladas.

## Resultado

- Correcta
- Parcial
- Fallida
- Cancelada

Todo filamento realmente extruido se descuenta aunque falle.

Todo tiempo real de máquina se acumula.

Una cancelada puede tener tiempo/grados consumidos si llegó a iniciar.

## Registro

Campos:

### Identificación
- ID automático, ej. `IMP-0001`;
- fecha/hora;
- nombre del trabajo;
- finalidad;
- referencia opcional a Pedido/Proyecto para futuro.

### Equipo
- impresora;
- snapshot de configuración instalada.

### Producción
- resultado;
- horas/minutos reales;
- piezas planificadas opcional;
- piezas obtenidas;
- incidencia/notas opcionales.

### Materiales
Una o varias líneas:

- perfil de filamento;
- bobina física;
- gramos realmente consumidos;
- gramos desperdiciados opcional.

No pedir manualmente color/fabricante.

## Bobinas y stock

Al seleccionar perfil:

- una bobina utilizable → preseleccionar;
- varias → Combobox con restante, estado, ubicación y lote;
- ninguna → error `No hay una bobina con stock disponible para este perfil.`

Permitir varias líneas del mismo perfil si se usaron dos bobinas.

No permitir stock negativo silenciosamente.

Si el stock registrado no coincide con la realidad, primero corregir Materiales.

## Movimiento de stock

Guardar una impresión crea `MaterialMovement` de consumo enlazado con:

- `profileId`;
- `spoolId`;
- gramos;
- fecha;
- `relatedPrintId`.

Actualizar `remainingWeightG`.

Cada movimiento debe ser trazable al PrintRecord y no duplicarse por recarga/render.

## Editar y eliminar

Regla crítica: nunca aplicar una edición sobre los efectos anteriores.

### Editar
1. recuperar efectos originales;
2. revertir movimientos de Materiales;
3. revertir/recalcular uso de Equipos;
4. validar nuevos datos;
5. aplicar nuevos movimientos;
6. recalcular Equipos/mantenimiento;
7. guardar.

Ejemplo: 184 g corregido a 148 g → devolver 184 g y luego descontar 148 g.

### Eliminar
Confirmación explícita. Revertir stock y uso de Equipos antes de borrar.

### Duplicar
Crea borrador nuevo, sin movimientos, ID ni fecha originales. No toca stock hasta guardar.

Centralizar estas mutaciones en store/service, no en componentes.

## Equipos

Cada impresión aporta:

- duración;
- +1 impresión;
- resultado;
- gramos totales;
- gramos por familia;
- gramos abrasivos;
- última actividad.

`PrintRecord` debe ser fuente de verdad del uso registrado.

Tras create/update/delete, reconciliar contadores para evitar drift.

## Desperdicio

`wastedG` es opcional y debe cumplir:

`0 <= wastedG <= consumedG`

Forma parte del consumo, no se suma dos veces.

En impresión fallida puede ofrecerse `Marcar todo el consumo como desperdicio`, pero nunca hacerlo silenciosamente.

## Consejos contextuales

Sí se implementan.

### Antes de imprimir
Se recalculan según:

- impresora;
- configuración instalada;
- material;
- bobina;
- finalidad;
- mantenimiento;
- material usado anteriormente cuando aporte.

### Después de registrar
Mostrar:

- nueva revisión/mantenimiento activado;
- exposición relevante;
- consejo postimpresión;
- cambio de estado de componente.

No mostrar recomendaciones genéricas irrelevantes.

## PrintGuidanceRule

```ts
type PrintGuidanceRule = {
  id: string;
  phase: 'pre-print' | 'post-print';
  title: string;
  message: string;
  severity: 'info' | 'review' | 'attention';
  source: 'manufacturer' | 'kubo';
  sourceLabel: string;
  sourceReference?: string;
  conditions: {
    printerModel?: string[];
    purpose?: PrintPurpose[];
    materialTypes?: string[];
    reinforcement?: ('CF' | 'GF' | 'other-abrasive')[];
    nozzleMaterial?: string[];
    nozzleDiameterMm?: number[];
    previousMaterialTypes?: string[];
    maintenanceStates?: string[];
  };
  enabled: boolean;
};
```

No usar `any`.

## Reglas iniciales de consejos

### Abrasivos — fabricante
Para CF/GF/partículas duras:

- verificar boquilla;
- con acero inoxidable → `Atención`;
- indicar que hace falta acero endurecido para reducir desgaste;
- Bambu PLA-CF/PETG-CF: hardened 0.4 mm tiene guía específica;
- CF/GF generales: la guía de hotends favorece hardened 0.6 mm para reducir atasco/abrasión.

### Materiales no recomendados en A1 — fabricante
Cuando la ficha A1 los marque `Not Recommended`, mostrarlo y explicar el motivo documentado.

No bloquear el registro histórico de algo que realmente ocurrió.

### Temperaturas
Nunca inventar temperatura de boquilla o cama.

Si Materiales contiene perfil técnico real/validado, mostrarlo como referencia.

Si no existe, solo consejo:
`Verifica que el perfil de material y la placa seleccionada coincidan con tu configuración de impresión.`

### Limpieza/purga — KUBO
No afirmar `Bambu exige limpiar antes de PETG` sin fuente.

Sí puede existir como Consejo KUBO:

`Inspecciona la boquilla y purga residuos si cambiaste de material o ves material adherido.`

### Calibración — KUBO
Recordar registrar resultado. Si se validó un nuevo perfil técnico, sugerir actualizar Materiales manualmente; nunca modificarlo automáticamente.

### Venta/Custom — KUBO
Recordar verificar cantidad final y condición visual/funcional antes de marcar Correcta.

### Fallida/Parcial — KUBO
Sugerir documentar incidencia y mostrar cualquier mantenimiento activado por el registro.

## Compatibilidad

Bloque compacto:

- Compatible
- Precaución
- No recomendado

Derivar desde `admin-equipment-printers.md`, `materialType`, reinforcement/additive y configuración instalada.

Nunca inferir abrasividad por nombre/color.

## Después de guardar

Orden:

1. guardar registro;
2. aplicar stock;
3. reconciliar Equipos;
4. reevaluar mantenimiento;
5. mostrar resultado.

Ejemplo:

`Impresión registrada`
`PLA+ Negro: -184 g`
`A1 #01: +6 h 20 min`
`Nueva revisión: Lubricación · Revisar`

Si no cambió mantenimiento:
`Sin nuevas acciones de mantenimiento.`

## Historial

Desktop:
ID · fecha · trabajo · impresora · finalidad · resultado · tiempo · material/gramos · piezas.

Mobile: row deliberada, no tabla comprimida.

Filtros:

- búsqueda ID/nombre;
- impresora;
- finalidad;
- resultado;
- material;
- rango de fechas.

Acciones:
- Ver
- Editar
- Duplicar
- Eliminar

Estado vacío:
`Aún no hay impresiones registradas.`

## Snapshot histórico

Guardar:

- nombre/SKU de material;
- impresora;
- configuración instalada;
- finalidad;
- resultado;
- consumo;
- fecha.

Los IDs siguen siendo las relaciones primarias.

## Modelo

```ts
type PrintPurpose =
  | 'sale'
  | 'custom'
  | 'calibration'
  | 'prototype'
  | 'internal'
  | 'sample';

type PrintResult = 'success' | 'partial' | 'failed' | 'cancelled';

type PrintMaterialUsage = {
  profileId: string;
  spoolId: string;
  consumedG: number;
  wastedG?: number;
  materialType: string;
  reinforcement?: 'CF' | 'GF' | 'other-abrasive';
  materialSnapshot: { name: string; sku?: string };
  materialMovementId?: string;
};

type PrintRecord = {
  id: string;
  displayId: string;
  date: string;
  name: string;
  purpose: PrintPurpose;
  result: PrintResult;
  printerId: string;
  printerSnapshot: {
    name: string;
    model: string;
    nozzleDiameterMm: number;
    nozzleMaterial: string;
    buildPlate?: string;
  };
  durationMinutes: number;
  plannedUnits?: number;
  producedUnits: number;
  materials: PrintMaterialUsage[];
  relatedOrderId?: string;
  relatedProjectId?: string;
  issueNote?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Integridad

- nunca stock negativo silencioso;
- nunca doble movimiento;
- editar revierte y reaplica;
- eliminar revierte;
- duplicar no aplica efectos;
- fallo no devuelve filamento consumido;
- `wastedG` es subconjunto de consumo;
- finalidad no altera consumo;
- Equipos se reconcilia tras mutaciones;
- historial conserva snapshots.

## Responsive y accesibilidad

Seguir `admin-ui-rules.md`.

Validar desktop, 390px y 360px.

- barras con valor y descripción textual;
- no depender del color;
- consejos con severity textual;
- labels persistentes;
- errores inline;
- Combobox accesible;
- confirmación delete;
- sin ellipsis destructivo ni overflow.

## Fuentes oficiales Bambu a verificar

A1:
https://us.store.bambulab.com/products/A1/

Hotend A1 Series:
https://us.store.bambulab.com/products/bambu-hotend-a1-series

Para cualquier consejo atribuido a Bambu, verificar fuente oficial y guardar `sourceReference`.

Si no existe respaldo explícito, etiquetar como `KUBO`.

## Criterios de aceptación

- perfil de impresora arriba;
- contadores reales;
- barras solo para triggers cuantificables;
- finalidad incluye Venta, Custom, Calibración, Prueba, Interno y Muestra;
- Correcta/Parcial/Fallida/Cancelada;
- perfil + bobina física;
- guardar descuenta stock;
- fallida también descuenta lo consumido;
- múltiples filamentos/bobinas;
- Equipos acumula uso;
- abrasivos acumulan exposición;
- consejos pre/post contextuales;
- temperatura solo si existe dato real;
- Bambu/KUBO diferenciados;
- editar/eliminar revierten correctamente;
- duplicar no toca stock;
- historial conserva snapshots;
- desktop/390/360 correctos;
- `npm run check`;
- `npm run build`.
