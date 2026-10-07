'use client'

import { motion } from 'framer-motion'
import type { AccountsTotals } from '@/types'

interface AccountsBoxesProps {
  payable?: AccountsTotals
  receivable?: AccountsTotals
  asOfLabel: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

function Box({ title, tone, data, empty, delay }: {
  title: string
  tone: 'red' | 'green'
  data?: AccountsTotals
  empty: string
  delay: number
}) {
  const red = tone === 'red'
  const items = data?.items ?? []
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-[20px] backdrop-blur-xl p-6 border ${
        red ? 'border-red-500/20 bg-[rgba(26,10,10,0.7)]' : 'border-green-500/20 bg-[rgba(10,26,15,0.7)]'
      }`}
    >
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${red ? 'bg-red-500/10' : 'bg-green-500/10'}`} />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-brand-muted text-sm font-medium">{title}</span>
          <span className="text-xs text-brand-muted">{data?.count ?? 0} pendiente{(data?.count ?? 0) === 1 ? '' : 's'}</span>
        </div>
        <p className={`text-3xl font-black tracking-tight ${red ? 'text-red-400' : 'text-green-400'}`}>
          {fmt(data?.pending ?? 0)}
        </p>
        {(data?.overdue ?? 0) > 0 && (
          <p className="text-xs text-yellow-400">{fmt(data!.overdue)} vencido</p>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-brand-muted pt-1">{empty}</p>
        ) : (
          <ul className="space-y-1.5 pt-1 max-h-72 overflow-y-auto pr-1">
            {items.map(i => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">
                    {i.concept}
                    {i.counterparty && <span className="text-brand-muted"> · {i.counterparty}</span>}
                  </p>
                  <p className={`text-[11px] ${i.overdue ? 'text-yellow-400' : 'text-brand-muted'}`}>
                    {i.overdue ? 'Vencida ' : 'Vence '}{fmtDate(i.dueDate)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-white shrink-0">{fmt(i.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export function AccountsBoxes({ payable, receivable, asOfLabel }: AccountsBoxesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-brand-muted">Pendientes {asOfLabel}</p>
        <a href="/finanzas" className="text-xs text-brand-primary hover:underline">Gestionar en Finanzas →</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="Cuentas por pagar" tone="red" data={payable} empty="Nada pendiente por pagar" delay={0.1} />
        <Box title="Cuentas por cobrar" tone="green" data={receivable} empty="Nada pendiente por cobrar" delay={0.16} />
      </div>
    </div>
  )
}
