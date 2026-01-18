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

    // Obtener configuración de admin
    let settings = await prisma.adminSettings.findUnique({
      where: { id: 1 }
    })

    // Si no existe, crear con contraseña del env
    if (!settings) {
      const hash = await bcrypt.hash(envPassword, 10)

      settings = await prisma.adminSettings.create({
        data: {
          id: 1,
          passwordHash: hash
        }
      })
    }

    // Verificar contra la contraseña del ENV directamente (permite resetear)
    if (password === envPassword) {
      // Actualizar hash si cambió la contraseña en env
      const newHash = await bcrypt.hash(envPassword, 10)
      await prisma.adminSettings.update({
        where: { id: 1 },
        data: { passwordHash: newHash }
      })

      const token = Buffer.from(`admin:${Date.now()}`).toString('base64')
      return successResponse({ authenticated: true, token })
    }

    // Verificar contra el hash guardado
    const isValid = await bcrypt.compare(password, settings.passwordHash)

    if (!isValid) {
      return errorResponse('Contraseña incorrecta', 401)
    }

    // Generar token simple (en producción usar JWT)
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64')

    return successResponse({
      authenticated: true,
      token
    })
  } catch (error) {
    console.error('Error authenticating:', error)
    return errorResponse('Error de autenticación', 500)
  }
}
