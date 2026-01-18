import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'

// POST /api/auth - Verificar contraseña de admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return errorResponse('Contraseña requerida', 400)
    }

    const envPassword = process.env.ADMIN_PASSWORD || 'admin123'

    // Verificar directamente contra la variable de entorno
    if (password === envPassword) {
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64')
      return successResponse({ authenticated: true, token })
    }

    return errorResponse('Contraseña incorrecta', 401)
  } catch (error) {
    console.error('Error authenticating:', error)
    return errorResponse('Error de autenticación', 500)
  }
}
