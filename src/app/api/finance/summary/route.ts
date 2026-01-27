import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Calcular el primer día del mes actual
function getFirstDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Calcular el último día del mes actual
function getLastDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

// GET - Resumen financiero del mes actual
export async function GET() {
  try {
    const monthStart = getFirstDayOfMonth()
    const monthEnd = getLastDayOfMonth()

    // 1. Calcular ingresos del mes
    // Onboarding: SalesClose creados este mes
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

    // MRR Servicios: SalesClose con status 'active'
    const activeSales = await prisma.salesClose.findMany({
      where: { status: 'active' }
    })

    const totalMrrServices = activeSales.reduce(
      (sum, sale) => sum + sale.recurringValue,
      0
    )

    // MRR Comunidad: promedio de WeeklyMetric.mrrComunidad del mes
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

    // Total ingresos
    const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity

    // 2. Calcular gastos del mes
    // Gastos activos (sin endDate o con endDate >= ahora)
    const activeExpenses = await prisma.expense.findMany({
      where: {
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ],
        startDate: { lte: monthEnd }
      },
      include: {
        category: true
      }
    })

    const totalExpenses = activeExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    )

    // Agrupar gastos por tipo
    const expensesByType = {
      fixed: activeExpenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0),
      recurring: activeExpenses.filter(e => e.type === 'recurring').reduce((sum, e) => sum + e.amount, 0)
    }

    // Agrupar gastos por categoría
    const expensesByCategory = activeExpenses.reduce((acc, expense) => {
      const catName = expense.category.name
      if (!acc[catName]) {
        acc[catName] = { total: 0, color: expense.category.color, items: [] }
      }
      acc[catName].total += expense.amount
      acc[catName].items.push({ name: expense.name, amount: expense.amount })
      return acc
    }, {} as Record<string, { total: number; color: string; items: { name: string; amount: number }[] }>)

    // 3. Calcular utilidad neta
    const netProfit = totalIncome - totalExpenses

    // 4. Clientes activos
    const activeClientsCount = activeSales.length

    const summary = {
      month: monthStart.toISOString(),
      income: {
        total: totalIncome,
        onboarding: totalOnboarding,
        mrrServices: totalMrrServices,
        mrrCommunity: totalMrrCommunity
      },
      expenses: {
        total: totalExpenses,
        byType: expensesByType,
        byCategory: expensesByCategory,
        list: activeExpenses.map(e => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
          type: e.type,
          category: e.category.name,
          categoryColor: e.category.color
        }))
      },
      netProfit,
      activeClients: activeClientsCount
    }

    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error('Error calculating finance summary:', error)
    return NextResponse.json(
      { success: false, error: 'Error al calcular resumen financiero' },
      { status: 500 }
    )
  }
}
