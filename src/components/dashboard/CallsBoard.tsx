'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'
import { Modal, Field, modalInputCls } from './Modal'
import { ProposalFormModal } from './ProposalFormModal'
import { CallsCsvImport } from '@/components/finanzas/SalesCsvImport'
import type { CallRecord } from '@/types'

interface CallsBoardProps {
  calls: CallRecord[]
  configured: boolean
  syncing: boolean
  syncError: string
  /** Mes global del dashboard (YYYY-MM o ''): el filtro de mes lo sigue. */
  month: string
  onSync: () => void
  /** Recarga llamadas, propuestas y métricas. */
  onChanged: () => void
}

type AttendanceFilter = 'todas' | CallRecord['attendance']

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function recentMonths(n = 24) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: yyyymm(d), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }
  })
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function localInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function CallsBoard({ calls, configured, syncing, syncError, month, onSync, onChanged }: CallsBoardProps) {
  const [filterMonth, setFilterMonth] = useState(month || yyyymm(new Date()))
  const [filterAttendance, setFilterAttendance] = useState<AttendanceFilter>('todas')
  const [proposalFor, setProposalFor] = useState<CallRecord | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState({ leadName: '', leadEmail: '', scheduledAt: localInputValue(new Date()), budget: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setFilterMonth(month || yyyymm(new Date())) }, [month])
  const monthOptions = useMemo(() => recentMonths(), [])

  const filtered = useMemo(() => calls.filter(c => {
    if (filterMonth && yyyymm(new Date(c.scheduledAt)) !== filterMonth) return false
    if (filterAttendance !== 'todas' && c.attendance !== filterAttendance) return false
    return true
  }), [calls, filterMonth, filterAttendance])

  const stats = useMemo(() => {
    const held = filtered.filter(c => c.status !== 'canceled')
    const attended = held.filter(c => c.attendance === 'attended').length
    const noShow = held.filter(c => c.attendance === 'no_show').length
    return { total: held.length, attended, noShow, rate: attended + noShow > 0 ? (attended / (attended + noShow)) * 100 : null }
  }, [filtered])

  async function setAttendance(call: CallRecord, attendance: CallRecord['attendance']) {
    // Volver a pulsar el mismo botón desmarca
    const next = call.attendance === attendance ? 'pending' : attendance
    setError('')
    try {
      const res = await apiFetch('/api/calls', { method: 'PATCH', body: JSON.stringify({ id: call.id, attendance: next }) })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'No se pudo actualizar la asistencia')
      onChanged()
      // Asistió: preguntar qué propuesta se envió
      if (next === 'attended' && !call.proposal) setProposalFor(call)
    } catch {
      setError('Error de conexión')
    }
  }

  async function remove(call: CallRecord) {
    if (!confirm(`¿Eliminar la llamada con ${call.leadName}?\n\nSi viene de Calendly volverá a aparecer en la próxima sincronización mientras siga agendada allí.`)) return
    const res = await apiFetch(`/api/calls?id=${call.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) onChanged()
    else setError(data.error || 'No se pudo eliminar')
  }

  async function addManual() {
    if (!form.leadName.trim()) return setError('El nombre del lead es requerido')
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() })
      })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'No se pudo guardar')
      setAddOpen(false)
      setForm({ leadName: '', leadEmail: '', scheduledAt: localInputValue(new Date()), budget: '' })
      onChanged()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const attBtn = (call: CallRecord, value: 'attended' | 'no_show', label: string, active: string) => (
    <button
      onClick={() => setAttendance(call, value)}
      disabled={call.status === 'canceled'}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
        call.attendance === value ? active : 'border-white/10 text-brand-muted hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  )

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">
            Llamadas
            <span className="ml-2 text-sm font-normal text-brand-muted">
              {stats.total} agendada{stats.total === 1 ? '' : 's'}
              {stats.rate !== null && ` · ${stats.rate.toFixed(0)}% asistencia`}
            </span>
          </h2>
          <p className="text-xs text-brand-muted">
            Cada llamada nueva cuenta como lead y como persona agendada.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onSync} disabled={!configured || syncing} className="btn-secondary text-sm disabled:opacity-40">
            {syncing ? 'Sincronizando…' : '↻ Sincronizar Calendly'}
          </button>
          <button onClick={() => setImportOpen(true)} className="btn-secondary text-sm">⬆ Importar CSV</button>
          <a href={`/api/calls/export${filterMonth ? `?month=${filterMonth}` : ''}`} download className="btn-secondary text-sm">⬇ CSV</a>
          <button onClick={() => { setError(''); setAddOpen(true) }} className="btn-primary text-sm">+ Agregar llamada</button>
        </div>
      </div>

      {!configured && (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-300">
          Calendly todavía no está conectado al dashboard. Agrega la variable <code className="bg-black/40 px-1.5 py-0.5 rounded">CALENDLY_API_TOKEN</code> en
          Dokploy y reinicia: las llamadas se sincronizarán solas. Mientras tanto puedes agregarlas a mano.
        </div>
      )}
      {syncError && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">Calendly: {syncError}</p>}
      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1">
          {([['todas', 'Todas'], ['pending', 'Por marcar'], ['attended', 'Asistieron'], ['no_show', 'No asistieron']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilterAttendance(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterAttendance === id
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                  : 'text-brand-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
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

      {filtered.length === 0 ? (
        <div className="glass-card py-8 text-center">
          <p className="text-brand-muted">No hay llamadas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Lead</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Fecha y hora</th>
                  <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm hidden md:table-cell">Presupuesto</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">¿Asistió?</th>
                  <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Propuesta</th>
                  <th className="py-3 px-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const canceled = c.status === 'canceled'
                  const upcoming = !canceled && new Date(c.scheduledAt) > new Date()
                  return (
                    <tr key={c.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${canceled ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{c.leadName}</p>
                        {c.leadEmail && <p className="text-xs text-brand-muted">{c.leadEmail}</p>}
                        {c.isReschedule && <span className="text-[10px] text-brand-muted">reprogramada</span>}
                      </td>
                      <td className="py-3 px-4 text-sm whitespace-nowrap">
                        <span className="text-white capitalize">{fmtDateTime(c.scheduledAt)}</span>
                        {canceled && <span className="ml-2 text-xs text-red-400">Cancelada</span>}
                        {upcoming && <span className="ml-2 text-xs text-brand-primary">Próxima</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-muted hidden md:table-cell max-w-[260px]">{c.budget || '—'}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          {attBtn(c, 'attended', 'Asistió', 'bg-green-400/10 border-green-400/30 text-green-400')}
                          {attBtn(c, 'no_show', 'No asistió', 'bg-red-400/10 border-red-400/30 text-red-400')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs">
                        {c.proposal ? (
                          <span className="text-green-400">✓ Enviada</span>
                        ) : c.attendance === 'attended' ? (
                          <button onClick={() => setProposalFor(c)} className="text-brand-primary hover:underline">Registrar propuesta</button>
                        ) : (
                          <span className="text-brand-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {c.joinUrl && upcoming && (
                          <a href={c.joinUrl} target="_blank" rel="noreferrer" title="Abrir la reunión" className="text-brand-muted hover:text-white px-1.5">🔗</a>
                        )}
                        <button title="Eliminar" className="text-brand-muted hover:text-red-400 px-1.5" onClick={() => remove(c)}>🗑</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asistió → ¿qué propuesta se envió? */}
      <ProposalFormModal
        open={!!proposalFor}
        proposal={null}
        prefill={proposalFor ? {
          clientName: proposalFor.leadName,
          callId: proposalFor.id,
          notes: proposalFor.budget ? `Presupuesto indicado: ${proposalFor.budget}` : '',
          title: `¿Qué propuesta le enviaste a ${proposalFor.leadName}?`,
          hint: 'Se guardará en Propuestas, vinculada a esta llamada (no cuenta como un lead extra). Si no enviaste propuesta, cierra esta ventana.'
        } : undefined}
        onClose={() => setProposalFor(null)}
        onSaved={() => { setProposalFor(null); onChanged() }}
      />

      <Modal open={importOpen} title="Importar llamadas" onClose={() => setImportOpen(false)} wide>
        <CallsCsvImport onImported={onChanged} />
      </Modal>

      <Modal open={addOpen} title="Agregar llamada manualmente" onClose={() => setAddOpen(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Lead *"><input className={modalInputCls} value={form.leadName} onChange={set('leadName')} autoFocus /></Field>
          <Field label="Email"><input type="email" className={modalInputCls} value={form.leadEmail} onChange={set('leadEmail')} /></Field>
          <Field label="Fecha y hora de la llamada"><input type="datetime-local" className={modalInputCls} value={form.scheduledAt} onChange={set('scheduledAt')} /></Field>
          <Field label="Presupuesto"><input className={modalInputCls} value={form.budget} onChange={set('budget')} placeholder="Lo que indique el lead" /></Field>
        </div>
        {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button onClick={addManual} loading={saving}>Agregar llamada</Button>
          <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancelar</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
