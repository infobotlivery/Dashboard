import { NextRequest } from 'next/server'
import { errorResponse, successResponse, createAuthToken } from '@/lib/api'

// Rate limiting en memoria
// Estructura: { [ip]: { attempts: number, blockedUntil: number } }
const rateLimitMap = new Map<string, { attempts: number; blockedUntil: number }>()

const RATE_LIMIT_MAX_ATTEMPTS = 5  // Máximo de intentos fallidos
const RATE_LIMIT_WINDOW_MS = 60000 // Bloqueo por 1 minuto

function getClientIP(request: NextRequest): string {
  // Intentar obtener IP real (detrás de proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  // Fallback
  return 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    return { allowed: true }
  }

  // Si está bloqueado y el bloqueo no ha expirado
  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
    }
  }

  // Si el bloqueo expiró, resetear
  if (record.blockedUntil <= now && record.blockedUntil > 0) {
    rateLimitMap.delete(ip)
    return { allowed: true }
  }

  return { allowed: true }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = rateLimitMap.get(ip) || { attempts: 0, blockedUntil: 0 }

  record.attempts += 1

  // Si alcanzó el límite, bloquear
  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    record.blockedUntil = now + RATE_LIMIT_WINDOW_MS
  }

  rateLimitMap.set(ip, record)
}

function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip)
}

// POST /api/auth - Verificar contraseña de admin
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return errorResponse(
        `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfter} segundos.`,
        429
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return errorResponse('Contraseña requerida', 400)
    }

    const envPassword = process.env.ADMIN_PASSWORD

    if (!envPassword) {
      return errorResponse('ADMIN_PASSWORD no configurado en el servidor', 500)
    }

    // Verificar directamente contra la variable de entorno
    if (password === envPassword) {
      // Login exitoso - resetear rate limit
      resetRateLimit(clientIP)
      // Generar token firmado con HMAC-SHA256
      const token = createAuthToken()
      return successResponse({ authenticated: true, token })
    }

    // Login fallido - registrar intento
    recordFailedAttempt(clientIP)
    return errorResponse('Contraseña incorrecta', 401)
  } catch (error) {
    console.error('Error authenticating:', error)
    return errorResponse('Error de autenticación', 500)
  }
}
