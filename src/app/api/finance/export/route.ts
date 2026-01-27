import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Exportar datos financieros a CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    let csv = ''
    const filename = `finanzas_${type}_${new Date().toISOString().split('T')[0]}.csv`

    if (type === 'expenses' || type === 'all') {
      // Exportar gastos
      const expenses = await prisma.expense.findMany({
        include: { category: true },
        where: startDate || endDate ? { startDate: dateFilter } : undefined,
        orderBy: { startDate: 'desc' }
      })

      csv += 'GASTOS\n'
      csv += 'Nombre,Categoria,Monto,Tipo,Fecha Inicio,Fecha Fin,Estado,Notas\n'

      expenses.forEach((expense) => {
        const status = expense.endDate ? 'Cancelado' : 'Activo'
        const endDateStr = expense.endDate
          ? new Date(expense.endDate).toLocaleDateString('es-MX')
          : '-'
        csv += `"${expense.name}","${expense.category.name}",${expense.amount},"${expense.type === 'recurring' ? 'Recurrente' : 'Fijo'}","${new Date(expense.startDate).toLocaleDateString('es-MX')}","${endDateStr}","${status}","${expense.notes || ''}"\n`
      })

      csv += '\n'
    }

    if (type === 'history' || type === 'all') {
      // Exportar historial mensual
      const now = new Date()
      const history = []

      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)

        // Solo incluir meses de 2026 en adelante
        if (monthStart.getFullYear() < 2026) continue

        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

        // Calcular ingresos
        const salesThisMonth = await prisma.salesClose.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        })

        const totalOnboarding = salesThisMonth.reduce(
          (sum, sale) => sum + sale.onboardingValue, 0
        )

        const activeSales = await prisma.salesClose.findMany({
          where: {
            status: 'active',
            createdAt: { lte: monthEnd }
          }
        })

        const totalMrrServices = activeSales.reduce(
          (sum, sale) => sum + sale.recurringValue, 0
        )

        const weeklyMetrics = await prisma.weeklyMetric.findMany({
          where: {
            weekStart: { gte: monthStart, lte: monthEnd }
          },
          orderBy: { weekStart: 'desc' },
          take: 1
        })

        const totalMrrCommunity = weeklyMetrics[0]?.mrrComunidad || 0
        const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity

        // Calcular gastos
        const expenses = await prisma.expense.findMany({
          where: {
            startDate: { lte: monthEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: monthStart } }
            ]
          }
        })

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

        history.push({
          month: monthStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
          totalIncome,
          totalOnboarding,
          totalMrrServices,
          totalMrrCommunity,
          totalExpenses,
          netProfit: totalIncome - totalExpenses
        })
      }

      csv += 'HISTORIAL MENSUAL\n'
      csv += 'Mes,Ingresos Totales,Onboarding,MRR Servicios,MRR Comunidad,Gastos Totales,Utilidad Neta\n'

      history.forEach((entry) => {
        csv += `"${entry.month}",${entry.totalIncome},${entry.totalOnboarding},${entry.totalMrrServices},${entry.totalMrrCommunity},${entry.totalExpenses},${entry.netProfit}\n`
      })

      csv += '\n'
    }

    if (type === 'goals' || type === 'all') {
      // Exportar metas
      const goals = await prisma.monthlyGoal.findMany({
        orderBy: { month: 'desc' }
      })

      csv += 'METAS MENSUALES\n'
      csv += 'Mes,Meta Ingresos,Limite Gastos,Meta Ahorro,Notas\n'

      goals.forEach((goal) => {
        csv += `"${new Date(goal.month).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}",${goal.incomeTarget},${goal.expenseLimit},${goal.savingsTarget},"${goal.notes || ''}"\n`
      })
    }

    // Retornar CSV como descarga
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
