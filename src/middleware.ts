import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const AUTH_SECRET = process.env.API_SECRET_KEY

// Public routes that never need auth
const PUBLIC_ROUTES = ['/api/auth', '/api/webhooks']

// Routes where GET is public but POST/PUT/DELETE need auth
const PUBLIC_GET_ROUTES = ['/api/metrics', '/api/scorecard', '/api/sales', '/api/daily', '/api/settings']

// Inline token verification (duplicated from src/lib/api.ts)
// Cannot import from api.ts because middleware runs in Edge Runtime
// and path aliases (@/) are not available in middleware
function verifyToken(token: string | null): boolean {
  if (!token || !AUTH_SECRET) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [prefix, timestamp, signature] = parts
  const payload = `${prefix}:${timestamp}`
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex')

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return false
  } catch {
    return false
  }

  // Token expires after 24 hours
  const age = Date.now() - parseInt(timestamp)
  if (age > 24 * 60 * 60 * 1000) return false

  return true
}

export function middleware(request: NextRequest) {
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

  if (!verifyToken(token)) {
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
