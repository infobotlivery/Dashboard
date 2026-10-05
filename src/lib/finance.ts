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

// ---------------------------------------------------------------------------
// Cuentas por cobrar / por pagar "a la fecha"
// ---------------------------------------------------------------------------

export interface AccountItem {
  id: string
  source: 'account' | 'expense'
  concept: string
  counterparty: string
  amount: number
  dueDate: string
  overdue: boolean
}

export interface AccountsBucket {
  pending: number
  overdue: number
  count: number
  items: AccountItem[]
}

interface AccountEntryLike {
  id: number
  kind: string
  concept: string
  counterparty: string
  amount: number
  dueDate: Date
  status: string
  paidAt: Date | null
}

interface RecurringExpenseLike extends ExpenseLike {
  id: number
  name: string
  amount: number
  billingDay: number | null
  paidByClient: string | null
  lastPaymentDate: Date | null
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Pendiente al día en que se consulta (o al cierre del mes si es un mes pasado):
 * - Por cobrar: cuentas manuales vencidas o por vencer dentro del mes y aún sin cobrar a esa fecha.
 * - Por pagar: cuentas manuales + gastos recurrentes del mes con día de cobro cuyo pago
 *   no se ha marcado (solo mes actual; en meses pasados se asumen pagados).
 *   Los gastos que paga un cliente no cuentan.
 */
export function buildAccounts(
  entries: AccountEntryLike[],
  expenses: RecurringExpenseLike[],
  range: MonthRange,
  now: Date
): { receivable: AccountsBucket; payable: AccountsBucket } {
  const asOf = now < range.end ? now : range.end
  const today = startOfDay(asOf)
  const isCurrentMonth = now >= range.start && now <= range.end

  const toBucket = (items: AccountItem[]): AccountsBucket => {
    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return {
      pending: items.reduce((s, i) => s + i.amount, 0),
      overdue: items.filter(i => i.overdue).reduce((s, i) => s + i.amount, 0),
      count: items.length,
      items
    }
  }

  const fromEntries = (kind: string): AccountItem[] =>
    entries
      .filter(e => e.kind === kind && e.dueDate <= range.end)
      .filter(e => e.status === 'pending' || (e.paidAt !== null && e.paidAt > asOf))
      .map(e => ({
        id: `account-${e.id}`,
        source: 'account' as const,
        concept: e.concept,
        counterparty: e.counterparty,
        amount: e.amount,
        dueDate: e.dueDate.toISOString(),
        overdue: e.dueDate < today
      }))

  const expenseItems: AccountItem[] = isCurrentMonth
    ? expenses
        .filter(e => e.type === 'recurring' && e.billingDay !== null && !e.paidByClient)
        .filter(e => expenseAppliesToMonth(e, range))
        .filter(e => !e.lastPaymentDate || e.lastPaymentDate < range.start)
        .map(e => {
          const lastDay = range.end.getDate()
          const due = new Date(range.start.getFullYear(), range.start.getMonth(), Math.min(e.billingDay as number, lastDay))
          return {
            id: `expense-${e.id}`,
            source: 'expense' as const,
            concept: e.name,
            counterparty: '',
            amount: e.amount,
            dueDate: due.toISOString(),
            overdue: due < today
          }
        })
    : []

  return {
    receivable: toBucket(fromEntries('receivable')),
    payable: toBucket([...fromEntries('payable'), ...expenseItems])
  }
}
