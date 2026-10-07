import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { monthRange, monthKey, expenseAppliesToMonth } from '@/lib/finance'
import { parseLocalDate } from '@/lib/dates'

export const dynamic = 'force-dynamic'

const parseMonth = (param: string | null) =>
  param && /^\d{4}-\d{2}$/.test(param) ? parseLocalDate(`${param}-01`) : new Date()

// GET /api/finance/review?month=YYYY-MM
// Gastos del mes agrupados por categoría, con su estado de revisión (sigue / cambió / cancelado).
// Solo los gastos mensuales (fijo mensual y variable) necesitan revisión; los únicos solo se muestran.
export async function GET(request: NextRequest) {
  try {
    const range = monthRange(parseMonth(new URL(request.url).searchParams.get('month')))
    const key = monthKey(range.start)
    const prevRange = monthRange(new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1))

    const [expenses, reviews] = await Promise.all([
      prisma.expense.findMany({ include: { category: true } }),
      prisma.expenseReview.findMany({ where: { month: key } })
    ])
    const reviewById = new Map(reviews.map(r => [r.expenseId, r.action]))
    const inMonth = expenses.filter(e => expenseAppliesToMonth(e, range))
    const items = inMonth.map(e => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      type: e.type,
      category: e.category.name,
      categoryColor: e.category.color,
      billingDay: e.billingDay,
      paidByClient: e.paidByClient,
      startDate: e.startDate.toISOString(),
      needsReview: e.type !== 'fixed',
      action: reviewById.get(e.id) ?? null
    }))

    const sum = (list: { amount: number }[]) => list.reduce((s, x) => s + x.amount, 0)
    const byType = (t: string) => items.filter(i => i.type === t)
    const groups = Object.values(
      items.reduce((acc, i) => {
        acc[i.category] ??= { category: i.category, color: i.categoryColor, items: [] as typeof items, total: 0 }
        acc[i.category].items.push(i)
        acc[i.category].total += i.amount
        return acc
      }, {} as Record<string, { category: string; color: string; items: typeof items; total: number }>)
    ).sort((a, b) => b.total - a.total)
    groups.forEach(g => g.items.sort((a, b) => b.amount - a.amount))

    return successResponse({
      month: key,
      groups,
      totals: {
        total: sum(items),
        fijos: sum(byType('recurring')),
        variables: sum(byType('variable')),
        unicos: sum(byType('fixed')),
        previous: sum(expenses.filter(e => expenseAppliesToMonth(e, prevRange)))
      },
      pending: items.filter(i => i.needsReview && !i.action).length,
      reviewed: items.filter(i => i.needsReview && i.action).length
    })
  } catch (error) {
    console.error('Error en revisión de gastos:', error)
    return errorResponse('Error al cargar la revisión de gastos', 500)
  }
}

// POST /api/finance/review { expenseId, month: "YYYY-MM", action: "keep" | "cancel" | "change", amount? }
//  - keep:   confirma que el gasto sigue este mes.
//  - cancel: el gasto deja de contarse desde este mes (fecha de fin = último día del mes anterior).
//  - change: nuevo monto desde este mes. El mes anterior conserva el monto viejo (se crea una nueva versión del gasto).
export async function POST(request: NextRequest) {
  try {
    const { expenseId, month, action, amount } = await request.json()
    if (!expenseId || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month) || !['keep', 'cancel', 'change'].includes(action)) {
      return errorResponse('expenseId, month (AAAA-MM) y action (keep, cancel o change) son requeridos')
    }
    const range = monthRange(parseLocalDate(`${month}-01`))
    const expense = await prisma.expense.findUnique({ where: { id: Number(expenseId) } })
    if (!expense) return errorResponse('Gasto no encontrado', 404)
    if (!expenseAppliesToMonth(expense, range)) return errorResponse('Ese gasto no está vigente en el mes indicado')
    const endOfPrev = new Date(range.start.getTime() - 1)
    const mark = (id: number, a: string) =>
      prisma.expenseReview.upsert({
        where: { expenseId_month: { expenseId: id, month } },
        create: { expenseId: id, month, action: a },
        update: { action: a }
      })

    if (action === 'keep') {
      await mark(expense.id, 'keep')
    } else if (action === 'cancel') {
      await prisma.$transaction([
        prisma.expense.update({ where: { id: expense.id }, data: { endDate: endOfPrev } }),
        mark(expense.id, 'cancelled')
      ])
    } else {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) return errorResponse('El nuevo monto debe ser mayor que 0')
      if (expense.startDate >= range.start) {
        // Empezó este mes: no hay historia que conservar
        await prisma.$transaction([
          prisma.expense.update({ where: { id: expense.id }, data: { amount: value } }),
          mark(expense.id, 'changed')
        ])
      } else {
        const created = await prisma.$transaction(async tx => {
          await tx.expense.update({ where: { id: expense.id }, data: { endDate: endOfPrev } })
          const next = await tx.expense.create({
            data: {
              name: expense.name, amount: value, type: expense.type, categoryId: expense.categoryId,
              startDate: range.start, notes: expense.notes, billingDay: expense.billingDay, paidByClient: expense.paidByClient
            }
          })
          await tx.expenseReview.upsert({
            where: { expenseId_month: { expenseId: next.id, month } },
            create: { expenseId: next.id, month, action: 'changed' },
            update: { action: 'changed' }
          })
          return next
        })
        return successResponse({ id: created.id })
      }
    }
    return successResponse({ id: expense.id })
  } catch (error) {
    console.error('Error al guardar la revisión:', error)
    return errorResponse('Error al guardar la revisión', 500)
  }
}
