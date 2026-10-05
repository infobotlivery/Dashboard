import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'

const KINDS = ['receivable', 'payable']

// Acepta 'YYYY-MM-DD' (como fecha local) o un ISO completo
function parseDueDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// GET /api/finance/accounts?kind=receivable|payable&status=pending|paid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kind = searchParams.get('kind')
    const status = searchParams.get('status')

    const accounts = await prisma.accountEntry.findMany({
      where: {
        ...(kind && KINDS.includes(kind) && { kind }),
        ...(status && { status })
      },
      orderBy: [{ status: 'desc' }, { dueDate: 'asc' }]
    })
    return successResponse(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return errorResponse('Error al cargar cuentas', 500)
  }
}

// POST /api/finance/accounts
export async function POST(request: NextRequest) {
  try {
    const { kind, concept, counterparty, amount, dueDate, notes } = await request.json()

    if (!KINDS.includes(kind)) return errorResponse('Tipo inválido (receivable | payable)')
    if (!concept?.trim()) return errorResponse('El concepto es requerido')
    if (!(Number(amount) > 0)) return errorResponse('El monto debe ser mayor a 0')
    const due = parseDueDate(dueDate)
    if (!due) return errorResponse('Fecha de vencimiento inválida')

    const account = await prisma.accountEntry.create({
      data: {
        kind,
        concept: concept.trim(),
        counterparty: (counterparty || '').trim(),
        amount: Number(amount),
        dueDate: due,
        notes: notes || null
      }
    })
    return successResponse(account, 201)
  } catch (error) {
    console.error('Error creating account:', error)
    return errorResponse('Error al crear cuenta', 500)
  }
}

// PUT /api/finance/accounts - Editar
export async function PUT(request: NextRequest) {
  try {
    const { id, concept, counterparty, amount, dueDate, notes } = await request.json()
    if (!id) return errorResponse('ID es requerido')
    if (!concept?.trim()) return errorResponse('El concepto es requerido')
    if (!(Number(amount) > 0)) return errorResponse('El monto debe ser mayor a 0')
    const due = parseDueDate(dueDate)
    if (!due) return errorResponse('Fecha de vencimiento inválida')

    const account = await prisma.accountEntry.update({
      where: { id: Number(id) },
      data: {
        concept: concept.trim(),
        counterparty: (counterparty || '').trim(),
        amount: Number(amount),
        dueDate: due,
        notes: notes || null
      }
    })
    return successResponse(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return errorResponse('Error al actualizar cuenta', 500)
  }
}

// PATCH /api/finance/accounts - Marcar como pagada/cobrada (o reabrir con paid:false)
export async function PATCH(request: NextRequest) {
  try {
    const { id, paid = true } = await request.json()
    if (!id) return errorResponse('ID es requerido')

    const account = await prisma.accountEntry.update({
      where: { id: Number(id) },
      data: paid
        ? { status: 'paid', paidAt: new Date() }
        : { status: 'pending', paidAt: null }
    })
    return successResponse(account)
  } catch (error) {
    console.error('Error toggling account:', error)
    return errorResponse('Error al actualizar cuenta', 500)
  }
}

// DELETE /api/finance/accounts?id=
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return errorResponse('ID es requerido')
    await prisma.accountEntry.delete({ where: { id: Number(id) } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return errorResponse('Error al eliminar cuenta', 500)
  }
}
