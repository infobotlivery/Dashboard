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
      id: `client-${c.saleId}-${c.key}`,
      source: 'client' as const,
      saleId: c.saleId,
      forMonth: c.key,
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

export interface InstallmentLike {
  id: number
  dueDate: Date
  amount: number
}

export interface ChargeSale extends SaleLike {
  id: number
  clientName: string
  customProduct?: string | null
  installments?: InstallmentLike[]   // cuotas con fecha y monto propios (asesorías)
  installmentCount?: number | null   // legado: N cuotas mensuales de igual monto
  installmentAmount?: number | null
}

export interface BaseCharge {
  amount: number
  kind: 'mensualidad' | 'cuota'
  label: string // "Mensualidad" | "Cuota 2/4"
}

export interface ScheduledInstallment {
  key: string      // clave del cobro: "c<id>" (cuotas con fecha propia) o "AAAA-MM" (legado)
  number: number
  total: number
  dueDate: Date
  amount: number
}

/**
 * Calendario de cuotas de una venta: las que se definieron al registrar el cierre (cada una con su fecha y monto).
 * Las ventas creadas antes con "N cuotas mensuales" siguen funcionando (una por mes, desde el mes siguiente).
 * Si el cliente se cancela, no se cobran las cuotas posteriores a la cancelación.
 */
export function installmentSchedule(sale: ChargeSale): ScheduledInstallment[] {
  let list: ScheduledInstallment[] = []
  const rows = sale.installments ?? []
  if (rows.length > 0) {
    const sorted = [...rows].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    list = sorted.map((r, i) => ({ key: `c${r.id}`, number: i + 1, total: sorted.length, dueDate: r.dueDate, amount: r.amount }))
  } else {
    const n = sale.installmentCount ?? 0
    const amount = sale.installmentAmount ?? 0
    for (let k = 1; n > 0 && amount > 0 && k <= n; k++) {
      const first = new Date(sale.createdAt.getFullYear(), sale.createdAt.getMonth() + k, 1)
      const day = Math.min(sale.createdAt.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate())
      const due = new Date(first.getFullYear(), first.getMonth(), day)
      list.push({ key: monthKey(due), number: k, total: n, dueDate: due, amount })
    }
  }
  if (sale.status === 'cancelled' && sale.cancelledAt) {
    const cut = sale.cancelledAt
    list = list.filter(i => i.dueDate <= cut)
  }
  return list
}

/** Mensualidad del mes (cliente con recurrencia vigente al cierre del mes; cuenta como MRR). */
export function recurringChargeFor(sale: ChargeSale, range: MonthRange): BaseCharge | null {
  if (sale.recurringValue > 0 && isRecurringAtMonthEnd(sale, range.end)) {
    return { amount: sale.recurringValue, kind: 'mensualidad', label: 'Mensualidad' }
  }
  return null
}

/** Monto normal del cobro identificado por `key` (mes para la mensualidad, "c<id>" para una cuota). */
export function chargeByKey(sale: ChargeSale, key: string, range: MonthRange): BaseCharge | null {
  const inst = installmentSchedule(sale).find(i => i.key === key)
  if (inst) return { amount: inst.amount, kind: 'cuota', label: `Cuota ${inst.number}/${inst.total}` }
  if (key === monthKey(range.start)) return recurringChargeFor(sale, range)
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
  key: string             // identifica el cobro dentro del cliente: mes (mensualidad) o "c<id>" (cuota)
  clientName: string
  product: string
  amount: number          // monto esperado (ajustado si hay ajuste)
  baseAmount: number      // monto normal de la mensualidad o cuota
  adjusted: boolean
  kind: 'mensualidad' | 'cuota'
  label: string           // "Mensualidad" | "Cuota 2/4"
  dueDate: Date
  paid: boolean
  paidAt: Date | null
}

/**
 * Cobros esperados de un mes:
 *  - una mensualidad por cliente con recurrencia vigente al cierre del mes (día de cobro = día del cierre de venta);
 *  - las cuotas cuya fecha cae en el mes;
 *  - en el mes en curso, también las cuotas anteriores que siguen sin cobrarse (vencidas).
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
  const isCurrentMonth = asOf >= range.start && asOf < range.end

  const out: ClientCharge[] = []
  const push = (s: ChargeSale, chargeKey: string, base: BaseCharge, dueDate: Date) => {
    const pay = payments.find(p => p.saleId === s.id && p.forMonth === chargeKey && p.paidAt <= asOf)
    const adj = adjustments.find(a => a.saleId === s.id && a.forMonth === chargeKey)
    out.push({
      saleId: s.id,
      key: chargeKey,
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

  for (const s of sales) {
    const rec = recurringChargeFor(s, range)
    if (rec) push(s, key, rec, new Date(range.start.getFullYear(), range.start.getMonth(), Math.min(s.createdAt.getDate(), lastDay)))

    for (const inst of installmentSchedule(s)) {
      const inMonth = inst.dueDate >= range.start && inst.dueDate <= range.end
      const overdueCarry =
        isCurrentMonth && inst.dueDate < range.start &&
        !payments.some(p => p.saleId === s.id && p.forMonth === inst.key && p.paidAt <= asOf)
      if (!inMonth && !overdueCarry) continue
      if (rec && inst.key === key) continue // legado: la mensualidad ya ocupa esa clave
      push(s, inst.key, { amount: inst.amount, kind: 'cuota', label: `Cuota ${inst.number}/${inst.total}` }, inst.dueDate)
    }
  }
  return out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Cuotas que vencen en meses POSTERIORES al consultado y siguen sin cobrarse.
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
    for (const inst of installmentSchedule(s)) {
      if (inst.dueDate <= range.end) continue
      if (payments.some(p => p.saleId === s.id && p.forMonth === inst.key)) continue
      const adj = adjustments.find(a => a.saleId === s.id && a.forMonth === inst.key)
      items.push({
        id: `cuota-${s.id}-${inst.key}`,
        source: 'client',
        saleId: s.id,
        forMonth: inst.key,
        concept: s.clientName,
        counterparty: `Cuota ${inst.number}/${inst.total} · ${s.customProduct || s.product}`,
        amount: adj ? adj.amount : inst.amount,
        dueDate: inst.dueDate.toISOString(),
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
