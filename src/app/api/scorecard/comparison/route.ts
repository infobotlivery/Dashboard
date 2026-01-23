import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getMonthStart } from '@/lib/api'

// GET /api/scorecard/comparison - Obtener comparación entre mes actual y anterior
export async function GET(request: NextRequest) {
  try {
    // Mes actual (primer día del mes)
    const currentMonthStart = getMonthStart()

    // Mes anterior
    const previousMonthStart = new Date(currentMonthStart)
    previousMonthStart.setUTCMonth(previousMonthStart.getUTCMonth() - 1)

    // Buscar ambos meses
    const [currentScorecard, previousScorecard] = await Promise.all([
      prisma.monthlyScorecard.findUnique({
        where: { month: currentMonthStart }
      }),
      prisma.monthlyScorecard.findUnique({
        where: { month: previousMonthStart }
      })
    ])

    // Si no existe el mes actual, crearlo
    let current = currentScorecard
    if (!current) {
      current = await prisma.monthlyScorecard.create({
        data: {
          month: currentMonthStart,
          facturacionTotal: 0,
          mrr: 0,
          clientesNuevos: 0,
          clientesPerdidos: 0,
          enigmaVendidos: 0,
          serviciosRecurrentes: 0,
          leadsTotales: 0,
          tasaCierre: 0
        }
      })
    }

    // Valores por defecto para mes anterior si no existe
    const previous = previousScorecard || {
      facturacionTotal: 0,
      mrr: 0,
      clientesNuevos: 0,
      clientesPerdidos: 0,
      enigmaVendidos: 0,
      serviciosRecurrentes: 0,
      leadsTotales: 0,
      tasaCierre: 0
    }

    return successResponse({
      currentMonth: {
        ...current,
        month: currentMonthStart.toISOString()
      },
      previousMonth: {
        ...previous,
        month: previousMonthStart.toISOString()
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Scorecard Comparison] Error:', errorMessage)
    return errorResponse(`Error al obtener comparación mensual: ${errorMessage}`, 500)
  }
}
