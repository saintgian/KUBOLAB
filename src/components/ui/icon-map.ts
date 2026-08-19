/**
 * icon-map.ts
 * Fuente oficial: Iconoir (estilo regular / lineal). Única fuente de iconografía del sistema.
 *
 * Centraliza el mapa `name -> raw SVG` para que tanto `KuboIcon.astro` (islas estáticas Astro)
 * como `KuboIcon.svelte` (islas hidratadas Svelte) consuman exactamente la misma fuente de
 * iconos sin duplicar imports ni divergir. No añadir un icono aquí sin una necesidad real de
 * interfaz — ver `fuentes_digitales/CLAUDE.md`.
 */
import dashboardDots from 'iconoir/icons/regular/dashboard-dots.svg?raw';
import pkg from 'iconoir/icons/regular/package.svg?raw';
import cube from 'iconoir/icons/regular/cube.svg?raw';
import viewGrid from 'iconoir/icons/regular/view-grid.svg?raw';
import group from 'iconoir/icons/regular/group.svg?raw';
import label from 'iconoir/icons/regular/label.svg?raw';
import deliveryTruck from 'iconoir/icons/regular/delivery-truck.svg?raw';
import chatLines from 'iconoir/icons/regular/chat-lines.svg?raw';
import page from 'iconoir/icons/regular/page.svg?raw';
import cubeReplaceFace from 'iconoir/icons/regular/cube-replace-face.svg?raw';
import printingPage from 'iconoir/icons/regular/printing-page.svg?raw';
import flask from 'iconoir/icons/regular/flask.svg?raw';
import server from 'iconoir/icons/regular/server.svg?raw';
import calculator from 'iconoir/icons/regular/calculator.svg?raw';
import wallet from 'iconoir/icons/regular/wallet.svg?raw';
import graphUp from 'iconoir/icons/regular/graph-up.svg?raw';
import refreshDouble from 'iconoir/icons/regular/refresh-double.svg?raw';
import mediaImage from 'iconoir/icons/regular/media-image.svg?raw';
import testTube from 'iconoir/icons/regular/test-tube.svg?raw';
import pageEdit from 'iconoir/icons/regular/page-edit.svg?raw';
import helpCircle from 'iconoir/icons/regular/help-circle.svg?raw';
import settings from 'iconoir/icons/regular/settings.svg?raw';
import controlSlider from 'iconoir/icons/regular/control-slider.svg?raw';
import user from 'iconoir/icons/regular/user.svg?raw';
import key from 'iconoir/icons/regular/key.svg?raw';
import network from 'iconoir/icons/regular/network.svg?raw';
import xmark from 'iconoir/icons/regular/xmark.svg?raw';
import navArrowRight from 'iconoir/icons/regular/nav-arrow-right.svg?raw';
import navArrowDown from 'iconoir/icons/regular/nav-arrow-down.svg?raw';
import menu from 'iconoir/icons/regular/menu.svg?raw';
import search from 'iconoir/icons/regular/search.svg?raw';
import calendar from 'iconoir/icons/regular/calendar.svg?raw';
import bell from 'iconoir/icons/regular/bell.svg?raw';
import download from 'iconoir/icons/regular/download.svg?raw';
import plus from 'iconoir/icons/regular/plus.svg?raw';
import infoCircle from 'iconoir/icons/regular/info-circle.svg?raw';
import arrowUpRight from 'iconoir/icons/regular/arrow-up-right.svg?raw';
import filterList from 'iconoir/icons/regular/filter-list.svg?raw';
import shoppingBag from 'iconoir/icons/regular/shopping-bag.svg?raw';
import cart from 'iconoir/icons/regular/cart.svg?raw';
import trash from 'iconoir/icons/regular/trash.svg?raw';
import check from 'iconoir/icons/regular/check.svg?raw';
import editPencil from 'iconoir/icons/regular/edit-pencil.svg?raw';
import warningTriangle from 'iconoir/icons/regular/warning-triangle.svg?raw';
import upload from 'iconoir/icons/regular/upload.svg?raw';
import attachment from 'iconoir/icons/regular/attachment.svg?raw';
import navArrowLeft from 'iconoir/icons/regular/nav-arrow-left.svg?raw';
import creditCard from 'iconoir/icons/regular/credit-card.svg?raw';
import box from 'iconoir/icons/regular/box.svg?raw';
import weight from 'iconoir/icons/regular/weight.svg?raw';
import archive from 'iconoir/icons/regular/archive.svg?raw';
import copy from 'iconoir/icons/regular/copy.svg?raw';
import openNewWindow from 'iconoir/icons/regular/open-new-window.svg?raw';
import wrench from 'iconoir/icons/regular/wrench.svg?raw';
import droplet from 'iconoir/icons/regular/droplet.svg?raw';
import timer from 'iconoir/icons/regular/timer.svg?raw';
import mapPin from 'iconoir/icons/regular/map-pin.svg?raw';
import whatsapp from 'iconoir/icons/regular/whatsapp.svg?raw';
import instagram from 'iconoir/icons/regular/instagram.svg?raw';
import facebook from 'iconoir/icons/regular/facebook.svg?raw';
import tiktok from 'iconoir/icons/regular/tiktok.svg?raw';
import eye from 'iconoir/icons/regular/eye.svg?raw';
import eyeClosed from 'iconoir/icons/regular/eye-closed.svg?raw';

export const icons = {
  'dashboard-dots': dashboardDots,
  package: pkg,
  cube,
  'view-grid': viewGrid,
  group,
  label,
  'delivery-truck': deliveryTruck,
  'chat-lines': chatLines,
  page,
  'cube-replace-face': cubeReplaceFace,
  'printing-page': printingPage,
  flask,
  server,
  calculator,
  wallet,
  'graph-up': graphUp,
  'refresh-double': refreshDouble,
  'media-image': mediaImage,
  'test-tube': testTube,
  'page-edit': pageEdit,
  'help-circle': helpCircle,
  settings,
  'control-slider': controlSlider,
  user,
  key,
  network,
  xmark,
  'nav-arrow-right': navArrowRight,
  'nav-arrow-down': navArrowDown,
  menu,
  search,
  calendar,
  bell,
  download,
  plus,
  'info-circle': infoCircle,
  'arrow-up-right': arrowUpRight,
  'filter-list': filterList,
  'shopping-bag': shoppingBag,
  cart,
  trash,
  check,
  'edit-pencil': editPencil,
  'warning-triangle': warningTriangle,
  upload,
  attachment,
  'nav-arrow-left': navArrowLeft,
  'credit-card': creditCard,
  box,
  weight,
  archive,
  copy,
  'open-new-window': openNewWindow,
  wrench,
  droplet,
  timer,
  'map-pin': mapPin,
  whatsapp,
  instagram,
  facebook,
  tiktok,
  eye,
  'eye-closed': eyeClosed,
} as const;

export type IconName = keyof typeof icons;

/** Sustituye width/height del <svg> raíz de Iconoir por el tamaño pedido, sin tocar nada más. */
export function sizedIconMarkup(name: IconName, size: number): string {
  const raw = icons[name];
  return raw
    .replace(/width="\d+(\.\d+)?"/, `width="${size}"`)
    .replace(/height="\d+(\.\d+)?"/, `height="${size}"`);
}
