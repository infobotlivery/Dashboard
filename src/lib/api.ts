import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Secret para firmar tokens de autenticación
const AUTH_SECRET = process.env.API_SECRET_KEY || 'fallback-secret-change-in-production'

// Verificar API Key para endpoints externos (N8N)
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  return apiKey === process.env.API_SECRET_KEY
}

// Crear token firmado con HMAC-SHA256
export function createAuthToken(): string {
  const payload = `admin:${Date.now()}`
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex')
  return `${payload}:${signature}`
}

// Verificar token firmado
export function verifyAuthToken(token: string | null): boolean {
  if (!token) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [prefix, timestamp, signature] = parts
  const payload = `${prefix}:${timestamp}`
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex')

  // Verificar firma usando comparación segura
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false
  }

  // Verificar expiración (24 horas)
  const age = Date.now() - parseInt(timestamp)
  if (age > 24 * 60 * 60 * 1000) return false

  return true
}

// Respuesta de error estándar
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// Respuesta exitosa estándar
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

// Obtener inicio de semana (lunes) - Usa UTC para consistencia en servidor
export function getWeekStart(date: Date = new Date()): Date {
  // Crear fecha en UTC para evitar problemas de zona horaria
  const d = new Date(date)

  // Ajustar a medianoche UTC
  d.setUTCHours(0, 0, 0, 0)

  // Obtener día de la semana (0 = domingo, 1 = lunes, etc.)
  const day = d.getUTCDay()

  // Calcular diferencia para llegar al lunes
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)

  return d
}

// Obtener inicio de mes - Usa UTC para consistencia en servidor
export function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// Formatear fecha para display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Formatear moneda
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
