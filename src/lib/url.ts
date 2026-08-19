/**
 * Antepone el base path del sitio (`import.meta.env.BASE_URL`, `/KUBOLAB/` en producción,
 * `/` en dev) a una ruta absoluta interna. Todo link o asset dentro de `/admin` debe pasar
 * por acá — un href hardcodeado como `/admin/...` rompe en GitHub Pages porque el sitio
 * vive bajo `/KUBOLAB`.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;
  return `${base}${path}`;
}
