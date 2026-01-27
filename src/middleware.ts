import { NextRequest, NextResponse } from 'next/server'

// Middleware de autenticación v3 - Compatible con Edge Runtime
// Usa Web Crypto API en lugar de Node.js crypto

// Secret para verificar tokens
const AUTH_SECRET = process.env.API_SECRET_KEY || 'fallback-secret-change-in-production'

// Rutas que SIEMPRE requieren autenticación (cualquier método)
const ALWAYS_PROTECTED_ROUTES = [
  '/api/finance',
  '/api/sales',
  '/api/settings',
  '/api/daily'
]

// Rutas que solo requieren auth para modificar (POST/PUT/DELETE)
// GET es público para el dashboard principal
const PROTECTED_WRITE_ONLY = [
  '/api/metrics',
  '/api/scorecard'
]

// Rutas completamente públicas
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/webhooks'
]

// Convertir string a ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

// Convertir ArrayBuffer a hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verificar token firmado usando Web Crypto API
async function verifyAuthToken(token: string | null): Promise<boolean> {
  if (!token) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [prefix, timestamp, signature] = parts
  const payload = `${prefix}:${timestamp}`

  try {
    // Crear key para HMAC
    const keyData = stringToArrayBuffer(AUTH_SECRET)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Generar firma esperada
    const payloadBuffer = stringToArrayBuffer(payload)
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadBuffer)
    const expectedSig = arrayBufferToHex(signatureBuffer)

    // Comparar firmas (timing-safe no es crítico aquí pero comparamos igual)
    if (signature !== expectedSig) {
      return false
    }

    // Verificar expiración (24 horas)
    const age = Date.now() - parseInt(timestamp)
    if (age > 24 * 60 * 60 * 1000) return false

    return true
  } catch (error) {
    console.error('Token verification error:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Permitir rutas completamente públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Rutas de solo escritura protegida: GET es público, POST/PUT/DELETE requieren auth
  const isWriteOnlyProtected = PROTECTED_WRITE_ONLY.some(route => pathname.startsWith(route))
  if (isWriteOnlyProtected) {
    // GET requests son públicos (para el dashboard)
    if (method === 'GET') {
      return NextResponse.next()
    }
    // POST/PUT/DELETE requieren autenticación
    return await verifyAndRespond(request)
  }

  // Rutas siempre protegidas (cualquier método)
  const isAlwaysProtected = ALWAYS_PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isAlwaysProtected) {
    return await verifyAndRespond(request)
  }

  // Cualquier otra ruta API no listada: permitir
  return NextResponse.next()
}

// Helper para verificar auth y responder
async function verifyAndRespond(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  const isValid = await verifyAuthToken(token)

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
