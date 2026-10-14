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
    onboardingValue: '', recurringValue: '', contractMonths: '',
    createdAt: formatLocalDate(new Date())
  })
  // Cuotas pendientes (asesorías): cada una con su fecha y su monto
  const [installments, setInstallments] = useState<{ dueDate: string; amount: string }[]>([])
  const [gen, setGen] = useState({ count: '', amount: '' })
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
      recurringValue: proposal.recurringAmount ? String(proposal.recurringAmount) : '',
      contractMonths: '',
      createdAt: formatLocalDate(new Date())
    })
    setInstallments([])
    setGen({ count: '', amount: '' })
    setError('')
  }, [proposal])

  async function handleSave() {
    if (!proposal) return
    if (!form.clientName.trim()) return setError('El nombre del cliente es requerido')
    if (form.product === 'Otro' && !form.customProduct.trim()) return setError('Indica el producto')
    if (isAdvisory && installments.some(i => !i.dueDate || !(Number(i.amount) > 0))) {
      return setError('Cada cuota necesita fecha y monto mayor que 0 (o quita las filas vacías)')
    }

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
          // Asesoría: se cobra en cuotas (no es MRR)
          recurringValue: isAdvisory ? 0 : Number(form.recurringValue) || 0,
          contractMonths: !isAdvisory && form.contractMonths ? Number(form.contractMonths) : null,
          installments: isAdvisory ? installments.map(i => ({ dueDate: parseLocalDate(i.dueDate).toISOString(), amount: Number(i.amount) })) : [],
          status: 'active',
          proposalId: proposal.id,
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

  const isAdvisory = form.product === 'Asesoría'
  const totalCuotas = installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  // Rellena N cuotas mensuales (misma fecha cada mes, desde el mes siguiente al cierre); luego se pueden editar una a una
  function generate() {
    const n = Math.floor(Number(gen.count))
    const amount = Number(gen.amount)
    if (!(n > 0) || !(amount > 0)) return setError('Indica cuántas cuotas y el monto de cada una para generarlas')
    setError('')
    const base = parseLocalDate(form.createdAt)
    setInstallments(Array.from({ length: n }, (_, k) => {
      const first = new Date(base.getFullYear(), base.getMonth() + k + 1, 1)
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
      return { dueDate: formatLocalDate(new Date(first.getFullYear(), first.getMonth(), Math.min(base.getDate(), last))), amount: String(amount) }
    }))
  }
  const setInst = (idx: number, k: 'dueDate' | 'amount', v: string) =>
    setInstallments(list => list.map((row, i) => (i === idx ? { ...row, [k]: v } : row)))

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
        <Field label={isAdvisory ? 'Pago inicial (onboarding)' : 'Onboarding (pago único)'}>
          <input type="number" min="0" step="0.01" className={modalInputCls} value={form.onboardingValue} onChange={set('onboardingValue')} />
        </Field>
        {isAdvisory ? (
          <div className="sm:col-span-2 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div>
              <p className="text-sm font-medium text-white">Cuotas pendientes</p>
              <p className="text-xs text-brand-muted">Cada cuota tiene su propia fecha y monto. Aparecen en "Cuentas por cobrar" y en "Cobros de clientes" en esa fecha. No cuentan como MRR.</p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Field label="Nº de cuotas">
                <input type="number" min="1" step="1" className={`${modalInputCls} w-24`} value={gen.count} onChange={e => setGen({ ...gen, count: e.target.value })} placeholder="3" />
              </Field>
              <Field label="Monto c/u">
                <input type="number" min="0" step="0.01" className={`${modalInputCls} w-28`} value={gen.amount} onChange={e => setGen({ ...gen, amount: e.target.value })} placeholder="150" />
              </Field>
              <Button variant="secondary" onClick={generate}>Generar cuotas mensuales</Button>
            </div>

            {installments.length > 0 && (
              <ul className="space-y-2">
                {installments.map((row, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-brand-muted">Cuota {idx + 1}</span>
                    <input type="date" className={modalInputCls} value={row.dueDate} onChange={e => setInst(idx, 'dueDate', e.target.value)} aria-label={`Fecha de la cuota ${idx + 1}`} />
                    <input type="number" min="0" step="0.01" className={`${modalInputCls} w-28`} value={row.amount} onChange={e => setInst(idx, 'amount', e.target.value)} aria-label={`Monto de la cuota ${idx + 1}`} placeholder="Monto" />
                    <button type="button" onClick={() => setInstallments(list => list.filter((_, i) => i !== idx))} className="text-brand-muted hover:text-red-400 px-1" aria-label={`Quitar cuota ${idx + 1}`}>✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs text-brand-primary hover:underline"
                onClick={() => setInstallments(list => [...list, { dueDate: formatLocalDate(new Date()), amount: '' }])}
              >
                + Agregar cuota
              </button>
              <p className="text-xs text-brand-muted">
                {installments.length > 0 ? `${installments.length} cuota${installments.length === 1 ? '' : 's'} · total $${totalCuotas.toLocaleString('en-US')}` : 'Sin cuotas: el cliente ya pagó todo'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Field label="Mensual (MRR)">
              <input type="number" min="0" step="0.01" className={modalInputCls} value={form.recurringValue} onChange={set('recurringValue')} placeholder="0 si no es recurrente" />
            </Field>
            <Field label="Meses de contrato">
              <input type="number" min="1" className={modalInputCls} value={form.contractMonths} onChange={set('contractMonths')} placeholder="Opcional" />
            </Field>
          </>
        )}
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
