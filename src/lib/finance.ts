// Reglas de cálculo financiero compartidas por summary, history y export.

export interface MonthRange {
  start: Date
  end: Date
}

// Rango [primer día 00:00, último día 23:59:59.999] en hora local del servidor
export function monthRange(date: Date): MonthRange {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  }
}

interface SaleLike {
  status: string
  createdAt: Date
  cancelledAt: Date | null
  recurringValue: number
  product: string
}

/**
 * ¿El cliente aportaba MRR al cierre del mes?
 * - Debe haber firmado en o antes del mes.
 * - 'active' siempre cuenta; 'cancelled' cuenta solo si canceló después del mes.
 * - 'completed' (servicios sin recurrencia) nunca cuenta.
 */
export function isRecurringAtMonthEnd(sale: SaleLike, monthEnd: Date): boolean {
  if (sale.createdAt > monthEnd) return false
  if (sale.status === 'active') return true
  if (sale.status === 'cancelled') return !!sale.cancelledAt && sale.cancelledAt > monthEnd
  return false
}

export function sumMrr(sales: SaleLike[], monthEnd: Date) {
  let services = 0
  let community = 0
  for (const s of sales) {
    if (!isRecurringAtMonthEnd(s, monthEnd)) continue
    if (s.product === 'Comunidad') community += s.recurringValue
    else services += s.recurringValue
  }
  return { services, community }
}

interface ExpenseLike {
  type: string
  startDate: Date
  endDate: Date | null
}

// Recurrente: vigente en algún momento del mes. Fijo: solo en el mes en que se creó.
export function expenseAppliesToMonth(e: ExpenseLike, range: MonthRange): boolean {
  if (e.type === 'fixed') return e.startDate >= range.start && e.startDate <= range.end
  return e.startDate <= range.end && (!e.endDate || e.endDate >= range.start)
}
