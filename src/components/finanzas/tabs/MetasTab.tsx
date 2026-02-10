'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import NumberInput from '@/components/ui/NumberInput'
import { ProgressBar } from '../ProgressBar'
import { financeAuthFetch } from '@/lib/authFetch'
import type { MonthlyGoal, FinanceSummary } from '@/types'

interface MetasTabProps {
  summary: FinanceSummary | null
  onMessage: (type: 'success' | 'error', text: string) => void
}

export function MetasTab({ summary, onMessage }: MetasTabProps) {
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estado del formulario
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [incomeTarget, setIncomeTarget] = useState(0)
  const [expenseLimit, setExpenseLimit] = useState(0)
  const [savingsTarget, setSavingsTarget] = useState(0)
  const [notes, setNotes] = useState('')

  const currentMonthKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const currentGoal = useMemo(() => {
    return goals.find((g) => {
      const goalDate = new Date(g.month)
      const goalKey = `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}`
      return goalKey === currentMonthKey
    })
  }, [goals, currentMonthKey])

  // Estadísticas de metas
  const goalStats = useMemo(() => {
    if (!summary || !currentGoal) return null

    const incomeProgress = currentGoal.incomeTarget > 0
      ? (summary.income.total / currentGoal.incomeTarget) * 100
      : 0
    const expenseProgress = currentGoal.expenseLimit > 0
      ? (summary.expenses.total / currentGoal.expenseLimit) * 100
      : 0
    const savingsProgress = currentGoal.savingsTarget > 0
      ? (Math.max(0, summary.netProfit) / currentGoal.savingsTarget) * 100
      : 0

    return {
      incomeProgress,
      expenseProgress,
      savingsProgress,
      incomeStatus: incomeProgress >= 100 ? 'achieved' : incomeProgress >= 70 ? 'close' : 'pending',
      expenseStatus: expenseProgress > 100 ? 'exceeded' : expenseProgress >= 80 ? 'warning' : 'safe',
      savingsStatus: savingsProgress >= 100 ? 'achieved' : savingsProgress >= 50 ? 'ontrack' : 'behind'
    }
  }, [summary, currentGoal])

  // Cargar metas
  useEffect(() => {
    async function loadGoals() {
      try {
        const res = await financeAuthFetch('/api/finance/goals')
        const data = await res.json()
        if (data.data) setGoals(data.data)
      } catch (err) {
        console.error('Error loading goals:', err)
      } finally {
        setLoading(false)
      }
    }
    loadGoals()
  }, [])

  // Cargar meta al cambiar mes seleccionado
  useEffect(() => {
    const existingGoal = goals.find((g) => {
      const goalDate = new Date(g.month)
      const goalKey = `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}`
      return goalKey === selectedMonth
    })

    if (existingGoal) {
      setIncomeTarget(existingGoal.incomeTarget)
      setExpenseLimit(existingGoal.expenseLimit)
      setSavingsTarget(existingGoal.savingsTarget)
      setNotes(existingGoal.notes || '')
    } else {
      setIncomeTarget(0)
      setExpenseLimit(0)
      setSavingsTarget(0)
      setNotes('')
    }
  }, [selectedMonth, goals])

  // Guardar meta
  async function handleSave() {
    setSaving(true)
    try {
      // Validación: al menos una meta debe ser > 0
      if (incomeTarget <= 0 && expenseLimit <= 0 && savingsTarget <= 0) {
        onMessage('error', 'Define al menos una meta con valor mayor a 0')
        setSaving(false)
        return
      }

      // Fix timezone: usar Date.UTC para evitar problemas de zona horaria
      const [year, month] = selectedMonth.split('-')
      const monthDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1))

      const res = await financeAuthFetch('/api/finance/goals', {
        method: 'POST',
        body: JSON.stringify({
          month: monthDate.toISOString(),
          incomeTarget,
          expenseLimit,
          savingsTarget,
          notes: notes || null
        })
      })

      const data = await res.json()

      if (data.success) {
        // Recargar metas
        const goalsRes = await financeAuthFetch('/api/finance/goals')
        const goalsData = await goalsRes.json()
        if (goalsData.data) setGoals(goalsData.data)
        onMessage('success', 'Meta guardada exitosamente')
      } else {
        onMessage('error', data.error || 'Error al guardar')
      }
    } catch {
      onMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  // Generar opciones de meses (6 anteriores + actual + 6 siguientes)
  const monthOptions = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - 6 + i)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      return { value, label }
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-[#44e1fc]/20 flex items-center justify-center mb-4"
        >
          <span className="text-3xl">🎯</span>
        </motion.div>
        <p className="text-gray-400">Cargando metas...</p>
      </div>
    )
  }

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
            <p className="text-xs text-gray-400">Metas configuradas</p>
            <p className="font-semibold text-[#44e1fc]">{goals.length}</p>
          </div>
        </div>
        {currentGoal && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-xs text-gray-400">Mes actual</p>
              <p className="font-semibold text-green-400">Configurado</p>
            </div>
          </div>
        )}
        {!currentGoal && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xs text-gray-400">Mes actual</p>
              <p className="font-semibold text-orange-400">Sin meta</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Progreso del mes actual - Diseño mejorado */}
      {summary && currentGoal && goalStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Progreso del Mes Actual</h3>
                <p className="text-sm text-gray-400">Tu desempeño contra las metas establecidas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Meta de Ingresos */}
              {currentGoal.incomeTarget > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-5 rounded-2xl bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Meta de Ingresos</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(summary.income.total)} de {formatCurrency(currentGoal.incomeTarget)}
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      label=""
                      current={summary.income.total}
                      target={currentGoal.incomeTarget}
                      color="green"
                      height="lg"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xl ${
                        goalStats.incomeStatus === 'achieved' ? '' : 'grayscale'
                      }`}>
                        {goalStats.incomeStatus === 'achieved' ? '🏆' : goalStats.incomeStatus === 'close' ? '🔥' : '⏳'}
                      </span>
                      <span className={`text-sm ${
                        goalStats.incomeStatus === 'achieved' ? 'text-green-400' :
                        goalStats.incomeStatus === 'close' ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {goalStats.incomeStatus === 'achieved' ? 'Meta alcanzada!' :
                         goalStats.incomeStatus === 'close' ? 'Casi lo logras!' : 'En progreso'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Límite de Gastos */}
              {currentGoal.expenseLimit > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <span className="text-xl">💸</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Límite de Gastos</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(summary.expenses.total)} de {formatCurrency(currentGoal.expenseLimit)}
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      label=""
                      current={summary.expenses.total}
                      target={currentGoal.expenseLimit}
                      color="red"
                      height="lg"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl">
                        {goalStats.expenseStatus === 'exceeded' ? '🚨' : goalStats.expenseStatus === 'warning' ? '⚠️' : '✅'}
                      </span>
                      <span className={`text-sm ${
                        goalStats.expenseStatus === 'exceeded' ? 'text-red-400' :
                        goalStats.expenseStatus === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {goalStats.expenseStatus === 'exceeded' ? 'Limite excedido!' :
                         goalStats.expenseStatus === 'warning' ? 'Cerca del limite' : 'Bajo control'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Meta de Ahorro */}
              {currentGoal.savingsTarget > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-[#44e1fc]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-5 rounded-2xl bg-[#44e1fc]/5 border border-[#44e1fc]/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#44e1fc]/20 flex items-center justify-center">
                        <span className="text-xl">🏦</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Meta de Ahorro</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(Math.max(0, summary.netProfit))} de {formatCurrency(currentGoal.savingsTarget)}
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      label=""
                      current={Math.max(0, summary.netProfit)}
                      target={currentGoal.savingsTarget}
                      color="cyan"
                      height="lg"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl">
                        {goalStats.savingsStatus === 'achieved' ? '🎉' : goalStats.savingsStatus === 'ontrack' ? '📈' : '💪'}
                      </span>
                      <span className={`text-sm ${
                        goalStats.savingsStatus === 'achieved' ? 'text-[#44e1fc]' :
                        goalStats.savingsStatus === 'ontrack' ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {goalStats.savingsStatus === 'achieved' ? 'Meta alcanzada!' :
                         goalStats.savingsStatus === 'ontrack' ? 'Buen ritmo!' : 'Sigue esforzandote!'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {currentGoal.notes && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Nota del mes:</p>
                    <p className="text-sm text-gray-400">{currentGoal.notes}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Formulario de metas - Diseño mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#44e1fc]/20 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Configurar Metas</h3>
              <p className="text-sm text-gray-400">Define tus objetivos financieros mensuales</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lado izquierdo: Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Seleccionar Mes
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#44e1fc] focus:outline-none transition-colors"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.value === currentMonthKey ? '(actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <NumberInput
                  label="Meta de Ingresos"
                  value={incomeTarget}
                  onChange={setIncomeTarget}
                  prefix="$"
                  step={1000}
                  color="#22c55e"
                />
                <NumberInput
                  label="Limite de Gastos"
                  value={expenseLimit}
                  onChange={setExpenseLimit}
                  prefix="$"
                  step={500}
                  color="#ef4444"
                />
                <NumberInput
                  label="Meta de Ahorro"
                  value={savingsTarget}
                  onChange={setSavingsTarget}
                  prefix="$"
                  step={500}
                  color="#44e1fc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recordatorios, prioridades del mes..."
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:border-[#44e1fc] focus:outline-none resize-none transition-colors"
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} loading={saving} className="w-full">
                Guardar Meta
              </Button>
            </div>

            {/* Lado derecho: Preview */}
            <div className="flex items-center justify-center">
              <motion.div
                key={selectedMonth}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 via-[#44e1fc]/20 to-purple-500/20 blur-xl" />

                {/* Preview card */}
                <div className="relative rounded-2xl p-6 bg-black/40 border border-white/10">
                  <div className="text-center mb-6">
                    <span className="text-4xl mb-2 block">🎯</span>
                    <h4 className="font-semibold text-white capitalize">
                      {monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth}
                    </h4>
                    <p className="text-xs text-gray-400">Vista previa de tu meta</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span className="text-sm text-gray-400">Ingresos</span>
                      </div>
                      <span className="font-semibold text-green-400">
                        {formatCurrency(incomeTarget)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💸</span>
                        <span className="text-sm text-gray-400">Gastos max</span>
                      </div>
                      <span className="font-semibold text-red-400">
                        {formatCurrency(expenseLimit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#44e1fc]/10 border border-[#44e1fc]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏦</span>
                        <span className="text-sm text-gray-400">Ahorro</span>
                      </div>
                      <span className="font-semibold text-[#44e1fc]">
                        {formatCurrency(savingsTarget)}
                      </span>
                    </div>
                  </div>

                  {notes && (
                    <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-gray-400 truncate">📝 {notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Lista de metas configuradas - Diseño mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Historial de Metas</h3>
              <p className="text-sm text-gray-400">Todas tus metas configuradas</p>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#44e1fc]/20 to-purple-500/20 flex items-center justify-center"
              >
                <span className="text-5xl">🎯</span>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold mb-2"
              >
                No hay metas configuradas
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 max-w-md mx-auto"
              >
                Configura tu primera meta arriba para empezar a
                hacer seguimiento de tus objetivos financieros.
              </motion.p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {goals.map((goal, index) => {
                  const goalDate = new Date(goal.month)
                  const goalKey = `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}`
                  const isCurrent = goalKey === currentMonthKey
                  const isPast = new Date(goal.month) < new Date(currentMonthKey + '-01')

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative group"
                    >
                      {/* Glow effect on hover */}
                      <div
                        className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity ${
                          isCurrent ? 'bg-green-500' : isPast ? 'bg-gray-500' : 'bg-[#44e1fc]'
                        }`}
                      />

                      <div
                        className={`relative rounded-2xl p-5 border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-green-500/10 border-green-500/30'
                            : isPast
                            ? 'bg-white/5 border-white/10 opacity-70'
                            : 'bg-[#44e1fc]/5 border-[#44e1fc]/20'
                        }`}
                        onClick={() => {
                          setSelectedMonth(goalKey)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isCurrent ? 'bg-green-500/20' : isPast ? 'bg-white/10' : 'bg-[#44e1fc]/20'
                            }`}>
                              <span className="text-xl">
                                {isCurrent ? '🎯' : isPast ? '📅' : '🔮'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white capitalize">
                                {goalDate.toLocaleDateString('es-ES', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className={`text-xs ${
                                isCurrent ? 'text-green-400' : isPast ? 'text-gray-500' : 'text-[#44e1fc]'
                              }`}>
                                {isCurrent ? 'Mes actual' : isPast ? 'Pasado' : 'Futuro'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMonth(goalKey)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="text-sm text-[#44e1fc] hover:text-white transition-colors"
                          >
                            Editar
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <span>💰</span> Ingresos
                            </span>
                            <span className="text-green-400 font-medium">
                              {formatCurrency(goal.incomeTarget)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <span>💸</span> Gastos max
                            </span>
                            <span className="text-red-400 font-medium">
                              {formatCurrency(goal.expenseLimit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <span>🏦</span> Ahorro
                            </span>
                            <span className="text-[#44e1fc] font-medium">
                              {formatCurrency(goal.savingsTarget)}
                            </span>
                          </div>
                        </div>

                        {goal.notes && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-gray-500 truncate">
                              📝 {goal.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
