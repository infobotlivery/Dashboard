/**
 * Helper para hacer requests autenticados a las APIs protegidas.
 * Envía el token almacenado en localStorage en el header Authorization.
 *
 * @param url - URL del endpoint
 * @param options - Opciones de fetch (method, body, etc.)
 * @param tokenKey - Key en localStorage donde está el token (default: 'admin_token')
 * @returns Promise<Response>
 */
export function authFetch(
  url: string,
  options: RequestInit = {},
  tokenKey: string = 'admin_token'
): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem(tokenKey)
    : null

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
}

/**
 * Helper específico para el módulo de finanzas.
 * Usa 'finance_token' como key en localStorage.
 */
export function financeAuthFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return authFetch(url, options, 'finance_token')
}

/**
 * Helper específico para el panel de admin.
 * Usa 'admin_token' como key en localStorage.
 */
export function adminAuthFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return authFetch(url, options, 'admin_token')
}
