'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import DateSelector from '@/components/ui/DateSelector'
import NumberInput from '@/components/ui/NumberInput'
import { Select } from '@/components/ui/Select'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'
import type { Proposal } from '@/types'

interface ProposalsTabProps {
  onMessage: (type: 'success' | 'error', text: string) => void
}

const emptyForm = () => ({
  clientName: '',
  company: '',
  service: '',
  amount: 0,
  date: formatLocalDate(new Date()),
  status: 'por_aprobacion' as Proposal['status'],
  notes: ''
})

export function ProposalsTab({ onMessage }: ProposalsTabProps) {
  const [proposalList, setProposalList] = useState<Proposal[]>([])
  const [proposalForm, setProposalForm] = useState(emptyForm())
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null)
  const [proposalFilterStatus, setProposalFilterStatus] = useState<string>('todas')
  const [proposalFilterMonth, setProposalFilterMonth] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function reloadProposals() {
    const res = await apiFetch('/api/proposals')
    const data = await res.json()
    if (data.data) setProposalList(data.data)
  }

  useEffect(() => {
    reloadProposals().catch(err => console.error('Error loading proposals:', err))
  }, [])

  async function handleSaveProposal() {
    if (!proposalForm.clientName.trim()) {
      onMessage('error', 'El nombre del cliente es requerido')
      return
    }
    setSaving(true)
    try {
      const body = editingProposalId ? { ...proposalForm, id: editingProposalId } : proposalForm
      const res = await apiFetch('/api/proposals', {
        method: editingProposalId ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        await reloadProposals()
        setProposalForm(emptyForm())
        setEditingProposalId(null)
        onMessage('success', editingProposalId ? 'Propuesta actualizada' : 'Propuesta creada')
      } else {
        onMessage('error', data.error || 'Error al guardar')
      }
    } catch {
      onMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProposal(id: number) {
    if (!confirm('¿Eliminar esta propuesta?')) return
    try {
      const res = await apiFetch(`/api/proposals?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setProposalList(proposalList.filter(p => p.id !== id))
        onMessage('success', 'Propuesta eliminada')
      }
    } catch {
      onMessage('error', 'Error al eliminar')
    }
  }

  function startEditProposal(p: Proposal) {
    setProposalForm({
      clientName: p.clientName,
      company: p.company,
      service: p.service,
      amount: p.amount,
      date: p.date.split('T')[0],
      status: p.status,
      notes: p.notes || ''
    })
    setEditingProposalId(p.id)
  }

        const proposalStatusConfig = {
          por_aprobacion: { label: 'Por Aprobación', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
          aprobada: { label: 'Aprobada', bg: 'bg-green-400/10', text: 'text-green-400' },
          no_cerrada: { label: 'No Cerrada', bg: 'bg-red-400/10', text: 'text-red-400' }
        } as const

        const filtered = proposalList.filter(p => {
          if (proposalFilterStatus !== 'todas' && p.status !== proposalFilterStatus) return false
          if (proposalFilterMonth) {
            const d = new Date(p.date)
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (ym !== proposalFilterMonth) return false
          }
          return true
        })
        const totalAmount = filtered.reduce((s, p) => s + p.amount, 0)
        const formatCurrency = (v: number) =>
          new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)


  return (
    <div className="space-y-6">
      {/* Formulario */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          {editingProposalId ? 'Editar Propuesta' : 'Nueva Propuesta'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cliente"
            value={proposalForm.clientName}
            onChange={e => setProposalForm({ ...proposalForm, clientName: e.target.value })}
            placeholder="Nombre del cliente"
          />
          <Input
            label="Empresa"
            value={proposalForm.company}
            onChange={e => setProposalForm({ ...proposalForm, company: e.target.value })}
            placeholder="Nombre de la empresa"
          />
          <Input
            label="Servicio"
            value={proposalForm.service}
            onChange={e => setProposalForm({ ...proposalForm, service: e.target.value })}
            placeholder="Servicio ofrecido"
          />
          <Input
            label="Monto (USD)"
            type="number"
            value={String(proposalForm.amount)}
            onChange={e => setProposalForm({ ...proposalForm, amount: Number(e.target.value) })}
            placeholder="0"
          />
          <Input
            label="Fecha"
            type="date"
            value={proposalForm.date}
            onChange={e => setProposalForm({ ...proposalForm, date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Estado</label>
            <select
              value={proposalForm.status}
              onChange={e => setProposalForm({ ...proposalForm, status: e.target.value as Proposal['status'] })}
              className="dark-select w-full"
            >
              <option value="por_aprobacion">Por Aprobación</option>
              <option value="aprobada">Aprobada</option>
              <option value="no_cerrada">No Cerrada</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              label="Notas (opcional)"
              value={proposalForm.notes}
              onChange={e => setProposalForm({ ...proposalForm, notes: e.target.value })}
              placeholder="Observaciones adicionales"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSaveProposal} loading={saving}>
            {editingProposalId ? 'Actualizar' : 'Crear Propuesta'}
          </Button>
          {editingProposalId && (
            <button
              onClick={() => {
                setProposalForm({ clientName: '', company: '', service: '', amount: 0, date: formatLocalDate(new Date()), status: 'por_aprobacion', notes: '' })
                setEditingProposalId(null)
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {['todas', 'por_aprobacion', 'aprobada', 'no_cerrada'].map(f => (
          <button
            key={f}
            onClick={() => setProposalFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              proposalFilterStatus === f
                ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                : 'text-brand-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {f === 'todas' ? 'Todas' : proposalStatusConfig[f as keyof typeof proposalStatusConfig].label}
          </button>
        ))}
        <input
          type="month"
          value={proposalFilterMonth}
          onChange={e => setProposalFilterMonth(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-primary/50"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Monto total visible */}
      {filtered.length > 0 && (
        <div className="glass-card flex items-center justify-between py-3">
          <span className="text-brand-muted text-sm">Monto de posible facturación ({filtered.length} propuesta{filtered.length !== 1 ? 's' : ''})</span>
          <span className="text-xl font-bold text-green-400">{formatCurrency(totalAmount)}</span>
        </div>
      )}

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-brand-muted">No hay propuestas</div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-brand-muted text-sm">Cliente</th>
                  <th className="text-left py-3 px-4 text-brand-muted text-sm hidden md:table-cell">Empresa</th>
                  <th className="text-left py-3 px-4 text-brand-muted text-sm hidden sm:table-cell">Servicio</th>
                  <th className="text-right py-3 px-4 text-brand-muted text-sm">Monto</th>
                  <th className="text-center py-3 px-4 text-brand-muted text-sm hidden sm:table-cell">Fecha</th>
                  <th className="text-center py-3 px-4 text-brand-muted text-sm">Estado</th>
                  <th className="text-center py-3 px-4 text-brand-muted text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = proposalStatusConfig[p.status]
                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium text-white">{p.clientName}</td>
                      <td className="py-3 px-4 text-brand-muted hidden md:table-cell">{p.company || '-'}</td>
                      <td className="py-3 px-4 text-brand-muted hidden sm:table-cell">{p.service || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-400">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-center text-brand-muted text-sm hidden sm:table-cell">
                        {new Date(p.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => startEditProposal(p)}
                            className="text-brand-primary hover:text-white text-sm px-2 py-1 rounded hover:bg-white/5"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(p.id)}
                            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
