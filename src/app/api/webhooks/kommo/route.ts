import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyApiKey, errorResponse, successResponse, getWeekStart } from '@/lib/api'

// ============================================================
// TRIPLE INTEGRACIÓN KOMMO CRM
// ============================================================
// Este webhook recibe notificaciones de 3 etapas diferentes:
// 1. Etapa "EN PROCESO DE AGENDA" (64363955) → Incrementa leadsEntrantes
// 2. Etapa "SE LE ENVIÓ EL LINK DE AGENDA" (90652680) → Incrementa personasAgendadas
// 3. Etapa "SE LE ENVIO PROPUESTA" (87360808) → Incrementa pipelineActivo

const STAGE_MAPPING = {
  '64363955': { metric: 'leadsEntrantes', label: 'Leads Entrantes' },
  '90652680': { metric: 'personasAgendadas', label: 'Personas Agendadas' },
  '87360808': { metric: 'pipelineActivo', label: 'Propuestas Enviadas' }
} as const

type MetricName = 'leadsEntrantes' | 'personasAgendadas' | 'pipelineActivo'

export async function POST(request: NextRequest) {
  try {
    // Verificar API Key
    if (!verifyApiKey(request)) {
      return errorResponse('API Key inválida', 401)
    }

    const body = await request.json()
    const { leadId, leadName, fromStage, toStage } = body

    // Validaciones básicas
    if (!leadId || !leadName || !toStage) {
      return errorResponse('leadId, leadName y toStage son requeridos', 400)
    }

    // Verificar si toStage es una de las 3 etapas mapeadas
    const mapping = STAGE_MAPPING[toStage as keyof typeof STAGE_MAPPING]
    if (!mapping) {
      // Si no es una etapa que nos interesa, retornar success sin hacer nada
      console.log(`[Kommo Webhook] Etapa ${toStage} no mapeada, ignorando`)
      return successResponse({
        message: 'Etapa no mapeada',
        toStage,
        ignored: true
      })
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
          mrr: 0,
          mrrComunidad: 0,
          pipelineActivo: 0,
          personasAgendadas: 0,
          cierresSemana: 0,
          contenidoPublicado: 0,
          leadsEntrantes: 0,
          entregasPendientes: 0
        }
      })
    }

    // Incrementar la métrica correspondiente
    const metricField = mapping.metric as MetricName
    const currentValue = metric[metricField]
    const newValue = currentValue + 1

    // Actualizar métrica
    const updated = await prisma.weeklyMetric.update({
      where: { weekStart },
      data: { [metricField]: newValue }
    })

    // Guardar en log de auditoría
    await prisma.kommoWebhookLog.create({
      data: {
        leadId: Number(leadId),
        leadName: String(leadName),
        fromStage: fromStage ? String(fromStage) : null,
        toStage: String(toStage),
        metricName: metricField,
        newValue: newValue
      }
    })

    console.log(`[Kommo Webhook] ${mapping.label}: ${leadName} (${leadId}) | ${metricField}: ${currentValue} → ${newValue}`)

    return successResponse({
      metric: metricField,
      previousValue: currentValue,
      newValue: newValue,
      leadId,
      leadName,
      toStage,
      logged: true
    })

  } catch (error) {
    console.error('[Kommo Webhook] Error:', error)
    return errorResponse('Error procesando webhook', 500)
  }
}
