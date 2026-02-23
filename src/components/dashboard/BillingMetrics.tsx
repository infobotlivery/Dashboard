'use client'

import { GlassCard } from '@/components/finanzas/GlassCard'
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

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Finanzas del Mes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(addMonths(activeMonth, -1))}
            className="btn-secondary px-3 py-1.5 text-sm"
            title="Mes anterior"
          >
            ←
          </button>
          <span className="text-white font-medium text-sm min-w-[120px] text-center">
            {formatMonthLabel(selectedMonth)}
          </span>
          <button
            onClick={() => {
              const next = addMonths(activeMonth, 1)
              // No navegar más allá del mes actual
              if (next <= currentMonth) {
                onMonthChange(next)
              } else {
                onMonthChange('')
              }
            }}
            className="btn-secondary px-3 py-1.5 text-sm"
            title="Mes siguiente"
          >
            →
          </button>
          {selectedMonth && (
            <button
              onClick={() => onMonthChange('')}
              className="btn-secondary px-3 py-1.5 text-sm text-brand-primary"
              title="Ir al mes actual"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facturación */}
        <GlassCard variant="cyan">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-brand-muted text-sm font-medium">Facturación del Mes</p>
              {incomeTarget > 0 && (
                <span className="text-xs text-brand-muted">
                  Meta: {formatCurrency(incomeTarget)}
                </span>
              )}
            </div>
            <AnimatedNumber
              value={totalIncome}
              className="text-3xl font-bold text-brand-primary"
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
            {incomeTarget > 0 && (
              <ProgressBar
                current={totalIncome}
                target={incomeTarget}
                color="cyan"
                height="sm"
                showValues={false}
              />
            )}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
              <div>
                <p className="text-xs text-brand-muted">Onboarding</p>
                <p className="text-sm font-semibold text-green-400">{formatCurrency(onboarding)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">MRR Servicios</p>
                <p className="text-sm font-semibold text-brand-primary">{formatCurrency(mrrServices)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">MRR Comunidad</p>
                <p className="text-sm font-semibold text-blue-400">{formatCurrency(mrrCommunity)}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Utilidad */}
        <GlassCard variant={netProfit >= 0 ? 'green' : 'red'}>
          <div className="space-y-3">
            <p className="text-brand-muted text-sm font-medium">Utilidad Neta</p>
            <AnimatedNumber
              value={netProfit}
              className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">Margen</span>
                <span className={`font-semibold ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <p className="text-xs text-brand-muted">Ingresos</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Gastos</p>
                <p className="text-sm font-semibold text-red-400">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
