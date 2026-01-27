import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Lista de categorías
export async function GET() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear categoría
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        color: color || '#44e1fc'
      }
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error: unknown) {
    console.error('Error creating category:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar categoría
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, color } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color })
      }
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría
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

    // Verificar si tiene gastos asociados
    const expensesCount = await prisma.expense.count({
      where: { categoryId: parseInt(id) }
    })

    if (expensesCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: tiene ${expensesCount} gastos asociados` },
        { status: 400 }
      )
    }

    await prisma.expenseCategory.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
