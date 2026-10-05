/**
 * Wrapper de fetch para las APIs internas del dashboard.
 * Envía JSON por defecto. La app no usa autenticación de usuario:
 * solo los webhooks externos (N8N/Kommo) usan X-API-Key.
 */
export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}
