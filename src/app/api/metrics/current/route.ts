import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getWeekStart } from '@/lib/api'

// GET /api/metrics/current - Obtener métrica de la semana actual
export async function GET(request: NextRequest) {
  try {
    const weekStart = getWeekStart()

    // Calcular fin de semana (domingo 23:59:59)
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
    weekEnd.setUTCHours(23, 59, 59, 999)

    let metric = await prisma.weeklyMetric.findUnique({
      where: { weekStart }
    })

    // Si no existe, crear con valores por defecto
    if (!metric) {
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
      } catch {
        // Si falla con mrrComunidad, intentar sin él (DB antigua)
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

    // Calcular métricas dinámicas desde SalesClose
    let salesMRR = 0
    let cierresSemana = 0

    try {
      // MRR = suma de recurringValue de clientes activos
      const activeSales = await prisma.salesClose.findMany({
        where: { status: 'active' }
      })
      salesMRR = activeSales.reduce((sum, s) => sum + s.recurringValue, 0)

      // Cierres de la semana = onboarding + recurring de ventas creadas esta semana
      const weekSales = await prisma.salesClose.findMany({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })
      cierresSemana = weekSales.reduce((sum, s) => sum + s.onboardingValue + s.recurringValue, 0)
    } catch {
      // Si la tabla no existe todavía, usar valores manuales
      console.log('[Metrics Current] Tabla salesClose no disponible aún')
    }

    // Devolver métrica con valores calculados dinámicamente
    const metricWithCalculated = {
      ...metric,
      mrrComunidad: (metric as Record<string, unknown>).mrrComunidad ?? 0,
      // MRR Clientes = calculado desde SalesClose (clientes activos)
      mrr: salesMRR,
      // Cierres de la semana = calculado desde SalesClose (ventas de la semana)
      cierresSemana: cierresSemana
    }

    return successResponse(metricWithCalculated)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Metrics Current] Error:', errorMessage)
    return errorResponse(`Error al obtener métrica actual: ${errorMessage}`, 500)
  }
}
