# KUBO Admin — referencia de interfaz frontend

> **Qué es este archivo:** una implementación visual de referencia para el panel administrativo de KUBO. No es un prompt para Claude. La idea es usar este frontend como base visual y de interacción y, después, pedirle a Claude Code que lo integre/refactorice dentro del repo Astro real.
>
> **Alcance:** shell administrativo + Dashboard. El resto de las rutas aparecen en la navegación, pero no se desarrollan todavía.
>
> **Importante antes de integrar:** los documentos del proyecto no incluyen los nombres exactos de los SVG ni de los archivos de fuente. Por eso hay dos placeholders deliberados (`__KUBO_HORIZONTAL_INVERSE__.svg` y los nombres de los font files). Claude deberá resolver esos nombres leyendo el repo; no se deben reconstruir ni recolorear logos, ni descargar fuentes externas.

---

## Estructura de referencia

```text
src/
├─ data/admin/admin-ui.mock.ts
├─ pages/admin/index.astro
└─ styles/admin.css
```

La implementación asume que ya existe:

```text
src/components/ui/KuboIcon.astro
```

con Iconoir como única fuente de iconografía.

---

## 1) `src/data/admin/admin-ui.mock.ts`

```ts
export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: 'INICIO',
    items: [
      { label: 'Dashboard', href: '/admin/', icon: 'dashboard-dots' },
    ],
  },
  {
    label: 'COMERCIO',
    items: [
      { label: 'Pedidos', href: '/admin/comercio/pedidos', icon: 'package' },
      { label: 'Productos', href: '/admin/comercio/productos', icon: 'cube' },
      { label: 'Colecciones', href: '/admin/comercio/colecciones', icon: 'view-grid' },
      { label: 'Clientes', href: '/admin/comercio/clientes', icon: 'group' },
      { label: 'Descuentos', href: '/admin/comercio/descuentos', icon: 'tag' },
      { label: 'Envíos', href: '/admin/comercio/envios', icon: 'delivery-truck' },
    ],
  },
  {
    label: 'CUSTOM',
    items: [
      { label: 'Solicitudes', href: '/admin/custom/solicitudes', icon: 'chat-lines' },
      { label: 'Cotizaciones', href: '/admin/custom/cotizaciones', icon: 'page' },
      { label: 'Proyectos', href: '/admin/custom/proyectos', icon: 'cube-replace-face' },
    ],
  },
  {
    label: 'PRODUCCIÓN',
    items: [
      { label: 'Cola de producción', href: '/admin/produccion/cola', icon: 'printing-page' },
      { label: 'Materiales', href: '/admin/produccion/materiales', icon: 'flask' },
      { label: 'Equipos', href: '/admin/produccion/equipos', icon: 'server' },
    ],
  },
  {
    label: 'HERRAMIENTAS',
    items: [
      { label: 'Calculadora de precios', href: '/admin/herramientas/calculadora', icon: 'calculator' },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { label: 'Gastos', href: '/admin/finanzas/gastos', icon: 'wallet' },
      { label: 'Resumen financiero', href: '/admin/finanzas/resumen', icon: 'graph-up' },
      { label: 'Costos recurrentes', href: '/admin/finanzas/recurrentes', icon: 'refresh-double' },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { label: 'Medios', href: '/admin/contenido/medios', icon: 'media-image' },
      { label: 'Lab', href: '/admin/contenido/lab', icon: 'test-tube' },
      { label: 'Páginas', href: '/admin/contenido/paginas', icon: 'page-edit' },
      { label: 'FAQs', href: '/admin/contenido/faqs', icon: 'help-circle' },
    ],
  },
  {
    label: 'CONFIGURACIÓN',
    items: [
      { label: 'General', href: '/admin/configuracion/general', icon: 'settings' },
      { label: 'Parámetros de costos', href: '/admin/configuracion/costos', icon: 'tuning-square' },
      { label: 'Usuarios', href: '/admin/configuracion/usuarios', icon: 'user' },
      { label: 'Roles', href: '/admin/configuracion/roles', icon: 'key' },
      { label: 'Integraciones', href: '/admin/configuracion/integraciones', icon: 'network' },
    ],
  },
];

export const kpis = [
  {
    eyebrow: 'VENTAS DEL PERIODO',
    value: 'S/ 24,680',
    delta: '+14.6%',
    context: 'vs. periodo anterior',
    tone: 'red',
    points: [22, 39, 28, 53, 74, 47, 66],
  },
  {
    eyebrow: 'PEDIDOS PENDIENTES',
    value: '12',
    delta: '+2',
    context: 'requieren atención',
    tone: 'neutral',
    points: [28, 34, 30, 44, 38, 51, 42],
  },
  {
    eyebrow: 'CUSTOM ACTIVOS',
    value: '6',
    delta: '+1',
    context: 'proyecto esta semana',
    tone: 'blue',
    points: [24, 36, 33, 51, 42, 45, 58],
  },
  {
    eyebrow: 'COTIZACIONES PENDIENTES',
    value: '4',
    delta: '2 nuevas',
    context: 'pendientes de revisión',
    tone: 'red',
    points: [34, 27, 43, 36, 50, 44, 48],
  },
  {
    eyebrow: 'CARGA DE PRODUCCIÓN',
    value: '72%',
    delta: '18 h',
    context: 'estimadas en cola',
    tone: 'blue',
    points: [31, 36, 46, 42, 55, 63, 72],
  },
] as const;

export const sales = {
  labels: ['Lun 11', 'Mar 12', 'Mié 13', 'Jue 14', 'Vie 15', 'Sáb 16', 'Dom 17'],
  values: [3200, 4100, 5200, 6900, 8600, 7200, 6680],
  summary: [
    { label: 'VENTAS', value: 'S/ 24,680' },
    { label: 'COSTO ESTIMADO', value: 'S/ 9,420' },
    { label: 'GANANCIA BRUTA', value: 'S/ 15,260' },
    { label: 'MARGEN', value: '61.8%' },
  ],
};

export const revenueChannels = [
  { label: 'Tienda online', value: 65, amount: 'S/ 16,042', tone: 'carbon' },
  { label: 'Custom', value: 20, amount: 'S/ 4,936', tone: 'blue' },
  { label: 'Lab', value: 10, amount: 'S/ 2,468', tone: 'red' },
  { label: 'Otros', value: 5, amount: 'S/ 1,234', tone: 'muted' },
] as const;

export const recentOrders = [
  { id: '#KUBO-1048', client: 'María Fernanda R.', total: 'S/ 189.00', status: 'Entregado', tone: 'success' },
  { id: '#KUBO-1047', client: 'Diego Salazar', total: 'S/ 259.00', status: 'Enviado', tone: 'info' },
  { id: '#KUBO-1046', client: 'Carlos A. Quispe', total: 'S/ 129.00', status: 'En producción', tone: 'warning' },
  { id: '#KUBO-1045', client: 'Lucía Romero', total: 'S/ 349.00', status: 'Nuevo', tone: 'neutral' },
  { id: '#KUBO-1044', client: 'Andrés Valdez', total: 'S/ 79.00', status: 'Cancelado', tone: 'danger' },
] as const;

export const productionQueue = [
  { item: 'Organizador M1', origin: 'Pedido #1047', qty: '2 u', material: 'PLA+', time: '—', status: 'Imprimiendo', tone: 'info' },
  { item: 'Miniatura de embarcación', origin: 'Custom / MAR-021', qty: '3 u', material: 'PLA+', time: '—', status: 'En cola', tone: 'warning' },
  { item: 'Caja técnica C2', origin: 'Custom / CTA-018', qty: '1 u', material: 'PETG', time: '—', status: 'Preparación', tone: 'neutral' },
  { item: 'Bandeja modular B2', origin: 'Pedido #1046', qty: '4 u', material: 'PETG', time: '—', status: 'En cola', tone: 'warning' },
] as const;

export const topProducts = [
  { name: 'Organizador M1', sku: 'ORG-M1', sold: 235, revenue: 'S/ 11,750', progress: 100 },
  { name: 'Bandeja Modular B2', sku: 'BAN-B2', sold: 168, revenue: 'S/ 6,720', progress: 72 },
  { name: 'Contenedor C1', sku: 'CON-C1', sold: 154, revenue: 'S/ 3,080', progress: 66 },
  { name: 'Riel Multiuso R1', sku: 'RIE-R1', sold: 102, revenue: 'S/ 2,040', progress: 43 },
  { name: 'Kit Starter KUBO', sku: 'KIT-S1', sold: 86, revenue: 'S/ 1,720', progress: 37 },
] as const;

export const customProjects = [
  { project: 'Estación de trabajo modular', client: 'Diego Salazar', phase: 'Diseño', tone: 'info', due: '22 ago.' },
  { project: 'Caja organizadora técnica', client: 'María F. R.', phase: 'Producción', tone: 'warning', due: '20 ago.' },
  { project: 'Panel de herramientas', client: 'Carlos Quispe', phase: 'Revisión', tone: 'review', due: '25 ago.' },
  { project: 'Módulo para impresión 3D', client: 'Andrés Valdez', phase: 'Cotización', tone: 'neutral', due: '28 ago.' },
  { project: 'Sistema de transporte', client: 'Lucía Romero', phase: 'Evaluación', tone: 'muted', due: '30 ago.' },
] as const;

export const activity = [
  { icon: 'cart', title: 'Nuevo pedido #KUBO-1048', meta: 'María Fernanda R. · S/ 189.00', when: '12 min', tone: 'red' },
  { icon: 'cube', title: 'Nuevo proyecto Custom', meta: 'Caja organizadora modular', when: '34 min', tone: 'carbon' },
  { icon: 'user', title: 'Nuevo cliente registrado', meta: 'jorgeh@correo.com', when: '1 h', tone: 'blue' },
  { icon: 'page', title: 'Cotización enviada', meta: 'Proyecto · Estación de trabajo', when: '2 h', tone: 'carbon' },
  { icon: 'package', title: 'Producto actualizado', meta: 'Organizador M1', when: '3 h', tone: 'blue' },
] as const;
```

---

## 2) `src/pages/admin/index.astro`

```astro
---
import KuboIcon from '../../components/ui/KuboIcon.astro';
import '../../styles/admin.css';

import {
  navGroups,
  kpis,
  sales,
  revenueChannels,
  recentOrders,
  productionQueue,
  topProducts,
  customProjects,
  activity,
} from '../../data/admin/admin-ui.mock';

const currentPath = Astro.url.pathname;

// IMPORTANTE: reemplazar únicamente por el nombre REAL del SVG oficial
// horizontal inverso dentro de /assets/logos/web/. No reconstruir el logo.
const logoSrc = '/assets/logos/web/__KUBO_HORIZONTAL_INVERSE__.svg';
const symbolLogoSrc = '/assets/logos/web/__KUBO_SYMBOL_INVERSE__.svg';

const salesWidth = 760;
const salesHeight = 230;
const salesPadX = 20;
const salesPadY = 24;
const minValue = 0;
const maxValue = 10000;

const salesPoints = sales.values.map((value, i) => {
  const x = salesPadX + (i * (salesWidth - salesPadX * 2)) / (sales.values.length - 1);
  const y = salesHeight - salesPadY - ((value - minValue) / (maxValue - minValue)) * (salesHeight - salesPadY * 2);
  return { x, y, value };
});

const salesLine = salesPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
const salesArea = `${salesLine} L ${salesPoints.at(-1)?.x} ${salesHeight - salesPadY} L ${salesPoints[0].x} ${salesHeight - salesPadY} Z`;

function sparklinePath(points: readonly number[]) {
  const width = 112;
  const height = 44;
  const padding = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = padding + (index * (width - padding * 2)) / (points.length - 1);
      const y = height - padding - ((point - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function isActive(href: string) {
  if (href === '/admin/') return currentPath === '/admin/' || currentPath === '/admin';
  return currentPath.startsWith(href);
}
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light" />
    <meta name="theme-color" content="#141414" />
    <title>Dashboard · KUBO Admin</title>
  </head>

  <body class="admin-body">
    <div class="admin-shell" data-admin-shell>
      <div class="sidebar-scrim" data-sidebar-scrim></div>

      <aside class="admin-sidebar" data-sidebar aria-label="Navegación administrativa">
        <div class="sidebar-brand">
          <a href="/admin/" class="brand-link" aria-label="KUBO Admin — inicio">
            <img src={logoSrc} alt="KUBO" class="brand-logo brand-logo-horizontal" />
            <img src={symbolLogoSrc} alt="" class="brand-logo brand-logo-symbol" aria-hidden="true" />
          </a>

          <button class="sidebar-close icon-button mobile-only" type="button" data-sidebar-close aria-label="Cerrar navegación">
            <KuboIcon name="xmark" size={20} />
          </button>
        </div>

        <nav class="sidebar-nav" aria-label="Secciones del panel">
          {navGroups.map((group) => (
            <section class="nav-group" aria-labelledby={`nav-${group.label.toLowerCase()}`}>
              <p class="nav-group-label" id={`nav-${group.label.toLowerCase()}`}>{group.label}</p>

              <div class="nav-group-items">
                {group.items.map((item) => (
                  <a
                    href={item.href}
                    class:list={['nav-item', { 'is-active': isActive(item.href) }]}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    title={item.label}
                  >
                    <span class="nav-item-icon" aria-hidden="true">
                      <KuboIcon name={item.icon} size={18} />
                    </span>
                    <span class="nav-item-label">{item.label}</span>
                    <span class="nav-item-arrow" aria-hidden="true">
                      <KuboIcon name="nav-arrow-right" size={15} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div class="sidebar-footer">
          <button class="sidebar-user" type="button" aria-label="Abrir menú de administrador">
            <span class="sidebar-avatar">AA</span>
            <span class="sidebar-user-copy">
              <strong>Admin KUBO</strong>
              <small>Administrador</small>
            </span>
            <KuboIcon name="nav-arrow-down" size={16} />
          </button>
          <p class="sidebar-version">KUBO ADMIN / UI 01</p>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <button class="icon-button desktop-sidebar-toggle" type="button" data-sidebar-collapse aria-label="Contraer navegación">
              <KuboIcon name="menu" size={21} />
            </button>

            <button class="icon-button mobile-menu mobile-only" type="button" data-sidebar-open aria-label="Abrir navegación">
              <KuboIcon name="menu" size={22} />
            </button>

            <div class="mobile-brand mobile-only" aria-hidden="true">
              <img src={symbolLogoSrc} alt="" class="mobile-brand-logo" />
            </div>
          </div>

          <div class="topbar-actions">
            <label class="global-search">
              <KuboIcon name="search" size={18} />
              <input type="search" placeholder="Buscar en KUBO..." aria-label="Buscar en KUBO" />
              <span class="search-shortcut" aria-hidden="true">⌘ K</span>
            </label>

            <div class="popover-wrap" data-popover>
              <button class="period-button" type="button" data-popover-trigger aria-expanded="false">
                <KuboIcon name="calendar" size={17} />
                <span>11 ago. — 17 ago. 2026</span>
                <KuboIcon name="nav-arrow-down" size={15} />
              </button>
              <div class="mini-popover" data-popover-panel hidden>
                <button type="button">Últimos 7 días</button>
                <button type="button">Últimos 30 días</button>
                <button type="button">Este mes</button>
              </div>
            </div>

            <button class="icon-button notification-button" type="button" aria-label="Notificaciones, 3 nuevas">
              <KuboIcon name="bell" size={20} />
              <span class="notification-dot">3</span>
            </button>

            <div class="popover-wrap user-menu-wrap" data-popover>
              <button class="topbar-user" type="button" data-popover-trigger aria-expanded="false">
                <span class="avatar">AA</span>
                <span class="topbar-user-copy">
                  <strong>Admin KUBO</strong>
                  <small>Administrador</small>
                </span>
                <KuboIcon name="nav-arrow-down" size={16} />
              </button>

              <div class="mini-popover user-popover" data-popover-panel hidden>
                <button type="button">Mi cuenta</button>
                <button type="button">Preferencias</button>
                <span class="popover-divider"></span>
                <button type="button">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </header>

        <div class="admin-content">
          <section class="page-heading reveal" style="--delay: 20ms">
            <div>
              <div class="eyebrow-line">
                <span class="page-index">01 / INICIO</span>
                <span class="demo-chip">DATOS DEMO</span>
              </div>
              <h1>Dashboard</h1>
              <p>Resumen general de tu tienda, proyectos y producción.</p>
            </div>

            <div class="heading-actions">
              <button class="secondary-button" type="button">
                <KuboIcon name="download" size={17} />
                Exportar
              </button>
              <button class="primary-button" type="button">
                <KuboIcon name="plus" size={18} />
                Nuevo registro
              </button>
            </div>
          </section>

          <section class="kpi-grid" aria-label="Indicadores generales">
            {kpis.map((kpi, index) => (
              <article class={`kpi-card reveal tone-${kpi.tone}`} style={`--delay: ${70 + index * 45}ms`}>
                <div class="kpi-card-top">
                  <p>{kpi.eyebrow}</p>
                  <button class="micro-info" type="button" aria-label={`Información sobre ${kpi.eyebrow}`}>
                    <KuboIcon name="info-circle" size={14} />
                  </button>
                </div>

                <div class="kpi-card-main">
                  <div>
                    <strong class="kpi-value">{kpi.value}</strong>
                    <div class="kpi-meta">
                      <span class="kpi-delta">{kpi.delta}</span>
                      <span>{kpi.context}</span>
                    </div>
                  </div>

                  <svg class="sparkline" viewBox="0 0 112 44" role="img" aria-label={`Tendencia de ${kpi.eyebrow}`}>
                    <path class="sparkline-grid" d="M3 40 H109" />
                    <path class="sparkline-line" pathLength="1" d={sparklinePath(kpi.points)} />
                  </svg>
                </div>
              </article>
            ))}
          </section>

          <section class="dashboard-grid">
            <!-- VENTAS -->
            <article class="panel panel-sales reveal" style="--delay: 310ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">COMERCIO / 01</p>
                  <h2>Ventas</h2>
                </div>
                <button class="compact-filter" type="button">
                  Últimos 7 días
                  <KuboIcon name="nav-arrow-down" size={14} />
                </button>
              </header>

              <div class="sales-chart-wrap">
                <div class="chart-axis-labels" aria-hidden="true">
                  <span>10K</span>
                  <span>7.5K</span>
                  <span>5K</span>
                  <span>2.5K</span>
                  <span>0</span>
                </div>

                <svg class="sales-chart" viewBox={`0 0 ${salesWidth} ${salesHeight}`} role="img" aria-labelledby="sales-chart-title sales-chart-desc">
                  <title id="sales-chart-title">Ventas demo de los últimos siete días</title>
                  <desc id="sales-chart-desc">La serie comienza en 3200 soles y alcanza un máximo demo de 8600 soles el viernes.</desc>

                  <defs>
                    <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="var(--kubo-red)" stop-opacity="0.22" />
                      <stop offset="100%" stop-color="var(--kubo-red)" stop-opacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3, 4].map((row) => {
                    const y = salesPadY + (row * (salesHeight - salesPadY * 2)) / 4;
                    return <line class="chart-grid-line" x1={salesPadX} y1={y} x2={salesWidth - salesPadX} y2={y} />;
                  })}

                  <path class="sales-area" d={salesArea} />
                  <path class="sales-line" pathLength="1" d={salesLine} />

                  {salesPoints.map((point, index) => (
                    <g class="sales-point" tabindex="0" aria-label={`${sales.labels[index]}: S/ ${point.value.toLocaleString('es-PE')}`}>
                      <circle class="sales-point-halo" cx={point.x} cy={point.y} r="10" />
                      <circle class="sales-point-dot" cx={point.x} cy={point.y} r="3.7" />
                    </g>
                  ))}
                </svg>

                <div class="chart-x-labels" aria-hidden="true">
                  {sales.labels.map((label) => <span>{label}</span>)}
                </div>
              </div>

              <div class="sales-summary">
                {sales.summary.map((item) => (
                  <div class="summary-stat">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <!-- DISTRIBUCIÓN -->
            <article class="panel panel-revenue reveal" style="--delay: 350ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">INGRESOS / 02</p>
                  <h2>Por canal</h2>
                </div>
                <button class="panel-action" type="button" aria-label="Abrir detalle de ingresos">
                  <KuboIcon name="arrow-up-right" size={18} />
                </button>
              </header>

              <div class="donut-zone">
                <div class="revenue-donut" role="img" aria-label="Distribución demo: Tienda online 65%, Custom 20%, Lab 10%, Otros 5%">
                  <div class="donut-center">
                    <span>TOTAL</span>
                    <strong>S/ 24,680</strong>
                  </div>
                </div>

                <div class="channel-list">
                  {revenueChannels.map((channel) => (
                    <div class="channel-row">
                      <span class={`channel-dot tone-${channel.tone}`} aria-hidden="true"></span>
                      <div class="channel-copy">
                        <strong>{channel.label}</strong>
                        <small>{channel.value}%</small>
                      </div>
                      <span class="channel-amount">{channel.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <!-- PEDIDOS -->
            <article class="panel panel-orders reveal" style="--delay: 390ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">COMERCIO / 03</p>
                  <h2>Pedidos recientes</h2>
                </div>
                <a class="text-link" href="/admin/comercio/pedidos">Ver todos <KuboIcon name="nav-arrow-right" size={14} /></a>
              </header>

              <div class="table-shell desktop-table">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">PEDIDO</th>
                      <th scope="col">CLIENTE</th>
                      <th scope="col">TOTAL</th>
                      <th scope="col">ESTADO</th>
                      <th scope="col"><span class="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr>
                        <td><strong class="mono-strong">{order.id}</strong></td>
                        <td>{order.client}</td>
                        <td>{order.total}</td>
                        <td><span class={`status-badge status-${order.tone}`}>{order.status}</span></td>
                        <td><button class="row-action" type="button" aria-label={`Abrir ${order.id}`}><KuboIcon name="nav-arrow-right" size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div class="mobile-list mobile-only">
                {recentOrders.map((order) => (
                  <a class="mobile-data-card" href="/admin/comercio/pedidos">
                    <div>
                      <strong class="mono-strong">{order.id}</strong>
                      <span>{order.client}</span>
                    </div>
                    <div class="mobile-card-right">
                      <strong>{order.total}</strong>
                      <span class={`status-badge status-${order.tone}`}>{order.status}</span>
                    </div>
                  </a>
                ))}
              </div>
            </article>

            <!-- PRODUCCIÓN -->
            <article class="panel panel-production reveal" style="--delay: 430ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">PRODUCCIÓN / 04</p>
                  <h2>Producción próxima</h2>
                </div>
                <a class="text-link" href="/admin/produccion/cola">Abrir cola <KuboIcon name="nav-arrow-right" size={14} /></a>
              </header>

              <div class="production-list">
                {productionQueue.map((job, index) => (
                  <div class="production-row">
                    <div class="production-index">{String(index + 1).padStart(2, '0')}</div>
                    <div class="production-main">
                      <strong>{job.item}</strong>
                      <span>{job.origin}</span>
                    </div>
                    <div class="production-tech">
                      <span>{job.qty}</span>
                      <span>{job.material}</span>
                      <span>{job.time}</span>
                    </div>
                    <span class={`status-badge status-${job.tone}`}>{job.status}</span>
                  </div>
                ))}
              </div>
            </article>

            <!-- PRODUCTOS -->
            <article class="panel panel-products reveal" style="--delay: 470ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">PRODUCTO / 05</p>
                  <h2>Más vendidos</h2>
                </div>
                <a class="text-link" href="/admin/comercio/productos">Ver productos <KuboIcon name="nav-arrow-right" size={14} /></a>
              </header>

              <div class="product-list">
                {topProducts.map((product) => (
                  <div class="product-row">
                    <div class="product-thumb" aria-hidden="true">
                      <span></span>
                    </div>
                    <div class="product-copy">
                      <div class="product-title-line">
                        <strong>{product.name}</strong>
                        <span>{product.sold} u</span>
                      </div>
                      <div class="product-meta-line">
                        <span>{product.sku}</span>
                        <strong>{product.revenue}</strong>
                      </div>
                      <div class="progress-track" aria-hidden="true">
                        <span style={`--progress: ${product.progress}%`}></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <!-- CUSTOM -->
            <article class="panel panel-custom reveal" style="--delay: 510ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">CUSTOM / 06</p>
                  <h2>Proyectos activos</h2>
                </div>
                <a class="text-link" href="/admin/custom/proyectos">Ver todos <KuboIcon name="nav-arrow-right" size={14} /></a>
              </header>

              <div class="custom-list">
                {customProjects.map((project) => (
                  <div class="custom-row">
                    <div class="custom-symbol" aria-hidden="true"><KuboIcon name="cube" size={17} /></div>
                    <div class="custom-main">
                      <strong>{project.project}</strong>
                      <span>{project.client}</span>
                    </div>
                    <span class={`status-badge status-${project.tone}`}>{project.phase}</span>
                    <span class="custom-due">{project.due}</span>
                  </div>
                ))}
              </div>
            </article>

            <!-- ACTIVIDAD -->
            <article class="panel panel-activity reveal" style="--delay: 550ms">
              <header class="panel-header">
                <div>
                  <p class="panel-kicker">SISTEMA / 07</p>
                  <h2>Actividad</h2>
                </div>
                <button class="panel-action" type="button" aria-label="Filtrar actividad"><KuboIcon name="filter-list" size={17} /></button>
              </header>

              <div class="activity-list">
                {activity.map((item) => (
                  <div class="activity-row">
                    <div class={`activity-icon tone-${item.tone}`} aria-hidden="true"><KuboIcon name={item.icon} size={18} /></div>
                    <div class="activity-copy">
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </div>
                    <time>{item.when}</time>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <footer class="admin-footer">
            <span>© 2026 KUBO. Interfaz administrativa.</span>
            <span>HECHO EN LIMA, PERÚ.</span>
          </footer>
        </div>
      </main>
    </div>

    <script is:inline>
      const root = document.documentElement;
      root.classList.add('has-js');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => document.body.classList.add('ui-ready'));
      });

      const shell = document.querySelector('[data-admin-shell]');
      const sidebarOpen = document.querySelector('[data-sidebar-open]');
      const sidebarClose = document.querySelector('[data-sidebar-close]');
      const sidebarScrim = document.querySelector('[data-sidebar-scrim]');
      const collapseButton = document.querySelector('[data-sidebar-collapse]');

      const openSidebar = () => {
        shell?.classList.add('mobile-sidebar-open');
        document.body.style.overflow = 'hidden';
      };

      const closeSidebar = () => {
        shell?.classList.remove('mobile-sidebar-open');
        document.body.style.overflow = '';
      };

      sidebarOpen?.addEventListener('click', openSidebar);
      sidebarClose?.addEventListener('click', closeSidebar);
      sidebarScrim?.addEventListener('click', closeSidebar);

      collapseButton?.addEventListener('click', () => {
        shell?.classList.toggle('sidebar-collapsed');
        const collapsed = shell?.classList.contains('sidebar-collapsed') ?? false;
        collapseButton.setAttribute('aria-label', collapsed ? 'Expandir navegación' : 'Contraer navegación');
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeSidebar();
      });

      document.querySelectorAll('[data-popover]').forEach((popover) => {
        const trigger = popover.querySelector('[data-popover-trigger]');
        const panel = popover.querySelector('[data-popover-panel]');
        if (!trigger || !panel) return;

        trigger.addEventListener('click', (event) => {
          event.stopPropagation();

          document.querySelectorAll('[data-popover-panel]').forEach((otherPanel) => {
            if (otherPanel !== panel) otherPanel.hidden = true;
          });

          const willOpen = panel.hidden;
          panel.hidden = !willOpen;
          trigger.setAttribute('aria-expanded', String(willOpen));
        });
      });

      document.addEventListener('click', () => {
        document.querySelectorAll('[data-popover-panel]').forEach((panel) => panel.hidden = true);
        document.querySelectorAll('[data-popover-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
      });
    </script>
  </body>
</html>
```

---

## 3) `src/styles/admin.css`

```css
/* =========================================================
   KUBO ADMIN — UI REFERENCE
   ---------------------------------------------------------
   IMPORTANTE:
   1) Reemplazar solo los filenames si difieren de los reales.
   2) No usar Google Fonts ni CDN.
   3) En integración final, reutilizar tokens existentes si ya
      están declarados en el proyecto para evitar duplicación.
   ========================================================= */

@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/Space_Grotesk/__SPACE_GROTESK_FILE__');
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrains_Mono/__JETBRAINS_MONO_FILE__');
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
}

:root {
  --kubo-carbon: #141414;
  --kubo-ivory: #fcf9f4;
  --kubo-red: #ed254e;
  --kubo-blue: #98d7e0;
  --kubo-cut-angle: 30deg;

  --admin-canvas: color-mix(in srgb, var(--kubo-ivory) 94%, var(--kubo-carbon) 6%);
  --admin-panel: color-mix(in srgb, var(--kubo-ivory) 97%, var(--kubo-carbon) 3%);
  --admin-panel-raised: color-mix(in srgb, var(--kubo-ivory) 99%, var(--kubo-carbon) 1%);
  --admin-line: color-mix(in srgb, var(--kubo-carbon) 10%, transparent);
  --admin-line-strong: color-mix(in srgb, var(--kubo-carbon) 18%, transparent);
  --admin-muted: color-mix(in srgb, var(--kubo-carbon) 57%, var(--kubo-ivory));
  --admin-faint: color-mix(in srgb, var(--kubo-carbon) 36%, var(--kubo-ivory));
  --admin-sidebar-muted: color-mix(in srgb, var(--kubo-ivory) 55%, transparent);

  --sidebar-width: 248px;
  --sidebar-collapsed-width: 78px;
  --topbar-height: 76px;
  --content-max: 1620px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-panel: 0 1px 1px rgb(20 20 20 / 0.025), 0 10px 32px rgb(20 20 20 / 0.035);
  --shadow-panel-hover: 0 2px 2px rgb(20 20 20 / 0.03), 0 18px 44px rgb(20 20 20 / 0.06);

  --ease-premium: cubic-bezier(.22, 1, .36, 1);
  --ease-ui: cubic-bezier(.2, .75, .2, 1);
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: var(--kubo-carbon);
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  color: var(--kubo-carbon);
  background: var(--admin-canvas);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
a {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button {
  color: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--kubo-red);
  outline-offset: 3px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mobile-only {
  display: none;
}

/* ========== SHELL ========== */

.admin-shell {
  min-height: 100vh;
}

.admin-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: var(--sidebar-width);
  overflow: hidden;
  color: var(--kubo-ivory);
  background:
    linear-gradient(to bottom, rgb(255 255 255 / 0.015), transparent 18%),
    var(--kubo-carbon);
  border-right: 1px solid rgb(255 255 255 / 0.07);
  transition:
    width 320ms var(--ease-premium),
    transform 320ms var(--ease-premium);
}

/* Una única retícula técnica muy silenciosa en el tercio inferior.
   No contiene cotas ni datos falsos; sirve únicamente para ordenar la superficie. */
.admin-sidebar::after {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 62% 0 0;
  pointer-events: none;
  opacity: .16;
  background-image:
    linear-gradient(rgb(152 215 224 / .16) 1px, transparent 1px),
    linear-gradient(90deg, rgb(152 215 224 / .16) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom, transparent, black 42%);
}

.sidebar-brand {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  padding: 0 22px;
  border-bottom: 1px solid rgb(255 255 255 / .07);
}

.brand-link {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.brand-logo {
  display: block;
  width: 126px;
  max-height: 42px;
  object-fit: contain;
  object-position: left center;
}

.sidebar-nav {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 18px 12px 28px;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / .14) transparent;
}

.nav-group + .nav-group {
  margin-top: 24px;
}

.nav-group-label {
  margin: 0 10px 8px;
  color: rgb(252 249 244 / .44);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .105em;
}

.nav-group-items {
  display: grid;
  gap: 3px;
}

.nav-item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 10px;
  overflow: hidden;
  color: rgb(252 249 244 / .72);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12.25px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  transition:
    color 170ms var(--ease-ui),
    background-color 170ms var(--ease-ui),
    border-color 170ms var(--ease-ui),
    transform 170ms var(--ease-ui);
}

.nav-item::before {
  content: '';
  position: absolute;
  inset: 8px auto 8px 0;
  width: 3px;
  background: var(--kubo-red);
  transform: translateX(-7px) scaleY(.35);
  transform-origin: center;
  opacity: 0;
  transition:
    transform 220ms var(--ease-premium),
    opacity 160ms ease;
}

.nav-item:hover {
  color: var(--kubo-ivory);
  background: rgb(255 255 255 / .045);
}

.nav-item:hover .nav-item-icon {
  transform: translateX(2px);
}

.nav-item.is-active {
  color: var(--kubo-ivory);
  background:
    linear-gradient(90deg, rgb(237 37 78 / .12), transparent 64%),
    rgb(255 255 255 / .055);
  border-color: rgb(255 255 255 / .075);
}

.nav-item.is-active::before {
  opacity: 1;
  transform: translateX(0) scaleY(1);
}

.nav-item.is-active::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 16px;
  height: 100%;
  background: rgb(237 37 78 / .10);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  opacity: .8;
}

.nav-item-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  transition: transform 180ms var(--ease-ui);
}

.nav-item-arrow {
  display: grid;
  place-items: center;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 180ms ease, transform 180ms var(--ease-ui);
}

.nav-item:hover .nav-item-arrow,
.nav-item.is-active .nav-item-arrow {
  opacity: .7;
  transform: translateX(0);
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgb(255 255 255 / .07);
}

.sidebar-user {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
  padding: 8px;
  text-align: left;
  color: var(--kubo-ivory);
  background: transparent;
  border: 1px solid rgb(255 255 255 / .08);
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 170ms ease, border-color 170ms ease;
}

.sidebar-user:hover {
  background: rgb(255 255 255 / .045);
  border-color: rgb(255 255 255 / .14);
}

.sidebar-avatar,
.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--kubo-ivory);
  background: color-mix(in srgb, var(--kubo-carbon) 88%, var(--kubo-ivory));
  border: 1px solid rgb(255 255 255 / .12);
  border-radius: 999px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
}

.sidebar-avatar {
  width: 36px;
  height: 36px;
  box-shadow: inset 0 -9px 16px rgb(0 0 0 / .16);
}

.sidebar-user-copy,
.topbar-user-copy {
  display: grid;
  min-width: 0;
}

.sidebar-user-copy strong,
.topbar-user-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
}

.sidebar-user-copy small,
.topbar-user-copy small {
  margin-top: 1px;
  color: rgb(252 249 244 / .48);
  font-size: 11px;
}

.sidebar-version {
  margin: 10px 8px 1px;
  color: rgb(252 249 244 / .32);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: .07em;
}

.admin-main {
  min-width: 0;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left 320ms var(--ease-premium);
}

.sidebar-collapsed .admin-sidebar {
  width: var(--sidebar-collapsed-width);
}

.sidebar-collapsed .admin-main {
  margin-left: var(--sidebar-collapsed-width);
}

.brand-logo-symbol {
  display: none;
  width: 30px;
  min-width: 30px;
}

.sidebar-collapsed .brand-logo-horizontal {
  display: none;
}

.sidebar-collapsed .brand-logo-symbol {
  display: block;
}

.sidebar-collapsed .nav-group-label,
.sidebar-collapsed .nav-item-label,
.sidebar-collapsed .nav-item-arrow,
.sidebar-collapsed .sidebar-user-copy,
.sidebar-collapsed .sidebar-user > svg,
.sidebar-collapsed .sidebar-version {
  opacity: 0;
  pointer-events: none;
}

.sidebar-collapsed .nav-group-label {
  height: 4px;
  margin: 0 0 7px;
}

.sidebar-collapsed .nav-item {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 0;
}

.sidebar-collapsed .sidebar-user {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 8px 0;
}

/* ========== TOPBAR ========== */

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: var(--topbar-height);
  padding: 0 28px;
  background: color-mix(in srgb, var(--kubo-ivory) 99%, var(--kubo-carbon) 1%);
  border-bottom: 1px solid var(--admin-line);
}

.topbar-left,
.topbar-actions {
  display: flex;
  align-items: center;
}

.topbar-actions {
  gap: 9px;
}

.icon-button,
.panel-action,
.row-action {
  display: inline-grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms var(--ease-ui);
}

.icon-button:hover {
  background: color-mix(in srgb, var(--kubo-carbon) 5%, transparent);
  border-color: var(--admin-line);
}

.icon-button:active {
  transform: scale(.97);
}

.global-search {
  display: flex;
  align-items: center;
  gap: 9px;
  width: min(300px, 25vw);
  height: 42px;
  padding: 0 10px 0 13px;
  background: var(--admin-panel-raised);
  border: 1px solid var(--admin-line);
  border-radius: 11px;
  transition: border-color 170ms ease, box-shadow 170ms ease, background-color 170ms ease;
}

.global-search:focus-within {
  background: var(--kubo-ivory);
  border-color: color-mix(in srgb, var(--kubo-carbon) 26%, transparent);
  box-shadow: 0 0 0 3px rgb(237 37 78 / .08);
}

.global-search input {
  width: 100%;
  min-width: 0;
  padding: 0;
  color: var(--kubo-carbon);
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 13px;
}

.global-search input::placeholder {
  color: var(--admin-faint);
}

.search-shortcut {
  flex: 0 0 auto;
  padding: 3px 6px;
  color: var(--admin-faint);
  background: color-mix(in srgb, var(--kubo-carbon) 4%, transparent);
  border: 1px solid var(--admin-line);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
}

.period-button,
.topbar-user {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 42px;
  padding: 0 12px;
  color: var(--kubo-carbon);
  background: var(--admin-panel-raised);
  border: 1px solid var(--admin-line);
  border-radius: 11px;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms var(--ease-ui);
}

.period-button {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
}

.period-button:hover,
.topbar-user:hover {
  background: var(--kubo-ivory);
  border-color: var(--admin-line-strong);
}

.period-button:active,
.topbar-user:active {
  transform: translateY(1px);
}

.notification-button {
  position: relative;
}

.notification-dot {
  position: absolute;
  top: 4px;
  right: 2px;
  display: grid;
  place-items: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  color: var(--kubo-ivory);
  background: var(--kubo-red);
  border: 2px solid var(--kubo-ivory);
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 700;
}

.avatar {
  width: 32px;
  height: 32px;
  box-shadow: 0 0 0 2px rgb(152 215 224 / .28);
}

.topbar-user {
  gap: 8px;
  padding-right: 10px;
}

.topbar-user-copy {
  width: 94px;
  text-align: left;
}

.topbar-user-copy small {
  color: var(--admin-muted);
}

.popover-wrap {
  position: relative;
}

.mini-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 80;
  width: 210px;
  padding: 7px;
  background: color-mix(in srgb, var(--kubo-ivory) 98%, var(--kubo-carbon) 2%);
  border: 1px solid var(--admin-line-strong);
  border-radius: 12px;
  box-shadow: 0 18px 60px rgb(20 20 20 / .14);
  transform-origin: top right;
  animation: popover-in 180ms var(--ease-premium) both;
}

.mini-popover[hidden] {
  display: none;
}

.mini-popover button {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  text-align: left;
  color: var(--kubo-carbon);
  background: transparent;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
}

.mini-popover button:hover {
  background: color-mix(in srgb, var(--kubo-carbon) 5%, transparent);
}

.popover-divider {
  display: block;
  height: 1px;
  margin: 5px 4px;
  background: var(--admin-line);
}

@keyframes popover-in {
  from { opacity: 0; transform: translateY(-5px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ========== CONTENT ========== */

.admin-content {
  width: min(100%, var(--content-max));
  margin: 0 auto;
  padding: 30px 28px 24px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 22px;
  margin-bottom: 7px;
}

.page-index,
.demo-chip,
.panel-kicker,
.kpi-card-top,
.summary-stat span,
.channel-row small,
.product-meta-line,
.sidebar-version,
.admin-footer,
.production-index,
.production-tech,
.custom-due,
.activity-row time {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.page-index {
  color: var(--admin-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
}

.demo-chip {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 7px;
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-blue) 48%, transparent);
  border: 1px solid color-mix(in srgb, var(--kubo-blue) 68%, var(--kubo-carbon) 8%);
  border-radius: 5px;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: .07em;
}

.page-heading h1 {
  margin: 0;
  font-size: clamp(32px, 3.1vw, 46px);
  line-height: 1;
  letter-spacing: -.035em;
  font-weight: 650;
}

.page-heading p {
  margin: 9px 0 0;
  max-width: 560px;
  color: var(--admin-muted);
  font-size: 14px;
  line-height: 1.5;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-button,
.secondary-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 15px;
  overflow: hidden;
  border-radius: 9px;
  cursor: pointer;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10.5px;
  font-weight: 600;
  transition:
    transform 170ms var(--ease-ui),
    box-shadow 170ms ease,
    border-color 170ms ease,
    background-color 170ms ease;
}

.primary-button {
  color: var(--kubo-ivory);
  background: var(--kubo-carbon);
  border: 1px solid var(--kubo-carbon);
  box-shadow: 0 8px 18px rgb(20 20 20 / .10);
}

.primary-button::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 100%;
  background: var(--kubo-red);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  opacity: .9;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgb(20 20 20 / .16);
}

.secondary-button {
  color: var(--kubo-carbon);
  background: var(--admin-panel-raised);
  border: 1px solid var(--admin-line);
}

.secondary-button:hover {
  background: var(--kubo-ivory);
  border-color: var(--admin-line-strong);
  transform: translateY(-1px);
}

/* ========== KPI ========== */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.kpi-card,
.panel {
  background: var(--admin-panel);
  border: 1px solid var(--admin-line);
  box-shadow: var(--shadow-panel);
}

.kpi-card {
  position: relative;
  min-height: 148px;
  padding: 17px;
  overflow: hidden;
  border-radius: var(--radius-md);
  transition:
    border-color 190ms ease,
    box-shadow 220ms ease,
    transform 220ms var(--ease-premium);
}

.kpi-card::after {
  content: '';
  position: absolute;
  inset: auto -22px -36px auto;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--kpi-glow) 0, transparent 66%);
  opacity: .13;
  pointer-events: none;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: var(--admin-line-strong);
  box-shadow: var(--shadow-panel-hover);
}

.kpi-card.tone-red { --kpi-accent: var(--kubo-red); --kpi-glow: var(--kubo-red); }
.kpi-card.tone-blue { --kpi-accent: color-mix(in srgb, var(--kubo-blue) 82%, var(--kubo-carbon)); --kpi-glow: var(--kubo-blue); }
.kpi-card.tone-neutral { --kpi-accent: var(--kubo-carbon); --kpi-glow: var(--kubo-carbon); }

.kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--admin-muted);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: .055em;
}

.kpi-card-top p {
  margin: 0;
}

.micro-info {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--admin-faint);
  background: transparent;
  border: 0;
  border-radius: 99px;
  cursor: pointer;
}

.micro-info:hover {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-carbon) 5%, transparent);
}

.kpi-card-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: 22px;
}

.kpi-value {
  display: block;
  font-size: clamp(24px, 2vw, 31px);
  line-height: 1;
  letter-spacing: -.04em;
  font-weight: 650;
}

.kpi-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  color: var(--admin-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  line-height: 1.35;
}

.kpi-delta {
  color: var(--kpi-accent);
  font-weight: 700;
}

.sparkline {
  flex: 0 0 100px;
  width: 100px;
  height: 42px;
  overflow: visible;
}

.sparkline-grid {
  fill: none;
  stroke: var(--admin-line);
  stroke-width: 1;
}

.sparkline-line {
  fill: none;
  stroke: var(--kpi-accent);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.has-js .sparkline-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}

.ui-ready .sparkline-line {
  animation: draw-line 760ms var(--ease-premium) forwards;
}

/* ========== GRID ========== */

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.panel {
  min-width: 0;
  border-radius: var(--radius-md);
  overflow: clip;
}

.panel-sales { grid-column: span 8; }
.panel-revenue { grid-column: span 4; }
.panel-orders { grid-column: span 7; }
.panel-production { grid-column: span 5; }
.panel-products { grid-column: span 4; }
.panel-custom { grid-column: span 5; }
.panel-activity { grid-column: span 3; }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 66px;
  padding: 14px 17px;
  border-bottom: 1px solid var(--admin-line);
}

.panel-header > div:first-child {
  min-width: 0;
}

.panel-kicker {
  margin: 0 0 4px;
  color: var(--admin-faint);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: .08em;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.1;
  letter-spacing: -.015em;
  font-weight: 650;
}

.compact-filter,
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  color: var(--admin-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 550;
}

.compact-filter {
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--admin-line);
  border-radius: 7px;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.compact-filter:hover {
  color: var(--kubo-carbon);
  background: var(--kubo-ivory);
  border-color: var(--admin-line-strong);
}

.text-link {
  transition: color 160ms ease, transform 160ms var(--ease-ui);
}

.text-link:hover {
  color: var(--kubo-carbon);
  transform: translateX(2px);
}

.panel-action {
  width: 32px;
  height: 32px;
  border-color: var(--admin-line);
  border-radius: 8px;
  transition: background-color 160ms ease, transform 160ms var(--ease-ui);
}

.panel-action:hover {
  background: var(--kubo-ivory);
  transform: translate(1px, -1px);
}

/* ========== SALES CHART ========== */

.sales-chart-wrap {
  position: relative;
  padding: 18px 18px 5px 52px;
}

.chart-axis-labels {
  position: absolute;
  top: 18px;
  bottom: 29px;
  left: 17px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--admin-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
}

.sales-chart {
  display: block;
  width: 100%;
  height: 230px;
  overflow: visible;
}

.chart-grid-line {
  stroke: color-mix(in srgb, var(--kubo-carbon) 8%, transparent);
  stroke-width: 1;
  stroke-dasharray: 3 5;
}

.sales-area {
  fill: url(#salesFill);
  opacity: .9;
}

.sales-line {
  fill: none;
  stroke: var(--kubo-red);
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 4px 8px rgb(237 37 78 / .08));
}

.has-js .sales-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}

.ui-ready .sales-line {
  animation: draw-line 1100ms 380ms var(--ease-premium) forwards;
}

.has-js .sales-area {
  opacity: 0;
}

.ui-ready .sales-area {
  animation: area-in 700ms 680ms ease forwards;
}

.sales-point {
  cursor: crosshair;
  outline: 0;
}

.sales-point-halo {
  fill: var(--kubo-red);
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity 150ms ease, transform 180ms var(--ease-premium);
}

.sales-point-dot {
  fill: var(--admin-panel-raised);
  stroke: var(--kubo-red);
  stroke-width: 2.4;
  transition: transform 180ms var(--ease-premium);
  transform-box: fill-box;
  transform-origin: center;
}

.sales-point:hover .sales-point-halo,
.sales-point:focus .sales-point-halo {
  opacity: .10;
  transform: scale(1.18);
}

.sales-point:hover .sales-point-dot,
.sales-point:focus .sales-point-dot {
  transform: scale(1.22);
}

.chart-x-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 2px 7px 0;
  color: var(--admin-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  text-align: center;
}

.sales-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 12px;
  border-top: 1px solid var(--admin-line);
}

.summary-stat {
  padding: 13px 17px 15px;
}

.summary-stat + .summary-stat {
  border-left: 1px solid var(--admin-line);
}

.summary-stat span {
  display: block;
  color: var(--admin-faint);
  font-size: 8px;
  letter-spacing: .05em;
}

.summary-stat strong {
  display: block;
  margin-top: 5px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -.018em;
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}

@keyframes area-in {
  to { opacity: .9; }
}

/* ========== DONUT ========== */

.donut-zone {
  display: grid;
  align-content: start;
  gap: 22px;
  padding: 21px 18px 18px;
}

.revenue-donut {
  position: relative;
  display: grid;
  place-items: center;
  width: min(190px, 72%);
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  background: conic-gradient(
    var(--kubo-carbon) 0 65%,
    var(--kubo-blue) 65% 85%,
    var(--kubo-red) 85% 95%,
    color-mix(in srgb, var(--kubo-carbon) 20%, var(--kubo-ivory)) 95% 100%
  );
  transform: rotate(-90deg);
  box-shadow: inset 0 0 0 1px rgb(20 20 20 / .025);
}

.revenue-donut::after {
  content: '';
  position: absolute;
  inset: 26%;
  background: var(--admin-panel);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--admin-line);
}

.has-js .revenue-donut {
  clip-path: circle(0 at 50% 50%);
}

.ui-ready .revenue-donut {
  animation: donut-reveal 720ms 480ms var(--ease-premium) forwards;
}

.donut-center {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 3px;
  text-align: center;
  transform: rotate(90deg);
}

.donut-center span {
  color: var(--admin-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: .07em;
}

.donut-center strong {
  font-size: 16px;
  font-weight: 650;
}

@keyframes donut-reveal {
  to { clip-path: circle(72% at 50% 50%); }
}

.channel-list {
  display: grid;
}

.channel-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  border-top: 1px solid var(--admin-line);
}

.channel-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.channel-dot.tone-carbon { background: var(--kubo-carbon); }
.channel-dot.tone-blue { background: var(--kubo-blue); }
.channel-dot.tone-red { background: var(--kubo-red); }
.channel-dot.tone-muted { background: color-mix(in srgb, var(--kubo-carbon) 22%, var(--kubo-ivory)); }

.channel-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
  gap: 8px;
}

.channel-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 550;
}

.channel-copy small {
  color: var(--admin-faint);
  font-size: 8.5px;
}

.channel-amount {
  color: var(--admin-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 550;
}

/* ========== TABLE ========== */

.table-shell {
  width: 100%;
  overflow-x: auto;
}

.table-shell table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.table-shell th,
.table-shell td {
  padding: 11px 15px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--admin-line);
}

.table-shell th {
  color: var(--admin-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: .055em;
}

.table-shell td {
  font-size: 11.5px;
}

.table-shell tbody tr {
  transition: background-color 150ms ease;
}

.table-shell tbody tr:hover {
  background: color-mix(in srgb, var(--kubo-carbon) 2.6%, transparent);
}

.table-shell tbody tr:last-child td {
  border-bottom: 0;
}

.mono-strong {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 650;
}

.row-action {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: var(--admin-faint);
  transition: color 150ms ease, background-color 150ms ease, transform 150ms var(--ease-ui);
}

.row-action:hover {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-carbon) 5%, transparent);
  transform: translateX(2px);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 7px;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 600;
}

.status-badge::before {
  content: '';
  width: 5px;
  height: 5px;
  margin-right: 6px;
  border-radius: 99px;
  background: currentColor;
}

.status-success {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-blue) 24%, var(--kubo-ivory));
  border-color: color-mix(in srgb, var(--kubo-blue) 48%, var(--kubo-ivory));
}

.status-info {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-blue) 14%, var(--kubo-ivory));
  border-color: color-mix(in srgb, var(--kubo-blue) 36%, var(--kubo-ivory));
}

.status-warning {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-red) 5%, var(--kubo-ivory));
  border-color: color-mix(in srgb, var(--kubo-red) 18%, var(--kubo-ivory));
}

.status-warning::before {
  background: var(--kubo-red);
}

.status-danger {
  color: var(--kubo-red);
  background: color-mix(in srgb, var(--kubo-red) 7%, var(--kubo-ivory));
  border-color: color-mix(in srgb, var(--kubo-red) 22%, var(--kubo-ivory));
}

.status-review {
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-red) 5%, var(--kubo-ivory));
  border-color: color-mix(in srgb, var(--kubo-red) 16%, var(--kubo-ivory));
}

.status-review::before {
  background: var(--kubo-red);
}

.status-neutral,
.status-muted {
  color: var(--admin-muted);
  background: color-mix(in srgb, var(--kubo-carbon) 4%, var(--kubo-ivory));
  border-color: var(--admin-line);
}

/* ========== PRODUCTION ========== */

.production-list,
.product-list,
.custom-list,
.activity-list {
  display: grid;
}

.production-row {
  display: grid;
  grid-template-columns: 30px minmax(150px, 1.4fr) minmax(180px, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  padding: 9px 15px;
  border-bottom: 1px solid var(--admin-line);
  transition: background-color 150ms ease;
}

.production-row:last-child {
  border-bottom: 0;
}

.production-row:hover {
  background: color-mix(in srgb, var(--kubo-carbon) 2.5%, transparent);
}

.production-index {
  color: var(--admin-faint);
  font-size: 8px;
}

.production-main {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.production-main strong,
.custom-main strong,
.activity-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 600;
}

.production-main span,
.custom-main span,
.activity-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--admin-muted);
  font-size: 10px;
}

.production-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: var(--admin-faint);
  font-size: 8px;
}

/* ========== PRODUCTS ========== */

.product-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 11px;
  padding: 11px 15px;
  border-bottom: 1px solid var(--admin-line);
}

.product-row:last-child {
  border-bottom: 0;
}

.product-thumb {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  background: color-mix(in srgb, var(--kubo-carbon) 4%, var(--kubo-ivory));
  border: 1px solid var(--admin-line);
  border-radius: 7px;
}

.product-thumb span {
  display: block;
  width: 18px;
  height: 18px;
  background: var(--kubo-carbon);
  clip-path: polygon(0 22%, 63% 0, 100% 24%, 100% 79%, 38% 100%, 0 76%);
  box-shadow: inset -5px -4px 0 rgb(255 255 255 / .16);
}

.product-copy {
  display: grid;
  align-content: center;
  gap: 4px;
  min-width: 0;
}

.product-title-line,
.product-meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.product-title-line strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
}

.product-title-line span {
  flex: 0 0 auto;
  color: var(--admin-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
}

.product-meta-line {
  color: var(--admin-faint);
  font-size: 7.5px;
}

.product-meta-line strong {
  color: var(--admin-muted);
  font-weight: 600;
}

.progress-track {
  height: 3px;
  margin-top: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--kubo-carbon) 8%, transparent);
  border-radius: 99px;
}

.progress-track span {
  display: block;
  width: var(--progress);
  height: 100%;
  background: var(--kubo-red);
  border-radius: inherit;
  transform-origin: left;
}

.has-js .progress-track span {
  transform: scaleX(0);
}

.ui-ready .progress-track span {
  animation: progress-in 720ms 520ms var(--ease-premium) forwards;
}

@keyframes progress-in {
  to { transform: scaleX(1); }
}

/* ========== CUSTOM ========== */

.custom-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto 48px;
  align-items: center;
  gap: 10px;
  min-height: 57px;
  padding: 8px 15px;
  border-bottom: 1px solid var(--admin-line);
  transition: background-color 150ms ease;
}

.custom-row:last-child {
  border-bottom: 0;
}

.custom-row:hover {
  background: color-mix(in srgb, var(--kubo-blue) 7%, transparent);
}

.custom-symbol {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--kubo-carbon);
  background: color-mix(in srgb, var(--kubo-blue) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--kubo-blue) 40%, transparent);
  border-radius: 7px;
}

.custom-main,
.activity-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.custom-due {
  justify-self: end;
  color: var(--admin-faint);
  font-size: 8px;
}

/* ========== ACTIVITY ========== */

.activity-list {
  padding: 2px 0;
}

.activity-row {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 64px;
  padding: 8px 14px;
}

.activity-row:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 30px;
  bottom: -8px;
  width: 1px;
  height: 18px;
  background: var(--admin-line-strong);
}

.activity-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.activity-icon.tone-red { color: var(--kubo-ivory); background: var(--kubo-red); }
.activity-icon.tone-carbon { color: var(--kubo-ivory); background: var(--kubo-carbon); }
.activity-icon.tone-blue { color: var(--kubo-carbon); background: var(--kubo-blue); }

.activity-row time {
  align-self: start;
  margin-top: 8px;
  color: var(--admin-faint);
  font-size: 7.5px;
  white-space: nowrap;
}

/* ========== FOOTER ========== */

.admin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 2px 4px;
  color: var(--admin-faint);
  font-size: 8px;
  letter-spacing: .04em;
}

/* ========== REVEAL / MOTION ========== */

.has-js .reveal {
  opacity: 0;
  transform: translateY(9px);
}

.ui-ready .reveal {
  animation: reveal-in 520ms var(--delay, 0ms) var(--ease-premium) forwards;
}

@keyframes reveal-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== RESPONSIVE ========== */

@media (max-width: 1439px) {
  :root {
    --sidebar-width: 228px;
  }

  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .panel-sales { grid-column: span 8; }
  .panel-revenue { grid-column: span 4; }
  .panel-orders { grid-column: span 7; }
  .panel-production { grid-column: span 5; }
  .panel-products { grid-column: span 6; }
  .panel-custom { grid-column: span 6; }
  .panel-activity { grid-column: span 12; }

  .activity-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 6px 8px;
  }

  .activity-row:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 1199px) {
  .global-search {
    width: 230px;
  }

  .topbar-user-copy {
    display: none;
  }

  .panel-sales,
  .panel-revenue,
  .panel-orders,
  .panel-production,
  .panel-products,
  .panel-custom {
    grid-column: span 6;
  }

  .panel-sales,
  .panel-orders {
    grid-column: span 12;
  }
}

@media (max-width: 1023px) {
  .desktop-sidebar-toggle {
    display: none;
  }

  .mobile-only {
    display: initial;
  }

  .mobile-menu,
  .sidebar-close {
    display: inline-grid;
  }

  .mobile-brand {
    display: inline-flex;
    align-items: center;
    margin-left: 5px;
  }

  .mobile-brand-logo {
    display: block;
    width: 28px;
    height: 32px;
    object-fit: contain;
  }

  .admin-sidebar {
    width: min(300px, 88vw);
    transform: translateX(-102%);
    box-shadow: 24px 0 60px rgb(0 0 0 / .20);
  }

  .admin-main,
  .sidebar-collapsed .admin-main {
    margin-left: 0;
  }

  .mobile-sidebar-open .admin-sidebar {
    transform: translateX(0);
  }

  .sidebar-scrim {
    position: fixed;
    inset: 0;
    z-index: 35;
    visibility: hidden;
    background: rgb(20 20 20 / .34);
    opacity: 0;
    transition: opacity 240ms ease, visibility 240ms ease;
  }

  .mobile-sidebar-open .sidebar-scrim {
    visibility: visible;
    opacity: 1;
  }

  .sidebar-close {
    color: var(--kubo-ivory);
  }

  .global-search {
    width: min(300px, 35vw);
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-card:last-child {
    grid-column: span 2;
  }

  .panel-sales,
  .panel-revenue,
  .panel-orders,
  .panel-production,
  .panel-products,
  .panel-custom,
  .panel-activity {
    grid-column: span 12;
  }

  .panel-products,
  .panel-custom {
    grid-column: span 6;
  }
}

@media (max-width: 767px) {
  :root {
    --topbar-height: 64px;
  }

  .admin-topbar {
    height: var(--topbar-height);
    padding: 0 14px;
  }

  .global-search,
  .period-button,
  .topbar-user {
    display: none;
  }

  .topbar-actions {
    gap: 2px;
  }

  .admin-content {
    padding: 22px 14px 20px;
  }

  .page-heading {
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .page-heading h1 {
    font-size: 36px;
  }

  .page-heading p {
    font-size: 13px;
  }

  .heading-actions {
    display: none;
  }

  .kpi-grid {
    display: flex;
    gap: 10px;
    margin: 0 -14px 10px;
    padding: 0 14px 6px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .kpi-grid::-webkit-scrollbar {
    display: none;
  }

  .kpi-card,
  .kpi-card:last-child {
    flex: 0 0 min(82vw, 300px);
    grid-column: auto;
    min-height: 142px;
    scroll-snap-align: start;
  }

  .dashboard-grid {
    gap: 10px;
  }

  .panel,
  .panel-products,
  .panel-custom {
    grid-column: span 12;
  }

  .panel-header {
    min-height: 62px;
    padding: 13px 14px;
  }

  .panel-header h2 {
    font-size: 15px;
  }

  .sales-chart-wrap {
    padding: 15px 10px 4px 37px;
    overflow: hidden;
  }

  .sales-chart {
    height: 190px;
  }

  .chart-axis-labels {
    left: 10px;
    top: 17px;
    bottom: 27px;
  }

  .chart-x-labels {
    font-size: 7px;
  }

  .sales-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-stat:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--admin-line);
  }

  .summary-stat:nth-child(4) {
    border-top: 1px solid var(--admin-line);
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: grid;
  }

  .mobile-data-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 64px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--admin-line);
  }

  .mobile-data-card > div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .mobile-data-card span:not(.status-badge) {
    overflow: hidden;
    color: var(--admin-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
  }

  .mobile-card-right {
    justify-items: end;
    flex: 0 0 auto;
  }

  .mobile-card-right > strong {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
  }

  .production-row {
    grid-template-columns: 26px minmax(0, 1fr) auto;
    gap: 8px;
  }

  .production-tech {
    grid-column: 2 / -1;
    margin-top: -4px;
  }

  .custom-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .custom-due {
    display: none;
  }

  .activity-list {
    grid-template-columns: 1fr;
    padding: 2px 0;
  }

  .activity-row:not(:last-child)::after {
    display: block;
  }

  .admin-footer {
    display: grid;
    justify-content: start;
    gap: 5px;
    padding-top: 20px;
  }
}

@media (max-width: 420px) {
  .panel-header .text-link {
    max-width: 92px;
    overflow: hidden;
    white-space: nowrap;
  }

  .product-row {
    padding-inline: 12px;
  }
}

/* ========== REDUCED MOTION ========== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }

  .has-js .reveal,
  .has-js .sparkline-line,
  .has-js .sales-line,
  .has-js .sales-area,
  .has-js .revenue-donut,
  .has-js .progress-track span {
    opacity: 1;
    transform: none;
    stroke-dashoffset: 0;
    clip-path: none;
  }
}
```

---

# Notas de diseño para la integración

## 1. Qué conservar tal cual

- Sidebar carbón y contenido claro.
- Densidad informativa del dashboard, pero con más aire que la referencia original.
- Jerarquía por módulos: Ventas domina; después pedidos/producción; después producto/Custom/actividad.
- Rojo como acento y serie principal, no como baño visual del dashboard.
- Celeste asociado a información, Custom y construcción.
- JetBrains Mono para estructura; Space Grotesk para comunicación.
- Movimiento corto y controlado.
- Responsive diseñado de verdad, no un desktop encogido.
- Estados de focus y `prefers-reduced-motion`.

## 2. Qué debe corregir Claude al integrarlo

1. Resolver los **nombres exactos del SVG horizontal inverso y del SVG de símbolo** dentro de `/assets/logos/web/`.
2. Sustituir el fallback `K` del sidebar colapsado por el **símbolo SVG oficial**.
3. Resolver los **nombres reales de los archivos Space Grotesk / JetBrains Mono** dentro de `/fonts/`.
4. Mapear los nombres usados en los ejemplos a los nombres reales soportados por `KuboIcon.astro`, siempre desde **Iconoir**.
5. Si el repo ya dispone de tokens de superficie, border, radius o motion, adaptar estas reglas en vez de duplicarlas.
6. Los estados usan únicamente combinaciones/transparencias derivadas de los cuatro colores oficiales; no añadir otra paleta para estados.
7. Mantener todos los datos como **mock/demo** hasta que trabajemos cada módulo funcional.

## 3. Navegación aprobada para esta etapa

```text
INICIO
└── Dashboard

COMERCIO
├── Pedidos
├── Productos
├── Colecciones
├── Clientes
├── Descuentos
└── Envíos

CUSTOM
├── Solicitudes
├── Cotizaciones
└── Proyectos

PRODUCCIÓN
├── Cola de producción
├── Materiales
└── Equipos

HERRAMIENTAS
└── Calculadora de precios

FINANZAS
├── Gastos
├── Resumen financiero
└── Costos recurrentes

CONTENIDO
├── Medios
├── Lab
├── Páginas
└── FAQs

CONFIGURACIÓN
├── General
├── Parámetros de costos
├── Usuarios
├── Roles
└── Integraciones
```

## 4. Próximo diseño, después de integrar este shell

No desarrollar todavía en esta referencia:

- lógica real de Dashboard;
- autenticación;
- CRUD;
- base de datos;
- calculadora de precios;
- gastos;
- finanzas;
- producción real.

La siguiente pestaña puede diseñarse sobre este mismo sistema de layout sin reinventar sidebar, topbar, cards, tablas, badges ni motion.
