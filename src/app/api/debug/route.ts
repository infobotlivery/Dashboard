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
