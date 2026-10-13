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

export function sumMrr(sales: SaleLike[], monthEnd: Date, adjustments: AdjustmentLike[] = []) {
  let services = 0
  let community = 0
  const key = monthKey(monthEnd)
  for (const s of sales) {
    if (!isRecurringAtMonthEnd(s, monthEnd)) continue
    // Si ese mes se ajustó el cobro de este cliente, el MRR del mes usa el monto ajustado
    const id = (s as { id?: number }).id
    const adj = id === undefined ? undefined : adjustments.find(a => a.saleId === id && a.forMonth === key)
    const value = adj ? adj.amount : s.recurringValue
    if (s.product === 'Comunidad') community += value
    else services += value
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
  source: 'account' | 'expense' | 'client'
  expenseId?: number   // solo source 'expense': gasto que se puede marcar como pagado
  saleId?: number      // solo source 'client': cliente al que se le cobra
  forMonth?: string    // solo source 'client': mes de la mensualidad
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
  upcoming?: AccountItem[] // cuotas de meses posteriores (no suman a pendiente: aún no vencen)
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
 * - Por pagar: cuentas manuales + gastos mensuales (fijos y variables) del mes cuyo pago
 *   no se ha marcado (vencen el día de cobro o, sin él, el día en que empezó el gasto) (solo mes actual; en meses pasados se asumen pagados).
 *   Los gastos que paga un cliente no cuentan.
 */
export function buildAccounts(
  entries: AccountEntryLike[],
  expenses: RecurringExpenseLike[],
  range: MonthRange,
  now: Date,
  clientCharges: ClientCharge[] = []
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
        .filter(e => (e.type === 'recurring' || e.type === 'variable') && !e.paidByClient)
        .filter(e => expenseAppliesToMonth(e, range))
        .filter(e => !e.lastPaymentDate || e.lastPaymentDate < range.start)
        .map(e => {
          const lastDay = range.end.getDate()
          const due = new Date(range.start.getFullYear(), range.start.getMonth(), Math.min(e.billingDay ?? e.startDate.getDate(), lastDay))
          return {
            id: `expense-${e.id}`,
            expenseId: e.id,
            source: 'expense' as const,
            concept: e.name,
            counterparty: '',
            amount: e.amount,
            dueDate: due.toISOString(),
            overdue: due < today
          }
        })
    : []

  // Mensualidades de clientes aún sin cobrar (mes en seguimiento)
  const clientItems: AccountItem[] = clientCharges
    .filter(c => !c.paid)
    .map(c => ({
      id: `client-${c.saleId}-${monthKey(range.start)}`,
      source: 'client' as const,
      saleId: c.saleId,
      forMonth: monthKey(range.start),
      concept: c.clientName,
      counterparty: `${c.label} · ${c.product}`,
      amount: c.amount,
      dueDate: c.dueDate.toISOString(),
      overdue: c.dueDate < today
    }))

  return {
    receivable: toBucket([...clientItems, ...fromEntries('receivable')]),
    payable: toBucket([...fromEntries('payable'), ...expenseItems])
  }
}

// ---------------------------------------------------------------------------
// Cobros de mensualidades: proyectado vs. cobrado
// ---------------------------------------------------------------------------
//
// - MRR proyectado = lo que los clientes deberían pagar en el mes (sumMrr).
// - Facturación    = lo que realmente se cobró: onboarding + mensualidades marcadas como cobradas
//                    (por fecha de cobro) + cuentas por cobrar manuales cobradas.
// - Por cobrar     = mensualidades esperadas que aún no se marcan como cobradas.
//
// Desde COLLECTIONS_START se lleva el registro de cobros. Los meses anteriores no tienen
// registro de pagos, así que se asumen cobrados (su facturación sigue siendo onboarding + MRR).

export const COLLECTIONS_START = new Date(2026, 6, 1) // julio de 2026

export const isTrackedMonth = (range: MonthRange): boolean => range.start >= COLLECTIONS_START

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export interface ChargeSale extends SaleLike {
  id: number
  clientName: string
  customProduct?: string | null
  installmentCount?: number | null   // cuotas pendientes tras el pago inicial (asesorías)
  installmentAmount?: number | null  // monto de cada cuota
}

export interface BaseCharge {
  amount: number
  kind: 'mensualidad' | 'cuota'
  label: string // "Mensualidad" | "Cuota 2/4"
}

/**
 * ¿Qué se le cobra a este cliente en este mes?
 *  - Mensualidad: cliente con recurrencia vigente al cierre del mes (cuenta como MRR).
 *  - Cuota: asesorías con cuotas pendientes; una por mes, empezando el mes siguiente al pago inicial
 *    (no es MRR). Si el cliente se cancela, dejan de cobrarse las cuotas posteriores.
 * Devuelve null si ese mes no le toca cobro.
 */
export function baseChargeFor(sale: ChargeSale, range: MonthRange): BaseCharge | null {
  if (sale.recurringValue > 0 && isRecurringAtMonthEnd(sale, range.end)) {
    return { amount: sale.recurringValue, kind: 'mensualidad', label: 'Mensualidad' }
  }
  const n = sale.installmentCount ?? 0
  const amount = sale.installmentAmount ?? 0
  if (n > 0 && amount > 0) {
    const k =
      (range.start.getFullYear() - sale.createdAt.getFullYear()) * 12 +
      (range.start.getMonth() - sale.createdAt.getMonth())
    const cancelled = sale.status === 'cancelled' && !(sale.cancelledAt && sale.cancelledAt > range.end)
    if (k >= 1 && k <= n && !cancelled) return { amount, kind: 'cuota', label: `Cuota ${k}/${n}` }
  }
  return null
}

export interface PaymentLike {
  saleId: number
  forMonth: string
  amount: number
  paidAt: Date
}

export interface AdjustmentLike {
  saleId: number
  forMonth: string
  amount: number
}

export interface ClientCharge {
  saleId: number
  clientName: string
  product: string
  amount: number          // monto esperado ese mes (ajustado si hay ajuste)
  baseAmount: number      // mensualidad (o cuota) normal del cliente
  adjusted: boolean
  kind: 'mensualidad' | 'cuota'
  label: string           // "Mensualidad" | "Cuota 2/4"
  dueDate: Date
  paid: boolean
  paidAt: Date | null
}

/**
 * Mensualidades esperadas de un mes (una por cliente con recurrencia vigente al cierre del mes).
 * El día de cobro es el día del mes en que se cerró la venta (ajustado a fin de mes).
 * `asOf`: un pago hecho después de esa fecha todavía contaba como pendiente.
 */
export function expectedCharges(
  sales: ChargeSale[],
  payments: PaymentLike[],
  range: MonthRange,
  asOf: Date,
  adjustments: AdjustmentLike[] = []
): ClientCharge[] {
  const tracked = isTrackedMonth(range)
  const key = monthKey(range.start)
  const lastDay = range.end.getDate()

  const out: ClientCharge[] = []
  for (const s of sales) {
    const base = baseChargeFor(s, range)
    if (!base) continue
    const dueDate = new Date(range.start.getFullYear(), range.start.getMonth(), Math.min(s.createdAt.getDate(), lastDay))
    const pay = payments.find(p => p.saleId === s.id && p.forMonth === key && p.paidAt <= asOf)
    const adj = adjustments.find(a => a.saleId === s.id && a.forMonth === key)
    out.push({
      saleId: s.id,
      clientName: s.clientName,
      product: s.customProduct || s.product,
      amount: adj ? adj.amount : base.amount,
      baseAmount: base.amount,
      adjusted: !!adj,
      kind: base.kind,
      label: base.label,
      dueDate,
      paid: !tracked || !!pay, // meses anteriores: se asumen cobrados
      paidAt: pay?.paidAt ?? null
    })
  }
  return out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Cuotas de asesorías que vencen en meses POSTERIORES al consultado y siguen sin cobrarse.
 * Sirven para ver el saldo pendiente de cada cliente (cuánto falta por cobrar en total).
 */
export function upcomingInstallments(
  sales: ChargeSale[],
  payments: PaymentLike[],
  adjustments: AdjustmentLike[],
  range: MonthRange
): AccountItem[] {
  const items: AccountItem[] = []
  for (const s of sales) {
    const n = s.installmentCount ?? 0
    const base = s.installmentAmount ?? 0
    if (n <= 0 || base <= 0) continue
    for (let k = 1; k <= n; k++) {
      const due = new Date(s.createdAt.getFullYear(), s.createdAt.getMonth() + k, 1)
      if (due <= range.start) continue // meses ya cubiertos por el cobro normal del mes
      const month = monthRange(due)
      if (baseChargeFor(s, month)?.kind !== 'cuota') continue // cancelado antes de esa cuota
      const key = monthKey(due)
      if (payments.some(p => p.saleId === s.id && p.forMonth === key)) continue
      const adj = adjustments.find(a => a.saleId === s.id && a.forMonth === key)
      const day = Math.min(s.createdAt.getDate(), month.end.getDate())
      items.push({
        id: `cuota-${s.id}-${key}`,
        source: 'client',
        saleId: s.id,
        forMonth: key,
        concept: s.clientName,
        counterparty: `Cuota ${k}/${n} · ${s.customProduct || s.product}`,
        amount: adj ? adj.amount : base,
        dueDate: new Date(due.getFullYear(), due.getMonth(), day).toISOString(),
        overdue: false
      })
    }
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/** MRR efectivamente cobrado en el mes (por fecha de cobro). Meses sin registro: todo el MRR proyectado. */
export function collectedMrr(
  sales: SaleLike[] & { id?: number }[],
  payments: PaymentLike[],
  range: MonthRange
): { services: number; community: number } {
  if (!isTrackedMonth(range)) return sumMrr(sales as SaleLike[], range.end)

  const community = new Set(
    (sales as (SaleLike & { id?: number })[]).filter(s => s.product === 'Comunidad').map(s => s.id)
  )
  let services = 0
  let comm = 0
  for (const p of payments) {
    if (p.paidAt < range.start || p.paidAt > range.end) continue
    if (community.has(p.saleId)) comm += p.amount
    else services += p.amount
  }
  return { services, community: comm }
}
