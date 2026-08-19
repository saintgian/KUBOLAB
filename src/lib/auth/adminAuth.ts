/**
 * Punto de integración futuro con el servicio real de autenticación de /admin.
 * Hoy no existe backend: esta función siempre resuelve en fallo controlado y nunca
 * otorga acceso, para que AdminLoginForm.svelte quede desacoplado del transporte real
 * (fetch a un endpoint, SDK de auth, etc.) sin simular un login exitoso.
 */
export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  ok: boolean;
}

export async function submitAdminLogin(_credentials: AdminLoginCredentials): Promise<AdminLoginResult> {
  return { ok: false };
}
