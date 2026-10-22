'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'
import { Modal, Field, modalInputCls } from './Modal'

interface Row { id: number; dueDate: string; amount: number; paid: boolean }

interface Props {
  sale: { id: number; clientName: string } | null   // null = cerrado
  onClose: () => void
  onChanged: () => void
}

// Ver, agregar y quitar las cuotas pendientes de un cliente ya registrado
export function SaleInstallmentsModal({ sale, onClose, onChanged }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<{ dueDate: string; amount: string }[]>([])
  const [gen, setGen] = useState({ count: '', amount: '', first: formatLocalDate(new Date()) })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!sale) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/sales/installments?saleId=${sale.id}`)
      const data = await res.json()
      if (data.success) setRows(data.data)
    } finally {
      setLoading(false)
    }
  }, [sale])

  useEffect(() => {
    setDraft([]); setError('')
    load()
  }, [load])

  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
  const total = rows.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0)

  // N cuotas mensuales a partir de la primera fecha
  function generate() {
    const n = Math.floor(Number(gen.count))
    const amount = Number(gen.amount)
    if (!(n > 0) || !(amount > 0) || !gen.first) return setError('Indica cuántas cuotas, el monto de cada una y la fecha de la primera')
    setError('')
    const base = parseLocalDate(gen.first)
    setDraft(Array.from({ length: n }, (_, k) => {
      const first = new Date(base.getFullYear(), base.getMonth() + k, 1)
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
      return { dueDate: formatLocalDate(new Date(first.getFullYear(), first.getMonth(), Math.min(base.getDate(), last))), amount: String(amount) }
    }))
  }
  const setD = (idx: number, k: 'dueDate' | 'amount', v: string) =>
    setDraft(list => list.map((r, i) => (i === idx ? { ...r, [k]: v } : r)))

  async function saveDraft() {
    if (!sale || draft.length === 0) return
    if (draft.some(d => !d.dueDate || !(Number(d.amount) > 0))) return setError('Cada cuota necesita fecha y un monto mayor que 0')
    setSaving(true); setError('')
    try {
      const res = await apiFetch('/api/sales/installments', {
        method: 'POST',
        body: JSON.stringify({ saleId: sale.id, installments: draft.map(d => ({ dueDate: parseLocalDate(d.dueDate).toISOString(), amount: Number(d.amount) })) })
      })
      const data = await res.json()
      if (!data.success) return setError(data.error || 'No se pudieron guardar las cuotas')
      setDraft([]); await load(); onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('¿Quitar esta cuota?')) return
    const res = await apiFetch(`/api/sales/installments?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!data.success) return setError(data.error || 'No se pudo quitar la cuota')
    await load(); onChanged()
  }

  return (
    <Modal open={!!sale} title={`Cuotas de ${sale?.clientName ?? ''}`} onClose={onClose} wide>
      <p className="text-sm text-brand-muted mb-4">
        Cada cuota aparece en "Cobros de clientes" y en "Cuentas por cobrar" en su fecha. Se marca ✓ al cobrarla. No cuentan como MRR.
      </p>

      {loading ? (
        <p className="text-sm text-brand-muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2">Este cliente no tiene cuotas registradas. Agrégalas abajo.</p>
      ) : (
        <>
          <ul className="space-y-1 mb-2">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-xs text-brand-muted">Cuota {i + 1}</span>
                <span className="flex-1 text-gray-300">{parseLocalDate(formatLocalDate(new Date(r.dueDate))).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="w-24 text-right text-white">{fmt(r.amount)}</span>
                {r.paid ? <span className="w-16 text-xs text-green-400">Cobrada</span> : (
                  <button type="button" onClick={() => remove(r.id)} className="w-16 text-xs text-red-400 hover:text-red-300" aria-label={`Quitar cuota ${i + 1}`}>Quitar</button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-brand-muted mb-4">Pendiente por cobrar: <strong className="text-white">{fmt(total)}</strong></p>
        </>
      )}

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-sm font-medium text-white">Agregar cuotas</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Nº de cuotas"><input type="number" min="1" className={`${modalInputCls} w-24`} value={gen.count} onChange={e => setGen({ ...gen, count: e.target.value })} placeholder="3" /></Field>
          <Field label="Monto c/u"><input type="number" min="0" step="0.01" className={`${modalInputCls} w-28`} value={gen.amount} onChange={e => setGen({ ...gen, amount: e.target.value })} placeholder="350" /></Field>
          <Field label="Primera cuota"><input type="date" className={modalInputCls} value={gen.first} onChange={e => setGen({ ...gen, first: e.target.value })} /></Field>
          <Button variant="secondary" onClick={generate}>Generar mensuales</Button>
        </div>
        {draft.length > 0 && (
          <ul className="space-y-2">
            {draft.map((d, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input type="date" className={modalInputCls} value={d.dueDate} onChange={e => setD(idx, 'dueDate', e.target.value)} aria-label={`Fecha de la cuota nueva ${idx + 1}`} />
                <input type="number" min="0" step="0.01" className={`${modalInputCls} w-28`} value={d.amount} onChange={e => setD(idx, 'amount', e.target.value)} aria-label={`Monto de la cuota nueva ${idx + 1}`} />
                <button type="button" onClick={() => setDraft(list => list.filter((_, i) => i !== idx))} className="text-brand-muted hover:text-red-400 px-1" aria-label="Quitar">✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between">
          <button type="button" className="text-xs text-brand-primary hover:underline" onClick={() => setDraft(list => [...list, { dueDate: formatLocalDate(new Date()), amount: '' }])}>+ Agregar una cuota</button>
          {draft.length > 0 && <Button onClick={saveDraft} loading={saving}>Guardar {draft.length} cuota{draft.length === 1 ? '' : 's'}</Button>}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mt-3">{error}</p>}
    </Modal>
  )
}
