import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { monthRange, monthKey, isTrackedMonth, isRecurringAtMonthEnd, collectedMrr } from '@/lib/finance'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'

export const dynamic = 'force-dynamic'

// GET /api/finance/breakdown?month=YYYY-MM
// De dónde sale cada número del mes: facturación cobrada (por cliente y concepto) y MRR proyectado (por cliente).
export async function GET(request: NextRequest) {
  try {
    const param = new URL(request.url).searchParams.get('month')
    const base = param && /^\d{4}-\d{2}$/.test(param) ? parseLocalDate(`${param}-01`) : new Date()
    const range = monthRange(base)
    const tracked = isTrackedMonth(range)
    const key = monthKey(range.start)

    const [sales, payments, others] = await Promise.all([
      prisma.salesClose.findMany({
        select: { id: true, clientName: true, product: true, customProduct: true, onboardingValue: true, recurringValue: true, status: true, createdAt: true, cancelledAt: true }
      }),
      prisma.clientPayment.findMany({ where: { paidAt: { gte: range.start, lte: range.end } } }),
      prisma.accountEntry.findMany({ where: { kind: 'receivable', status: 'paid', paidAt: { gte: range.start, lte: range.end } } })
    ])
    const byId = new Map(sales.map(s => [s.id, s]))
    const label = (s: { product: string; customProduct: string | null }) => s.customProduct || s.product

    type Row = { type: 'onboarding' | 'mensualidad' | 'otro'; client: string; detail: string; date: string; amount: number; assumed: boolean }
    const cobrado: Row[] = []

    for (const s of sales) {
      if (s.onboardingValue > 0 && s.createdAt >= range.start && s.createdAt <= range.end) {
        cobrado.push({ type: 'onboarding', client: s.clientName, detail: `Pago único · ${label(s)}`, date: formatLocalDate(s.createdAt), amount: s.onboardingValue, assumed: false })
      }
    }
    if (tracked) {
      for (const p of payments) {
        const s = byId.get(p.saleId)
        if (!s || p.amount <= 0) continue
        cobrado.push({ type: 'mensualidad', client: s.clientName, detail: `Mensualidad de ${p.forMonth} · ${label(s)}`, date: formatLocalDate(p.paidAt), amount: p.amount, assumed: false })
      }
    } else {
      // Meses sin registro de cobros: se asume cobrada la mensualidad de cada cliente vigente
      for (const s of sales) {
        if (s.recurringValue > 0 && isRecurringAtMonthEnd(s, range.end)) {
          cobrado.push({ type: 'mensualidad', client: s.clientName, detail: `Mensualidad asumida cobrada · ${label(s)}`, date: '', amount: s.recurringValue, assumed: true })
        }
      }
    }
    for (const a of others) {
      cobrado.push({ type: 'otro', client: a.counterparty || a.concept, detail: a.concept, date: a.paidAt ? formatLocalDate(a.paidAt) : '', amount: a.amount, assumed: false })
    }
    cobrado.sort((a, b) => b.amount - a.amount)

    const mrr = sales
      .filter(s => s.recurringValue > 0 && isRecurringAtMonthEnd(s, range.end))
      .map(s => ({ client: s.clientName, product: label(s), amount: s.recurringValue, since: formatLocalDate(s.createdAt), cancelledAt: s.cancelledAt ? formatLocalDate(s.cancelledAt) : null }))
      .sort((a, b) => b.amount - a.amount)

    const sum = (rows: { amount: number }[]) => rows.reduce((t, r) => t + r.amount, 0)
    const mrrPaid = collectedMrr(sales, payments, range)
    return successResponse({
      month: key,
      tracked,
      cobrado: { rows: cobrado, total: sum(cobrado) },
      mrr: { rows: mrr, total: sum(mrr), cobrado: mrrPaid.services + mrrPaid.community }
    })
  } catch (error) {
    console.error('Error en breakdown:', error)
    return errorResponse('Error al obtener el detalle', 500)
  }
}
