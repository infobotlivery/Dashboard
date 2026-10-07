'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate } from '@/lib/dates'

type Period = 'week' | 'month' | 'quarter'

interface PeriodValues {
  leads: number
  leadsKommo: number
  leadsCalls: number
  leadsProposals: number
  agendadas: number
  callsAttended: number
  callsNoShow: number
  callsPending: number
  asistencia: number
  noShow: number
  cierreSobre: 'asistidas' | 'agendadas' | 'leads'
  clientesActivos: number
  mrrPerdido: number
  churnPct: number
  mrrNeto: number
  propuestas: { total: number; porAprobacion: number; aprobada: number; noCerrada: number; monto: number }
  cierres: number
  tasaCierre: number
  onboarding: number
  mrr: number
  mrrServices: number
  mrrCommunity: number
  mrrCobrado: number
  porCobrarMensualidades: number
  facturacion: number
  clientesPerdidos: number
  mrrNuevo: number
  facturacionNuevas: number
  porCerrar: number
  porCerrarPagoUnico: number
  porCerrarMensual: number
}

interface PeriodResponse {
  label: string
  previousLabel: string
  current: PeriodValues
  previous: PeriodValues
}

interface PeriodMetricsProps {
  /** Mes global del dashboard (YYYY-MM o ''). Con `followMonth` el modo "Mes" lo sigue. */
  month?: string
  followMonth?: boolean
  /** Periodos disponibles (por defecto los tres) y el inicial. */
  periods?: Period[]
  initialPeriod?: Period
  /** Cambia cuando se registra una venta/propuesta para volver a calcular. */
  refreshKey?: number
  title?: string
}

const PERIOD_LABELS: Record<Period, string> = { week: 'Semanal', month: 'Mensual', quarter: 'Trimestral' }

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

function Delta({ value, previous, unit = 'pct', inverse = false }: { value: number; previous: number; unit?: 'pct' | 'pts'; inverse?: boolean }) {
  const diff = value - previous
  if (diff === 0) return <span className="text-xs text-brand-muted">= vs anterior</span>
  const good = inverse ? diff < 0 : diff > 0
  const text = unit === 'pts'
    ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts`
    : previous === 0 ? 'nuevo' : `${diff > 0 ? '+' : ''}${((diff / previous) * 100).toFixed(0)}%`
  return (
    <span className={`text-xs font-medium ${good ? 'text-green-400' : 'text-red-400'}`}>
      {diff > 0 ? '▲' : '▼'} {text} <span className="text-brand-muted font-normal">vs anterior</span>
    </span>
  )
}

function Card({ title, value, sub, delta, delay, star = false }: { title: string; value: string; sub?: string; delta: React.ReactNode; delay: number; star?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card p-5 space-y-1 ${star ? 'ring-1 ring-brand-primary/40' : ''}`}
    >
      <p className="text-xs uppercase tracking-wider text-brand-muted">
        {star && <span className="text-brand-primary mr-1" title="Número clave">★</span>}
        {title}
      </p>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-brand-muted">{sub}</p>}
      <div>{delta}</div>
    </motion.div>
  )
}

function Block({ n, title, question }: { n: number; title: string; question: string }) {
  return (
    <div className="flex items-baseline gap-3 pt-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">{n}</span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <span className="text-sm text-brand-muted hidden sm:inline">{question}</span>
    </div>
  )
}

export function PeriodMetrics({
  month = '',
  followMonth = false,
  periods = ['week', 'month', 'quarter'],
  initialPeriod = 'month',
  refreshKey = 0,
  title = 'Métricas'
}: PeriodMetricsProps) {
  const [period, setPeriod] = useState<Period>(periods.includes(initialPeriod) ? initialPeriod : periods[0])
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<PeriodResponse | null>(null)
  const [error, setError] = useState(false)

  const controlled = followMonth && period === 'month'

  // Fecha ancla del periodo consultado
  function anchorDate(): string {
    const base = new Date()
    if (controlled && month) return `${month}-01`
    if (period === 'week') base.setDate(base.getDate() + offset * 7)
    if (period === 'month') base.setMonth(base.getMonth() + offset, 1)
    if (period === 'quarter') base.setMonth(base.getMonth() + offset * 3, 1)
    return formatLocalDate(base)
  }

  const date = anchorDate()

  useEffect(() => {
    let cancelled = false
    setError(false)
    apiFetch(`/api/metrics/period?period=${period}&date=${date}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) d.data ? setData(d.data) : setError(true) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [period, date, refreshKey])

  const c = data?.current
  const p = data?.previous

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-brand-muted">{data?.label ?? ' '}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {periods.length > 1 && (
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {periods.map(pr => (
                <button
                  key={pr}
                  onClick={() => { setPeriod(pr); setOffset(0) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    period === pr ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-muted hover:text-white'
                  }`}
                >
                  {PERIOD_LABELS[pr]}
                </button>
              ))}
            </div>
          )}
          <a
            href={`/api/metrics/export?period=${period}&date=${date}`}
            download
            className="btn-secondary text-sm"
            title="Descargar las métricas de este periodo en CSV"
          >
            ⬇ Exportar CSV
          </a>
          {!controlled && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setOffset(o => o - 1)} className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white" title="Anterior">‹</button>
              <button onClick={() => setOffset(0)} disabled={offset === 0} className="px-2 py-1 text-xs rounded-lg text-brand-primary disabled:opacity-40">Actual</button>
              <button onClick={() => setOffset(o => Math.min(o + 1, 0))} disabled={offset >= 0} className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white disabled:opacity-40" title="Siguiente">›</button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="glass-card text-center py-6 text-red-400">No se pudieron cargar las métricas</div>}
      {!error && !c && <div className="glass-card text-center py-6 text-brand-muted">Cargando…</div>}

      {c && p && (
        <>
        {/* 1 · EMBUDO */}
        <Block n={1} title="Embudo" question="¿Estoy generando oportunidades?" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="Leads"
            value={String(c.leads)}
            sub={`${c.leadsCalls} llamadas agendadas + ${c.leadsProposals} propuestas directas`}
            delta={<Delta value={c.leads} previous={p.leads} />}
            delay={0}
          />
          <Card
            title="Llamadas asistidas"
            value={String(c.callsAttended)}
            sub={`${c.agendadas} agendadas · ${c.callsNoShow} no asistieron`}
            delta={<Delta value={c.callsAttended} previous={p.callsAttended} />}
            delay={0.04}
          />
          <Card
            title="Propuestas enviadas"
            value={String(c.propuestas.total)}
            sub={`${c.propuestas.aprobada} aprobadas · ${c.propuestas.porAprobacion} por aprobar · ${c.propuestas.noCerrada} no cerradas`}
            delta={<Delta value={c.propuestas.total} previous={p.propuestas.total} />}
            delay={0.08}
          />
          <Card title="Clientes nuevos" value={String(c.cierres)} sub="Cierres de venta" delta={<Delta value={c.cierres} previous={p.cierres} />} delay={0.12} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            star
            title="% de cierre"
            value={`${c.tasaCierre.toFixed(1)}%`}
            sub={
              c.cierreSobre === 'asistidas'
                ? 'Clientes nuevos ÷ llamadas asistidas'
                : c.cierreSobre === 'agendadas'
                  ? 'Sobre llamadas agendadas: marca la asistencia para afinarlo'
                  : 'Sobre leads (aún no hay llamadas)'
            }
            delta={<Delta value={c.tasaCierre} previous={p.tasaCierre} unit="pts" />}
            delay={0}
          />
          <Card
            title="Asistencia a llamadas"
            value={`${c.asistencia.toFixed(0)}%`}
            sub={`${c.callsAttended} asistieron · ${c.callsNoShow} no asistieron`}
            delta={<Delta value={c.asistencia} previous={p.asistencia} unit="pts" />}
            delay={0.04}
          />
          <Card
            title="Llamadas por marcar"
            value={String(c.callsPending)}
            sub="Ya ocurrieron y falta marcar si asistieron"
            delta={<span className="text-xs text-brand-muted">Márcalas en "Llamadas"</span>}
            delay={0.08}
          />
        </div>
        {c.leadsKommo > 0 && (
          <p className="text-xs text-brand-muted">Aparte: {c.leadsKommo} conversaciones calificadas en Kommo (no se suman a los leads).</p>
        )}

        {/* 2 · VENTAS */}
        <Block n={2} title="Ventas" question="¿Cuánto vendí? (valor firmado, no necesariamente cobrado)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            title="Venta nueva"
            value={fmtMoney(c.facturacionNuevas)}
            sub={`Onboarding ${fmtMoney(c.onboarding)} + MRR nuevo ${fmtMoney(c.mrrNuevo)} · ${c.cierres} cliente${c.cierres === 1 ? '' : 's'}`}
            delta={<Delta value={c.facturacionNuevas} previous={p.facturacionNuevas} />}
            delay={0}
          />
          <Card
            title="Facturación por cerrar"
            value={fmtMoney(c.porCerrar)}
            sub={`${c.propuestas.porAprobacion} propuesta${c.propuestas.porAprobacion === 1 ? '' : 's'} por aprobar · pago único ${fmtMoney(c.porCerrarPagoUnico)} + mensual ${fmtMoney(c.porCerrarMensual)}`}
            delta={<Delta value={c.porCerrar} previous={p.porCerrar} />}
            delay={0.04}
          />
        </div>

        {/* 3 · DINERO */}
        <Block n={3} title="Dinero" question="¿Cuánto entró? (lo cobrado; gastos y utilidad están en Finanzas del Mes)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            star
            title="Facturación cobrada"
            value={fmtMoney(c.facturacion)}
            sub={`Onboarding ${fmtMoney(c.onboarding)} + MRR cobrado ${fmtMoney(c.mrrCobrado)}`}
            delta={<Delta value={c.facturacion} previous={p.facturacion} />}
            delay={0}
          />
          <Card
            title="Mensualidades por cobrar"
            value={period === 'month' ? fmtMoney(c.porCobrarMensualidades) : '—'}
            sub={period === 'month' ? `MRR proyectado ${fmtMoney(c.mrr)}; mensualidades ya cobradas ${fmtMoney(c.mrrCobrado)}` : 'Se calcula en la vista mensual'}
            delta={<span className="text-xs text-brand-muted">Márcalas en "Cobros de clientes"</span>}
            delay={0.04}
          />
        </div>

        {/* 4 · BASE RECURRENTE */}
        <Block n={4} title="Base recurrente (MRR)" question="¿Qué tan sólida es la agencia?" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            star
            title="MRR activo"
            value={fmtMoney(c.mrr)}
            sub={`${c.clientesActivos} cliente${c.clientesActivos === 1 ? '' : 's'} · Servicios ${fmtMoney(c.mrrServices)} · Comunidad ${fmtMoney(c.mrrCommunity)}`}
            delta={<Delta value={c.mrr} previous={p.mrr} />}
            delay={0}
          />
          <Card title="MRR nuevo" value={fmtMoney(c.mrrNuevo)} sub="Clientes que cerraron en el periodo" delta={<Delta value={c.mrrNuevo} previous={p.mrrNuevo} />} delay={0.04} />
          <Card
            title="MRR perdido"
            value={fmtMoney(c.mrrPerdido)}
            sub={`Churn ${c.churnPct.toFixed(1)}% · ${c.clientesPerdidos} cliente${c.clientesPerdidos === 1 ? '' : 's'} perdido${c.clientesPerdidos === 1 ? '' : 's'}`}
            delta={<Delta value={c.mrrPerdido} previous={p.mrrPerdido} inverse />}
            delay={0.08}
          />
          <Card title="MRR neto" value={fmtMoney(c.mrrNeto)} sub="MRR nuevo − MRR perdido" delta={<Delta value={c.mrrNeto} previous={p.mrrNeto} />} delay={0.12} />
        </div>
        </>
      )}
    </div>
  )
}
