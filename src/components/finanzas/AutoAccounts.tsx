'use client'

import { GlassCard } from './GlassCard'
import type { FinanceSummary } from '@/types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/**
 * Cuentas que aparecen solas, sin agregarlas a mano:
 *  - por pagar: gastos mensuales (fijos y variables) del mes aún sin marcar como pagados;
 *  - por cobrar: mensualidades de clientes aún sin cobrar.
 * Las cuentas manuales (botón Agregar) son solo para casos extra.
 */
export function AutoAccounts({ summary, onMarkPaid, onChanged }: {
  summary: FinanceSummary | null
  onMarkPaid?: (expenseId: number) => void | Promise<void>
  onChanged?: () => void
}) {
  const payable = (summary?.accounts?.payable.items ?? []).filter(i => i.source === 'expense')
  const receivable = (summary?.accounts?.receivable.items ?? []).filter(i => i.source === 'client')

  const column = (title: string, color: string, items: typeof payable, empty: string) => (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="font-semibold">{title}</h4>
        <span className={`font-bold ${color}`}>{fmt(items.reduce((s, i) => s + i.amount, 0))}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {items.map(i => (
            <li key={i.id} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-sm">
              <span className="truncate">
                {i.concept}
                {i.counterparty && <span className="text-gray-400"> · {i.counterparty}</span>}
              </span>
              <span className="shrink-0 flex items-center gap-2 text-right">
                {i.source === 'expense' && i.expenseId && onMarkPaid && (
                  <button
                    onClick={async () => { await onMarkPaid(i.expenseId as number); onChanged?.() }}
                    className="text-[11px] rounded-md border border-white/10 px-2 py-1 text-gray-300 hover:text-white hover:border-white/30"
                    title="Marcar como pagado este mes"
                  >
                    ✓ Pagado
                  </button>
                )}
                <span>
                {fmt(i.amount)}
                <span className={`block text-[11px] ${i.overdue ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {i.overdue ? 'Vencida ' : 'Vence '}{new Date(i.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <GlassCard hover={false} className="p-5">
      <div className="mb-3">
        <h3 className="font-semibold">Automáticas este mes</h3>
        <p className="text-xs text-gray-400">
          Salen solas de tus gastos y de las mensualidades de clientes. Se marcan como pagadas o cobradas desde la portada.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {column('Por pagar (gastos del mes)', 'text-red-400', payable, 'Todos los gastos del mes están pagados')}
        {column('Por cobrar (mensualidades)', 'text-green-400', receivable, 'No hay mensualidades pendientes')}
      </div>
    </GlassCard>
  )
}
