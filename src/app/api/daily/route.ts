import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse } from '@/lib/api'

// GET /api/daily - Obtener checks diarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const today = searchParams.get('today') === 'true'

    if (today) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)

      let check = await prisma.dailyCheck.findUnique({
        where: { date }
      })

      // Si no existe, crear uno con valores por defecto
      if (!check) {
        check = await prisma.dailyCheck.create({
          data: { date }
        })
      }

      return successResponse(check)
    }

    const checks = await prisma.dailyCheck.findMany({
      orderBy: { date: 'desc' },
      take: limit
    })

    return successResponse(checks)
  } catch (error) {
    console.error('Error fetching daily checks:', error)
    return errorResponse('Error al obtener checks diarios', 500)
  }
}

// POST /api/daily - Registrar check diario
export async function POST(request: NextRequest) {
  try {
    const isApiRequest = request.headers.get('X-API-Key')
    if (isApiRequest && !verifyApiKey(request)) {
      return errorResponse('API Key inválida', 401)
    }

    const body = await request.json()
    const { date: dateStr, publicoContenido, respondioLeads, notas } = body

    const date = dateStr ? new Date(dateStr) : new Date()
    date.setHours(0, 0, 0, 0)

    // Sanitizar datos booleanos
    const sanitizedPublico = publicoContenido === true || publicoContenido === 'true'
    const sanitizedRespondio = respondioLeads === true || respondioLeads === 'true'

    const check = await prisma.dailyCheck.upsert({
      where: { date },
      update: {
        publicoContenido: sanitizedPublico,
        respondioLeads: sanitizedRespondio,
        notas: notas || null
      },
      create: {
        date,
        publicoContenido: sanitizedPublico,
        respondioLeads: sanitizedRespondio,
        notas: notas || null
      }
    })

    return successResponse(check, 201)
  } catch (error) {
    console.error('Error creating/updating daily check:', error)
    return errorResponse('Error al guardar check diario', 500)
  }
}
