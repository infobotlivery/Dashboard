import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
const ATT: Record<string, string> = { pending: 'Pendiente', attended: 'Asistió', no_show: 'No asistió' }

// GET /api/calls/export?month=YYYY-MM (opcional) — CSV de llamadas
export async function GET(request: NextRequest) {
  const month = new URL(request.url).searchParams.get('month')
  let where = {}
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    where = { scheduledAt: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59, 999) } }
  }
  const calls = await prisma.call.findMany({ where, orderBy: { scheduledAt: 'asc' } })

  const rows = ['Lead,Email,Fecha llamada,Agendada el,Presupuesto,Estado,Asistencia,Origen']
  for (const c of calls) {
    rows.push([
      csv(c.leadName), csv(c.leadEmail), csv(c.scheduledAt.toISOString()), csv(c.bookedAt.toISOString()),
      csv(c.budget), csv(c.status === 'canceled' ? 'Cancelada' : 'Agendada'), csv(ATT[c.attendance]), csv(c.source)
    ].join(','))
  }

  return new NextResponse('﻿' + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="llamadas${month ? `_${month}` : ''}.csv"`
    }
  })
}
