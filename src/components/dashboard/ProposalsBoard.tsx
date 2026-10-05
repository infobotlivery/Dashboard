'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/finanzas/AnimatedNumber'
import { ProposalsCsvImport } from '@/components/finanzas/SalesCsvImport'
import { apiFetch } from '@/lib/apiFetch'
import { Modal } from './Modal'
import { ProposalFormModal } from './ProposalFormModal'
import { CloseSaleModal } from './CloseSaleModal'
import type { Proposal } from '@/types'

interface ProposalsBoardProps {
  proposals: Proposal[]
  /** Mes global del dashboard (YYYY-MM o ''): el filtro de mes lo sigue. */
  month: string
  /** Se llama tras crear/editar/eliminar/cerrar para recargar datos de toda la página. */
  onChanged: () => void
}

type FilterStatus = 'todas' | Proposal['status']

const statusConfig: Record<Proposal['status'], { label: string; cls: string }> = {
  por_aprobacion: { label: 'Por aprobación', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  aprobada: { label: 'Aprobada', cls: 'bg-green-400/10 text-green-400 border-green-400/20' },
  no_cerrada: { label: 'No cerrada', cls: 'bg-red-400/10 text-red-400 border-red-400/20' }
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function recentMonths(n = 24) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: yyyymm(d), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }
  })
}

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

export function ProposalsBoard({ proposals, month, onChanged }: ProposalsBoardProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas')
  const [filterMonth, setFilterMonth] = useState<string>(month || yyyymm(new Date()))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Proposal | null>(null)
  const [closing, setClosing] = useState<Proposal | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [error, setError] = useState('')

  // El filtro de mes sigue al selector de mes del dashboard
  useEffect(() => { setFilterMonth(month || yyyymm(new Date())) }, [month])

  const monthOptions = useMemo(() => recentMonths(), [])

  const filtered = useMemo(() => proposals.filter(p => {
    if (filterStatus !== 'todas' && p.status !== filterStatus) return false
    if (filterMonth && yyyymm(new Date(p.date)) !== filterMonth) return false
    return true
  }), [proposals, filterStatus, filterMonth])

  const totalAmount = useMemo(() => filtered.reduce((s, p) => s + p.amount, 0), [filtered])

  const filterButtons: { id: FilterStatus; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'por_aprobacion', label: 'Por aprobación' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'no_cerrada', label: 'No cerradas' }
  ]

  async function changeStatus(p: Proposal, status: Proposal['status']) {
    if (status === p.status) return
    // Aprobar = cerrar la venta: se pide el registro del cierre en el momento
    if (status === 'aprobada') return setClosing(p)
    setError('')
    try {
      const res = await apiFetch('/api/proposals', { method: 'PUT', body: JSON.stringify({ id: p.id, status }) })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'No se pudo cambiar el estado')
      onChanged()
    } catch {
      setError('Error de conexión')
    }
  }

  async function remove(p: Proposal) {
    if (!confirm(`¿Eliminar la propuesta de ${p.clientName}?`)) return
    try {
      const res = await apiFetch(`/api/proposals?id=${p.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) onChanged()
      else setError(data.error || 'No se pudo eliminar')
    } catch {
      setError('Error de conexión')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white">
          Propuestas
          <span className="ml-2 text-sm font-normal text-brand-muted">({proposals.length} total)</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowImport(true)} className="btn-secondary text-sm">⬆ Importar CSV</button>
          <button onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary text-sm">+ Agregar nueva propuesta</button>
        </div>
      </div>

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
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="dark-select bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-primary/50 cursor-pointer"
        >
          <option value="">Todos los meses</option>
          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

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
                    <th className="py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const sc = statusConfig[p.status]
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{p.clientName}</td>
                        <td className="py-3 px-4 text-brand-muted hidden md:table-cell">{p.company || '-'}</td>
                        <td className="py-3 px-4 text-brand-muted hidden sm:table-cell">{p.service || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-400">{fmtMoney(p.amount)}</td>
                        <td className="py-3 px-4 text-center text-brand-muted text-sm hidden sm:table-cell">
                          {new Date(p.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={p.status}
                            onChange={e => changeStatus(p, e.target.value as Proposal['status'])}
                            aria-label={`Estado de la propuesta de ${p.clientName}`}
                            className={`dark-select text-xs font-medium rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none ${sc.cls}`}
                          >
                            <option value="por_aprobacion">Por aprobación</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="no_cerrada">No cerrada</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap text-right">
                          <button title="Editar" className="text-brand-muted hover:text-white px-1.5" onClick={() => { setEditing(p); setFormOpen(true) }}>✎</button>
                          <button title="Eliminar" className="text-brand-muted hover:text-red-400 px-1.5" onClick={() => remove(p)}>🗑</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

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

      <ProposalFormModal
        open={formOpen}
        proposal={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, becameApproved) => {
          setFormOpen(false)
          onChanged()
          if (becameApproved) setClosing(saved)
        }}
      />

      <CloseSaleModal
        proposal={closing}
        onClose={() => setClosing(null)}
        onDone={() => { setClosing(null); onChanged() }}
      />

      <Modal open={showImport} title="Importar propuestas" onClose={() => setShowImport(false)} wide>
        <ProposalsCsvImport onImported={onChanged} />
      </Modal>
    </motion.div>
  )
}
