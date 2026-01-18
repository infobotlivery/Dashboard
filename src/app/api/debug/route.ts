import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api'

// GET /api/debug - Ver si las variables de entorno están configuradas
export async function GET(request: NextRequest) {
  const envPassword = process.env.ADMIN_PASSWORD

  return successResponse({
    hasAdminPassword: !!envPassword,
    passwordLength: envPassword?.length || 0,
    firstChars: envPassword?.substring(0, 3) + '***' || 'not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}

// POST /api/debug - Probar comparación de contraseña
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body
  const envPassword = process.env.ADMIN_PASSWORD || 'admin123'

  return successResponse({
    inputPassword: password,
    inputLength: password?.length || 0,
    envLength: envPassword.length,
    exactMatch: password === envPassword,
    trimmedMatch: password?.trim() === envPassword.trim(),
    envFirstChars: envPassword.substring(0, 5) + '***',
    inputFirstChars: password?.substring(0, 5) + '***'
  })
}
