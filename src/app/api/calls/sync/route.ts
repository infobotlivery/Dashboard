import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api'
import { syncCalls } from '@/lib/callsSync'

// POST /api/calls/sync — { days?, force? } sincroniza Calendly → llamadas.
// El dashboard lo llama al abrirse y cada pocos minutos mientras está abierto.
export async function POST(request: NextRequest) {
  let body: { days?: number; force?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    // sin cuerpo
  }
  const days = Math.min(Math.max(Number(body.days) || 120, 7), 730)
  return successResponse(await syncCalls({ days, force: body.force === true }))
}
