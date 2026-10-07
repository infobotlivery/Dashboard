import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { parseLocalDate, formatLocalDate } from '@/lib/dates'
import { computePeriodMetrics } from '@/lib/periodMetrics'

const TYPES = ['sales', 'proposals', 'calls', 'collections', 'expenses', 'metrics'] as const
type ExportType = (typeof TYPES)[number]

const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
const day = (d: Date | null | undefined) => (d ? formatLocalDate(d) : '')
const ST_SALE: Record<string, string> = { active: 'Activo', cancelled: 'Cancelado', completed: 'Completado' }
const ST_PROP: Record<string, string> = { por_aprobacion: 'Por aprobación', aprobada: 'Aprobada', no_cerrada: 'No cerrada' }
const ATT: Record<string, string> = { pending: 'Pendiente', attended: 'Asistió', no_show: 'No asistió' }

export const dynamic = 'force-dynamic'

// GET /api/export?type=sales|proposals|calls|collections|expenses|metrics&from=YYYY-MM-DD&to=YYYY-MM-DD
// Sin from/to exporta todo el historial.
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const type = sp.get('type') as ExportType
  if (!TYPES.includes(type)) return NextResponse.json({ success: false, error: 'type inválido' }, { status: 400 })

  const fromRaw = sp.get('from')
  const toRaw = sp.get('to')
  const valid = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
  if ((fromRaw && !valid(fromRaw)) || (toRaw && !valid(toRaw))) {
    return NextResponse.json({ success: false, error: 'Fechas con formato AAAA-MM-DD' }, { status: 400 })
  }
  const from = fromRaw ? parseLocalDate(fromRaw) : null
  const to = toRaw ? new Date(parseLocalDate(toRaw).getTime() + 24 * 3600_000 - 1) : null
  const between = (): { gte?: Date; lte?: Date } | undefined =>
    from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined

  const rows: string[] = []
  const push = (...cells: unknown[]) => rows.push(cells.map(q).join(','))

  if (type === 'sales') {
    push('Cliente', 'Producto', 'Onboarding', 'Mensual', 'Meses contrato', 'Estado', 'Fecha cierre', 'Fecha cancelación')
    const list = await prisma.salesClose.findMany({ where: { createdAt: between() }, orderBy: { createdAt: 'asc' } })
    for (const s of list) {
      push(s.clientName, s.customProduct || s.product, s.onboardingValue, s.recurringValue, s.contractMonths ?? '', ST_SALE[s.status] ?? s.status, day(s.createdAt), day(s.cancelledAt))
    }
  } else if (type === 'proposals') {
    push('Cliente', 'Empresa', 'Servicio', 'Pago único', 'Mensual', 'Fecha', 'Estado', 'Notas')
    const list = await prisma.proposal.findMany({ where: { date: between() }, orderBy: { date: 'asc' } })
    for (const p of list) push(p.clientName, p.company, p.service, p.amount, p.recurringAmount, day(p.date), ST_PROP[p.status] ?? p.status, p.notes)
  } else if (type === 'calls') {
    push('Lead', 'Email', 'Fecha llamada', 'Agendada el', 'Presupuesto', 'Estado', 'Asistencia', 'Origen')
    const list = await prisma.call.findMany({ where: { scheduledAt: between() }, orderBy: { scheduledAt: 'asc' } })
    for (const c of list) {
      push(c.leadName, c.leadEmail, c.scheduledAt.toISOString(), c.bookedAt.toISOString(), c.budget, c.status === 'canceled' ? 'Cancelada' : 'Agendada', ATT[c.attendance] ?? c.attendance, c.source)
    }
  } else if (type === 'collections') {
    push('Tipo', 'Cliente', 'Concepto', 'Mes', 'Monto', 'Fecha de cobro')
    const [pays, sales, others] = await Promise.all([
      prisma.clientPayment.findMany({ where: { paidAt: between() }, orderBy: { paidAt: 'asc' } }),
      prisma.salesClose.findMany({ select: { id: true, clientName: true } }),
      prisma.accountEntry.findMany({ where: { kind: 'receivable', status: 'paid', paidAt: between() }, orderBy: { paidAt: 'asc' } })
    ])
    const names = new Map(sales.map(s => [s.id, s.clientName]))
    const all = [
      ...pays.map(p => ({ at: p.paidAt, cells: ['Mensualidad', names.get(p.saleId) ?? `#${p.saleId}`, 'Mensualidad', p.forMonth, p.amount, day(p.paidAt)] })),
      ...others.map(a => ({ at: a.paidAt ?? a.dueDate, cells: ['Otro', a.counterparty, a.concept, a.paidAt ? formatLocalDate(a.paidAt).slice(0, 7) : '', a.amount, day(a.paidAt)] }))
    ].sort((a, b) => a.at.getTime() - b.at.getTime())
    for (const r of all) push(...r.cells)
  } else if (type === 'expenses') {
    push('Gasto', 'Monto', 'Tipo', 'Inicio', 'Fin', 'Día de cobro', 'Cliente que paga', 'Notas')
    // Gastos vigentes en algún momento del rango
    const list = await prisma.expense.findMany({
      where: {
        ...(to ? { startDate: { lte: to } } : {}),
        ...(from ? { OR: [{ endDate: null }, { endDate: { gte: from } }] } : {})
      },
      orderBy: { startDate: 'asc' }
    })
    for (const e of list) push(e.name, e.amount, e.type === 'fixed' ? 'Fijo' : 'Recurrente', day(e.startDate), day(e.endDate), e.billingDay ?? '', e.paidByClient, e.notes)
  } else {
    // Una fila por mes: métricas automáticas del dashboard
    const first = await prisma.salesClose.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    const start = from ?? first?.createdAt ?? new Date()
    const end = to ?? new Date()
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    const months: Date[] = []
    while (cursor <= end && months.length < 60) { months.push(new Date(cursor)); cursor.setMonth(cursor.getMonth() + 1) }
    const results = await Promise.all(months.map(m => computePeriodMetrics('month', m)))
    push('Mes', 'Leads', 'Llamadas agendadas', 'Asistieron', 'No asistieron', 'Propuestas enviadas', 'Clientes nuevos', '% cierre',
      'Venta nueva', 'Facturación cobrada', 'Mensualidades por cobrar', 'MRR proyectado', 'MRR nuevo', 'MRR perdido', 'Churn %', 'Clientes activos', 'Clientes perdidos')
    results.forEach((r, i) => {
      const c = r.current
      const n = (x: number) => Math.round(x * 100) / 100
      push(formatLocalDate(months[i]).slice(0, 7), c.leads, c.agendadas, c.callsAttended, c.callsNoShow, c.propuestas.total, c.cierres, n(c.tasaCierre),
        n(c.facturacionNuevas), n(c.facturacion), n(c.porCobrarMensualidades), n(c.mrr), n(c.mrrNuevo), n(c.mrrPerdido), n(c.churnPct), c.clientesActivos, c.clientesPerdidos)
    })
  }

  const suffix = fromRaw || toRaw ? `_${fromRaw ?? 'inicio'}_a_${toRaw ?? 'hoy'}` : '_todo'
  return new NextResponse('﻿' + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}${suffix}.csv"`
    }
  })
}
