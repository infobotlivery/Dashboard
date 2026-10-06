import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { isCalendlyConfigured } from '@/lib/calendly'

const ATTENDANCE = ['pending', 'attended', 'no_show']

// GET /api/calls — todas las llamadas (más recientes primero) + si Calendly está conectado
export async function GET() {
  try {
    const calls = await prisma.call.findMany({ orderBy: { scheduledAt: 'desc' } })

    // Propuestas vinculadas a cada llamada
    const proposals = await prisma.proposal.findMany({
      where: { callId: { in: calls.map(c => c.id) } },
      select: { id: true, callId: true, amount: true, status: true }
    })
    const byCall = new Map(proposals.map(p => [p.callId, p]))

    return successResponse({
      configured: isCalendlyConfigured(),
      calls: calls.map(c => ({ ...c, proposal: byCall.get(c.id) ?? null }))
    })
  } catch (error) {
    console.error('Error fetching calls:', error)
    return errorResponse('Error al obtener llamadas', 500)
  }
}

// POST /api/calls — agregar una llamada manualmente
export async function POST(request: NextRequest) {
  try {
    const { leadName, leadEmail = '', scheduledAt, budget, notes } = await request.json()
    if (!leadName?.trim()) return errorResponse('El nombre del lead es requerido')
    const when = new Date(scheduledAt)
    if (!scheduledAt || isNaN(when.getTime())) return errorResponse('Fecha de la llamada inválida')

    const call = await prisma.call.create({
      data: {
        leadName: leadName.trim(),
        leadEmail: String(leadEmail).trim(),
        eventName: 'Llamada manual',
        scheduledAt: when,
        bookedAt: new Date(),
        budget: budget?.trim() || null,
        notes: notes?.trim() || null,
        source: 'manual'
      }
    })
    return successResponse(call, 201)
  } catch (error) {
    console.error('Error creating call:', error)
    return errorResponse('Error al crear la llamada', 500)
  }
}

// PATCH /api/calls — { id, attendance } marca asistencia; también acepta budget / notes
export async function PATCH(request: NextRequest) {
  try {
    const { id, attendance, budget, notes } = await request.json()
    if (!id) return errorResponse('ID es requerido')
    if (attendance !== undefined && !ATTENDANCE.includes(attendance)) {
      return errorResponse('Asistencia inválida (pending | attended | no_show)')
    }

    const call = await prisma.call.update({
      where: { id: Number(id) },
      data: {
        ...(attendance !== undefined && { attendance }),
        ...(budget !== undefined && { budget: budget?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      }
    })
    return successResponse(call)
  } catch (error) {
    console.error('Error updating call:', error)
    return errorResponse('Error al actualizar la llamada', 500)
  }
}

// DELETE /api/calls?id=
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return errorResponse('ID es requerido')
    await prisma.call.delete({ where: { id: Number(id) } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting call:', error)
    return errorResponse('Error al eliminar la llamada', 500)
  }
}
