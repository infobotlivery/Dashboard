import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'

// Helper para asegurar que existe el registro de settings
async function ensureSettingsExist() {
  let settings = await prisma.adminSettings.findUnique({
    where: { id: 1 }
  })

  if (!settings) {
    const defaultPassword = process.env.ADMIN_PASSWORD
    if (!defaultPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required')
    }
    const hash = await bcrypt.hash(defaultPassword, 10)

    settings = await prisma.adminSettings.create({
      data: {
        id: 1,
        passwordHash: hash,
        brandPrimary: '#44e1fc',
        brandDark: '#171717'
      }
    })
  }

  return settings
}

// GET /api/settings - Obtener configuración (sin password)
export async function GET() {
  try {
    const settings = await ensureSettingsExist()

    // No devolver el hash de la contraseña
    const { passwordHash, ...publicSettings } = settings

    return successResponse(publicSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return errorResponse('Error al obtener configuración', 500)
  }
}

// POST /api/settings - Actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandPrimary, brandDark, logoUrl, newPassword } = body

    // Asegurar que existe el registro antes de actualizar
    await ensureSettingsExist()

    const updateData: Record<string, string> = {}

    if (brandPrimary) updateData.brandPrimary = brandPrimary
    if (brandDark) updateData.brandDark = brandDark
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    // Si se proporciona nueva contraseña, hashearla
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    const settings = await prisma.adminSettings.update({
      where: { id: 1 },
      data: updateData
    })

    const { passwordHash, ...publicSettings } = settings

    return successResponse(publicSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return errorResponse('Error al actualizar configuración', 500)
  }
}
