import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse, getWeekStart } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    // Verificar API Key
    if (!verifyApiKey(request)) {
      return errorResponse('API Key inválida', 401)
    }

    const body = await request.json()
    const { leadId, leadName, fromStage, toStage } = body

    // Validaciones básicas
    if (!leadId || !leadName) {
      return errorResponse('leadId y leadName son requeridos', 400)
    }

    // Obtener métrica de la semana actual
    const weekStart = getWeekStart()

    let metric = await prisma.weeklyMetric.findUnique({
      where: { weekStart }
    })

    // Si no existe, crear con valores por defecto
    if (!metric) {
      metric = await prisma.weeklyMetric.create({
        data: {
          weekStart,
          pipelineActivo: 0,
          mrr: 0,
          mrrComunidad: 0,
          cierresSemana: 0,
          contenidoPublicado: 0,
          leadsEntrantes: 0,
          entregasPendientes: 0
        }
      })
    }

    // Incrementar pipelineActivo (solo incrementar, nunca decrementar)
    const newValue = metric.pipelineActivo + 1

    // Actualizar métrica
    const updated = await prisma.weeklyMetric.update({
      where: { weekStart },
      data: { pipelineActivo: newValue }
    })

    // Guardar en log de auditoría
    await prisma.kommoWebhookLog.create({
      data: {
        leadId: Number(leadId),
        leadName: String(leadName),
        fromStage: fromStage ? String(fromStage) : null,
        toStage: toStage ? String(toStage) : 'Calificado',
        action: 'increment',
        pipelineActivo: newValue
      }
    })

    console.log(`[Kommo Webhook] Lead calificado: ${leadName} (${leadId}) | pipelineActivo: ${newValue}`)

    return successResponse({
      pipelineActivo: updated.pipelineActivo,
      leadId,
      leadName,
      logged: true
    })

  } catch (error) {
    console.error('[Kommo Webhook] Error:', error)
    return errorResponse('Error procesando webhook', 500)
  }
}
