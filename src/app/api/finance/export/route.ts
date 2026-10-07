import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { collectedMrr, expenseAppliesToMonth } from '@/lib/finance'

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
      // Exportar historial mensual - bulk fetch optimization
      const now = new Date()

      // 1. Determine valid months
      const months: { start: Date; end: Date }[] = []
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        if (monthStart.getFullYear() < 2026) continue
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        months.push({ start: monthStart, end: monthEnd })
      }

      const history: {
        month: string
        totalIncome: number
        totalOnboarding: number
        totalMrrServices: number
        totalMrrCommunity: number
        totalExpenses: number
        netProfit: number
      }[] = []

      if (months.length > 0) {
        const earliestStart = months[months.length - 1].start
        const latestEnd = months[0].end

        // 2. Bulk fetch all data in parallel (4 queries instead of ~48)
        const [allSalesInRange, recurringSales, expensesData, payments, paidReceivables] = await Promise.all([
          prisma.salesClose.findMany({
            where: { createdAt: { gte: earliestStart, lte: latestEnd } },
            select: { onboardingValue: true, createdAt: true }
          }),
          prisma.salesClose.findMany({
            where: { recurringValue: { gt: 0 } },
            select: { id: true, recurringValue: true, createdAt: true, product: true, status: true, cancelledAt: true }
          }),
          prisma.expense.findMany({
            where: {
              startDate: { lte: latestEnd },
              OR: [
                { endDate: null },
                { endDate: { gte: earliestStart } }
              ]
            },
            select: { amount: true, type: true, startDate: true, endDate: true }
          }),
          prisma.clientPayment.findMany({ where: { paidAt: { gte: earliestStart, lte: latestEnd } } }),
          prisma.accountEntry.findMany({
            where: { kind: 'receivable', status: 'paid', paidAt: { gte: earliestStart, lte: latestEnd } },
            select: { amount: true, paidAt: true }
          })
        ])

        // 3. Compute per-month values from pre-fetched data
        for (const { start: monthStart, end: monthEnd } of months) {
          const totalOnboarding = allSalesInRange
            .filter(s => s.createdAt >= monthStart && s.createdAt <= monthEnd)
            .reduce((sum, s) => sum + s.onboardingValue, 0)

          const mrr = collectedMrr(recurringSales, payments, { start: monthStart, end: monthEnd })
          const otherCollected = paidReceivables
            .filter(a => a.paidAt && a.paidAt >= monthStart && a.paidAt <= monthEnd)
            .reduce((sum, a) => sum + a.amount, 0)
          const totalMrrServices = mrr.services
          const totalMrrCommunity = mrr.community

          const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity + otherCollected

          const totalExpenses = expensesData
            .filter(e => expenseAppliesToMonth(e, { start: monthStart, end: monthEnd }))
            .reduce((sum, e) => sum + e.amount, 0)

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
