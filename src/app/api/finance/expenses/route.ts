import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Lista de gastos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const whereClause = activeOnly
      ? {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        }
      : {}

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar gastos' },
      { status: 500 }
    )
  }
}

// POST - Crear gasto
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, amount, type, categoryId, startDate, notes, billingDay, paidByClient } = body

    if (!name || !amount || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Nombre, monto y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Validar billingDay si se proporciona
    if (billingDay !== undefined && billingDay !== null && billingDay !== '') {
      const day = parseInt(billingDay)
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { success: false, error: 'Día de cobro debe ser entre 1 y 31' },
          { status: 400 }
        )
      }
    }

    const expense = await prisma.expense.create({
      data: {
        name: name.trim(),
        amount: parseFloat(amount),
        type: type || 'recurring',
        categoryId: parseInt(categoryId),
        startDate: startDate ? new Date(startDate) : new Date(),
        notes: notes || null,
        billingDay: billingDay ? parseInt(billingDay) : null,
        paidByClient: paidByClient?.trim() || null
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear gasto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar gasto
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, amount, type, categoryId, startDate, endDate, notes, billingDay, paidByClient } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Validar billingDay si se proporciona
    if (billingDay !== undefined && billingDay !== null && billingDay !== '') {
      const day = parseInt(billingDay)
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { success: false, error: 'Día de cobro debe ser entre 1 y 31' },
          { status: 400 }
        )
      }
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(billingDay !== undefined && { billingDay: billingDay ? parseInt(billingDay) : null }),
        ...(paidByClient !== undefined && { paidByClient: paidByClient?.trim() || null })
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar gasto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar gasto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}
