import { NextRequest, NextResponse } from 'next/server'
import { computePeriodMetrics, type Period, type PeriodValues } from '@/lib/periodMetrics'
import { parseLocalDate } from '@/lib/dates'

const PERIODS: Period[] = ['week', 'month', 'quarter']
const csv = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
const num = (n: number) => String(Math.round(n * 100) / 100)

// GET /api/metrics/export?period=week|month|quarter&date=YYYY-MM-DD — CSV con las métricas del periodo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') || 'month') as Period
  if (!PERIODS.includes(period)) return NextResponse.json({ success: false, error: 'period inválido' }, { status: 400 })

  const dateParam = searchParams.get('date')
  const date = dateParam && /^\d{4}-\d{2}(-\d{2})?$/.test(dateParam)
    ? parseLocalDate(dateParam.length === 7 ? `${dateParam}-01` : dateParam)
    : new Date()

  const m = await computePeriodMetrics(period, date)
  const lines: [string, (v: PeriodValues) => number][] = [
    ['1. EMBUDO', () => NaN],
    ['Leads (llamadas agendadas + propuestas directas)', v => v.leads],
    ['  Llamadas agendadas (leads)', v => v.leadsCalls],
    ['  Propuestas directas (leads)', v => v.leadsProposals],
    ['Llamadas agendadas activas (personas agendadas)', v => v.agendadas],
    ['Llamadas que asistieron', v => v.callsAttended],
    ['Llamadas que no asistieron', v => v.callsNoShow],
    ['Llamadas por marcar', v => v.callsPending],
    ['Tasa de asistencia (%)', v => v.asistencia],
    ['Propuestas enviadas', v => v.propuestas.total],
    ['  Por aprobación', v => v.propuestas.porAprobacion],
    ['  Aprobadas', v => v.propuestas.aprobada],
    ['  No cerradas', v => v.propuestas.noCerrada],
    ['Clientes nuevos', v => v.cierres],
    ['% de cierre (clientes nuevos / llamadas asistidas)', v => v.tasaCierre],
    ['Conversaciones calificadas en Kommo (aparte, no suma a leads)', v => v.leadsKommo],
    ['2. VENTAS', () => NaN],
    ['Venta nueva (USD)', v => v.facturacionNuevas],
    ['  Onboarding (USD)', v => v.onboarding],
    ['  MRR nuevo (USD)', v => v.mrrNuevo],
    ['Facturación por cerrar (USD)', v => v.porCerrar],
    ['  Por cerrar: pago único (USD)', v => v.porCerrarPagoUnico],
    ['  Por cerrar: mensual (USD)', v => v.porCerrarMensual],
    ['3. DINERO', () => NaN],
    ['Facturación cobrada (USD)', v => v.facturacion],
    ['  MRR cobrado (USD)', v => v.mrrCobrado],
    ['4. BASE RECURRENTE (MRR)', () => NaN],
    ['MRR activo / proyectado (USD)', v => v.mrr],
    ['  MRR servicios (USD)', v => v.mrrServices],
    ['  MRR comunidad (USD)', v => v.mrrCommunity],
    ['MRR nuevo (USD)', v => v.mrrNuevo],
    ['MRR perdido (USD)', v => v.mrrPerdido],
    ['Churn de MRR (%)', v => v.churnPct],
    ['MRR neto (USD)', v => v.mrrNeto],
    ['Clientes activos', v => v.clientesActivos],
    ['Clientes perdidos', v => v.clientesPerdidos]
  ]

  const rows = [`Métrica,${csv(m.label)},${csv(m.previousLabel)}`]
  for (const [name, get] of lines) {
    const cur = get(m.current)
    rows.push(Number.isNaN(cur) ? `${csv(name)},,` : `${csv(name)},${num(cur)},${num(get(m.previous))}`)
  }

  return new NextResponse('﻿' + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="metricas_${period}_${m.start.slice(0, 10)}.csv"`
    }
  })
}
