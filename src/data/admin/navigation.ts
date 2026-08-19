import type { IconName } from '../../components/ui/KuboIcon.astro';
import { withBase } from '../../lib/url';

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /** Slug de la categoría, usado por AdminPlaceholder para mostrar contexto. */
  category: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: 'INICIO',
    items: [{ label: 'Dashboard', href: withBase('/admin/'), icon: 'dashboard-dots', category: 'Inicio' }],
  },
  {
    label: 'COMERCIO',
    items: [
      { label: 'Pedidos', href: withBase('/admin/comercio/pedidos/'), icon: 'package', category: 'Comercio' },
      { label: 'Productos', href: withBase('/admin/comercio/productos/'), icon: 'cube', category: 'Comercio' },
      { label: 'Colecciones', href: withBase('/admin/comercio/colecciones/'), icon: 'view-grid', category: 'Comercio' },
      { label: 'Clientes', href: withBase('/admin/comercio/clientes/'), icon: 'group', category: 'Comercio' },
      { label: 'Descuentos', href: withBase('/admin/comercio/descuentos/'), icon: 'label', category: 'Comercio' },
      { label: 'Envíos', href: withBase('/admin/comercio/envios/'), icon: 'delivery-truck', category: 'Comercio' },
    ],
  },
  {
    label: 'CUSTOM',
    items: [
      { label: 'Solicitudes', href: withBase('/admin/custom/solicitudes/'), icon: 'chat-lines', category: 'Custom' },
      { label: 'Cotizaciones', href: withBase('/admin/custom/cotizaciones/'), icon: 'page', category: 'Custom' },
      { label: 'Proyectos', href: withBase('/admin/custom/proyectos/'), icon: 'cube-replace-face', category: 'Custom' },
    ],
  },
  {
    label: 'PRODUCCIÓN',
    items: [
      { label: 'Cola de producción', href: withBase('/admin/produccion/cola/'), icon: 'printing-page', category: 'Producción' },
      { label: 'Impresiones', href: withBase('/admin/produccion/impresiones/'), icon: 'timer', category: 'Producción' },
      { label: 'Materiales', href: withBase('/admin/produccion/materiales/'), icon: 'flask', category: 'Producción' },
      { label: 'Equipos', href: withBase('/admin/produccion/equipos/'), icon: 'server', category: 'Producción' },
    ],
  },
  {
    label: 'HERRAMIENTAS',
    items: [
      {
        label: 'Calculadora de precios',
        href: withBase('/admin/herramientas/calculadora/'),
        icon: 'calculator',
        category: 'Herramientas',
      },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { label: 'Gastos', href: withBase('/admin/finanzas/gastos/'), icon: 'wallet', category: 'Finanzas' },
      { label: 'Resumen financiero', href: withBase('/admin/finanzas/resumen/'), icon: 'graph-up', category: 'Finanzas' },
      { label: 'Costos recurrentes', href: withBase('/admin/finanzas/recurrentes/'), icon: 'refresh-double', category: 'Finanzas' },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { label: 'Medios', href: withBase('/admin/contenido/medios/'), icon: 'media-image', category: 'Contenido' },
      { label: 'Lab', href: withBase('/admin/contenido/lab/'), icon: 'test-tube', category: 'Contenido' },
      { label: 'Páginas', href: withBase('/admin/contenido/paginas/'), icon: 'page-edit', category: 'Contenido' },
      { label: 'FAQs', href: withBase('/admin/contenido/faqs/'), icon: 'help-circle', category: 'Contenido' },
    ],
  },
  {
    label: 'CONFIGURACIÓN',
    items: [
      { label: 'General', href: withBase('/admin/configuracion/general/'), icon: 'settings', category: 'Configuración' },
      {
        label: 'Parámetros de costos',
        href: withBase('/admin/configuracion/costos/'),
        icon: 'control-slider',
        category: 'Configuración',
      },
      { label: 'Usuarios', href: withBase('/admin/configuracion/usuarios/'), icon: 'user', category: 'Configuración' },
      { label: 'Roles', href: withBase('/admin/configuracion/roles/'), icon: 'key', category: 'Configuración' },
      { label: 'Integraciones', href: withBase('/admin/configuracion/integraciones/'), icon: 'network', category: 'Configuración' },
    ],
  },
];

/** Aplana el árbol de navegación — usado por [...slug].astro para generar rutas estáticas. */
export const flatNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function isActiveHref(currentPath: string, href: string): boolean {
  const dashboardHref = withBase('/admin/');
  if (href === dashboardHref) return currentPath === dashboardHref || currentPath === dashboardHref.replace(/\/$/, '');
  return currentPath.startsWith(href);
}
