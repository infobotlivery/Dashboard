import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Secret para verificar tokens (debe coincidir con api.ts)
const AUTH_SECRET = process.env.API_SECRET_KEY || 'fallback-secret-change-in-production'

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/api/finance',
  '/api/sales',
  '/api/settings',
  '/api/daily',
  '/api/metrics',
  '/api/scorecard'
]

// Rutas excluidas (públicas)
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/webhooks'
]

// Verificar token firmado (duplicado para middleware ya que no puede importar de api.ts)
function verifyAuthToken(token: string | null): boolean {
  if (!token) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [prefix, timestamp, signature] = parts
  const payload = `${prefix}:${timestamp}`

  try {
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex')

    // Verificar firma usando comparación segura
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false
    }

    // Verificar expiración (24 horas)
    const age = Date.now() - parseInt(timestamp)
    if (age > 24 * 60 * 60 * 1000) return false

    return true
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar si es ruta protegida
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Extraer token del header Authorization
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!verifyAuthToken(token)) {
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
