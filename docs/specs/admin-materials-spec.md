# KUBO Admin — Producción / Materiales

## 1. Objetivo

Construir `Producción → Materiales` como sistema de **perfiles de filamento + inventario**, no como un catálogo plano.

La pantalla debe permitir:

- crear y mantener perfiles de filamento;
- distinguir materiales para uso Comercial, Interno o Ambos;
- distinguir estado de validación;
- conocer stock real disponible;
- registrar ingresos de stock y compras;
- consultar última compra;
- controlar stock mínimo;
- preparar el modelo para futuras conexiones con Producción, Calculadora y Finanzas.

### Fuente de verdad

KUBO opera actualmente con:

- 1 impresora FDM;
- materiales principales: **PLA+ y PETG**;
- Bambu Studio como herramienta actual.

No inventar parámetros técnicos. Los datos de temperatura, densidad, secado, flow, velocidad volumétrica u otros parámetros deben provenir de ficha del fabricante o pruebas reales de KUBO.

---

## 2. Principio de modelo

Separar obligatoriamente:

### Perfil de filamento
Describe **qué material es y cómo KUBO lo utiliza**.

### Inventario
Describe **cuánto material físico existe** y de dónde proviene.

### Movimientos
Explican **por qué cambia el stock**.

No guardar `stock` o `última compra` como campos manuales aislados si pueden derivarse del historial.

- `stockDisponible` = suma de inventario/movimientos.
- `ultimaCompra` = fecha más reciente de un ingreso por compra.

---

## 3. Pantalla principal — Materiales

### Header

**Materiales**

Microcopy:

`Perfiles, stock y parámetros de los filamentos de KUBO.`

CTA:

`+ Crear perfil`

### Resumen operativo

Connected surface compacta con:

- **Stock total** — kg/g disponibles.
- **Perfiles activos** — perfiles no inactivos.
- **Stock bajo** — perfiles por debajo del mínimo.
- **En evaluación** — perfiles todavía no aprobados.

No mostrar métricas ficticias ni tendencias sin datos.

### Toolbar

- Buscar material.
- Tipo: Todos / PLA+ / PETG.
- Uso: Comercial / Interno / Ambos.
- Validación: En evaluación / Aprobado / Inactivo.
- Stock: En stock / Stock bajo / Sin stock.
- Limpiar filtros.

### Desktop list

Columnas recomendadas:

1. Material.
2. Tipo.
3. Uso.
4. Validación.
5. Stock.
6. Última compra.
7. Estado stock.

#### Material

Mostrar:

- swatch real del color;
- nombre interno;
- fabricante/línea en secondary text.

Ejemplo:

`■ PLA+ Negro mate`
`Bambu Lab · Basic`

#### Stock

Mostrar peso como dato principal:

`2.43 kg`

Secondary:

`3 bobinas · 2 abiertas`

No tratar una bobina como equivalente automático a 1 kg cuando está parcialmente usada.

#### Estado stock

Usar el StatusChip global del Admin:

- En stock.
- Stock bajo.
- Sin stock.

### Mobile

No comprimir tabla.

Anatomía estable:

`MATERIAL                          STOCK`
`Fabricante · Tipo`
`Uso · Validación`
`Última compra                  Estado`

Mantener gutters y primitives definidas en `docs/admin-ui-rules.md`.

---

## 4. Crear perfil

Usar Modal compartido del Admin.

No crear una variante local de formulario.

El alta se divide visualmente en:

1. Información.
2. Uso KUBO.
3. Presentación.
4. Inventario.
5. Perfil técnico opcional.

No hacer wizard si no mejora la implementación. Secciones claras dentro del mismo formulario son suficientes.

### 4.1 Información

#### Nombre interno *
Ejemplo:

`PLA+ Negro mate`

#### Tipo de material *
Combobox controlado:

- PLA+
- PETG

La estructura debe permitir añadir otros materiales en el futuro sin cambiar el modelo.

#### Fabricante / marca
Ejemplo:

`Bambu Lab`

#### Línea / familia
Ejemplo:

`Basic`

#### Nombre del color *
Ejemplo:

`Negro`

#### Color
Color/swatch editable mediante valor hexadecimal.

Ejemplo:

`#1A1A1A`

Mostrar preview.

No asumir que el HEX representa exactamente el resultado impreso; es una referencia visual de inventario.

#### Diámetro *
Default configurable según datos reales.

Ejemplo visual:

`1.75 mm`

No hardcodear como verdad universal si el perfil puede cambiarlo.

#### SKU fabricante
Opcional.

#### Código interno KUBO
Opcional/autogenerable en el futuro.

No diseñar lógica compleja de SKU en esta iteración.

---

## 5. Uso KUBO

### Uso permitido *

Segmented control/radio:

- Comercial
- Interno
- Ambos

Significado:

- **Comercial:** autorizado para piezas/productos destinados a clientes o venta.
- **Interno:** pruebas, prototipos, utillaje o uso propio.
- **Ambos:** puede utilizarse en ambos contextos.

### Estado de validación *

- En evaluación
- Aprobado
- Inactivo

No mezclar `uso` con `validación`.

Ejemplo válido:

`Uso: Comercial`
`Validación: En evaluación`

El StatusChip debe reutilizar la primitive global.

---

## 6. Presentación / bobina

Campos:

### Peso neto nominal
Ejemplo:

`1000 g`

### Tara de bobina
Opcional.

Ejemplo:

`245 g`

Permite posteriormente calcular material restante cuando se pesa una bobina completa.

### Presentación
Opciones iniciales:

- Bobina
- Refill
- Muestra
- Otro

### Notas de presentación
Opcional.

---

## 7. Control de inventario

### Stock mínimo
Peso a partir del cual debe considerarse `Stock bajo`.

Ejemplo:

`1000 g`

### Ubicación habitual
Opcional.

Ejemplo:

`Estante A · Dry box 01`

### Proveedor preferido
Opcional.

No duplicar una base de proveedores compleja todavía.

### Estado stock derivado

- **En stock**: stock > mínimo.
- **Stock bajo**: stock > 0 y stock <= mínimo.
- **Sin stock**: stock <= 0.

No permitir que el usuario seleccione manualmente estos estados.

---

## 8. Stock inicial al crear perfil

El perfil puede crearse sin stock.

Añadir bloque opcional:

`Añadir stock inicial`

Si se activa:

- Fecha de compra *
- Proveedor.
- Cantidad de bobinas *
- Peso neto por bobina *
- Costo unitario opcional.
- Lote/batch opcional.
- Estado inicial de bobina: Sellada / Abierta.
- Ubicación.
- Notas.

El ingreso crea inventario/movimiento; no debe convertir `stock` en un campo editable del perfil.

---

## 9. Agregar stock

En cada perfil:

`+ Agregar stock`

Usar Modal compartido.

Campos:

- Fecha de compra *
- Proveedor.
- Cantidad de bobinas *
- Peso neto por bobina *
- Costo unitario.
- Costo total calculado.
- Lote/batch.
- Estado inicial: Sellada / Abierta.
- Ubicación.
- Referencia a gasto opcional.
- Documento/referencia opcional.
- Notas.

### Resumen reactivo

`2 bobinas × 1,000 g = +2.00 kg`

`Costo total: S/ 130.00`

No registrar automáticamente un Gasto todavía si no existe persistencia compartida entre módulos.

Preparar el modelo para un futuro `expenseId`.

---

## 10. Bobinas

El modelo debe permitir tracking por bobina/lote.

Una bobina puede incluir:

- id;
- profileId;
- lot;
- status: Sealed / Open / Empty / Discarded;
- initialNetWeightG;
- remainingWeightG;
- tareWeightG opcional;
- purchaseDate;
- openedAt opcional;
- supplier;
- location;
- unitCost opcional.

### Dato principal

El inventario se mide por **peso restante**, no solo por cantidad de bobinas.

Mostrar:

`2.43 kg disponibles`
`3 bobinas · 2 abiertas · 1 sellada`

---

## 11. Actualizar peso de bobina

En bobinas abiertas permitir:

`Actualizar peso`

Campos:

### Método
- Peso neto restante.
- Peso bruto de balanza, si existe tara conocida.

Si se usa peso bruto:

`restante = peso bruto - tara`

Nunca permitir resultado negativo.

Registrar un movimiento de ajuste.

---

## 12. Movimientos

Preparar tipo de movimiento:

- Compra / ingreso.
- Consumo.
- Merma.
- Ajuste.
- Devolución.

Para esta iteración UI pueden implementarse:

- Compra / ingreso.
- Ajuste.

Consumo/Merma automático se conectará posteriormente con Producción.

Cada movimiento:

- id;
- profileId;
- spoolId opcional;
- type;
- quantityG;
- date;
- note;
- relatedPurchaseId/expenseId opcional;
- createdAt.

No editar stock directamente sin movimiento.

---

## 13. Detalle del perfil

Al seleccionar un material abrir un workspace de detalle.

Preferencia de IA:

`/admin/materiales/[id]`

Header:

`PLA+ Negro mate`
`Bambu Lab · PLA+ · 1.75 mm`

Chips:

`Aprobado`
`Comercial`

KPIs compactos:

- Stock disponible.
- Bobinas.
- Última compra.
- Stock mínimo.

Acciones:

- `+ Agregar stock`
- `Editar perfil`

Tabs:

### Resumen
Identidad, uso, validación, inventario esencial.

### Inventario
Bobinas y movimientos.

### Perfil de impresión
Datos fabricante + parámetros KUBO validados.

### Compras
Historial de ingresos/compras y costos.

No convertir todos los tabs en islands separadas si no requieren estado independiente.

---

## 14. Perfil de impresión

Separar visualmente:

### Especificación del fabricante
Datos documentados del fabricante.

### Perfil validado KUBO
Valores que KUBO realmente probó.

Campos posibles cuando existan datos reales:

- temperatura nozzle;
- temperatura cama;
- rango del fabricante;
- flow ratio;
- max volumetric speed;
- densidad;
- secado recomendado;
- impresora compatible;
- nozzle compatible;
- nombre del preset de Bambu Studio;
- fecha de última calibración;
- notas de prueba.

No inventar valores default técnicos.

Los campos pueden permanecer vacíos.

Usar JetBrains Mono para valores técnicos y Space Grotesk para explicación.

---

## 15. Compras / costos

Por ingreso guardar cuando exista:

- fecha;
- proveedor;
- cantidad;
- peso;
- costo unitario;
- costo total;
- lote;
- referencia de comprobante;
- expenseId opcional.

Permitir derivar posteriormente:

- última compra;
- último costo/kg;
- costo promedio;
- valor estimado del inventario.

No fijar todavía una política contable de valoración.

No asumir si Calculadora utilizará último costo o promedio; solo conservar datos suficientes.

---

## 16. Relaciones futuras

Preparar sin implementar lógica falsa:

### Producción
Consumirá gramos del inventario y generará movimientos.

### Calculadora
Podrá leer costo de material y perfiles Comerciales/Aprobados.

### Finanzas
Una compra podrá enlazarse con un gasto mediante `expenseId`.

### Compras pendientes
Stock bajo podrá originar una necesidad de reposición.

No simular persistencia entre rutas si todavía no existe un store/backend compartido.

---

## 17. Modelo sugerido

### FilamentProfile

- id
- name
- materialType
- manufacturer?
- productLine?
- colorName
- colorHex?
- diameterMm
- manufacturerSku?
- internalCode?
- usage: commercial | internal | both
- validationStatus: evaluation | approved | inactive
- nominalSpoolWeightG?
- tareWeightG?
- presentation?
- minimumStockG
- defaultLocation?
- preferredSupplier?
- manufacturerSpecs?
- kuboPrintProfile?
- notes?
- createdAt
- updatedAt

### FilamentSpool

- id
- profileId
- lot?
- status
- initialNetWeightG
- remainingWeightG
- tareWeightG?
- purchaseDate
- openedAt?
- supplier?
- location?
- unitCost?
- expenseId?
- notes?

### MaterialMovement

- id
- profileId
- spoolId?
- type
- quantityG
- date
- note?
- relatedExpenseId?
- createdAt

No usar `any`.

Centralizar enums/options.

---

## 18. Estados UX necesarios

Material/Profile:

- loading;
- empty;
- search no results;
- validation error;
- inactive;
- stock low;
- out of stock.

Inventario:

- sin bobinas;
- bobina abierta;
- sellada;
- vacía;
- ajuste exitoso;
- error.

Formularios:

- default;
- focus;
- disabled;
- invalid;
- saving;
- success.

Reutilizar primitives definidas en `docs/admin-ui-rules.md`.

---

## 19. Diseño visual

Mantener el Admin KUBO actual:

- Astro-first;
- Svelte solo para interacción/estado;
- workspace blanco;
- sidebar negra;
- Connected Bento;
- Space Grotesk dominante;
- JetBrains Mono para datos técnicos;
- Iconoir exclusivamente;
- rojo `#ED254E` como selección/revisión;
- celeste `#98D7E0` como información;
- StatusChip global;
- cutting/construction grid de intensidad baja-media porque Materiales pertenece a Producción.

### Stock bar

Puede utilizar barra geométrica:

- track carbón tenue;
- fill carbón;
- rojo únicamente para stock crítico/atención;
- celeste para información secundaria;
- radius mínimo, no pill.

No usar gauges o charts sin necesidad.

---

## 20. Responsive

### Desktop >=1024
- resumen compacto;
- toolbar;
- tabla/listado;
- forms con grid compartido;
- pares 6/6 donde corresponda.

### Tablet 640–1023
- forms una columna;
- tabla se simplifica cuando pierda legibilidad;
- Modal conserva reglas globales.

### Mobile <640
- rows/cards deliberadas;
- forms una columna;
- Modal fullscreen;
- CTA principal accesible;
- sin tabla comprimida;
- sin overflow horizontal.

Validar 390 y 360.

---

## 21. Accesibilidad

- labels persistentes;
- swatch acompañado por nombre de color;
- estado nunca solo por color;
- StatusChip con texto;
- inputs numéricos con unidad visible;
- keyboard/focus en combobox/modal/tabs;
- errores inline;
- touch targets adecuados;
- reduced motion;
- tabla semántica en desktop.

---

## 22. Alcance inicial de implementación

Implementar frontend funcional con mock/session state, siguiendo el patrón actual del Admin, salvo que el repositorio ya tenga persistencia real para Materiales.

Debe funcionar:

- listar perfiles;
- filtrar/buscar;
- crear perfil;
- editar perfil;
- añadir stock;
- actualizar inventario en sesión;
- visualizar detalle;
- calcular stock total/última compra/estado de stock;
- actualizar peso mediante ajuste;
- responsive.

No implementar todavía:

- consumo automático desde Producción;
- sincronización real con Finanzas;
- Calculadora;
- backend nuevo;
- política contable;
- datos técnicos inventados.

---

## 23. Criterios de aceptación

- Perfil e inventario están separados conceptualmente.
- Stock se calcula por peso real disponible.
- Cantidad de bobinas es secundaria al peso.
- Última compra se deriva del historial.
- Uso Comercial/Interno/Ambos funciona.
- Validación En evaluación/Aprobado/Inactivo funciona.
- Stock mínimo deriva En stock/Stock bajo/Sin stock.
- Crear perfil puede incluir stock inicial opcional.
- Agregar stock registra compra/ingreso.
- Detalle muestra Resumen/Inventario/Perfil impresión/Compras.
- Parámetros técnicos pueden quedar vacíos y nunca se inventan.
- Gastos y futuras relaciones quedan preparadas pero no simuladas.
- UI reutiliza primitives globales del Admin.
- Responsive 390/360 no rompe.
- Build/check sin errores ni warnings del scope.
