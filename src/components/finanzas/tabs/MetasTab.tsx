'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import NumberInput from '@/components/ui/NumberInput'
import { ProgressBar } from '../ProgressBar'

interface MonthlyGoal {
  id: number
  month: string
  incomeTarget: number
  expenseLimit: number
  savingsTarget: number
  notes: string | null
}

interface FinanceSummary {
  income: { total: number }
  expenses: { total: number }
  netProfit: number
}

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

  const currentMonthKey = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const currentGoal = goals.find((g) => {
    const goalDate = new Date(g.month)
    const goalKey = `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}`
    return goalKey === currentMonthKey
  })

  // Cargar metas
  useEffect(() => {
    async function loadGoals() {
      try {
        const res = await fetch('/api/finance/goals')
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
      const monthDate = new Date(selectedMonth + '-01')
      const res = await fetch('/api/finance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const goalsRes = await fetch('/api/finance/goals')
        const goalsData = await goalsRes.json()
        if (goalsData.data) setGoals(goalsData.data)
        onMessage('success', 'Meta guardada exitosamente')
      } else {
        onMessage('error', data.error || 'Error al guardar')
      }
    } catch {
      onMessage('error', 'Error de conexion')
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
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - 6 + i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 mt-4">Cargando metas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progreso del mes actual */}
      {summary && currentGoal && (
        <GlassCard delay={0.1}>
          <h3 className="text-lg font-semibold mb-4 text-[#44e1fc]">
            Progreso del Mes Actual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentGoal.incomeTarget > 0 && (
              <ProgressBar
                label="Meta de Ingresos"
                current={summary.income.total}
                target={currentGoal.incomeTarget}
                color="green"
                height="lg"
              />
            )}
            {currentGoal.expenseLimit > 0 && (
              <ProgressBar
                label="Limite de Gastos"
                current={summary.expenses.total}
                target={currentGoal.expenseLimit}
                color="red"
                height="lg"
              />
            )}
            {currentGoal.savingsTarget > 0 && (
              <ProgressBar
                label="Meta de Ahorro"
                current={Math.max(0, summary.netProfit)}
                target={currentGoal.savingsTarget}
                color="cyan"
                height="lg"
              />
            )}
          </div>
          {currentGoal.notes && (
            <p className="mt-4 text-sm text-gray-400 italic">
              Nota: {currentGoal.notes}
            </p>
          )}
        </GlassCard>
      )}

      {/* Formulario de metas */}
      <GlassCard delay={0.2}>
        <h3 className="text-lg font-semibold mb-4">Configurar Metas</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Seleccionar Mes
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-white focus:border-[#44e1fc] focus:outline-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.value === currentMonthKey ? '(actual)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Recordatorios, prioridades del mes..."
            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:border-[#44e1fc] focus:outline-none resize-none"
            rows={2}
          />
        </div>

        <Button onClick={handleSave} loading={saving}>
          Guardar Meta
        </Button>
      </GlassCard>

      {/* Lista de metas configuradas */}
      {goals.length > 0 && (
        <GlassCard delay={0.3}>
          <h3 className="text-lg font-semibold mb-4">Metas Configuradas</h3>
          <div className="space-y-3">
            {goals.map((goal) => {
              const goalDate = new Date(goal.month)
              const isCurrent =
                `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}` ===
                currentMonthKey

              return (
                <div
                  key={goal.id}
                  className={`bg-black/30 rounded-lg p-4 ${
                    isCurrent ? 'ring-1 ring-green-500/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">
                      {goalDate.toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric'
                      })}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-green-500">(actual)</span>
                      )}
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedMonth(
                          `${goalDate.getFullYear()}-${String(goalDate.getMonth() + 1).padStart(2, '0')}`
                        )
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="text-sm text-[#44e1fc] hover:text-white"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Ingresos</p>
                      <p className="text-green-400">{formatCurrency(goal.incomeTarget)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gastos</p>
                      <p className="text-red-400">{formatCurrency(goal.expenseLimit)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ahorro</p>
                      <p className="text-[#44e1fc]">{formatCurrency(goal.savingsTarget)}</p>
                    </div>
                  </div>
                  {goal.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic">{goal.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
