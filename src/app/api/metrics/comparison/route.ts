import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getWeekStart } from '@/lib/api'

// GET /api/metrics/comparison - Obtener comparación entre semana actual y anterior
export async function GET(request: NextRequest) {
  try {
    // Semana actual (lunes de esta semana)
    const currentWeekStart = getWeekStart()

    // Semana anterior (lunes de la semana pasada)
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)

    // Buscar ambas semanas
    const [currentMetric, previousMetric] = await Promise.all([
      prisma.weeklyMetric.findUnique({
        where: { weekStart: currentWeekStart }
      }),
      prisma.weeklyMetric.findUnique({
        where: { weekStart: previousWeekStart }
      })
    ])

    // Si no existe la semana actual, crearla
    let current = currentMetric
    if (!current) {
      current = await prisma.weeklyMetric.create({
        data: {
          weekStart: currentWeekStart,
          mrr: 0,
          mrrComunidad: 0,
          pipelineActivo: 0,
          cierresSemana: 0,
          contenidoPublicado: 0,
          leadsEntrantes: 0,
          entregasPendientes: 0
        }
      })
    }

    // Valores por defecto para semana anterior si no existe
    const previous = previousMetric || {
      mrr: 0,
      mrrComunidad: 0,
      pipelineActivo: 0,
      cierresSemana: 0,
      contenidoPublicado: 0,
      leadsEntrantes: 0,
      entregasPendientes: 0
    }

    // Calcular MRR de ventas activas para MRR híbrido
    let salesMRR = 0
    try {
      const activeSales = await prisma.salesClose.findMany({
        where: { status: 'active' }
      })
      salesMRR = activeSales.reduce((sum, s) => sum + s.recurringValue, 0)
    } catch {
      // Si la tabla no existe todavía, ignorar
      console.log('[Metrics Comparison] Tabla salesClose no disponible aún')
    }

    return successResponse({
      currentWeek: {
        ...current,
        weekStart: currentWeekStart.toISOString(),
        mrrComunidad: (current as Record<string, unknown>).mrrComunidad ?? 0,
        mrr: (current.mrr || 0) + salesMRR
      },
      previousWeek: {
        ...previous,
        weekStart: previousWeekStart.toISOString(),
        mrrComunidad: (previous as Record<string, unknown>).mrrComunidad ?? 0
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Metrics Comparison] Error:', errorMessage)
    return errorResponse(`Error al obtener comparación: ${errorMessage}`, 500)
  }
}
