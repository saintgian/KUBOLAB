/**
 * Datos demo para el Dashboard de KUBO Admin.
 * Todo lo que se muestra en /admin/ proviene de este archivo — no hay datos inline en markup.
 * Es mock/demo hasta que se implemente cada módulo funcional (fuera de alcance de esta pantalla).
 */

export const kpis = [
  {
    eyebrow: 'VENTAS DEL PERIODO',
    value: 'S/ 24,680',
    delta: '+14.6%',
    context: 'vs. periodo anterior',
    tone: 'red',
    points: [22, 39, 28, 53, 74, 47, 66],
    radial: false,
  },
  {
    eyebrow: 'PEDIDOS PENDIENTES',
    value: '12',
    delta: '+2',
    context: 'requieren atención',
    tone: 'neutral',
    points: [28, 34, 30, 44, 38, 51, 42],
    radial: false,
  },
  {
    eyebrow: 'CUSTOM ACTIVOS',
    value: '6',
    delta: '+1',
    context: 'proyecto esta semana',
    tone: 'blue',
    points: [24, 36, 33, 51, 42, 45, 58],
    radial: false,
  },
  {
    eyebrow: 'COTIZACIONES PENDIENTES',
    value: '4',
    delta: '2 nuevas',
    context: 'pendientes de revisión',
    tone: 'red',
    points: [34, 27, 43, 36, 50, 44, 48],
    radial: false,
  },
  {
    eyebrow: 'CARGA DE PRODUCCIÓN',
    value: '72%',
    delta: '18 h',
    context: 'estimadas en cola',
    tone: 'blue',
    points: [31, 36, 46, 42, 55, 63, 72],
    radial: true,
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

/**
 * Datasets demo por período para el módulo de analítica interactivo (DashboardAnalytics.svelte).
 * Centralizados aquí (no inline en el componente) para que quede un único lugar de verdad,
 * igual que el resto del mock del Dashboard. '7d' coincide con `sales`/`revenueChannels` de
 * arriba (el período por defecto al cargar la página sin JS).
 */
export type PeriodKey = '7d' | '30d' | '90d';

export const salesByPeriod: Record<
  PeriodKey,
  {
    labels: string[];
    values: number[];
    maxValue: number;
    summary: { label: string; value: string }[];
  }
> = {
  '7d': {
    labels: ['Lun 11', 'Mar 12', 'Mié 13', 'Jue 14', 'Vie 15', 'Sáb 16', 'Dom 17'],
    values: [3200, 4100, 5200, 6900, 8600, 7200, 6680],
    maxValue: 10000,
    summary: [
      { label: 'VENTAS', value: 'S/ 24,680' },
      { label: 'COSTO ESTIMADO', value: 'S/ 9,420' },
      { label: 'GANANCIA BRUTA', value: 'S/ 15,260' },
      { label: 'MARGEN', value: '61.8%' },
    ],
  },
  '30d': {
    labels: [
      '19 jul', '22 jul', '25 jul', '28 jul', '31 jul',
      '03 ago', '06 ago', '09 ago', '12 ago', '17 ago',
    ],
    values: [2600, 3400, 4100, 3800, 5200, 6100, 5600, 7300, 8100, 6680],
    maxValue: 10000,
    summary: [
      { label: 'VENTAS', value: 'S/ 98,420' },
      { label: 'COSTO ESTIMADO', value: 'S/ 37,600' },
      { label: 'GANANCIA BRUTA', value: 'S/ 60,820' },
      { label: 'MARGEN', value: '61.8%' },
    ],
  },
  '90d': {
    labels: [
      'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6',
      'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10', 'Sem 11', 'Sem 12',
    ],
    values: [4200, 5100, 4600, 6200, 7100, 6400, 7600, 8300, 7200, 8900, 9400, 8100],
    maxValue: 10000,
    summary: [
      { label: 'VENTAS', value: 'S/ 276,900' },
      { label: 'COSTO ESTIMADO', value: 'S/ 105,700' },
      { label: 'GANANCIA BRUTA', value: 'S/ 171,200' },
      { label: 'MARGEN', value: '61.8%' },
    ],
  },
};

export const revenueChannelsByPeriod: Record<
  PeriodKey,
  { label: string; value: number; amount: string; tone: 'carbon' | 'blue' | 'red' | 'muted' }[]
> = {
  '7d': [
    { label: 'Tienda online', value: 65, amount: 'S/ 16,042', tone: 'carbon' },
    { label: 'Custom', value: 20, amount: 'S/ 4,936', tone: 'blue' },
    { label: 'Lab', value: 10, amount: 'S/ 2,468', tone: 'red' },
    { label: 'Otros', value: 5, amount: 'S/ 1,234', tone: 'muted' },
  ],
  '30d': [
    { label: 'Tienda online', value: 61, amount: 'S/ 60,036', tone: 'carbon' },
    { label: 'Custom', value: 23, amount: 'S/ 22,637', tone: 'blue' },
    { label: 'Lab', value: 11, amount: 'S/ 10,826', tone: 'red' },
    { label: 'Otros', value: 5, amount: 'S/ 4,921', tone: 'muted' },
  ],
  '90d': [
    { label: 'Tienda online', value: 58, amount: 'S/ 160,602', tone: 'carbon' },
    { label: 'Custom', value: 25, amount: 'S/ 69,225', tone: 'blue' },
    { label: 'Lab', value: 12, amount: 'S/ 33,228', tone: 'red' },
    { label: 'Otros', value: 5, amount: 'S/ 13,845', tone: 'muted' },
  ],
};

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
