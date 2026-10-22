import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

// Cuotas de un cliente ya registrado: ver, agregar y quitar (las ya cobradas no se pueden quitar)

async function listWithPaid(saleId: number) {
  const [rows, payments] = await Promise.all([
    prisma.saleInstallment.findMany({ where: { saleId }, orderBy: { dueDate: 'asc' } }),
    prisma.clientPayment.findMany({ where: { saleId, forMonth: { startsWith: 'c' } } })
  ])
  const paid = new Set(payments.map(p => p.forMonth))
  return rows.map(r => ({ id: r.id, dueDate: r.dueDate, amount: r.amount, paid: paid.has(`c${r.id}`) }))
}

// GET /api/sales/installments?saleId=
export async function GET(request: NextRequest) {
  try {
    const saleId = Number(new URL(request.url).searchParams.get('saleId'))
    if (!saleId) return errorResponse('saleId es requerido', 400)
    return successResponse(await listWithPaid(saleId))
  } catch (error) {
    console.error('Error listing installments:', error)
    return errorResponse('Error al cargar las cuotas', 500)
  }
}

// POST /api/sales/installments { saleId, installments: [{ dueDate, amount }] } — agrega cuotas
export async function POST(request: NextRequest) {
  try {
    const { saleId, installments } = await request.json()
    if (!saleId || !Array.isArray(installments) || installments.length === 0) {
      return errorResponse('saleId y al menos una cuota son requeridos', 400)
    }
    const sale = await prisma.salesClose.findUnique({ where: { id: Number(saleId) } })
    if (!sale) return errorResponse('Cliente no encontrado', 404)

    const data: { saleId: number; dueDate: Date; amount: number }[] = []
    for (const row of installments) {
      const due = new Date(row?.dueDate)
      const amount = Number(row?.amount)
      if (isNaN(due.getTime()) || !(amount > 0)) return errorResponse('Cada cuota necesita una fecha válida y un monto mayor que 0', 400)
      data.push({ saleId: sale.id, dueDate: due, amount })
    }
    await prisma.saleInstallment.createMany({ data })
    return successResponse(await listWithPaid(sale.id), 201)
  } catch (error) {
    console.error('Error adding installments:', error)
    return errorResponse('Error al agregar las cuotas', 500)
  }
}

// DELETE /api/sales/installments?id= — quita una cuota (no si ya está cobrada)
export async function DELETE(request: NextRequest) {
  try {
    const id = Number(new URL(request.url).searchParams.get('id'))
    if (!id) return errorResponse('ID es requerido', 400)
    const row = await prisma.saleInstallment.findUnique({ where: { id } })
    if (!row) return errorResponse('Cuota no encontrada', 404)
    const paid = await prisma.clientPayment.findFirst({ where: { saleId: row.saleId, forMonth: `c${id}` } })
    if (paid) return errorResponse('Esa cuota ya está cobrada: primero desmarca el cobro', 409)
    await prisma.chargeAdjustment.deleteMany({ where: { saleId: row.saleId, forMonth: `c${id}` } })
    await prisma.saleInstallment.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting installment:', error)
    return errorResponse('Error al quitar la cuota', 500)
  }
}
