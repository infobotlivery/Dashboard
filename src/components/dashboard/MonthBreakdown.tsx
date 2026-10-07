'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

interface CobradoRow { type: 'onboarding' | 'mensualidad' | 'otro'; client: string; detail: string; date: string; amount: number; assumed: boolean }
interface MrrRow { client: string; product: string; amount: number; since: string; cancelledAt: string | null }
interface Breakdown {
  month: string
  tracked: boolean
  cobrado: { rows: CobradoRow[]; total: number }
  mrr: { rows: MrrRow[]; total: number; cobrado: number }
}

const fmt = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v)
const TYPE: Record<CobradoRow['type'], string> = { onboarding: 'Pago único', mensualidad: 'Mensualidad', otro: 'Otro ingreso' }

/** Desplegable "¿De dónde sale cada número?": clientes y montos detrás de la facturación y el MRR del mes. */
export function MonthBreakdown({ month, refreshKey }: { month: string; refreshKey?: number }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Breakdown | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    apiFetch(`/api/finance/breakdown?month=${month}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, month, refreshKey])

  return (
    <details className="glass-card p-0 overflow-hidden group" onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer select-none list-none px-5 py-3 flex items-center justify-between">
        <span>
          <span className="font-semibold text-white">¿De dónde sale este mes?</span>
          <span className="block text-xs text-brand-muted">Clientes y montos detrás de la facturación cobrada y del MRR</span>
        </span>
        <span className="text-brand-muted text-sm group-open:rotate-180 transition-transform">▾</span>
      </summary>

      <div className="px-5 pb-5 pt-4 border-t border-white/10 space-y-6">
        {loading && !data && <p className="text-sm text-brand-muted">Cargando…</p>}
        {data && (
          <>
            <section>
              <h4 className="font-semibold text-white mb-1">Facturación cobrada: {fmt(data.cobrado.total)}</h4>
              {!data.tracked && (
                <p className="text-xs text-brand-muted mb-2">Mes sin registro de cobros: se asume que las mensualidades vigentes se cobraron.</p>
              )}
              {data.cobrado.rows.length === 0 ? (
                <p className="text-sm text-brand-muted">No hay cobros registrados en este mes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-brand-muted"><th className="py-1 pr-3">Cliente</th><th className="pr-3">Concepto</th><th className="pr-3">Fecha</th><th className="text-right">Monto</th></tr></thead>
                    <tbody>
                      {data.cobrado.rows.map((r, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="py-1.5 pr-3 text-white">{r.client}</td>
                          <td className="pr-3 text-brand-muted">
                            <span className="text-xs mr-2 rounded bg-white/10 px-1.5 py-0.5">{TYPE[r.type]}</span>{r.detail}
                          </td>
                          <td className="pr-3 text-brand-muted whitespace-nowrap">{r.date || '—'}</td>
                          <td className="text-right text-green-400 whitespace-nowrap">{fmt(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h4 className="font-semibold text-white mb-1">MRR activo: {fmt(data.mrr.total)}</h4>
              <p className="text-xs text-brand-muted mb-2">Clientes con mensualidad vigente al cierre del mes.{data.tracked ? ` Cobrado hasta ahora: ${fmt(data.mrr.cobrado)}.` : ''}</p>
              {data.mrr.rows.length === 0 ? (
                <p className="text-sm text-brand-muted">Ningún cliente tenía mensualidad vigente en este mes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-brand-muted"><th className="py-1 pr-3">Cliente</th><th className="pr-3">Servicio</th><th className="pr-3">Desde</th><th className="text-right">Mensual</th></tr></thead>
                    <tbody>
                      {data.mrr.rows.map((r, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="py-1.5 pr-3 text-white">{r.client}</td>
                          <td className="pr-3 text-brand-muted">{r.product}</td>
                          <td className="pr-3 text-brand-muted whitespace-nowrap">{r.since}</td>
                          <td className="text-right text-brand-primary whitespace-nowrap">{fmt(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </details>
  )
}
