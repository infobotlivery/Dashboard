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
    ['Leads', v => v.leads],
    ['  Leads Kommo', v => v.leadsKommo],
    ['  Leads por llamadas agendadas', v => v.leadsCalls],
    ['  Leads por propuestas directas', v => v.leadsProposals],
    ['Personas agendadas (llamadas)', v => v.agendadas],
    ['Llamadas que asistieron', v => v.callsAttended],
    ['Llamadas que no asistieron', v => v.callsNoShow],
    ['Llamadas sin marcar', v => v.callsPending],
    ['Tasa de asistencia (%)', v => v.asistencia],
    ['Tasa de no asistencia (%)', v => v.noShow],
    ['Propuestas enviadas', v => v.propuestas.total],
    ['  Por aprobación', v => v.propuestas.porAprobacion],
    ['  Aprobadas', v => v.propuestas.aprobada],
    ['  No cerradas', v => v.propuestas.noCerrada],
    ['Monto de propuestas (USD)', v => v.propuestas.monto],
    ['Cierres (clientes nuevos)', v => v.cierres],
    ['% de cierre', v => v.tasaCierre],
    ['Onboarding (USD)', v => v.onboarding],
    ['Facturación (USD)', v => v.facturacion],
    ['Facturación de ventas nuevas (USD)', v => v.facturacionNuevas],
    ['MRR de clientes nuevos (USD)', v => v.mrrNuevo],
    ['MRR por cerrar (USD)', v => v.mrrPorCerrar],
    ['MRR clientes (USD)', v => v.mrr],
    ['  MRR servicios (USD)', v => v.mrrServices],
    ['  MRR comunidad (USD)', v => v.mrrCommunity],
    ['Clientes perdidos', v => v.clientesPerdidos]
  ]

  const rows = [`Métrica,${csv(m.label)},${csv(m.previousLabel)}`]
  for (const [name, get] of lines) rows.push(`${csv(name)},${num(get(m.current))},${num(get(m.previous))}`)

  return new NextResponse('﻿' + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="metricas_${period}_${m.start.slice(0, 10)}.csv"`
    }
  })
}
