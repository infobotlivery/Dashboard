import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getWeekStart } from '@/lib/api'

// Calcular métricas de ventas para un rango de fechas
async function calculateSalesMetrics(weekStart: Date, weekEnd: Date) {
  try {
    // MRR = suma de recurringValue de clientes activos (snapshot actual)
    const activeSales = await prisma.salesClose.findMany({
      where: { status: 'active' }
    })
    const salesMRR = activeSales.reduce((sum, s) => sum + s.recurringValue, 0)

    // Cierres de la semana = onboarding + recurring de ventas creadas en ese rango
    const weekSales = await prisma.salesClose.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    })
    const cierresSemana = weekSales.reduce((sum, s) => sum + s.onboardingValue + s.recurringValue, 0)

    return { salesMRR, cierresSemana }
  } catch {
    return { salesMRR: 0, cierresSemana: 0 }
  }
}

// GET /api/metrics/comparison - Obtener comparación entre semana actual y anterior
export async function GET(request: NextRequest) {
  try {
    // Semana actual (lunes de esta semana)
    const currentWeekStart = getWeekStart()
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() + 6)
    currentWeekEnd.setUTCHours(23, 59, 59, 999)

    // Semana anterior (lunes de la semana pasada)
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(previousWeekStart)
    previousWeekEnd.setUTCDate(previousWeekEnd.getUTCDate() + 6)
    previousWeekEnd.setUTCHours(23, 59, 59, 999)

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

    // Calcular métricas dinámicas desde SalesClose
    const currentSalesMetrics = await calculateSalesMetrics(currentWeekStart, currentWeekEnd)
    const previousSalesMetrics = await calculateSalesMetrics(previousWeekStart, previousWeekEnd)

    return successResponse({
      currentWeek: {
        ...current,
        weekStart: currentWeekStart.toISOString(),
        mrrComunidad: (current as Record<string, unknown>).mrrComunidad ?? 0,
        // MRR y cierres calculados dinámicamente
        mrr: currentSalesMetrics.salesMRR,
        cierresSemana: currentSalesMetrics.cierresSemana
      },
      previousWeek: {
        ...previous,
        weekStart: previousWeekStart.toISOString(),
        mrrComunidad: (previous as Record<string, unknown>).mrrComunidad ?? 0,
        // Para semana anterior, usar cierres calculados pero mantener MRR histórico
        cierresSemana: previousSalesMetrics.cierresSemana || previous.cierresSemana
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Metrics Comparison] Error:', errorMessage)
    return errorResponse(`Error al obtener comparación: ${errorMessage}`, 500)
  }
}
