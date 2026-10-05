import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api'
import { computePeriodMetrics, type Period } from '@/lib/periodMetrics'
import { parseLocalDate } from '@/lib/dates'

const PERIODS: Period[] = ['week', 'month', 'quarter']

// GET /api/metrics/period?period=week|month|quarter&date=YYYY-MM-DD
// Métricas calculadas automáticamente (leads, agendadas, propuestas, cierres, % cierre, MRR...)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'month') as Period
    if (!PERIODS.includes(period)) return errorResponse('period inválido (week | month | quarter)')

    const dateParam = searchParams.get('date')
    const date = dateParam && /^\d{4}-\d{2}(-\d{2})?$/.test(dateParam)
      ? parseLocalDate(dateParam.length === 7 ? `${dateParam}-01` : dateParam)
      : new Date()

    return successResponse(await computePeriodMetrics(period, date))
  } catch (error) {
    console.error('Error computing period metrics:', error)
    return errorResponse('Error al calcular métricas', 500)
  }
}
