import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Obtener metas (todas o de un mes específico)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')

    if (monthParam) {
      // Obtener meta de un mes específico
      const month = new Date(monthParam)
      month.setUTCHours(0, 0, 0, 0)

      const goal = await prisma.monthlyGoal.findUnique({
        where: { month }
      })

      return NextResponse.json({ success: true, data: goal })
    }

    // Obtener todas las metas (últimos 12 meses)
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const goals = await prisma.monthlyGoal.findMany({
      where: {
        month: { gte: twelveMonthsAgo }
      },
      orderBy: { month: 'desc' }
    })

    return NextResponse.json({ success: true, data: goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cargar metas' },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, incomeTarget, expenseLimit, savingsTarget, notes } = body

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'El mes es requerido' },
        { status: 400 }
      )
    }

    const monthDate = new Date(month)
    monthDate.setUTCHours(0, 0, 0, 0)

    // Upsert - crear o actualizar
    const goal = await prisma.monthlyGoal.upsert({
      where: { month: monthDate },
      update: {
        incomeTarget: incomeTarget ?? 0,
        expenseLimit: expenseLimit ?? 0,
        savingsTarget: savingsTarget ?? 0,
        notes: notes ?? null
      },
      create: {
        month: monthDate,
        incomeTarget: incomeTarget ?? 0,
        expenseLimit: expenseLimit ?? 0,
        savingsTarget: savingsTarget ?? 0,
        notes: notes ?? null
      }
    })

    return NextResponse.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error saving goal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al guardar meta' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar meta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await prisma.monthlyGoal.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar meta' },
      { status: 500 }
    )
  }
}
