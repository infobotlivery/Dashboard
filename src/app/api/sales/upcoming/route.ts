import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/sales/upcoming — clientes activos con cobros próximos en 7 días
export async function GET() {
  try {
    const activeSales = await prisma.salesClose.findMany({
      where: {
        status: 'active',
        recurringValue: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = activeSales.map(sale => {
      // Día del mes del cierre = día de cobro
      const billingDay = new Date(sale.createdAt).getDate()

      // Calcular próxima fecha de cobro
      const thisMonthBilling = new Date(today.getFullYear(), today.getMonth(), billingDay)
      let nextPaymentDate: Date

      if (today <= thisMonthBilling) {
        nextPaymentDate = thisMonthBilling
      } else {
        // Próximo mes
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, billingDay)
      }

      // Normalizar a medianoche
      nextPaymentDate.setHours(0, 0, 0, 0)

      const daysUntil = Math.round((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: sale.id,
        clientName: sale.clientName,
        product: sale.customProduct || sale.product,
        recurringValue: sale.recurringValue,
        billingDay,
        nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
        daysUntil
      }
    })

    // Filtrar solo los próximos 7 días (inclusive hoy)
    const upcoming = results
      .filter(r => r.daysUntil >= 0 && r.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({ success: true, data: upcoming })
  } catch (error) {
    console.error('Error fetching upcoming client payments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cobros próximos' },
      { status: 500 }
    )
  }
}
