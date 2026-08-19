<script lang="ts">
  /**
   * AdminNavigation.svelte
   * Única isla responsable de la navegación interactiva: drawer móvil, overlay, Escape,
   * focus trap + focus restore. Los datos de navegación siguen viniendo de navigation.ts
   * (no se duplican aquí).
   *
   * En escritorio (>=1024px) la sidebar está siempre expandida (puro CSS, ver admin-core.css):
   * .admin-sidebar es fixed con ancho fijo y .admin-main reserva ese mismo ancho vía
   * margin-left (push de layout). No hay estado de colapso ni JS involucrado.
   *
   * El botón que abre el drawer vive en AdminHeader.astro (topbar, markup estático, visible
   * solo <1024px) y el overlay vive en AdminLayout.astro (`[data-sidebar-scrim]`) — ambos son
   * elementos simples fuera del árbol de esta isla. En vez de convertir el header o el overlay
   * en islas propias (lo que duplicaría trabajo de hidratación por casi nada), esta isla los
   * localiza por selector una vez montada y les añade los listeners.
   * No hay persistencia en localStorage a propósito (todavía).
   */
  import { onMount } from 'svelte';
  import { navGroups, isActiveHref } from '../../data/admin/navigation';
  import { withBase } from '../../lib/url';
  import KuboIcon from '../ui/KuboIcon.svelte';

  interface Props {
    currentPath: string;
  }

  let { currentPath }: Props = $props();

  const dashboardHref = withBase('/admin/');
  const logoSrc = withBase('/assets/logos/KUBO_InversaColor_Horizontal.svg');
  const symbolLogoSrc = withBase('/assets/logos/KUBO_InversaColor_Simbolo.svg');

  let mobileOpen = $state(false);
  let asideEl: HTMLElement | undefined = $state();
  let lastFocused: HTMLElement | null = null;

  function getFocusable(container: HTMLElement | undefined | null): HTMLElement[] {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }

  function setToggleExpanded(expanded: boolean, label: string) {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    toggle?.setAttribute('aria-expanded', String(expanded));
    toggle?.setAttribute('aria-label', label);
  }

  function openMobile() {
    lastFocused = document.activeElement as HTMLElement;
    mobileOpen = true;
    document.body.style.overflow = 'hidden';
    setToggleExpanded(true, 'Cerrar navegación');
    requestAnimationFrame(() => {
      const focusables = getFocusable(asideEl);
      (focusables[0] ?? asideEl)?.focus();
    });
  }

  function closeMobile() {
    if (!mobileOpen) return;
    mobileOpen = false;
    document.body.style.overflow = '';
    setToggleExpanded(false, 'Abrir navegación');
    const restoreTarget = lastFocused ?? document.querySelector<HTMLElement>('[data-sidebar-toggle]');
    restoreTarget?.focus();
    lastFocused = null;
  }

  function handleToggleClick() {
    openMobile();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileOpen) {
      closeMobile();
      return;
    }
    if (event.key === 'Tab' && mobileOpen) {
      const focusables = getFocusable(asideEl);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function handleViewportChange(event: MediaQueryListEvent) {
    if (event.matches && mobileOpen) closeMobile();
  }

  function handleNavClick() {
    if (mobileOpen) closeMobile();
  }

  // Refleja el estado del drawer móvil en el shell para que el CSS existente (transform del
  // drawer, overlay) siga resolviendo el layout. El colapso de escritorio no usa clase: es
  // :hover / :focus-within puro sobre .admin-sidebar.
  $effect(() => {
    const shell = document.querySelector('[data-admin-shell]');
    shell?.classList.toggle('mobile-sidebar-open', mobileOpen);
  });

  onMount(() => {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const scrim = document.querySelector('[data-sidebar-scrim]');
    const mq = window.matchMedia('(min-width: 1024px)');

    toggle?.addEventListener('click', handleToggleClick);
    scrim?.addEventListener('click', closeMobile);
    document.addEventListener('keydown', handleKeydown);
    mq.addEventListener('change', handleViewportChange);

    return () => {
      toggle?.removeEventListener('click', handleToggleClick);
      scrim?.removeEventListener('click', closeMobile);
      document.removeEventListener('keydown', handleKeydown);
      mq.removeEventListener('change', handleViewportChange);
    };
  });
</script>

<aside
  id="admin-sidebar-drawer"
  class="admin-sidebar"
  bind:this={asideEl}
  aria-label="Navegación administrativa"
>
  <div class="sidebar-brand">
    <a href={dashboardHref} class="brand-link" aria-label="KUBO Admin — inicio">
      <img src={logoSrc} alt="KUBO" class="brand-logo brand-logo-horizontal" width="126" height="32" />
      <img src={symbolLogoSrc} alt="" class="brand-logo brand-logo-symbol" aria-hidden="true" width="30" height="30" />
    </a>

    <button
      class="sidebar-close icon-button mobile-only"
      type="button"
      onclick={closeMobile}
      aria-label="Cerrar navegación"
    >
      <KuboIcon name="xmark" size={20} />
    </button>
  </div>

  <nav class="sidebar-nav" aria-label="Secciones del panel">
    {#each navGroups as group (group.label)}
      <section class="nav-group" aria-labelledby={`nav-${group.label.toLowerCase()}`}>
        <p class="nav-group-label" id={`nav-${group.label.toLowerCase()}`}>{group.label}</p>

        <div class="nav-group-items">
          {#each group.items as item (item.href)}
            <a
              href={item.href}
              class="nav-item"
              class:is-active={isActiveHref(currentPath, item.href)}
              aria-current={isActiveHref(currentPath, item.href) ? 'page' : undefined}
              onclick={handleNavClick}
            >
              <span class="nav-item-icon" aria-hidden="true">
                <KuboIcon name={item.icon} size={18} />
              </span>
              <span class="nav-item-label">{item.label}</span>
              <span class="nav-item-arrow" aria-hidden="true">
                <KuboIcon name="nav-arrow-right" size={15} />
              </span>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <button class="sidebar-user" type="button" aria-label="Administrador — Admin KUBO">
      <span class="sidebar-avatar">AA</span>
      <span class="sidebar-user-copy">
        <strong>Admin KUBO</strong>
        <small>Administrador</small>
      </span>
      <KuboIcon name="nav-arrow-down" size={16} />
    </button>
    <p class="sidebar-version">KUBO ADMIN / UI 02</p>
  </div>
</aside>
