import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Histórico de últimos 6 meses (solo 2026+)
export async function GET() {
  try {
    const now = new Date()
    const history = []

    for (let i = 0; i < 12; i++) {
      // Buscar hasta 12 meses atrás pero solo incluir 2026+
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)

      // Filtrar meses anteriores a 2026
      if (monthStart.getFullYear() < 2026) continue

      // Limitar a 6 entradas
      if (history.length >= 6) break

      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

      // Buscar en MonthlyFinance (si existe snapshot guardado)
      let snapshot = await prisma.monthlyFinance.findFirst({
        where: {
          month: monthStart
        }
      })

      // Si no hay snapshot, calcular en tiempo real
      if (!snapshot) {
        // Onboarding del mes
        const salesThisMonth = await prisma.salesClose.findMany({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })

        const totalOnboarding = salesThisMonth.reduce(
          (sum, sale) => sum + sale.onboardingValue,
          0
        )

        // MRR Servicios (activos al final del mes)
        // Para meses pasados, aproximamos con los activos actuales
        // En producción, se debería guardar snapshot al final de cada mes
        const activeSales = await prisma.salesClose.findMany({
          where: {
            status: 'active',
            createdAt: { lte: monthEnd }
          }
        })

        const totalMrrServices = activeSales.reduce(
          (sum, sale) => sum + sale.recurringValue,
          0
        )

        // MRR Comunidad (última semana del mes)
        const weeklyMetrics = await prisma.weeklyMetric.findMany({
          where: {
            weekStart: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          orderBy: { weekStart: 'desc' },
          take: 1
        })

        const totalMrrCommunity = weeklyMetrics.length > 0
          ? weeklyMetrics[0].mrrComunidad
          : 0

        const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity

        // Gastos del mes (activos en ese momento)
        const expenses = await prisma.expense.findMany({
          where: {
            startDate: { lte: monthEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: monthStart } }
            ]
          }
        })

        const totalExpenses = expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        )

        const netProfit = totalIncome - totalExpenses

        snapshot = {
          id: 0,
          month: monthStart,
          totalIncome,
          totalOnboarding,
          totalMrrServices,
          totalMrrCommunity,
          totalExpenses,
          netProfit,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      history.push({
        month: monthStart.toISOString(),
        monthLabel: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        totalIncome: snapshot.totalIncome,
        totalOnboarding: snapshot.totalOnboarding,
        totalMrrServices: snapshot.totalMrrServices,
        totalMrrCommunity: snapshot.totalMrrCommunity,
        totalExpenses: snapshot.totalExpenses,
        netProfit: snapshot.netProfit,
        isSnapshot: snapshot.id !== 0
      })
    }

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    console.error('Error fetching finance history:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar historial financiero' },
      { status: 500 }
    )
  }
}
