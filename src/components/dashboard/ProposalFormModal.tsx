'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'
import { Modal, Field, modalInputCls } from './Modal'
import type { Proposal } from '@/types'

interface ProposalFormModalProps {
  open: boolean
  proposal: Proposal | null          // null = nueva propuesta
  onClose: () => void
  onSaved: (saved: Proposal, becameApproved: boolean) => void
}

const emptyForm = () => ({
  clientName: '', company: '', service: '', amount: '', recurringAmount: '',
  date: formatLocalDate(new Date()), status: 'por_aprobacion' as Proposal['status'], notes: ''
})

export function ProposalFormModal({ open, proposal, onClose, onSaved }: ProposalFormModalProps) {
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(proposal ? {
      clientName: proposal.clientName,
      company: proposal.company,
      service: proposal.service,
      amount: String(proposal.amount),
      recurringAmount: proposal.recurringAmount ? String(proposal.recurringAmount) : '',
      date: formatLocalDate(new Date(proposal.date)),
      status: proposal.status,
      notes: proposal.notes || ''
    } : emptyForm())
  }, [open, proposal])

  async function handleSave() {
    if (!form.clientName.trim()) return setError('El nombre del cliente es requerido')
    setSaving(true)
    setError('')
    try {
      // Si queda "aprobada" se guarda como pendiente y se abre el registro del cierre de venta
      const wantsApproved = form.status === 'aprobada' && proposal?.status !== 'aprobada'
      const body = {
        ...(proposal && { id: proposal.id }),
        clientName: form.clientName.trim(),
        company: form.company.trim(),
        service: form.service.trim(),
        amount: Number(form.amount) || 0,
        recurringAmount: Number(form.recurringAmount) || 0,
        date: parseLocalDate(form.date).toISOString(),
        status: wantsApproved ? (proposal?.status ?? 'por_aprobacion') : form.status,
        notes: form.notes
      }
      const res = await apiFetch('/api/proposals', { method: proposal ? 'PUT' : 'POST', body: JSON.stringify(body) })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'Error al guardar')
      onSaved(data.data, wantsApproved)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <Modal open={open} title={proposal ? 'Editar propuesta' : 'Agregar nueva propuesta'} onClose={onClose} wide>
      {!proposal && (
        <p className="text-xs text-brand-muted mb-4">Cada propuesta nueva cuenta automáticamente como un lead.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cliente *"><input className={modalInputCls} value={form.clientName} onChange={set('clientName')} autoFocus /></Field>
        <Field label="Empresa"><input className={modalInputCls} value={form.company} onChange={set('company')} /></Field>
        <Field label="Servicio"><input className={modalInputCls} value={form.service} onChange={set('service')} placeholder="CRM, Agente IA, Asesoría…" /></Field>
        <Field label="Monto (pago único / onboarding)"><input type="number" min="0" step="0.01" className={modalInputCls} value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Mensual esperado (MRR)"><input type="number" min="0" step="0.01" className={modalInputCls} value={form.recurringAmount} onChange={set('recurringAmount')} placeholder="0 si no es recurrente" /></Field>
        <Field label="Fecha de envío"><input type="date" className={modalInputCls} value={form.date} onChange={set('date')} /></Field>
        <Field label="Estado">
          <select className={`${modalInputCls} dark-select`} value={form.status} onChange={set('status')}>
            <option value="por_aprobacion">Por aprobación</option>
            <option value="aprobada">Aprobada</option>
            <option value="no_cerrada">No cerrada</option>
          </select>
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          <textarea className={modalInputCls} rows={2} value={form.notes} onChange={set('notes')} />
        </Field>
      </div>
      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mt-3">{error}</p>}
      <div className="flex gap-2 mt-5">
        <Button onClick={handleSave} loading={saving}>{proposal ? 'Guardar cambios' : 'Agregar propuesta'}</Button>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  )
}
