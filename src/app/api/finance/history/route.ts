import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Histórico de últimos 6 meses (solo 2026+)
export async function GET() {
  try {
    const now = new Date()

    // 1. Determine valid months
    const months: { start: Date; end: Date }[] = []
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      if (monthStart.getFullYear() < 2026) continue
      if (months.length >= 6) break
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      months.push({ start: monthStart, end: monthEnd })
    }

    if (months.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const earliestStart = months[months.length - 1].start
    const latestEnd = months[0].end

    // 2. Bulk fetch all data in parallel (4 queries total)
    const [snapshots, allSalesInRange, activeSales, expenses] = await Promise.all([
      prisma.monthlyFinance.findMany({
        where: { month: { gte: earliestStart, lte: latestEnd } }
      }),
      prisma.salesClose.findMany({
        where: { createdAt: { gte: earliestStart, lte: latestEnd } },
        select: { onboardingValue: true, createdAt: true }
      }),
      prisma.salesClose.findMany({
        where: { status: 'active' },
        select: { recurringValue: true, createdAt: true, product: true }
      }),
      prisma.expense.findMany({
        where: {
          startDate: { lte: latestEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: earliestStart } }
          ]
        },
        select: { amount: true, startDate: true, endDate: true }
      })
    ])

    // Create a map of snapshots by month
    const snapshotMap = new Map(
      snapshots.map(s => [s.month.toISOString(), s])
    )

    // 3. Compute per-month values from pre-fetched data
    const history = months.map(({ start: monthStart, end: monthEnd }) => {
      const snapshot = snapshotMap.get(monthStart.toISOString())

      if (snapshot) {
        return {
          month: monthStart.toISOString(),
          monthLabel: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          totalIncome: snapshot.totalIncome,
          totalOnboarding: snapshot.totalOnboarding,
          totalMrrServices: snapshot.totalMrrServices,
          totalMrrCommunity: snapshot.totalMrrCommunity,
          totalExpenses: snapshot.totalExpenses,
          netProfit: snapshot.netProfit,
          isSnapshot: true
        }
      }

      // Calculate from pre-fetched data
      const totalOnboarding = allSalesInRange
        .filter(s => s.createdAt >= monthStart && s.createdAt <= monthEnd)
        .reduce((sum, s) => sum + s.onboardingValue, 0)

      const totalMrrServices = activeSales
        .filter(s => s.createdAt <= monthEnd && s.product !== 'Comunidad')
        .reduce((sum, s) => sum + s.recurringValue, 0)

      const totalMrrCommunity = activeSales
        .filter(s => s.createdAt <= monthEnd && s.product === 'Comunidad')
        .reduce((sum, s) => sum + s.recurringValue, 0)

      const totalIncome = totalOnboarding + totalMrrServices + totalMrrCommunity

      const totalExpenses = expenses
        .filter(e => e.startDate <= monthEnd && (!e.endDate || e.endDate >= monthStart))
        .reduce((sum, e) => sum + e.amount, 0)

      const netProfit = totalIncome - totalExpenses

      return {
        month: monthStart.toISOString(),
        monthLabel: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalOnboarding,
        totalMrrServices,
        totalMrrCommunity,
        totalExpenses,
        netProfit,
        isSnapshot: false
      }
    })

    return NextResponse.json({ success: true, data: history })
  } catch (error) {
    console.error('Error fetching finance history:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar historial financiero' },
      { status: 500 }
    )
  }
}
