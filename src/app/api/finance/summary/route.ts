import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { monthRange, sumMrr, isRecurringAtMonthEnd, expenseAppliesToMonth, buildAccounts } from '@/lib/finance'

// Parsear 'YYYY-MM' o 'YYYY-MM-DD' a Date local
function parseMonthParam(month: string): Date {
  const parts = month.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, 1)
}

// GET - Resumen financiero del mes (acepta ?month=YYYY-MM o YYYY-MM-DD)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')

    const referenceDate = monthParam ? parseMonthParam(monthParam) : new Date()
    const range = monthRange(referenceDate)
    const prevRange = monthRange(new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1))
    const now = new Date()

    // Todas las consultas en paralelo
    const [sales, expenses, accounts] = await Promise.all([
      prisma.salesClose.findMany({
        select: {
          status: true,
          createdAt: true,
          cancelledAt: true,
          recurringValue: true,
          onboardingValue: true,
          product: true
        }
      }),
      prisma.expense.findMany({
        where: { startDate: { lte: range.end } },
        include: { category: true }
      }),
      prisma.accountEntry.findMany()
    ])

    // 1. Ingresos del mes
    // Onboarding: cierres firmados en el mes
    const totalOnboarding = sales
      .filter(s => s.createdAt >= range.start && s.createdAt <= range.end)
      .reduce((sum, s) => sum + s.onboardingValue, 0)

    // MRR: TODOS los clientes con recurrencia vigente al cierre del mes (no solo los nuevos)
    const mrr = sumMrr(sales, range.end)
    const totalMrrServices = mrr.services
    const totalMrrCommunity = mrr.community
    const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity

    // Clientes activos (con recurrencia vigente al cierre del mes)
    const activeClientsCount = sales.filter(
      s => s.recurringValue > 0 && isRecurringAtMonthEnd(s, range.end)
    ).length

    // 2. Gastos del mes
    const monthExpenses = expenses.filter(e => expenseAppliesToMonth(e, range))
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const sumBy = (type: string) =>
      monthExpenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0)
    const expensesByType = { fixed: sumBy('fixed'), recurring: sumBy('recurring') }

    const expensesByCategory = monthExpenses.reduce((acc, expense) => {
      const catName = expense.category.name
      if (!acc[catName]) {
        acc[catName] = { total: 0, color: expense.category.color, items: [] }
      }
      acc[catName].total += expense.amount
      acc[catName].items.push({ name: expense.name, amount: expense.amount })
      return acc
    }, {} as Record<string, { total: number; color: string; items: { name: string; amount: number }[] }>)

    // 3. Mes anterior (comparativa de gastos)
    const prevExpenses = expenses.filter(e => expenseAppliesToMonth(e, prevRange))
    const prevSum = (type?: string) =>
      prevExpenses.filter(e => !type || e.type === type).reduce((sum, e) => sum + e.amount, 0)

    // 4. Cuentas por cobrar / por pagar pendientes al día de consulta
    const { receivable, payable } = buildAccounts(accounts, expenses, range, now)

    const netProfit = totalIncome - totalExpenses

    const summary = {
      month: range.start.toISOString(),
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
        list: monthExpenses.map(e => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
          type: e.type,
          category: e.category.name,
          categoryColor: e.category.color
        }))
      },
      previousMonth: {
        totalExpenses: prevSum(),
        fixedExpenses: prevSum('fixed'),
        recurringExpenses: prevSum('recurring')
      },
      accounts: {
        receivable,
        payable,
        // Utilidad del mes ajustada por lo que falta cobrar y pagar
        projectedBalance: netProfit + receivable.pending - payable.pending
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
