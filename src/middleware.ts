import { NextRequest, NextResponse } from 'next/server'

const AUTH_SECRET = process.env.API_SECRET_KEY

// Public routes that never need auth
const PUBLIC_ROUTES = ['/api/auth', '/api/webhooks']

// Routes where GET is public but POST/PUT/DELETE need auth
const PUBLIC_GET_ROUTES = [
  '/api/metrics',
  '/api/scorecard',
  '/api/sales',
  '/api/daily',
  '/api/settings',
  '/api/proposals',
  '/api/finance/summary',
  '/api/finance/goals'
]

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// Token verification using Web Crypto API (Edge Runtime compatible)
// Duplicated logic from src/lib/api.ts which uses Node.js crypto
async function verifyToken(token: string | null): Promise<boolean> {
  if (!token || !AUTH_SECRET) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [prefix, timestamp, signature] = parts
  const payload = `${prefix}:${timestamp}`

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSig = bufferToHex(signatureBuffer)

    if (!safeCompare(signature, expectedSig)) return false
  } catch {
    return false
  }

  // Token expires after 24 hours
  const age = Date.now() - parseInt(timestamp)
  if (age > 24 * 60 * 60 * 1000) return false

  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes - always allow
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Public GET routes - allow GET, protect other methods
  if (PUBLIC_GET_ROUTES.some(route => pathname.startsWith(route))) {
    if (request.method === 'GET') {
      return NextResponse.next()
    }
  }

  // All other /api routes (including /api/finance/*) - require auth
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!await verifyToken(token)) {
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
