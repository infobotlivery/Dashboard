import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse, getMonthStart } from '@/lib/api'

// GET /api/sales - Lista de cierres o resumen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary') === 'true'

    if (summary) {
      // Calcular resumen: MRR activo, totales históricos y del mes
      const monthStart = getMonthStart()

      const [activeSales, allSales, monthCloses] = await Promise.all([
        prisma.salesClose.findMany({
          where: { status: 'active' }
        }),
        prisma.salesClose.findMany(),
        prisma.salesClose.findMany({
          where: {
            createdAt: { gte: monthStart }
          }
        })
      ])

      // MRR de clientes activos
      const mrrActivo = activeSales.reduce((sum, s) => sum + s.recurringValue, 0)

      // Total histórico de onboarding (todos los cierres)
      const totalOnboardingHistorico = allSales.reduce((sum, s) => sum + s.onboardingValue, 0)

      // Onboarding solo del mes actual
      const totalOnboardingMes = monthCloses.reduce((sum, s) => sum + s.onboardingValue, 0)

      const clientesActivos = activeSales.length
      const clientesTotales = allSales.length
      const cierresMes = monthCloses.length

      return successResponse({
        mrrActivo,
        totalOnboardingHistorico,
        totalOnboardingMes,
        clientesActivos,
        clientesTotales,
        cierresMes
      })
    }

    // Lista completa de cierres ordenados por fecha
    const sales = await prisma.salesClose.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return successResponse(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return errorResponse('Error al obtener cierres de venta', 500)
  }
}

// POST /api/sales - Crear nuevo cierre
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      clientName,
      product,
      customProduct,
      onboardingValue,
      recurringValue,
      contractMonths,
      status
    } = body

    // Validación básica
    if (!clientName || !product) {
      return errorResponse('Nombre de cliente y producto son requeridos', 400)
    }

    const sale = await prisma.salesClose.create({
      data: {
        clientName,
        product,
        customProduct: product === 'Otro' ? customProduct : null,
        onboardingValue: Number(onboardingValue) || 0,
        recurringValue: Number(recurringValue) || 0,
        contractMonths: contractMonths ? Number(contractMonths) : null,
        status: status || 'active'
      }
    })

    return successResponse(sale, 201)
  } catch (error) {
    console.error('Error creating sale:', error)
    return errorResponse('Error al crear cierre de venta', 500)
  }
}

// PUT /api/sales - Actualizar cierre (principalmente cambio de estado)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const { id, ...updateData } = body

    if (!id) {
      return errorResponse('ID es requerido', 400)
    }

    // Si se cambia a cancelled, registrar fecha de cancelación
    if (updateData.status === 'cancelled') {
      updateData.cancelledAt = new Date()
    }

    // Limpiar customProduct si el producto no es "Otro"
    if (updateData.product && updateData.product !== 'Otro') {
      updateData.customProduct = null
    }

    // Convertir valores numéricos
    if (updateData.onboardingValue !== undefined) {
      updateData.onboardingValue = Number(updateData.onboardingValue) || 0
    }
    if (updateData.recurringValue !== undefined) {
      updateData.recurringValue = Number(updateData.recurringValue) || 0
    }
    if (updateData.contractMonths !== undefined) {
      updateData.contractMonths = updateData.contractMonths ? Number(updateData.contractMonths) : null
    }

    const sale = await prisma.salesClose.update({
      where: { id: Number(id) },
      data: updateData
    })

    return successResponse(sale)
  } catch (error) {
    console.error('Error updating sale:', error)
    return errorResponse('Error al actualizar cierre de venta', 500)
  }
}

// DELETE /api/sales - Eliminar cierre
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID es requerido', 400)
    }

    await prisma.salesClose.delete({
      where: { id: Number(id) }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return errorResponse('Error al eliminar cierre de venta', 500)
  }
}
