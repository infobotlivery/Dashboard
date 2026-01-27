'use client'

import { GlassCard } from '../GlassCard'
import { AnimatedNumber } from '../AnimatedNumber'
import { ProgressBar } from '../ProgressBar'

interface FinanceSummary {
  month: string
  income: {
    total: number
    onboarding: number
    mrrServices: number
    mrrCommunity: number
  }
  expenses: {
    total: number
    byType: {
      fixed: number
      recurring: number
    }
    byCategory: Record<string, { total: number; color: string; items: { name: string; amount: number }[] }>
  }
  netProfit: number
  activeClients: number
}

interface MonthlyGoal {
  id: number
  month: string
  incomeTarget: number
  expenseLimit: number
  savingsTarget: number
  notes: string | null
}

interface ResumenTabProps {
  summary: FinanceSummary
  currentGoal: MonthlyGoal | null
}

export function ResumenTab({ summary, currentGoal }: ResumenTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Balance General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="green" delay={0.1}>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Ingresos Totales</p>
            <AnimatedNumber
              value={summary.income.total}
              className="text-3xl font-bold text-green-500"
            />
          </div>
        </GlassCard>

        <GlassCard variant="red" delay={0.2}>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Gastos Totales</p>
            <AnimatedNumber
              value={summary.expenses.total}
              className="text-3xl font-bold text-red-500"
            />
          </div>
        </GlassCard>

        <GlassCard
          variant={summary.netProfit >= 0 ? 'green' : 'red'}
          delay={0.3}
        >
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Utilidad Neta</p>
            <AnimatedNumber
              value={summary.netProfit}
              className={`text-3xl font-bold ${
                summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            />
          </div>
        </GlassCard>
      </div>

      {/* Progreso de Metas */}
      {currentGoal && (currentGoal.incomeTarget > 0 || currentGoal.expenseLimit > 0) && (
        <GlassCard delay={0.4}>
          <h3 className="text-lg font-semibold mb-4 text-[#44e1fc]">
            Progreso del Mes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentGoal.incomeTarget > 0 && (
              <ProgressBar
                label="Meta de Ingresos"
                current={summary.income.total}
                target={currentGoal.incomeTarget}
                color="green"
              />
            )}
            {currentGoal.expenseLimit > 0 && (
              <ProgressBar
                label="Limite de Gastos"
                current={summary.expenses.total}
                target={currentGoal.expenseLimit}
                color="red"
              />
            )}
            {currentGoal.savingsTarget > 0 && (
              <ProgressBar
                label="Meta de Ahorro"
                current={Math.max(0, summary.netProfit)}
                target={currentGoal.savingsTarget}
                color="cyan"
              />
            )}
          </div>
        </GlassCard>
      )}

      {/* Desglose de Ingresos */}
      <GlassCard delay={0.5}>
        <h3 className="text-lg font-semibold mb-4 text-green-500">
          Desglose de Ingresos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Onboarding (este mes)</p>
            <p className="text-xl font-semibold">{formatCurrency(summary.income.onboarding)}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">MRR Servicios</p>
            <p className="text-xl font-semibold">{formatCurrency(summary.income.mrrServices)}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm">MRR Comunidad</p>
            <p className="text-xl font-semibold">{formatCurrency(summary.income.mrrCommunity)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Desglose de Gastos por Categoria */}
      <GlassCard delay={0.6}>
        <h3 className="text-lg font-semibold mb-4 text-red-500">
          Gastos por Categoria
        </h3>
        {Object.keys(summary.expenses.byCategory).length === 0 ? (
          <p className="text-gray-400 text-center py-4">No hay gastos registrados</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(summary.expenses.byCategory).map(([catName, cat]) => (
              <div key={catName} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{catName}</span>
                  </div>
                  <span className="text-red-400 font-semibold">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Info adicional */}
      <GlassCard variant="cyan" delay={0.7}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Clientes activos</span>
          <span className="text-xl font-semibold text-[#44e1fc]">
            {summary.activeClients}
          </span>
        </div>
      </GlassCard>
    </div>
  )
}
