'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'
import { Modal, Field, modalInputCls } from './Modal'
import type { Proposal } from '@/types'

const PRODUCTS = ['CRM', 'Agente IA', 'Enigma', 'Comunidad', 'Asesoría', 'Otro']

interface CloseSaleModalProps {
  proposal: Proposal | null          // propuesta que se está cerrando (null = modal cerrado)
  onClose: () => void                // cancelar: la propuesta conserva su estado
  onDone: () => void                 // venta registrada y propuesta marcada como aprobada
}

// Al aprobar una propuesta se registra el cierre de venta en el mismo paso.
export function CloseSaleModal({ proposal, onClose, onDone }: CloseSaleModalProps) {
  const [form, setForm] = useState({
    clientName: '', product: 'CRM', customProduct: '',
    onboardingValue: '', recurringValue: '', contractMonths: '', createdAt: formatLocalDate(new Date())
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!proposal) return
    const match = PRODUCTS.find(p => p.toLowerCase() === proposal.service.trim().toLowerCase())
    setForm({
      clientName: proposal.clientName,
      product: match ?? 'Otro',
      customProduct: match ? '' : proposal.service,
      onboardingValue: String(proposal.amount || ''),
      recurringValue: '',
      contractMonths: '',
      createdAt: formatLocalDate(new Date())
    })
    setError('')
  }, [proposal])

  async function handleSave() {
    if (!proposal) return
    if (!form.clientName.trim()) return setError('El nombre del cliente es requerido')
    if (form.product === 'Otro' && !form.customProduct.trim()) return setError('Indica el producto')

    setSaving(true)
    setError('')
    try {
      const saleRes = await apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          product: form.product,
          customProduct: form.product === 'Otro' ? form.customProduct.trim() : null,
          onboardingValue: Number(form.onboardingValue) || 0,
          recurringValue: Number(form.recurringValue) || 0,
          contractMonths: form.contractMonths ? Number(form.contractMonths) : null,
          status: 'active',
          createdAt: parseLocalDate(form.createdAt).toISOString()
        })
      })
      const sale = await saleRes.json()
      if (!sale.success) return setError(sale.error || 'No se pudo registrar el cierre')

      const propRes = await apiFetch('/api/proposals', {
        method: 'PUT',
        body: JSON.stringify({ id: proposal.id, status: 'aprobada' })
      })
      const prop = await propRes.json()
      if (!prop.success) return setError('El cierre se registró, pero no se pudo marcar la propuesta como aprobada')

      onDone()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <Modal open={!!proposal} title="🎉 Registrar cierre de venta" onClose={onClose}>
      <p className="text-sm text-brand-muted mb-4">
        Completa los datos del cierre. Se guardará como cliente activo y la propuesta quedará <strong className="text-green-400">aprobada</strong>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cliente" className="sm:col-span-2">
          <input className={modalInputCls} value={form.clientName} onChange={set('clientName')} />
        </Field>
        <Field label="Producto">
          <select className={`${modalInputCls} dark-select`} value={form.product} onChange={set('product')}>
            {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        {form.product === 'Otro' ? (
          <Field label="¿Cuál producto?">
            <input className={modalInputCls} value={form.customProduct} onChange={set('customProduct')} />
          </Field>
        ) : (
          <Field label="Fecha del cierre">
            <input type="date" className={modalInputCls} value={form.createdAt} onChange={set('createdAt')} />
          </Field>
        )}
        <Field label="Onboarding (pago único)">
          <input type="number" min="0" step="0.01" className={modalInputCls} value={form.onboardingValue} onChange={set('onboardingValue')} />
        </Field>
        <Field label="Mensual (MRR)">
          <input type="number" min="0" step="0.01" className={modalInputCls} value={form.recurringValue} onChange={set('recurringValue')} placeholder="0 si no es recurrente" />
        </Field>
        <Field label="Meses de contrato">
          <input type="number" min="1" className={modalInputCls} value={form.contractMonths} onChange={set('contractMonths')} placeholder="Opcional" />
        </Field>
        {form.product === 'Otro' && (
          <Field label="Fecha del cierre">
            <input type="date" className={modalInputCls} value={form.createdAt} onChange={set('createdAt')} />
          </Field>
        )}
      </div>
      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mt-3">{error}</p>}
      <div className="flex gap-2 mt-5">
        <Button onClick={handleSave} loading={saving}>Registrar cierre</Button>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  )
}
