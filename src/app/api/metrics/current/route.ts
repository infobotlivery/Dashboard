import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getWeekStart } from '@/lib/api'

// GET /api/metrics/current - Obtener métrica de la semana actual
export async function GET(request: NextRequest) {
  try {
    const weekStart = getWeekStart()

    let metric = await prisma.weeklyMetric.findUnique({
      where: { weekStart }
    })

    // Si no existe, crear con valores por defecto
    if (!metric) {
      metric = await prisma.weeklyMetric.create({
        data: {
          weekStart,
          mrr: 0,
          pipelineActivo: 0,
          cierresSemana: 0,
          contenidoPublicado: 0,
          leadsEntrantes: 0,
          entregasPendientes: 0
        }
      })
    }

    return successResponse(metric)
  } catch (error) {
    console.error('Error fetching current metric:', error)
    return errorResponse('Error al obtener métrica actual', 500)
  }
}
