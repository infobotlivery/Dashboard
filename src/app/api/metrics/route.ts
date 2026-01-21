import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse, getWeekStart } from '@/lib/api'

// GET /api/metrics - Obtener métricas semanales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const current = searchParams.get('current') === 'true'

    if (current) {
      const weekStart = getWeekStart()
      let metric = await prisma.weeklyMetric.findUnique({
        where: { weekStart }
      })

      // Si no existe, crear uno con valores por defecto
      if (!metric) {
        metric = await prisma.weeklyMetric.create({
          data: { weekStart }
        })
      }

      return successResponse(metric)
    }

    const metrics = await prisma.weeklyMetric.findMany({
      orderBy: { weekStart: 'desc' },
      take: limit
    })

    return successResponse(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return errorResponse('Error al obtener métricas', 500)
  }
}

// POST /api/metrics - Crear o actualizar métrica semanal
export async function POST(request: NextRequest) {
  try {
    // Verificar API key para acceso externo (N8N)
    const isApiRequest = request.headers.get('X-API-Key')
    if (isApiRequest && !verifyApiKey(request)) {
      return errorResponse('API Key inválida', 401)
    }

    const body = await request.json()
    const { weekStart: weekStartStr, ...data } = body

    console.log('[Metrics POST] Datos recibidos:', JSON.stringify(body))

    // Si no se proporciona fecha, usar la semana actual
    const weekStart = weekStartStr
      ? new Date(weekStartStr)
      : getWeekStart()

    console.log('[Metrics POST] weekStart:', weekStart.toISOString())

    // Sanitizar datos numéricos - campos base que siempre existen
    const sanitizedData: Record<string, number> = {}
    const baseFields = ['mrr', 'pipelineActivo', 'cierresSemana', 'contenidoPublicado', 'leadsEntrantes', 'entregasPendientes']

    for (const field of baseFields) {
      if (data[field] !== undefined) {
        sanitizedData[field] = Number(data[field]) || 0
      }
    }

    // Agregar mrrComunidad si está presente (campo nuevo, puede no existir en DB antigua)
    if (data.mrrComunidad !== undefined) {
      sanitizedData.mrrComunidad = Number(data.mrrComunidad) || 0
    }

    console.log('[Metrics POST] Datos sanitizados:', JSON.stringify(sanitizedData))

    // Upsert: crear si no existe, actualizar si existe
    const metric = await prisma.weeklyMetric.upsert({
      where: { weekStart },
      update: {
        ...sanitizedData,
        updatedAt: new Date()
      },
      create: {
        weekStart,
        ...sanitizedData
      }
    })

    console.log('[Metrics POST] Métrica guardada:', metric.id)

    return successResponse(metric, 201)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[Metrics POST] Error:', errorMessage)
    console.error('[Metrics POST] Stack:', errorStack)
    return errorResponse(`Error al guardar métrica: ${errorMessage}`, 500)
  }
}
