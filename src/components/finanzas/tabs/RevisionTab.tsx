'use client'

import { useCallback, useEffect, useState } from 'react'
import { GlassCard } from '@/components/finanzas/GlassCard'
import { apiFetch } from '@/lib/apiFetch'

interface Item {
  id: number
  name: string
  amount: number
  type: string
  category: string
  categoryColor: string
  billingDay: number | null
  paidByClient: string | null
  needsReview: boolean
  action: string | null
}
interface Group { category: string; color: string; items: Item[]; total: number }
interface Review {
  month: string
  groups: Group[]
  totals: { total: number; fijos: number; variables: number; unicos: number; previous: number }
  pending: number
  reviewed: number
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const TYPE_LABEL: Record<string, string> = { recurring: 'Fijo mensual', variable: 'Variable', fixed: 'Único' }
const fmt = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v)
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const shift = (m: string, delta: number) => {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const label = (m: string) => { const [y, mo] = m.split('-').map(Number); return `${MONTHS[mo - 1]} ${y}` }

/** Revisión mensual: cada gasto mensual se confirma con Sigue / Cancelar / Cambiar monto. */
export function RevisionTab({ onChanged }: { onChanged?: () => void }) {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<Review | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/finance/review?month=${month}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || 'No se pudo cargar')
    } catch { setError('Error de conexión') }
  }, [month])

  useEffect(() => { load() }, [load])

  async function act(item: Item, action: 'keep' | 'cancel' | 'change') {
    let amount: number | undefined
    if (action === 'cancel' && !confirm(`¿Cancelar "${item.name}"? Deja de contarse desde ${label(month)}; los meses anteriores no cambian.`)) return
    if (action === 'change') {
      const raw = window.prompt(`Nuevo monto mensual de "${item.name}" desde ${label(month)} (ahora ${fmt(item.amount)}):`, String(item.amount))
      if (raw === null) return
      amount = Number(raw.replace(',', '.'))
      if (!Number.isFinite(amount) || amount <= 0) { alert('Escribe un monto mayor que 0'); return }
    }
    setBusy(item.id)
    setError('')
    try {
      const res = await apiFetch('/api/finance/review', { method: 'POST', body: JSON.stringify({ expenseId: item.id, month, action, amount }) })
      const json = await res.json()
      if (!json.success) setError(json.error || 'No se pudo guardar')
      await load()
      onChanged?.()
    } catch { setError('Error de conexión') }
    finally { setBusy(null) }
  }

  const diff = data ? data.totals.total - data.totals.previous : 0
  const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibleGroups = (data?.groups ?? [])
    .map(g => ({ ...g, items: g.items.filter(i => !search.trim() || norm(i.name).includes(norm(search))) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Revisión de {label(month)}</h3>
            <p className="text-sm text-gray-400">Confirma cada gasto mensual: sigue, se cancela o cambia de monto.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonth(shift(month, -1))} className="btn-secondary text-sm" aria-label="Mes anterior">‹</button>
            <button onClick={() => setMonth(currentMonth())} className="btn-secondary text-sm">Hoy</button>
            <button onClick={() => setMonth(shift(month, 1))} className="btn-secondary text-sm" aria-label="Mes siguiente">›</button>
          </div>
        </div>

        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Stat title="Total del mes" value={fmt(data.totals.total)} sub={`${diff >= 0 ? '▲' : '▼'} ${fmt(Math.abs(diff))} vs mes anterior`} />
            <Stat title="Fijos mensuales" value={fmt(data.totals.fijos)} sub="Mismo monto cada mes" />
            <Stat title="Variables" value={fmt(data.totals.variables)} sub="El monto cambia cada mes" />
            <Stat title="Únicos" value={fmt(data.totals.unicos)} sub="Un solo pago" />
          </div>
        )}
        {data && (
          <p className={`mt-4 text-sm px-4 py-2 rounded-lg ${data.pending > 0 ? 'bg-yellow-400/10 text-yellow-300' : 'bg-green-400/10 text-green-400'}`}>
            {data.pending > 0
              ? `⚠ ${data.pending} gasto${data.pending === 1 ? '' : 's'} sin revisar este mes (${data.reviewed} revisados)`
              : '✓ Todos los gastos mensuales están revisados'}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </GlassCard>

      {!data && !error && <p className="text-sm text-gray-400">Cargando…</p>}
      {data && data.groups.length === 0 && <GlassCard hover={false} className="p-5"><p className="text-gray-400 text-sm">No hay gastos vigentes en este mes.</p></GlassCard>}

      {data && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar gasto por nombre…"
          className="w-full sm:w-72 px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white placeholder:text-gray-500 focus:border-[#44e1fc] focus:outline-none"
        />
      )}

      {visibleGroups.map(g => (
        <GlassCard key={g.category} hover={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: g.color }} />
              {g.category}
              <span className="text-xs text-gray-500">({g.items.length})</span>
            </h4>
            <span className="font-semibold text-red-400">{fmt(g.total)}</span>
          </div>
          <div className="divide-y divide-white/5">
            {g.items.map(i => (
              <div key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-medium">
                    {i.name}
                    {i.paidByClient && <span className="ml-2 text-xs rounded bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5">Paga {i.paidByClient}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABEL[i.type] ?? i.type}{i.billingDay ? ` · día ${i.billingDay}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-red-400 font-semibold">{fmt(i.amount)}</span>
                  {!i.needsReview ? (
                    <span className="text-xs text-gray-500">No requiere revisión</span>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      {i.action && (
                        <span className="text-xs rounded-full px-2 py-1 bg-green-400/10 text-green-400">
                          {i.action === 'keep' ? '✓ Sigue' : i.action === 'changed' ? '✓ Monto cambiado' : '✓ Cancelado'}
                        </span>
                      )}
                      <button disabled={busy === i.id} onClick={() => act(i, 'keep')} className="btn-secondary text-xs">Sigue</button>
                      <button disabled={busy === i.id} onClick={() => act(i, 'change')} className="btn-secondary text-xs">Cambiar monto</button>
                      <button disabled={busy === i.id} onClick={() => act(i, 'cancel')} className="btn-secondary text-xs text-red-400">Cancelar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}
