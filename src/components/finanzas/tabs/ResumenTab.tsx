'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
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

// Iconos para las categorías de gastos
const categoryIcons: Record<string, string> = {
  'herramientas': '🛠️',
  'marketing': '📣',
  'software': '💻',
  'suscripciones': '🔄',
  'oficina': '🏢',
  'viajes': '✈️',
  'comida': '🍔',
  'transporte': '🚗',
  'educacion': '📚',
  'salud': '💊',
  'entretenimiento': '🎮',
  'servicios': '⚡',
  'impuestos': '📋',
  'legal': '⚖️',
  'hosting': '☁️',
  'default': '📁'
}

function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return icon
  }
  return categoryIcons.default
}

export function ResumenTab({ summary, currentGoal }: ResumenTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  // Formatear mes correctamente (evitar problemas de zona horaria)
  const formatMonth = (monthStr: string) => {
    // Si viene como ISO (2026-01-01T00:00:00.000Z) o YYYY-MM-DD
    const parts = monthStr.split('T')[0].split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // JavaScript months are 0-indexed
    return new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  // Calcular porcentajes para el gráfico de ingresos
  const incomeBreakdown = useMemo(() => {
    const total = summary.income.total || 1
    return {
      onboarding: (summary.income.onboarding / total) * 100,
      mrrServices: (summary.income.mrrServices / total) * 100,
      mrrCommunity: (summary.income.mrrCommunity / total) * 100
    }
  }, [summary.income])

  // Calcular el margen de utilidad
  const profitMargin = useMemo(() => {
    if (summary.income.total === 0) return 0
    return (summary.netProfit / summary.income.total) * 100
  }, [summary.netProfit, summary.income.total])

  // Ordenar categorías por total de gastos
  const sortedCategories = useMemo(() => {
    return Object.entries(summary.expenses.byCategory)
      .sort(([, a], [, b]) => b.total - a.total)
  }, [summary.expenses.byCategory])

  // Calcular el gasto más alto
  const maxCategoryExpense = useMemo(() => {
    if (sortedCategories.length === 0) return 0
    return Math.max(...sortedCategories.map(([, cat]) => cat.total))
  }, [sortedCategories])

  return (
    <div className="space-y-6">
      {/* Header con resumen rápido */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-xs text-gray-400">Mes actual</p>
            <p className="font-semibold capitalize">
              {formatMonth(summary.month)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-2xl">👥</span>
          <div>
            <p className="text-xs text-gray-400">Clientes activos</p>
            <p className="font-semibold text-[#44e1fc]">{summary.activeClients}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-2xl">{profitMargin >= 0 ? '📈' : '📉'}</span>
          <div>
            <p className="text-xs text-gray-400">Margen</p>
            <p className={`font-semibold ${profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Balance General - Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          <GlassCard variant="green" className="relative h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-400">Ingresos</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Ingresos Totales</p>
            <AnimatedNumber
              value={summary.income.total}
              className="text-4xl font-bold text-green-500"
            />
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Este mes</span>
                <span className="text-green-400">+{formatCurrency(summary.income.onboarding)}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

          <GlassCard variant="red" className="relative h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">💸</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="text-xs text-red-400">Gastos</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Gastos Totales</p>
            <AnimatedNumber
              value={summary.expenses.total}
              className="text-4xl font-bold text-red-500"
            />
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Categorías</span>
                <span className="text-gray-300">{sortedCategories.length}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div
            className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
              summary.netProfit >= 0 ? 'bg-[#44e1fc]/20' : 'bg-red-500/20'
            }`}
          />

          <GlassCard
            variant={summary.netProfit >= 0 ? 'cyan' : 'red'}
            className="relative h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                summary.netProfit >= 0 ? 'bg-[#44e1fc]/20' : 'bg-red-500/20'
              }`}>
                <span className="text-3xl">{summary.netProfit >= 0 ? '🎯' : '⚠️'}</span>
              </div>
              <div className={`px-3 py-1 rounded-full border ${
                summary.netProfit >= 0
                  ? 'bg-[#44e1fc]/10 border-[#44e1fc]/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <span className={`text-xs ${summary.netProfit >= 0 ? 'text-[#44e1fc]' : 'text-red-400'}`}>
                  Utilidad
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Utilidad Neta</p>
            <AnimatedNumber
              value={summary.netProfit}
              className={`text-4xl font-bold ${
                summary.netProfit >= 0 ? 'text-[#44e1fc]' : 'text-red-500'
              }`}
            />
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Margen</span>
                <span className={summary.netProfit >= 0 ? 'text-[#44e1fc]' : 'text-red-400'}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Progreso de Metas */}
      {currentGoal && (currentGoal.incomeTarget > 0 || currentGoal.expenseLimit > 0 || currentGoal.savingsTarget > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Progreso del Mes</h3>
                <p className="text-sm text-gray-400">Seguimiento de tus metas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentGoal.incomeTarget > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💰</span>
                    <span className="text-sm text-gray-400">Meta de Ingresos</span>
                  </div>
                  <ProgressBar
                    label=""
                    current={summary.income.total}
                    target={currentGoal.incomeTarget}
                    color="green"
                  />
                </div>
              )}
              {currentGoal.expenseLimit > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💸</span>
                    <span className="text-sm text-gray-400">Límite de Gastos</span>
                  </div>
                  <ProgressBar
                    label=""
                    current={summary.expenses.total}
                    target={currentGoal.expenseLimit}
                    color="red"
                  />
                </div>
              )}
              {currentGoal.savingsTarget > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏦</span>
                    <span className="text-sm text-gray-400">Meta de Ahorro</span>
                  </div>
                  <ProgressBar
                    label=""
                    current={Math.max(0, summary.netProfit)}
                    target={currentGoal.savingsTarget}
                    color="cyan"
                  />
                </div>
              )}
            </div>
            {currentGoal.notes && (
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400">
                  <span className="text-white">📝 Nota:</span> {currentGoal.notes}
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Desglose de Ingresos con gráfico visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-500">Desglose de Ingresos</h3>
              <p className="text-sm text-gray-400">Fuentes de ingreso del mes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barras visuales */}
            <div className="space-y-4">
              {/* Onboarding */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span className="text-sm">Onboarding (este mes)</span>
                  </div>
                  <span className="font-semibold text-green-400">{formatCurrency(summary.income.onboarding)}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${incomeBreakdown.onboarding}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  />
                </div>
                <p className="text-xs text-gray-500">{incomeBreakdown.onboarding.toFixed(1)}% del total</p>
              </div>

              {/* MRR Servicios */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    <span className="text-sm">MRR Servicios</span>
                  </div>
                  <span className="font-semibold text-[#44e1fc]">{formatCurrency(summary.income.mrrServices)}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${incomeBreakdown.mrrServices}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#44e1fc] to-cyan-400"
                  />
                </div>
                <p className="text-xs text-gray-500">{incomeBreakdown.mrrServices.toFixed(1)}% del total</p>
              </div>

              {/* MRR Comunidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="text-sm">MRR Comunidad</span>
                  </div>
                  <span className="font-semibold text-purple-400">{formatCurrency(summary.income.mrrCommunity)}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${incomeBreakdown.mrrCommunity}%` }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                  />
                </div>
                <p className="text-xs text-gray-500">{incomeBreakdown.mrrCommunity.toFixed(1)}% del total</p>
              </div>
            </div>

            {/* Gráfico circular visual */}
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Círculo de fondo */}
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="24"
                  />
                  {/* Segmento Onboarding */}
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeDasharray={`${incomeBreakdown.onboarding * 5.02} 502`}
                    initial={{ strokeDasharray: "0 502" }}
                    animate={{ strokeDasharray: `${incomeBreakdown.onboarding * 5.02} 502` }}
                    transition={{ delay: 0.6, duration: 1 }}
                  />
                  {/* Segmento MRR Servicios */}
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#44e1fc"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeDasharray={`${incomeBreakdown.mrrServices * 5.02} 502`}
                    strokeDashoffset={-incomeBreakdown.onboarding * 5.02}
                    initial={{ strokeDasharray: "0 502" }}
                    animate={{ strokeDasharray: `${incomeBreakdown.mrrServices * 5.02} 502` }}
                    transition={{ delay: 0.8, duration: 1 }}
                  />
                  {/* Segmento MRR Comunidad */}
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeDasharray={`${incomeBreakdown.mrrCommunity * 5.02} 502`}
                    strokeDashoffset={-(incomeBreakdown.onboarding + incomeBreakdown.mrrServices) * 5.02}
                    initial={{ strokeDasharray: "0 502" }}
                    animate={{ strokeDasharray: `${incomeBreakdown.mrrCommunity * 5.02} 502` }}
                    transition={{ delay: 1, duration: 1 }}
                  />
                </svg>
                {/* Centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(summary.income.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-400">Onboarding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#44e1fc]" />
              <span className="text-sm text-gray-400">MRR Servicios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-400">MRR Comunidad</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Desglose de Gastos por Categoría */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-500">Gastos por Categoría</h3>
              <p className="text-sm text-gray-400">Distribución de gastos del mes</p>
            </div>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
              >
                <span className="text-4xl">💰</span>
              </motion.div>
              <p className="text-gray-400">No hay gastos registrados este mes</p>
              <p className="text-sm text-gray-500 mt-1">Los gastos aparecerán aquí cuando los registres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map(([catName, cat], index) => (
                <motion.div
                  key={catName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="group"
                >
                  <div
                    className="rounded-xl p-4 border transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: `${cat.color}10`,
                      borderColor: `${cat.color}30`
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${cat.color}25` }}
                        >
                          {getCategoryIcon(catName)}
                        </div>
                        <div>
                          <span className="font-semibold text-white">{catName}</span>
                          <p className="text-xs text-gray-400">{cat.items.length} {cat.items.length === 1 ? 'gasto' : 'gastos'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: cat.color }}>
                          {formatCurrency(cat.total)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {summary.expenses.total > 0
                            ? `${((cat.total / summary.expenses.total) * 100).toFixed(1)}%`
                            : '0%'}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: maxCategoryExpense > 0
                            ? `${(cat.total / maxCategoryExpense) * 100}%`
                            : '0%'
                        }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>

                    {/* Items de la categoría */}
                    {cat.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                        {cat.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-400">{item.name}</span>
                            <span className="text-gray-300">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        {cat.items.length > 3 && (
                          <p className="text-xs text-gray-500 pt-1">
                            +{cat.items.length - 3} más...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Estadísticas rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#44e1fc]/20 flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-[#44e1fc]">{summary.activeClients}</p>
          <p className="text-xs text-gray-400">Clientes Activos</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
            <span className="text-xl">🔄</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(summary.income.mrrServices + summary.income.mrrCommunity)}
          </p>
          <p className="text-xs text-gray-400">MRR Total</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <span className="text-xl">📁</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{sortedCategories.length}</p>
          <p className="text-xs text-gray-400">Categorías</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
            summary.netProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <span className="text-xl">{summary.netProfit >= 0 ? '✅' : '❌'}</span>
          </div>
          <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {summary.netProfit >= 0 ? 'Positivo' : 'Negativo'}
          </p>
          <p className="text-xs text-gray-400">Balance</p>
        </div>
      </motion.div>
    </div>
  )
}
