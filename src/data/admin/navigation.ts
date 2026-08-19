import type { IconName } from '../../components/ui/KuboIcon.astro';

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
    items: [{ label: 'Dashboard', href: '/admin/', icon: 'dashboard-dots', category: 'Inicio' }],
  },
  {
    label: 'COMERCIO',
    items: [
      { label: 'Pedidos', href: '/admin/comercio/pedidos/', icon: 'package', category: 'Comercio' },
      { label: 'Productos', href: '/admin/comercio/productos/', icon: 'cube', category: 'Comercio' },
      { label: 'Colecciones', href: '/admin/comercio/colecciones/', icon: 'view-grid', category: 'Comercio' },
      { label: 'Clientes', href: '/admin/comercio/clientes/', icon: 'group', category: 'Comercio' },
      { label: 'Descuentos', href: '/admin/comercio/descuentos/', icon: 'label', category: 'Comercio' },
      { label: 'Envíos', href: '/admin/comercio/envios/', icon: 'delivery-truck', category: 'Comercio' },
    ],
  },
  {
    label: 'CUSTOM',
    items: [
      { label: 'Solicitudes', href: '/admin/custom/solicitudes/', icon: 'chat-lines', category: 'Custom' },
      { label: 'Cotizaciones', href: '/admin/custom/cotizaciones/', icon: 'page', category: 'Custom' },
      { label: 'Proyectos', href: '/admin/custom/proyectos/', icon: 'cube-replace-face', category: 'Custom' },
    ],
  },
  {
    label: 'PRODUCCIÓN',
    items: [
      { label: 'Cola de producción', href: '/admin/produccion/cola/', icon: 'printing-page', category: 'Producción' },
      { label: 'Impresiones', href: '/admin/produccion/impresiones/', icon: 'timer', category: 'Producción' },
      { label: 'Materiales', href: '/admin/produccion/materiales/', icon: 'flask', category: 'Producción' },
      { label: 'Equipos', href: '/admin/produccion/equipos/', icon: 'server', category: 'Producción' },
    ],
  },
  {
    label: 'HERRAMIENTAS',
    items: [
      {
        label: 'Calculadora de precios',
        href: '/admin/herramientas/calculadora/',
        icon: 'calculator',
        category: 'Herramientas',
      },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { label: 'Gastos', href: '/admin/finanzas/gastos/', icon: 'wallet', category: 'Finanzas' },
      { label: 'Resumen financiero', href: '/admin/finanzas/resumen/', icon: 'graph-up', category: 'Finanzas' },
      { label: 'Costos recurrentes', href: '/admin/finanzas/recurrentes/', icon: 'refresh-double', category: 'Finanzas' },
    ],
  },
  {
    label: 'CONTENIDO',
    items: [
      { label: 'Medios', href: '/admin/contenido/medios/', icon: 'media-image', category: 'Contenido' },
      { label: 'Lab', href: '/admin/contenido/lab/', icon: 'test-tube', category: 'Contenido' },
      { label: 'Páginas', href: '/admin/contenido/paginas/', icon: 'page-edit', category: 'Contenido' },
      { label: 'FAQs', href: '/admin/contenido/faqs/', icon: 'help-circle', category: 'Contenido' },
    ],
  },
  {
    label: 'CONFIGURACIÓN',
    items: [
      { label: 'General', href: '/admin/configuracion/general/', icon: 'settings', category: 'Configuración' },
      {
        label: 'Parámetros de costos',
        href: '/admin/configuracion/costos/',
        icon: 'control-slider',
        category: 'Configuración',
      },
      { label: 'Usuarios', href: '/admin/configuracion/usuarios/', icon: 'user', category: 'Configuración' },
      { label: 'Roles', href: '/admin/configuracion/roles/', icon: 'key', category: 'Configuración' },
      { label: 'Integraciones', href: '/admin/configuracion/integraciones/', icon: 'network', category: 'Configuración' },
    ],
  },
];

/** Aplana el árbol de navegación — usado por [...slug].astro para generar rutas estáticas. */
export const flatNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function isActiveHref(currentPath: string, href: string): boolean {
  if (href === '/admin/') return currentPath === '/admin/' || currentPath === '/admin';
  return currentPath.startsWith(href);
}
