import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getWeekStart } from '@/lib/api'

// GET /api/metrics/current - Obtener métrica de la semana actual
export async function GET(request: NextRequest) {
  try {
    const weekStart = getWeekStart()
    console.log('[Metrics Current] Fecha actual del servidor:', new Date().toISOString())
    console.log('[Metrics Current] Buscando semana que inicia:', weekStart.toISOString())

    let metric = await prisma.weeklyMetric.findUnique({
      where: { weekStart }
    })

    // Si no existe, crear con valores por defecto (sin mrrComunidad para compatibilidad)
    if (!metric) {
      console.log('[Metrics Current] No existe métrica, creando nueva...')
      try {
        metric = await prisma.weeklyMetric.create({
          data: {
            weekStart,
            mrr: 0,
            mrrComunidad: 0,
            pipelineActivo: 0,
            cierresSemana: 0,
            contenidoPublicado: 0,
            leadsEntrantes: 0,
            entregasPendientes: 0
          }
        })
      } catch (createError) {
        // Si falla con mrrComunidad, intentar sin él (DB antigua)
        console.log('[Metrics Current] Error creando con mrrComunidad, intentando sin él...')
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
      console.log('[Metrics Current] Tabla salesClose no disponible aún')
    }

    // Asegurar que mrrComunidad existe en la respuesta (puede ser undefined en DB antigua)
    // MRR híbrido = MRR manual + MRR de ventas activas
    const metricWithDefaults = {
      ...metric,
      mrrComunidad: (metric as Record<string, unknown>).mrrComunidad ?? 0,
      mrr: (metric.mrr || 0) + salesMRR,
      mrrManual: metric.mrr || 0,
      mrrSales: salesMRR
    }

    return successResponse(metricWithDefaults)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Metrics Current] Error:', errorMessage)
    return errorResponse(`Error al obtener métrica actual: ${errorMessage}`, 500)
  }
}
