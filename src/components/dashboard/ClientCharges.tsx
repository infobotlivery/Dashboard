'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

export interface ClientChargeRow {
  saleId: number
  clientName: string
  product: string
  amount: number
  dueDate: string
  paid: boolean
  paidAt: string | null
  overdue: boolean
  daysUntil: number
}

interface ClientChargesProps {
  charges: ClientChargeRow[]
  /** false = mes anterior al seguimiento de cobros (se asumen cobrados, solo lectura). */
  tracked: boolean
  /** true cuando el mes seleccionado es el actual: habilita la vista "Esta semana". */
  isCurrentMonth: boolean
  monthLabel: string
  /** Marca / desmarca el cobro y recarga los datos de la página. */
  onToggle: (saleId: number, paid: boolean) => Promise<void>
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

function statusLabel(c: ClientChargeRow): { text: string; cls: string } {
  if (c.paid) return { text: 'Cobrado', cls: 'text-green-400 bg-green-400/10' }
  if (c.overdue) return { text: 'Vencido', cls: 'text-red-400 bg-red-400/10' }
  if (c.daysUntil === 0) return { text: 'Hoy', cls: 'text-red-400 bg-red-400/10' }
  if (c.daysUntil === 1) return { text: 'Mañana', cls: 'text-yellow-400 bg-yellow-400/10' }
  return { text: `${c.daysUntil} días`, cls: c.daysUntil <= 3 ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10' }
}

export function ClientCharges({ charges, tracked, isCurrentMonth, monthLabel, onToggle }: ClientChargesProps) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [busy, setBusy] = useState<number | null>(null)
  // Estado optimista: la casilla cambia al instante y se corrige si el servidor falla
  const [override, setOverride] = useState<Record<number, boolean>>({})

  const mode = isCurrentMonth ? view : 'month'
  const shown = useMemo(
    () => charges.map(c => (c.saleId in override ? { ...c, paid: override[c.saleId], overdue: override[c.saleId] ? false : c.overdue } : c)),
    [charges, override]
  )

  // Esta semana = lo vencido sin cobrar + lo que vence en los próximos 7 días
  const rows = useMemo(
    () => (mode === 'month' ? shown : shown.filter(c => (!c.paid && c.overdue) || (c.daysUntil >= 0 && c.daysUntil <= 7))),
    [shown, mode]
  )

  const total = (list: ClientChargeRow[]) => list.reduce((s, c) => s + c.amount, 0)
  const pending = rows.filter(c => !c.paid)
  const monthPending = shown.filter(c => !c.paid)

  async function toggle(c: ClientChargeRow) {
    setBusy(c.saleId)
    setOverride(o => ({ ...o, [c.saleId]: !c.paid }))
    try {
      await onToggle(c.saleId, !c.paid)
    } finally {
      setOverride(o => {
        const { [c.saleId]: _done, ...rest } = o
        void _done
        return rest
      })
      setBusy(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">
            Cobros de clientes
            <span className="ml-2 text-sm font-normal text-brand-muted">
              {mode === 'week' ? 'esta semana' : monthLabel}
            </span>
          </h2>
          <p className="text-xs text-brand-muted">
            {tracked
              ? `Por cobrar ${fmt(total(pending))} (${pending.length}) · ${fmt(total(monthPending))} en todo el mes. Marca ✓ al cobrar: pasa a la facturación y a la utilidad.`
              : 'Los meses anteriores a julio 2026 se consideran cobrados.'}
          </p>
        </div>
        {isCurrentMonth && (
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === v ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-muted hover:text-white'
                }`}
              >
                {v === 'week' ? 'Esta semana' : 'Este mes'}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="glass-card py-6 text-center">
          <p className="text-brand-muted text-sm">
            {mode === 'week' ? 'No hay cobros de clientes esta semana' : 'No hay mensualidades de clientes en este mes'}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 w-12 text-center text-brand-muted font-medium text-sm">✓</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Cliente</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm hidden sm:table-cell">Servicio</th>
                  <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Monto</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Fecha</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const st = statusLabel(c)
                  return (
                    <tr key={c.saleId} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${c.paid ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={c.paid}
                          disabled={!tracked || busy === c.saleId}
                          onChange={() => toggle(c)}
                          aria-label={`${c.paid ? 'Desmarcar' : 'Marcar'} cobro de ${c.clientName}`}
                          className="h-4 w-4 accent-green-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className={`py-3 px-4 font-medium text-white ${c.paid ? 'line-through' : ''}`}>{c.clientName}</td>
                      <td className="py-3 px-4 text-brand-muted hidden sm:table-cell">{c.product}</td>
                      <td className="py-3 px-4 text-right font-semibold text-brand-primary">{fmt(c.amount)}</td>
                      <td className="py-3 px-4 text-center text-brand-muted text-sm">{fmtDate(c.dueDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.text}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
