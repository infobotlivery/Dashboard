import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { expectedCharges, isRecurringAtMonthEnd, isTrackedMonth, monthKey, monthRange } from '@/lib/finance'

function parseMonth(value: string | null): Date {
  const m = value && /^(\d{4})-(\d{2})$/.exec(value)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : new Date()
}

const SALE_SELECT = {
  id: true, clientName: true, customProduct: true, product: true, status: true,
  createdAt: true, cancelledAt: true, recurringValue: true
} as const

// GET /api/collections?month=YYYY-MM — mensualidades de clientes del mes (cobradas y por cobrar)
export async function GET(request: NextRequest) {
  try {
    const range = monthRange(parseMonth(new URL(request.url).searchParams.get('month')))
    const now = new Date()
    const asOf = now < range.end ? now : range.end

    const [sales, payments, adjustments] = await Promise.all([
      prisma.salesClose.findMany({ where: { recurringValue: { gt: 0 } }, select: SALE_SELECT }),
      prisma.clientPayment.findMany({ where: { forMonth: monthKey(range.start) } }),
      prisma.chargeAdjustment.findMany({ where: { forMonth: monthKey(range.start) } })
    ])

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const charges = expectedCharges(sales, payments, range, asOf, adjustments).map(c => ({
      saleId: c.saleId,
      clientName: c.clientName,
      product: c.product,
      amount: c.amount,
      baseAmount: c.baseAmount,
      adjusted: c.adjusted,
      dueDate: c.dueDate.toISOString(),
      paid: c.paid,
      paidAt: c.paidAt?.toISOString() ?? null,
      overdue: !c.paid && c.dueDate < today,
      daysUntil: Math.round((c.dueDate.getTime() - today.getTime()) / 86_400_000)
    }))

    const sum = (list: typeof charges) => list.reduce((s, c) => s + c.amount, 0)
    return successResponse({
      month: monthKey(range.start),
      tracked: isTrackedMonth(range),
      charges,
      totals: { expected: sum(charges), collected: sum(charges.filter(c => c.paid)), pending: sum(charges.filter(c => !c.paid)) }
    })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return errorResponse('Error al obtener cobros', 500)
  }
}

// POST /api/collections — { saleId, month: "YYYY-MM", paid: boolean }
// paid=true registra la mensualidad como cobrada (suma a la facturación y a la utilidad del mes de cobro);
// paid=false la deja otra vez por cobrar.
export async function POST(request: NextRequest) {
  try {
    const { saleId, month, paid } = await request.json()
    if (!saleId || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month) || typeof paid !== 'boolean') {
      return errorResponse('saleId, month (AAAA-MM) y paid (true/false) son requeridos')
    }

    const range = monthRange(parseMonth(month))
    if (!isTrackedMonth(range)) {
      return errorResponse('Los meses anteriores a julio 2026 se consideran cobrados y no se pueden modificar')
    }

    const sale = await prisma.salesClose.findUnique({ where: { id: Number(saleId) }, select: SALE_SELECT })
    if (!sale || sale.recurringValue <= 0 || !isRecurringAtMonthEnd(sale, range.end)) {
      return errorResponse('Ese cliente no tiene una mensualidad vigente en ese mes', 404)
    }

    const where = { saleId_forMonth: { saleId: sale.id, forMonth: month } }
    if (paid) {
      const adj = await prisma.chargeAdjustment.findUnique({ where })
      await prisma.clientPayment.upsert({
        where,
        create: { saleId: sale.id, forMonth: month, amount: adj ? adj.amount : sale.recurringValue, paidAt: new Date() },
        update: {}
      })
    } else {
      await prisma.clientPayment.deleteMany({ where: { saleId: sale.id, forMonth: month } })
    }
    return successResponse({ saleId: sale.id, month, paid })
  } catch (error) {
    console.error('Error updating collection:', error)
    return errorResponse('Error al actualizar el cobro', 500)
  }
}

// PUT /api/collections — { saleId, month: "YYYY-MM", amount: number | null }
// Ajusta el monto de UNA mensualidad (solo ese cliente y ese mes). amount=null quita el ajuste.
// Solo se puede ajustar un cobro pendiente: si ya está cobrado, primero se desmarca.
export async function PUT(request: NextRequest) {
  try {
    const { saleId, month, amount } = await request.json()
    if (!saleId || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse('saleId y month (AAAA-MM) son requeridos')
    }
    if (amount !== null && !(typeof amount === 'number' && Number.isFinite(amount) && amount >= 0)) {
      return errorResponse('El monto debe ser un número mayor o igual a 0 (o null para quitar el ajuste)')
    }
    const range = monthRange(parseMonth(month))
    if (!isTrackedMonth(range)) {
      return errorResponse('Los meses anteriores a julio 2026 se consideran cobrados y no se pueden modificar')
    }
    const sale = await prisma.salesClose.findUnique({ where: { id: Number(saleId) }, select: SALE_SELECT })
    if (!sale || sale.recurringValue <= 0 || !isRecurringAtMonthEnd(sale, range.end)) {
      return errorResponse('Ese cliente no tiene una mensualidad vigente en ese mes', 404)
    }
    const where = { saleId_forMonth: { saleId: sale.id, forMonth: month } }
    if (await prisma.clientPayment.findUnique({ where })) {
      return errorResponse('Ese cobro ya está marcado como cobrado: desmárcalo primero para cambiar el monto', 409)
    }
    if (amount === null || amount === sale.recurringValue) {
      await prisma.chargeAdjustment.deleteMany({ where: { saleId: sale.id, forMonth: month } })
    } else {
      await prisma.chargeAdjustment.upsert({
        where,
        create: { saleId: sale.id, forMonth: month, amount },
        update: { amount }
      })
    }
    return successResponse({ saleId: sale.id, month, amount })
  } catch (error) {
    console.error('Error adjusting collection:', error)
    return errorResponse('Error al ajustar el cobro', 500)
  }
}
