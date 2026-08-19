<script lang="ts">
  /**
   * AdminLoginForm.svelte
   * Isla interactiva de /admin/login (docs/specs/admin-login-spec.md): show/hide password,
   * loading y error inline. El submit llama a submitAdminLogin (src/lib/auth/adminAuth.ts),
   * hoy sin backend real — nunca otorga acceso, así que no hay redirect ni sesión que fijar acá.
   */
  import KuboIcon from '../../ui/KuboIcon.svelte';
  import { submitAdminLogin } from '../../../lib/auth/adminAuth';

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let status = $state<'idle' | 'loading' | 'error'>('idle');

  const errorMessage = 'No pudimos iniciar sesión. Revisa tus credenciales.';

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (status === 'loading') return;

    status = 'loading';

    const result = await submitAdminLogin({ email, password });

    status = result.ok ? 'idle' : 'error';
  }

  function toggleShowPassword() {
    showPassword = !showPassword;
  }
</script>

<form class="login-form" novalidate onsubmit={handleSubmit}>
  {#if status === 'error'}
    <p class="login-form-error" role="alert">
      <KuboIcon name="warning-triangle" size={14} />
      {errorMessage}
    </p>
  {/if}

  <div class="field">
    <label class="field-label" for="login-email">Correo electrónico</label>
    <input
      id="login-email"
      class="text-input"
      type="email"
      name="email"
      autocomplete="email"
      required
      bind:value={email}
      disabled={status === 'loading'}
      aria-invalid={status === 'error' ? 'true' : undefined}
    />
  </div>

  <div class="field">
    <label class="field-label" for="login-password">Contraseña</label>
    <div class="login-password-wrap">
      <input
        id="login-password"
        class="text-input login-password-input"
        type={showPassword ? 'text' : 'password'}
        name="password"
        autocomplete="current-password"
        required
        bind:value={password}
        disabled={status === 'loading'}
        aria-invalid={status === 'error' ? 'true' : undefined}
      />
      <button
        type="button"
        class="login-password-toggle"
        onclick={toggleShowPassword}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        disabled={status === 'loading'}
      >
        <KuboIcon name={showPassword ? 'eye-closed' : 'eye'} size={18} />
      </button>
    </div>
  </div>

  <button type="submit" class="primary-button login-submit" disabled={status === 'loading'}>
    {status === 'loading' ? 'Ingresando…' : 'Ingresar al Admin'}
    {#if status !== 'loading'}
      <KuboIcon name="nav-arrow-right" size={16} />
    {/if}
  </button>
</form>

<style>
  .login-form {
    display: grid;
  }

  .login-form-error {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 var(--space-5);
    padding: 10px var(--space-3);
    color: var(--kubo-red);
    background: color-mix(in srgb, var(--kubo-red) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--kubo-red) 22%, transparent);
    border-radius: var(--radius-sm);
    font-family: var(--font-kubo-sans);
    font-size: 12.5px;
    font-weight: 500;
  }

  .login-password-wrap {
    position: relative;
  }

  .login-password-input {
    padding-right: 44px;
  }

  .login-password-toggle {
    position: absolute;
    top: 0;
    right: 0;
    display: inline-grid;
    place-items: center;
    width: var(--form-control-height);
    height: var(--form-control-height);
    color: var(--admin-muted);
    border-radius: var(--radius-sm);
    transition: color var(--dur-hover) ease, background-color var(--dur-hover) ease;
  }

  .login-password-toggle:hover {
    color: var(--kubo-carbon);
    background: color-mix(in srgb, var(--kubo-carbon) 5%, transparent);
  }

  .login-password-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .login-submit {
    width: 100%;
    margin-top: var(--space-6);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--kubo-red) 45%, transparent);
    transition:
      transform var(--dur-hover) var(--ease-standard),
      background-color var(--dur-hover) ease,
      box-shadow var(--dur-hover) ease;
  }

  .login-submit:hover:not(:disabled) {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--kubo-red) 14%, transparent);
  }

  .login-submit:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }
</style>
