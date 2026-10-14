import prisma from '@/lib/db'
import type { InstallmentLike } from '@/lib/finance'

/** Agrega a cada venta sus cuotas con fecha y monto propios (tabla SaleInstallment). */
export async function attachInstallments<T extends { id: number }>(sales: T[]): Promise<(T & { installments: InstallmentLike[] })[]> {
  const rows = sales.length
    ? await prisma.saleInstallment.findMany({ where: { saleId: { in: sales.map(s => s.id) } }, select: { id: true, saleId: true, dueDate: true, amount: true } })
    : []
  const bySale = new Map<number, InstallmentLike[]>()
  for (const r of rows) {
    const list = bySale.get(r.saleId) ?? []
    list.push({ id: r.id, dueDate: r.dueDate, amount: r.amount })
    bySale.set(r.saleId, list)
  }
  return sales.map(s => ({ ...s, installments: bySale.get(s.id) ?? [] }))
}
