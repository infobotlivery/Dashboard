import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse, getMonthStart } from '@/lib/api'

// Calcular métricas de ventas para un mes específico
async function calculateMonthSalesMetrics(monthStart: Date, monthEnd: Date) {
  try {
    // Ventas creadas en el mes
    const monthSales = await prisma.salesClose.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    // Clientes activos (para MRR actual)
    const activeSales = await prisma.salesClose.findMany({
      where: { status: 'active' }
    })

    // Clientes perdidos en el mes (cancelados durante el mes)
    const cancelledThisMonth = await prisma.salesClose.findMany({
      where: {
        status: 'cancelled',
        cancelledAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    // Enigmas vendidos (producto = 'Enigma')
    const enigmasThisMonth = monthSales.filter(s => s.product === 'Enigma').length

    // Cálculos
    const onboardingTotal = monthSales.reduce((sum, s) => sum + s.onboardingValue, 0)
    const mrrActivo = activeSales.reduce((sum, s) => sum + s.recurringValue, 0)
    const facturacionTotal = onboardingTotal + mrrActivo

    return {
      facturacionTotal,
      mrr: mrrActivo,
      clientesNuevos: monthSales.length,
      clientesPerdidos: cancelledThisMonth.length,
      enigmaVendidos: enigmasThisMonth,
      serviciosRecurrentes: activeSales.length
    }
  } catch {
    return null
  }
}

// GET /api/scorecard - Obtener scorecards mensuales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const current = searchParams.get('current') === 'true'

    if (current) {
      const month = getMonthStart()
      const monthEnd = new Date(month)
      monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
      monthEnd.setUTCDate(0)
      monthEnd.setUTCHours(23, 59, 59, 999)

      let scorecard = await prisma.monthlyScorecard.findUnique({
        where: { month }
      })

      // Si no existe, crear uno con valores por defecto
      if (!scorecard) {
        scorecard = await prisma.monthlyScorecard.create({
          data: { month }
        })
      }

      // Calcular métricas dinámicas desde SalesClose
      const salesMetrics = await calculateMonthSalesMetrics(month, monthEnd)

      if (salesMetrics) {
        // Calcular tasa de cierre
        const tasaCierre = scorecard.leadsTotales > 0
          ? (salesMetrics.clientesNuevos / scorecard.leadsTotales) * 100
          : 0

        // Devolver scorecard con valores calculados
        return successResponse({
          ...scorecard,
          facturacionTotal: salesMetrics.facturacionTotal,
          mrr: salesMetrics.mrr,
          clientesNuevos: salesMetrics.clientesNuevos,
          clientesPerdidos: salesMetrics.clientesPerdidos,
          enigmaVendidos: salesMetrics.enigmaVendidos,
          serviciosRecurrentes: salesMetrics.serviciosRecurrentes,
          tasaCierre
        })
      }

      return successResponse(scorecard)
    }

    // Asegurar que existe el mes actual antes de devolver la lista
    const currentMonth = getMonthStart()
    const existsCurrentMonth = await prisma.monthlyScorecard.findUnique({
      where: { month: currentMonth }
    })

    if (!existsCurrentMonth) {
      await prisma.monthlyScorecard.create({
        data: { month: currentMonth }
      })
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

    // Sanitizar datos numéricos (sin tasaCierre, se calcula automáticamente)
    const sanitizedData: Record<string, number> = {}
    const numericFields = ['facturacionTotal', 'mrr', 'clientesNuevos', 'clientesPerdidos', 'enigmaVendidos', 'serviciosRecurrentes', 'leadsTotales']

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = Number(data[field]) || 0
      }
    }

    // Obtener datos actuales para calcular tasaCierre correctamente
    const existingScorecard = await prisma.monthlyScorecard.findUnique({
      where: { month }
    })

    // Determinar valores para el cálculo (usar nuevos si vienen, si no los existentes)
    const clientesNuevos = sanitizedData.clientesNuevos ?? existingScorecard?.clientesNuevos ?? 0
    const leadsTotales = sanitizedData.leadsTotales ?? existingScorecard?.leadsTotales ?? 0

    // Calcular tasa de cierre automáticamente
    sanitizedData.tasaCierre = leadsTotales > 0
      ? (clientesNuevos / leadsTotales) * 100
      : 0

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
