'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/finanzas/AnimatedNumber'
import type { Proposal } from '@/types'

interface ProposalsTableProps {
  proposals: Proposal[]
}

type FilterStatus = 'todas' | 'por_aprobacion' | 'aprobada' | 'no_cerrada'

const statusConfig = {
  por_aprobacion: { label: 'Por Aprobación', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
  aprobada: { label: 'Aprobada', bg: 'bg-green-400/10', text: 'text-green-400' },
  no_cerrada: { label: 'No Cerrada', bg: 'bg-red-400/10', text: 'text-red-400' }
}

function getCurrentYYYYMM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function ProposalsTable({ proposals }: ProposalsTableProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas')
  const [filterMonth, setFilterMonth] = useState<string>('')

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filtered = useMemo(() => {
    return proposals.filter(p => {
      if (filterStatus !== 'todas' && p.status !== filterStatus) return false
      if (filterMonth) {
        const d = new Date(p.date)
        const pm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (pm !== filterMonth) return false
      }
      return true
    })
  }, [proposals, filterStatus, filterMonth])

  const totalAmount = useMemo(() => filtered.reduce((s, p) => s + p.amount, 0), [filtered])

  const filterButtons: { id: FilterStatus; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'por_aprobacion', label: 'Por Aprobación' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'no_cerrada', label: 'No Cerradas' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white">
          Propuestas
          <span className="ml-2 text-sm font-normal text-brand-muted">
            ({proposals.length} total)
          </span>
        </h2>
        <a
          href="/admin"
          className="btn-secondary text-sm"
        >
          Gestionar en Admin →
        </a>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === btn.id
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                  : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          max={getCurrentYYYYMM()}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-primary/50"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-8 text-center">
          <p className="text-brand-muted">No hay propuestas que coincidan con los filtros</p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Cliente</th>
                    <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm hidden md:table-cell">Empresa</th>
                    <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm hidden sm:table-cell">Servicio</th>
                    <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Monto</th>
                    <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm hidden sm:table-cell">Fecha</th>
                    <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const sc = statusConfig[p.status]
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-white">{p.clientName}</td>
                        <td className="py-3 px-4 text-brand-muted hidden md:table-cell">{p.company || '-'}</td>
                        <td className="py-3 px-4 text-brand-muted hidden sm:table-cell">{p.service || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-400">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-center text-brand-muted text-sm hidden sm:table-cell">
                          {formatDate(p.date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer: total */}
          <div className="glass-card flex items-center justify-between py-4">
            <p className="text-brand-muted text-sm">
              Monto de posible facturación ({filtered.length} propuesta{filtered.length !== 1 ? 's' : ''})
            </p>
            <AnimatedNumber
              value={totalAmount}
              className="text-xl font-bold text-green-400"
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
