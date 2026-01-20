import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse, getMonthStart } from '@/lib/api'

// GET /api/scorecard - Obtener scorecards mensuales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const current = searchParams.get('current') === 'true'

    if (current) {
      const month = getMonthStart()
      console.log('[Scorecard API] Buscando mes actual:', month.toISOString())

      let scorecard = await prisma.monthlyScorecard.findUnique({
        where: { month }
      })

      // Si no existe, crear uno con valores por defecto
      if (!scorecard) {
        scorecard = await prisma.monthlyScorecard.create({
          data: { month }
        })
      }

      return successResponse(scorecard)
    }

    const scorecards = await prisma.monthlyScorecard.findMany({
      orderBy: { month: 'desc' },
      take: limit
    })

    return successResponse(scorecards)
  } catch (error) {
    console.error('Error fetching scorecards:', error)
    return errorResponse('Error al obtener scorecards', 500)
  }
}

// POST /api/scorecard - Crear o actualizar scorecard mensual
export async function POST(request: NextRequest) {
  try {
    const isApiRequest = request.headers.get('X-API-Key')
    if (isApiRequest && !verifyApiKey(request)) {
      return errorResponse('API Key inválida', 401)
    }

    const body = await request.json()
    const { month: monthStr, ...data } = body

    const month = monthStr
      ? new Date(monthStr)
      : getMonthStart()

    // Sanitizar datos numéricos
    const sanitizedData: Record<string, number> = {}
    const numericFields = ['facturacionTotal', 'mrr', 'clientesNuevos', 'clientesPerdidos', 'enigmaVendidos', 'serviciosRecurrentes', 'leadsTotales', 'tasaCierre']

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = Number(data[field]) || 0
      }
    }

    const scorecard = await prisma.monthlyScorecard.upsert({
      where: { month },
      update: {
        ...sanitizedData,
        updatedAt: new Date()
      },
      create: {
        month,
        ...sanitizedData
      }
    })

    return successResponse(scorecard, 201)
  } catch (error) {
    console.error('Error creating/updating scorecard:', error)
    return errorResponse('Error al guardar scorecard', 500)
  }
}
