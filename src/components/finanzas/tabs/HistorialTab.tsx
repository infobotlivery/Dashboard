'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../GlassCard'
import { AnimatedNumber } from '../AnimatedNumber'
import type { MonthlyHistory } from '@/types'

interface HistorialTabProps {
  history: MonthlyHistory[]
}

export function HistorialTab({ history }: HistorialTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  // Calcular estadísticas y máximos para las barras
  const stats = useMemo(() => {
    if (history.length === 0) return null

    const totalIncome = history.reduce((sum, h) => sum + h.totalIncome, 0)
    const totalExpenses = history.reduce((sum, h) => sum + h.totalExpenses, 0)
    const totalProfit = history.reduce((sum, h) => sum + h.netProfit, 0)
    const avgIncome = totalIncome / history.length
    const avgExpenses = totalExpenses / history.length
    const maxIncome = Math.max(...history.map(h => h.totalIncome))
    const maxExpenses = Math.max(...history.map(h => h.totalExpenses))
    const maxValue = Math.max(maxIncome, maxExpenses)

    // Tendencia (comparar primero con último)
    const trend = history.length > 1
      ? ((history[0].netProfit - history[history.length - 1].netProfit) / Math.abs(history[history.length - 1].netProfit || 1)) * 100
      : 0

    return { totalIncome, totalExpenses, totalProfit, avgIncome, avgExpenses, maxValue, trend }
  }, [history])

  if (history.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#44e1fc]/20 to-purple-500/20 flex items-center justify-center"
          >
            <span className="text-5xl">📈</span>
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">No hay datos historicos</h3>
          <p className="text-gray-400">
            Los datos del historial apareceran aqui conforme se registren
          </p>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen del período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-green p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <AnimatedNumber
                value={stats?.totalIncome || 0}
                className="text-xl font-bold text-green-500"
              />
              <p className="text-xs text-gray-400">Ingresos totales</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-red p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">💸</span>
            </div>
            <div>
              <AnimatedNumber
                value={stats?.totalExpenses || 0}
                className="text-xl font-bold text-red-500"
              />
              <p className="text-xs text-gray-400">Gastos totales</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-cyan p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#44e1fc]/20 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <AnimatedNumber
                value={stats?.totalProfit || 0}
                className={`text-xl font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
              <p className="text-xs text-gray-400">Utilidad total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (stats?.trend || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <span className="text-xl">{(stats?.trend || 0) >= 0 ? '📈' : '📉'}</span>
            </div>
            <div>
              <p className={`text-xl font-bold ${(stats?.trend || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(stats?.trend || 0) >= 0 ? '+' : ''}{(stats?.trend || 0).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-400">Tendencia</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráfico de barras visual */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#44e1fc]/10 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Evolucion Mensual</h3>
            <p className="text-sm text-gray-400">Ingresos vs Gastos por mes</p>
          </div>
        </div>

        <div className="space-y-4">
          {history.map((entry, index) => {
            const incomeWidth = stats?.maxValue ? (entry.totalIncome / stats.maxValue) * 100 : 0
            const expenseWidth = stats?.maxValue ? (entry.totalExpenses / stats.maxValue) * 100 : 0

            return (
              <motion.div
                key={entry.month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${index === 0 ? 'bg-[#44e1fc]/5 ring-1 ring-[#44e1fc]/20' : 'bg-white/5'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{entry.monthLabel}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#44e1fc]/20 text-[#44e1fc] text-xs">
                        Actual
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${entry.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(entry.netProfit)}
                  </span>
                </div>

                {/* Barras */}
                <div className="space-y-2">
                  {/* Ingresos */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">Ingresos</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incomeWidth}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-end px-2"
                      >
                        {incomeWidth > 20 && (
                          <span className="text-xs font-medium text-white">
                            {formatCurrency(entry.totalIncome)}
                          </span>
                        )}
                      </motion.div>
                    </div>
                    {incomeWidth <= 20 && (
                      <span className="text-xs text-green-500">{formatCurrency(entry.totalIncome)}</span>
                    )}
                  </div>

                  {/* Gastos */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">Gastos</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${expenseWidth}%` }}
                        transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-lg flex items-center justify-end px-2"
                      >
                        {expenseWidth > 20 && (
                          <span className="text-xs font-medium text-white">
                            {formatCurrency(entry.totalExpenses)}
                          </span>
                        )}
                      </motion.div>
                    </div>
                    {expenseWidth <= 20 && (
                      <span className="text-xs text-red-500">{formatCurrency(entry.totalExpenses)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
            <span className="text-sm text-gray-400">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
            <span className="text-sm text-gray-400">Gastos</span>
          </div>
        </div>
      </GlassCard>

      {/* Detalle expandido */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Detalle por Mes</h3>
            <p className="text-sm text-gray-400">Desglose completo de ingresos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((entry, index) => (
            <motion.div
              key={entry.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl p-5 border transition-all ${
                index === 0
                  ? 'bg-[#44e1fc]/5 border-[#44e1fc]/20'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{entry.monthLabel}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#44e1fc]/20 text-[#44e1fc] text-xs">
                      Actual
                    </span>
                  )}
                </div>
                <span className={`text-lg font-bold ${entry.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {entry.netProfit >= 0 ? '+' : ''}{formatCurrency(entry.netProfit)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Onboarding</p>
                  <p className="text-green-400 font-semibold">{formatCurrency(entry.totalOnboarding)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">MRR Servicios</p>
                  <p className="text-green-400 font-semibold">{formatCurrency(entry.totalMrrServices)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">MRR Comunidad</p>
                  <p className="text-green-400 font-semibold">{formatCurrency(entry.totalMrrCommunity)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Gastos</p>
                  <p className="text-red-400 font-semibold">{formatCurrency(entry.totalExpenses)}</p>
                </div>
              </div>

              {/* Mini barra de progreso utilidad */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Margen de utilidad</span>
                  <span className={entry.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {entry.totalIncome > 0
                      ? `${((entry.netProfit / entry.totalIncome) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: entry.totalIncome > 0
                        ? `${Math.max(0, Math.min(100, (entry.netProfit / entry.totalIncome) * 100))}%`
                        : '0%'
                    }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                    className={`h-full rounded-full ${entry.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Promedios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Promedio ingresos/mes</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(stats?.avgIncome || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">📉</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Promedio gastos/mes</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(stats?.avgExpenses || 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
