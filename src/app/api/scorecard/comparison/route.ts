import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getMonthStart } from '@/lib/api'

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
    return {
      facturacionTotal: 0,
      mrr: 0,
      clientesNuevos: 0,
      clientesPerdidos: 0,
      enigmaVendidos: 0,
      serviciosRecurrentes: 0
    }
  }
}

// GET /api/scorecard/comparison - Obtener comparación entre mes actual y anterior
export async function GET(request: NextRequest) {
  try {
    // Mes actual (primer día del mes) - usar hora local
    const currentMonthStart = getMonthStart()
    const currentMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0, 23, 59, 59, 999)

    // Mes anterior - usar hora local
    const previousMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1, 1, 0, 0, 0, 0)
    const previousMonthEnd = new Date(previousMonthStart.getFullYear(), previousMonthStart.getMonth() + 1, 0, 23, 59, 59, 999)

    // Buscar ambos meses en la base de datos
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

    // Calcular métricas dinámicas desde SalesClose
    const currentSalesMetrics = await calculateMonthSalesMetrics(currentMonthStart, currentMonthEnd)
    const previousSalesMetrics = await calculateMonthSalesMetrics(previousMonthStart, previousMonthEnd)

    // Calcular tasa de cierre (clientesNuevos / leadsTotales * 100)
    const currentTasaCierre = current.leadsTotales > 0
      ? (currentSalesMetrics.clientesNuevos / current.leadsTotales) * 100
      : 0

    const previousTasaCierre = previous.leadsTotales > 0
      ? ((previousSalesMetrics.clientesNuevos || previous.clientesNuevos) / previous.leadsTotales) * 100
      : previous.tasaCierre

    return successResponse({
      currentMonth: {
        ...current,
        month: currentMonthStart.toISOString(),
        // Métricas calculadas dinámicamente desde SalesClose
        facturacionTotal: currentSalesMetrics.facturacionTotal,
        mrr: currentSalesMetrics.mrr,
        clientesNuevos: currentSalesMetrics.clientesNuevos,
        clientesPerdidos: currentSalesMetrics.clientesPerdidos,
        enigmaVendidos: currentSalesMetrics.enigmaVendidos,
        serviciosRecurrentes: currentSalesMetrics.serviciosRecurrentes,
        tasaCierre: currentTasaCierre
      },
      previousMonth: {
        ...previous,
        month: previousMonthStart.toISOString(),
        // Para mes anterior, usar métricas calculadas si hay datos
        facturacionTotal: previousSalesMetrics.facturacionTotal || previous.facturacionTotal,
        clientesNuevos: previousSalesMetrics.clientesNuevos || previous.clientesNuevos,
        clientesPerdidos: previousSalesMetrics.clientesPerdidos || previous.clientesPerdidos,
        enigmaVendidos: previousSalesMetrics.enigmaVendidos || previous.enigmaVendidos,
        serviciosRecurrentes: previousSalesMetrics.serviciosRecurrentes || previous.serviciosRecurrentes,
        tasaCierre: previousTasaCierre
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[Scorecard Comparison] Error:', errorMessage)
    return errorResponse(`Error al obtener comparación mensual: ${errorMessage}`, 500)
  }
}
