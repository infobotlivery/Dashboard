'use client'

import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/finanzas/AnimatedNumber'
import { ProgressBar } from '@/components/finanzas/ProgressBar'
import type { FinanceSummary, MonthlyGoal } from '@/types'

interface BillingMetricsProps {
  summary: FinanceSummary | null
  goal: MonthlyGoal | null
  selectedMonth: string
  onMonthChange: (m: string) => void
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function formatMonthLabel(yyyyMM: string): string {
  if (!yyyyMM) {
    const now = new Date()
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
  }
  const [year, month] = yyyyMM.split('-').map(Number)
  return `${monthNames[month - 1]} ${year}`
}

function getCurrentYYYYMM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function addMonths(yyyyMM: string, delta: number): string {
  const base = yyyyMM || getCurrentYYYYMM()
  const [year, month] = base.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {direction === 'left'
        ? <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  )
}

export function BillingMetrics({ summary, goal, selectedMonth, onMonthChange }: BillingMetricsProps) {
  const activeMonth = selectedMonth || getCurrentYYYYMM()
  const currentMonth = getCurrentYYYYMM()

  const totalIncome = summary?.income.total ?? 0
  const totalExpenses = summary?.expenses.total ?? 0
  const netProfit = summary?.netProfit ?? 0
  const onboarding = summary?.income.onboarding ?? 0
  const mrrServices = summary?.income.mrrServices ?? 0
  const mrrCommunity = summary?.income.mrrCommunity ?? 0

  const incomeTarget = goal?.incomeTarget ?? 0
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
  const isPositive = netProfit >= 0

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-4">
      {/* Header + Selector de mes */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Finanzas del Mes</h2>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => onMonthChange(addMonths(activeMonth, -1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-all"
            title="Mes anterior"
          >
            <ChevronIcon direction="left" />
          </button>
          <span className="text-white font-medium text-sm min-w-[130px] text-center px-2">
            {formatMonthLabel(selectedMonth)}
          </span>
          <button
            onClick={() => {
              const next = addMonths(activeMonth, 1)
              onMonthChange(next <= currentMonth ? next : '')
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-white transition-all"
            title="Mes siguiente"
          >
            <ChevronIcon direction="right" />
          </button>
          {selectedMonth && (
            <button
              onClick={() => onMonthChange('')}
              className="px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20 transition-all ml-1"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Facturación ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[20px] border border-[#44e1fc]/20 bg-[rgba(14,28,32,0.7)] backdrop-blur-xl p-6"
        >
          {/* Orbe decorativo */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#44e1fc]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cyan-800/20 blur-2xl pointer-events-none" />
          {/* Grid sutil de fondo */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(68,225,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(68,225,252,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />

          <div className="relative space-y-4">
            {/* Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#44e1fc]/10 border border-[#44e1fc]/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M10.5 4H5.25a2.25 2.25 0 0 0 0 4.5h3.5a2.25 2.25 0 0 1 0 4.5H3.5" stroke="#44e1fc" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-brand-muted text-sm font-medium">Facturación del Mes</span>
              </div>
              {incomeTarget > 0 && (
                <span className="text-xs text-[#44e1fc]/60 px-2 py-1 rounded-lg bg-[#44e1fc]/5 border border-[#44e1fc]/10">
                  Meta {fmt(incomeTarget)}
                </span>
              )}
            </div>

            {/* Número principal con glow */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-[#44e1fc]/8 blur-lg pointer-events-none" />
              <AnimatedNumber
                value={totalIncome}
                className="relative text-4xl font-black text-[#44e1fc] tracking-tight"
                formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
              />
            </div>

            {/* Barra de progreso */}
            {incomeTarget > 0 && (
              <ProgressBar current={totalIncome} target={incomeTarget} color="cyan" height="sm" showValues={false} />
            )}

            {/* Sub-métricas como mini-cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1.5">Onboarding</p>
                <p className="text-sm font-bold text-green-400 leading-none">{fmt(onboarding)}</p>
              </div>
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1.5">MRR Serv.</p>
                <p className="text-sm font-bold text-[#44e1fc] leading-none">{fmt(mrrServices)}</p>
              </div>
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1.5">MRR Com.</p>
                <p className="text-sm font-bold text-blue-400 leading-none">{fmt(mrrCommunity)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Utilidad Neta ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className={`relative overflow-hidden rounded-[20px] backdrop-blur-xl p-6 ${
            isPositive
              ? 'border border-green-500/20 bg-[rgba(10,26,15,0.7)]'
              : 'border border-red-500/20 bg-[rgba(26,10,10,0.7)]'
          }`}
        >
          {/* Orbe decorativo */}
          <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isPositive ? 'bg-green-500/12' : 'bg-red-500/12'}`} />
          <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl pointer-events-none ${isPositive ? 'bg-green-900/20' : 'bg-red-900/20'}`} />

          <div className="relative space-y-4">
            {/* Label + badge de margen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    {isPositive
                      ? <path d="M2 10L5.5 6.5l3 3L12 3" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      : <path d="M2 4L5.5 7.5l3-3L12 11" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    }
                  </svg>
                </div>
                <span className="text-brand-muted text-sm font-medium">Utilidad Neta</span>
              </div>
              {/* Badge de margen */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                isPositive
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {margin >= 0 ? '+' : ''}{margin.toFixed(1)}% margen
              </span>
            </div>

            {/* Número principal */}
            <div className="relative">
              <div className={`absolute -inset-1 rounded-xl blur-lg pointer-events-none ${isPositive ? 'bg-green-500/8' : 'bg-red-500/8'}`} />
              <AnimatedNumber
                value={netProfit}
                className={`relative text-4xl font-black tracking-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
              />
            </div>

            {/* Barra Ingresos vs Gastos */}
            {totalIncome > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-brand-muted uppercase tracking-wider">
                  <span>Ingresos</span>
                  <span>Gastos</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalIncome / (totalIncome + totalExpenses)) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-green-500 rounded-l-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalExpenses / (totalIncome + totalExpenses)) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-red-500 rounded-r-full"
                  />
                </div>
              </div>
            )}

            {/* Sub-métricas */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1.5">Ingresos</p>
                <p className="text-sm font-bold text-white leading-none">{fmt(totalIncome)}</p>
              </div>
              <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1.5">Gastos</p>
                <p className="text-sm font-bold text-red-400 leading-none">{fmt(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
