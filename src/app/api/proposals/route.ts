import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/proposals — lista completa, soporta ?status= y ?month=YYYY-MM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const month = searchParams.get('month') // 'YYYY-MM'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      const start = new Date(year, mon - 1, 1)
      const end = new Date(year, mon, 0, 23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: proposals.map(p => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener propuestas' }, { status: 500 })
  }
}

// POST /api/proposals — crear propuesta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, company = '', service = '', amount = 0, date, status = 'por_aprobacion', notes } = body

    if (!clientName) {
      return NextResponse.json({ success: false, error: 'clientName es requerido' }, { status: 400 })
    }

    const proposal = await prisma.proposal.create({
      data: {
        clientName,
        company,
        service,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        status,
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...proposal,
        date: proposal.date.toISOString(),
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ success: false, error: 'Error al crear propuesta' }, { status: 500 })
  }
}

// PUT /api/proposals — actualizar (requiere id en body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, clientName, company, service, amount, date, status, notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }

    const proposal = await prisma.proposal.update({
      where: { id: Number(id) },
      data: {
        ...(clientName !== undefined && { clientName }),
        ...(company !== undefined && { company }),
        ...(service !== undefined && { service }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...proposal,
        date: proposal.date.toISOString(),
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar propuesta' }, { status: 500 })
  }
}

// DELETE /api/proposals?id=X
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }

    await prisma.proposal.delete({ where: { id: Number(id) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar propuesta' }, { status: 500 })
  }
}
