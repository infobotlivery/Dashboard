import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Próximos pagos ordenados por fecha
export async function GET() {
  try {
    // Obtener gastos recurrentes activos con día de cobro definido
    const expenses = await prisma.expense.findMany({
      where: {
        type: 'recurring',
        endDate: null,
        billingDay: { not: null }
      },
      include: {
        category: true
      },
      orderBy: { billingDay: 'asc' }
    })

    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Calcular próxima fecha de pago y días restantes para cada gasto
    const upcomingPayments = expenses.map(expense => {
      const billingDay = expense.billingDay as number

      // Calcular la próxima fecha de pago
      let nextPaymentDate: Date

      // Si el día de cobro ya pasó este mes, el próximo pago es el mes siguiente
      if (billingDay <= currentDay) {
        // Próximo mes
        const nextMonth = currentMonth + 1
        const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear
        const adjustedMonth = nextMonth > 11 ? 0 : nextMonth

        // Ajustar si el día no existe en ese mes (ej: día 31 en febrero)
        const daysInNextMonth = new Date(nextYear, adjustedMonth + 1, 0).getDate()
        const adjustedDay = Math.min(billingDay, daysInNextMonth)

        nextPaymentDate = new Date(nextYear, adjustedMonth, adjustedDay)
      } else {
        // Este mes todavía
        // Ajustar si el día no existe en este mes
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const adjustedDay = Math.min(billingDay, daysInCurrentMonth)

        nextPaymentDate = new Date(currentYear, currentMonth, adjustedDay)
      }

      // Calcular días hasta el pago
      const diffTime = nextPaymentDate.getTime() - now.getTime()
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        billingDay: expense.billingDay,
        paidByClient: expense.paidByClient,
        category: expense.category,
        nextPaymentDate: nextPaymentDate.toISOString(),
        daysUntil
      }
    })

    // Ordenar por días restantes (más próximos primero)
    upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil)

    // Limitar a 5 resultados
    const top5 = upcomingPayments.slice(0, 5)

    // Calcular total de los próximos 5
    const total = top5.reduce((sum, expense) => sum + expense.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        payments: top5,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming payments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar próximos pagos' },
      { status: 500 }
    )
  }
}
