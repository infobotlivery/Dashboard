'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GlassCard } from './GlassCard'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'
import type { AccountEntry } from '@/types'

type Kind = AccountEntry['kind']

interface CuentasPanelProps {
  onChanged?: () => void
}

const kindLabels: Record<Kind, { title: string; counterparty: string; paidLabel: string; color: string }> = {
  receivable: { title: 'Cuentas por cobrar', counterparty: 'Cliente', paidLabel: 'Cobrada', color: 'text-green-400' },
  payable: { title: 'Cuentas por pagar', counterparty: 'Proveedor', paidLabel: 'Pagada', color: 'text-red-400' }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// 'YYYY-MM-DD' local (regla #4: nunca toISOString().split)
function toInputDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const emptyForm = (kind: Kind) => ({ kind, concept: '', counterparty: '', amount: '', dueDate: toInputDate(new Date()), notes: '' })

export function CuentasPanel({ onChanged }: CuentasPanelProps) {
  const [accounts, setAccounts] = useState<AccountEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ReturnType<typeof emptyForm> | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPaid, setShowPaid] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/finance/accounts')
      const data = await res.json()
      if (data.success) setAccounts(data.data)
      else setError(data.error || 'Error al cargar cuentas')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const now = useMemo(() => new Date(), [])

  async function mutate(url: string, init: RequestInit) {
    setError('')
    const res = await apiFetch(url, init)
    const data = await res.json()
    if (!data.success) {
      setError(data.error || 'Error al guardar')
      return false
    }
    await load()
    onChanged?.()
    return true
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    const ok = await mutate('/api/finance/accounts', {
      method: editingId ? 'PUT' : 'POST',
      body: JSON.stringify({ ...form, amount: Number(form.amount), id: editingId })
    })
    setSaving(false)
    if (ok) {
      setForm(null)
      setEditingId(null)
    }
  }

  function startEdit(a: AccountEntry) {
    setEditingId(a.id)
    setForm({
      kind: a.kind,
      concept: a.concept,
      counterparty: a.counterparty,
      amount: String(a.amount),
      dueDate: toInputDate(new Date(a.dueDate)),
      notes: a.notes || ''
    })
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#44e1fc]'

  function renderColumn(kind: Kind) {
    const meta = kindLabels[kind]
    const all = accounts.filter(a => a.kind === kind)
    const pending = all.filter(a => a.status === 'pending')
    const paid = all.filter(a => a.status === 'paid')
    const total = pending.reduce((s, a) => s + a.amount, 0)
    const overdue = pending.filter(a => new Date(a.dueDate) < now).reduce((s, a) => s + a.amount, 0)
    const rows = showPaid ? [...pending, ...paid] : pending

    return (
      <GlassCard variant={kind === 'receivable' ? 'green' : 'red'} hover={false} className="p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <h3 className="font-semibold">{meta.title}</h3>
            <p className={`text-2xl font-bold ${meta.color}`}>{fmt(total)}</p>
            {overdue > 0 && <p className="text-xs text-yellow-400">{fmt(overdue)} vencido</p>}
          </div>
          <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm(kind)) }}>+ Agregar</Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400">Sin cuentas pendientes</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {rows.map(a => {
              const isOverdue = a.status === 'pending' && new Date(a.dueDate) < now
              return (
                <li key={a.id} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${a.status === 'paid' ? 'line-through text-gray-500' : ''}`}>
                      {a.concept}{a.counterparty && <span className="text-gray-400 font-normal"> · {a.counterparty}</span>}
                    </p>
                    <p className={`text-xs ${isOverdue ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {isOverdue ? 'Vencida ' : 'Vence '}
                      {new Date(a.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{fmt(a.amount)}</span>
                    {a.status === 'pending' ? (
                      <button title={`Marcar ${meta.paidLabel.toLowerCase()}`} className="text-green-400 hover:text-green-300"
                        onClick={() => mutate('/api/finance/accounts', { method: 'PATCH', body: JSON.stringify({ id: a.id }) })}>✓</button>
                    ) : (
                      <button title="Reabrir" className="text-gray-400 hover:text-white"
                        onClick={() => mutate('/api/finance/accounts', { method: 'PATCH', body: JSON.stringify({ id: a.id, paid: false }) })}>↺</button>
                    )}
                    <button title="Editar" className="text-gray-400 hover:text-white" onClick={() => startEdit(a)}>✎</button>
                    <button title="Eliminar" className="text-gray-400 hover:text-red-400"
                      onClick={() => { if (confirm('¿Eliminar esta cuenta?')) mutate(`/api/finance/accounts?id=${a.id}`, { method: 'DELETE' }) }}>🗑</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cuentas por cobrar y por pagar</h2>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)} />
          Mostrar saldadas
        </label>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 py-2 px-4 rounded-lg">{error}</p>}

      {form && (
        <GlassCard hover={false} className="p-5">
          <h3 className="font-semibold mb-3">
            {editingId ? 'Editar' : 'Nueva'} {form.kind === 'receivable' ? 'cuenta por cobrar' : 'cuenta por pagar'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Concepto *" value={form.concept}
              onChange={e => setForm({ ...form, concept: e.target.value })} />
            <input className={inputCls} placeholder={kindLabels[form.kind].counterparty} value={form.counterparty}
              onChange={e => setForm({ ...form, counterparty: e.target.value })} />
            <input className={inputCls} type="number" min="0" step="0.01" placeholder="Monto *" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />
            <input className={inputCls} type="date" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            <input className={`${inputCls} md:col-span-2`} placeholder="Notas" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
            <Button variant="secondary" onClick={() => { setForm(null); setEditingId(null) }}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderColumn('receivable')}
        {renderColumn('payable')}
      </div>
    </div>
  )
}
