import prisma from '@/lib/db'
import { monthRange, sumMrr, collectedMrr, isTrackedMonth, type MonthRange, type PaymentLike } from '@/lib/finance'

export type Period = 'week' | 'month' | 'quarter'

export interface PeriodRange extends MonthRange {
  label: string
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Rango de la semana (lunes–domingo), mes o trimestre que contiene a `date` (hora local)
export function periodRange(period: Period, date: Date): PeriodRange {
  if (period === 'week') {
    const day = date.getDay()
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (day === 0 ? 6 : day - 1))
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
    const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
    return { start, end, label: `Semana del ${fmt(start)} al ${fmt(end)}` }
  }
  if (period === 'quarter') {
    const q = Math.floor(date.getMonth() / 3)
    const start = new Date(date.getFullYear(), q * 3, 1)
    const end = new Date(date.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999)
    return { start, end, label: `T${q + 1} ${date.getFullYear()}` }
  }
  const { start, end } = monthRange(date)
  return { start, end, label: `${cap(MONTHS[start.getMonth()])} ${start.getFullYear()}` }
}

// Periodo inmediatamente anterior (mismo tipo)
export function previousRange(period: Period, range: PeriodRange): PeriodRange {
  const ref = new Date(range.start)
  if (period === 'week') ref.setDate(ref.getDate() - 7)
  else if (period === 'quarter') ref.setMonth(ref.getMonth() - 3)
  else ref.setMonth(ref.getMonth() - 1)
  return periodRange(period, ref)
}

export interface PeriodValues {
  leads: number          // leads de Kommo + llamadas nuevas + propuestas que no vienen de una llamada
  leadsKommo: number
  leadsCalls: number     // llamadas agendadas en el periodo (sin reprogramaciones)
  leadsProposals: number // propuestas directas (sin llamada previa)
  agendadas: number      // personas agendadas = llamadas agendadas (no canceladas)
  callsAttended: number  // llamadas del periodo marcadas como asistidas
  callsNoShow: number    // llamadas del periodo marcadas como no asistidas
  callsPending: number   // llamadas ya realizadas sin marcar
  asistencia: number     // asistió ÷ (asistió + no asistió) × 100
  noShow: number         // no asistió ÷ (asistió + no asistió) × 100
  propuestas: { total: number; porAprobacion: number; aprobada: number; noCerrada: number; monto: number }
  cierres: number        // clientes nuevos (cierres de venta firmados en el periodo)
  tasaCierre: number     // cierres / leads * 100
  onboarding: number
  mrr: number            // MRR PROYECTADO: lo que los clientes deberían pagar (vigente al cierre del periodo)
  mrrServices: number
  mrrCommunity: number
  mrrCobrado: number     // parte del MRR que ya se marcó como cobrada
  facturacion: number    // FACTURACIÓN = lo cobrado: onboarding + mensualidades cobradas + otros cobros
  clientesPerdidos: number
  mrrNuevo: number          // MRR de los clientes que cerraron en el periodo
  facturacionNuevas: number // Ventas nuevas: onboarding + MRR nuevo
  porCerrar: number         // Facturación por cerrar: monto de las propuestas del periodo aún por aprobar
  porCerrarPagoUnico: number
  porCerrarMensual: number
}

interface Data {
  sales: Awaited<ReturnType<typeof loadSales>>
  proposals: { date: Date; status: string; amount: number; recurringAmount: number; callId: number | null }[]
  payments: PaymentLike[]                       // mensualidades cobradas
  paidReceivables: { amount: number; paidAt: Date }[] // otras cuentas por cobrar cobradas
  hasCalls: boolean // ¿existe alguna llamada registrada? (si no, se usa el dato de Kommo)
  calls: { bookedAt: Date; scheduledAt: Date; status: string; attendance: string; isReschedule: boolean }[]
  weekly: { weekStart: Date; leadsEntrantes: number; personasAgendadas: number }[]
}

function loadSales() {
  return prisma.salesClose.findMany({
    select: { id: true, status: true, createdAt: true, cancelledAt: true, recurringValue: true, onboardingValue: true, product: true }
  })
}

function monthsIn(range: MonthRange): MonthRange[] {
  const out: MonthRange[] = []
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  while (cursor <= range.end) {
    out.push(monthRange(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

function compute(period: Period, range: MonthRange, d: Data): PeriodValues {
  const inRange = (x: Date) => x >= range.start && x <= range.end

  const proposals = d.proposals.filter(p => inRange(p.date))
  const count = (status: string) => proposals.filter(p => p.status === status).length

  // Semanas de Kommo (guardadas con el lunes en UTC): tolerancia de 12 h por zona horaria
  const weekly = d.weekly.filter(w => w.weekStart.getTime() >= range.start.getTime() - 12 * 3600_000 && w.weekStart <= range.end)
  const leadsKommo = weekly.reduce((s, w) => s + w.leadsEntrantes, 0)

  // Llamadas: el lead nace al agendar (bookedAt); la asistencia se mide por la fecha de la llamada
  const booked = d.calls.filter(c => inRange(c.bookedAt))
  const leadsCalls = booked.filter(c => !c.isReschedule).length
  const callsBooked = booked.filter(c => c.status !== 'canceled').length
  const held = d.calls.filter(c => inRange(c.scheduledAt) && c.status !== 'canceled')
  const callsAttended = held.filter(c => c.attendance === 'attended').length
  const callsNoShow = held.filter(c => c.attendance === 'no_show').length
  const callsPending = held.filter(c => c.attendance === 'pending' && c.scheduledAt <= new Date()).length
  const marked = callsAttended + callsNoShow

  // Una propuesta que sale de una llamada ya se contó como lead al agendar
  const leadsProposals = proposals.filter(p => p.callId === null).length
  const leads = leadsKommo + leadsCalls + leadsProposals
  // Sin llamadas registradas (Calendly sin conectar) se conserva el dato histórico de Kommo
  const agendadas = d.hasCalls ? callsBooked : weekly.reduce((s, w) => s + w.personasAgendadas, 0)

  const newSales = d.sales.filter(s => inRange(s.createdAt))
  const onboarding = newSales.reduce((s, x) => s + x.onboardingValue, 0)
  const cierres = newSales.length

  // MRR proyectado al cierre del periodo (lo que los clientes deberían pagar)
  const mrr = sumMrr(d.sales, range.end)
  const mrrNuevo = newSales.filter(s => s.status === 'active').reduce((sum, s) => sum + s.recurringValue, 0)
  const pending = proposals.filter(p => p.status === 'por_aprobacion')
  const porCerrarPagoUnico = pending.reduce((sum, p) => sum + p.amount, 0)
  const porCerrarMensual = pending.reduce((sum, p) => sum + p.recurringAmount, 0)

  // Facturación = lo COBRADO. Mes: onboarding + mensualidades cobradas; trimestre: suma de sus meses ya
  // iniciados; semana: onboarding + cobros de la semana. Antes de octubre 2026 no hay registro de cobros
  // y se asume cobrado todo el MRR (ver COLLECTIONS_START).
  const otherIn = (r: MonthRange) =>
    d.paidReceivables.filter(a => a.paidAt >= r.start && a.paidAt <= r.end).reduce((sum, a) => sum + a.amount, 0)
  const onboardingIn = (r: MonthRange) =>
    d.sales.filter(s => s.createdAt >= r.start && s.createdAt <= r.end).reduce((sum, s) => sum + s.onboardingValue, 0)
  const monthCash = (m: MonthRange) => {
    const c = collectedMrr(d.sales, d.payments, m)
    return { onboarding: onboardingIn(m), mrr: c.services + c.community, other: otherIn(m) }
  }

  let cash: { onboarding: number; mrr: number; other: number }
  if (period === 'month') {
    cash = monthCash(range)
  } else if (period === 'quarter') {
    cash = monthsIn(range)
      .filter(m => m.start <= new Date())
      .map(monthCash)
      .reduce((a, c) => ({ onboarding: a.onboarding + c.onboarding, mrr: a.mrr + c.mrr, other: a.other + c.other }),
        { onboarding: 0, mrr: 0, other: 0 })
  } else {
    const paid = d.payments.filter(p => p.paidAt >= range.start && p.paidAt <= range.end).reduce((sum, p) => sum + p.amount, 0)
    cash = { onboarding, mrr: isTrackedMonth(range) ? paid : 0, other: otherIn(range) }
  }
  const facturacion = cash.onboarding + cash.mrr + cash.other

  return {
    leads,
    leadsKommo,
    leadsCalls,
    leadsProposals,
    agendadas,
    callsAttended,
    callsNoShow,
    callsPending,
    asistencia: marked > 0 ? (callsAttended / marked) * 100 : 0,
    noShow: marked > 0 ? (callsNoShow / marked) * 100 : 0,
    propuestas: {
      total: proposals.length,
      porAprobacion: count('por_aprobacion'),
      aprobada: count('aprobada'),
      noCerrada: count('no_cerrada'),
      monto: proposals.reduce((s, p) => s + p.amount, 0)
    },
    cierres,
    tasaCierre: leads > 0 ? (cierres / leads) * 100 : 0,
    onboarding,
    mrr: mrr.services + mrr.community,
    mrrServices: mrr.services,
    mrrCommunity: mrr.community,
    mrrCobrado: cash.mrr,
    facturacion,
    clientesPerdidos: d.sales.filter(s => s.status === 'cancelled' && s.cancelledAt && inRange(s.cancelledAt)).length,
    mrrNuevo,
    facturacionNuevas: onboarding + mrrNuevo,
    porCerrar: porCerrarPagoUnico + porCerrarMensual,
    porCerrarPagoUnico,
    porCerrarMensual
  }
}

export async function computePeriodMetrics(period: Period, date: Date) {
  const range = periodRange(period, date)
  const prev = previousRange(period, range)

  const [sales, proposals, weekly, calls, callCount, payments, paidReceivables] = await Promise.all([
    loadSales(),
    prisma.proposal.findMany({
      where: { date: { gte: prev.start, lte: range.end } },
      select: { date: true, status: true, amount: true, recurringAmount: true, callId: true }
    }),
    prisma.weeklyMetric.findMany({
      where: { weekStart: { gte: new Date(prev.start.getTime() - 12 * 3600_000), lte: range.end } },
      select: { weekStart: true, leadsEntrantes: true, personasAgendadas: true }
    }),
    prisma.call.findMany({
      where: {
        OR: [
          { bookedAt: { gte: prev.start, lte: range.end } },
          { scheduledAt: { gte: prev.start, lte: range.end } }
        ]
      },
      select: { bookedAt: true, scheduledAt: true, status: true, attendance: true, isReschedule: true }
    }),
    prisma.call.count(),
    prisma.clientPayment.findMany({ where: { paidAt: { gte: prev.start, lte: range.end } } }),
    prisma.accountEntry.findMany({
      where: { kind: 'receivable', status: 'paid', paidAt: { gte: prev.start, lte: range.end } },
      select: { amount: true, paidAt: true }
    })
  ])
  const data: Data = {
    sales,
    proposals,
    weekly,
    calls,
    hasCalls: callCount > 0,
    payments,
    paidReceivables: paidReceivables.flatMap(a => (a.paidAt ? [{ amount: a.amount, paidAt: a.paidAt }] : []))
  }

  return {
    period,
    label: range.label,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
    current: compute(period, range, data),
    previous: compute(period, prev, data),
    previousLabel: prev.label
  }
}
