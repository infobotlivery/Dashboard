'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../GlassCard'
import { UpcomingPayments } from '../UpcomingPayments'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import NumberInput from '@/components/ui/NumberInput'
import type { Category, Expense, UpcomingPayment, PaymentStatus, FinanceSummary } from '@/types'

interface NewExpense {
  name: string
  amount: number
  type: string
  categoryId: string
  notes: string
  billingDay: string
  paidByClient: string
}

interface GastosTabProps {
  expenses: Expense[]
  categories: Category[]
  newExpense: NewExpense
  setNewExpense: (expense: NewExpense) => void
  editingExpenseId: number | null
  setEditingExpenseId: (id: number | null) => void
  onSave: () => void
  onDelete: (id: number) => void
  onMarkPaid: (id: number) => void
  saving: boolean
  upcomingPayments: UpcomingPayment[]
  upcomingTotal: number
  upcomingLoading: boolean
  summary: FinanceSummary | null
}

// Iconos para categorias
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
  'mercadeo': '📣',
  'publicidad': '📢',
  'nomina': '👥',
  'colaboradores': '🤝',
  'operativos': '⚙️',
  'otros': '📁',
  'default': '📁'
}

function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return icon
  }
  return categoryIcons.default
}

type FilterStatus = 'all' | 'active' | 'cancelled'
type ViewMode = 'cards' | 'list'
type SubTab = 'all' | 'fixed' | 'variable'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function getPaymentStatus(expense: Expense): { status: PaymentStatus; daysRemaining: number | null } {
  if (!expense.billingDay) {
    return { status: 'no_date', daysRemaining: null }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const today = now.getDate()

  // Check if lastPaymentDate is in the current billing cycle
  if (expense.lastPaymentDate) {
    const lastPaid = new Date(expense.lastPaymentDate)
    const billingDay = expense.billingDay

    // Current cycle: from previous billingDay to next billingDay
    let cycleStart: Date
    let cycleEnd: Date

    if (today >= billingDay) {
      // We're past billing day this month, cycle is this month's billingDay to next month's
      cycleStart = new Date(currentYear, currentMonth, billingDay)
      cycleEnd = new Date(currentYear, currentMonth + 1, billingDay)
    } else {
      // We haven't reached billing day, cycle is last month's billingDay to this month's
      cycleStart = new Date(currentYear, currentMonth - 1, billingDay)
      cycleEnd = new Date(currentYear, currentMonth, billingDay)
    }

    if (lastPaid >= cycleStart && lastPaid < cycleEnd) {
      return { status: 'paid', daysRemaining: null }
    }
  }

  // Not paid this cycle
  const billingDay = expense.billingDay
  if (today > billingDay) {
    // Billing day already passed this month and not paid
    return { status: 'expired', daysRemaining: 0 }
  } else {
    // Billing day hasn't arrived yet
    const daysRemaining = billingDay - today
    return { status: 'upcoming', daysRemaining }
  }
}

function getPaymentStatusBadge(status: PaymentStatus, daysRemaining: number | null) {
  switch (status) {
    case 'paid':
      return { label: 'Pagado', bgClass: 'bg-green-500/20', textClass: 'text-green-400' }
    case 'expired':
      return { label: 'Expirado', bgClass: 'bg-red-500/20', textClass: 'text-red-400' }
    case 'upcoming':
      return { label: `${daysRemaining}d restantes`, bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' }
    case 'no_date':
    default:
      return null
  }
}

function formatPaymentDate(billingDay: number | null): string {
  if (!billingDay) return '-'
  const now = new Date()
  const month = now.toLocaleDateString('es-ES', { month: 'short' })
  const year = now.getFullYear()
  return `${String(billingDay).padStart(2, '0')}, ${month} ${year}`
}

function formatLastPaymentDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleDateString('es-ES', { month: 'short' })
  const year = d.getFullYear()
  return `${day}, ${month} ${year}`
}

function calcPercentChange(current: number, previous: number): { value: number; increased: boolean } {
  if (previous === 0) return { value: 0, increased: false }
  const change = ((current - previous) / previous) * 100
  return { value: Math.abs(change), increased: change > 0 }
}

export function GastosTab({
  expenses,
  categories,
  newExpense,
  setNewExpense,
  editingExpenseId,
  setEditingExpenseId,
  onSave,
  onDelete,
  onMarkPaid,
  saving,
  upcomingPayments,
  upcomingTotal,
  upcomingLoading,
  summary
}: GastosTabProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [showForm, setShowForm] = useState(false)
  const [subTab, setSubTab] = useState<SubTab>('all')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  // Filtrar gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (filterCategory !== 'all' && String(expense.categoryId) !== filterCategory) return false
      if (filterStatus === 'active' && expense.endDate) return false
      if (filterStatus === 'cancelled' && !expense.endDate) return false

      // Sub-tab filter
      if (subTab === 'fixed' && expense.type !== 'recurring') return false
      if (subTab === 'variable' && expense.type !== 'fixed') return false

      // Month/Year filter: check if expense was active in the selected month
      const selectedStart = new Date(filterYear, filterMonth, 1)
      const selectedEnd = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999)
      const expStart = new Date(expense.startDate)
      if (expStart > selectedEnd) return false
      if (expense.endDate && new Date(expense.endDate) < selectedStart) return false

      return true
    })
  }, [expenses, filterCategory, filterStatus, subTab, filterMonth, filterYear])

  // Estadisticas
  const stats = useMemo(() => {
    const active = expenses.filter(e => !e.endDate)
    const recurring = active.filter(e => e.type === 'recurring')
    const fixed = active.filter(e => e.type === 'fixed')

    return {
      totalActive: active.length,
      totalAmount: active.reduce((sum, e) => sum + e.amount, 0),
      recurringAmount: recurring.reduce((sum, e) => sum + e.amount, 0),
      fixedAmount: fixed.reduce((sum, e) => sum + e.amount, 0),
      cancelled: expenses.filter(e => e.endDate).length
    }
  }, [expenses])

  // % change calculations
  const prevMonth = summary?.previousMonth
  const totalChange = calcPercentChange(stats.totalAmount, prevMonth?.totalExpenses ?? 0)
  const fixedChange = calcPercentChange(stats.recurringAmount, prevMonth?.recurringExpenses ?? 0)
  const variableChange = calcPercentChange(stats.fixedAmount, prevMonth?.fixedExpenses ?? 0)

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id)
    setNewExpense({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      categoryId: String(expense.categoryId),
      notes: expense.notes || '',
      billingDay: expense.billingDay ? String(expense.billingDay) : '',
      paidByClient: expense.paidByClient || ''
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingExpenseId(null)
    setNewExpense({
      name: '',
      amount: 0,
      type: 'recurring',
      categoryId: '',
      notes: '',
      billingDay: '',
      paidByClient: ''
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Proximos Pagos */}
      <UpcomingPayments
        payments={upcomingPayments}
        total={upcomingTotal}
        loading={upcomingLoading}
      />

      {/* 3 Tarjetas resumen estilo Fina Partner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gastos Totales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Gastos Totales</p>
            {prevMonth && prevMonth.totalExpenses > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                totalChange.increased
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {totalChange.increased ? '▲' : '▼'} {totalChange.value.toFixed(1)}%
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                -- 0.00
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">vs mes anterior</p>
        </motion.div>

        {/* Gastos Fijos (type=recurring) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Gastos Fijos</p>
            {prevMonth && prevMonth.recurringExpenses > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                fixedChange.increased
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {fixedChange.increased ? '▲' : '▼'} {fixedChange.value.toFixed(1)}%
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                -- 0.00
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-purple-400">{formatCurrency(stats.recurringAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">Mensuales recurrentes</p>
        </motion.div>

        {/* Gastos Variables (type=fixed) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Gastos Variables</p>
            {prevMonth && prevMonth.fixedExpenses > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                variableChange.increased
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {variableChange.increased ? '▲' : '▼'} {variableChange.value.toFixed(1)}%
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                -- 0.00
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-orange-400">{formatCurrency(stats.fixedAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">Pagos unicos</p>
        </motion.div>
      </div>

      {/* Sub-tabs: Gastos fijos / Gastos variables */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {[
          { key: 'all' as SubTab, label: 'Todos' },
          { key: 'fixed' as SubTab, label: 'Gastos fijos' },
          { key: 'variable' as SubTab, label: 'Gastos variables' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
              subTab === tab.key
                ? 'border-[#44e1fc] text-[#44e1fc]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fila 1: Boton agregar + Mes/Anio */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
            showForm
              ? 'bg-white/10 text-white'
              : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
          }`}
        >
          <span className="text-lg">{showForm ? '✕' : '+'}</span>
          {showForm ? 'Cerrar formulario' : 'Agregar gasto'}
        </motion.button>

        <div className="flex flex-wrap gap-2">
          {/* Filtro mes */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="dark-select px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white focus:border-[#44e1fc] focus:outline-none cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          {/* Filtro anio */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="dark-select px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white focus:border-[#44e1fc] focus:outline-none cursor-pointer"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Filtros de contenido */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Filtro categoria */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="dark-select px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white focus:border-[#44e1fc] focus:outline-none cursor-pointer"
        >
          <option value="all">Todas las categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
          ))}
        </select>

        {/* Filtro estado */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="dark-select px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white focus:border-[#44e1fc] focus:outline-none cursor-pointer"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="cancelled">Cancelados</option>
        </select>

        {/* Toggle vista */}
        <div className="flex rounded-lg bg-white/5 border border-white/10 overflow-hidden">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 text-sm transition-all ${
              viewMode === 'cards' ? 'bg-[#44e1fc] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-sm transition-all ${
              viewMode === 'list' ? 'bg-[#44e1fc] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            ☰
          </button>
        </div>

        {/* Badge gastos activos */}
        <span className="px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">
          {stats.totalActive} gastos activos
        </span>
      </div>

      {/* Modal del formulario */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Modal centrado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header del modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      editingExpenseId ? 'bg-orange-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className="text-xl">{editingExpenseId ? '✏️' : '💸'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {editingExpenseId ? 'Modifica los datos del gasto' : 'Registra un nuevo gasto'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Contenido del formulario */}
                <div className="space-y-4">
                  <Input
                    label="Nombre del gasto"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                    placeholder="Ej: Cursor Pro, ChatGPT Plus..."
                  />
                  <NumberInput
                    label="Monto mensual"
                    value={newExpense.amount}
                    onChange={(value) => setNewExpense({ ...newExpense, amount: value })}
                    prefix="$"
                    step={10}
                    color="#ef4444"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Categoria"
                      value={newExpense.categoryId}
                      onChange={(value) => setNewExpense({ ...newExpense, categoryId: value })}
                      options={categories.map((c) => ({ value: String(c.id), label: `${getCategoryIcon(c.name)} ${c.name}` }))}
                      placeholder="Seleccionar categoria..."
                    />
                    <Select
                      label="Tipo de gasto"
                      value={newExpense.type}
                      onChange={(value) => setNewExpense({ ...newExpense, type: value })}
                      options={[
                        { value: 'recurring', label: 'Fijo (mensual)' },
                        { value: 'fixed', label: 'Variable (pago unico)' }
                      ]}
                    />
                  </div>

                  {/* Campos adicionales solo para gastos recurrentes */}
                  {newExpense.type === 'recurring' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Dia de cobro (opcional)"
                        value={newExpense.billingDay}
                        onChange={(value) => setNewExpense({ ...newExpense, billingDay: value })}
                        options={[
                          { value: '', label: 'Sin fecha definida' },
                          ...Array.from({ length: 31 }, (_, i) => ({
                            value: String(i + 1),
                            label: `Dia ${i + 1}`
                          }))
                        ]}
                        placeholder="Seleccionar dia..."
                      />
                      <Input
                        label="Pagado por cliente (opcional)"
                        value={newExpense.paidByClient}
                        onChange={(e) => setNewExpense({ ...newExpense, paidByClient: e.target.value })}
                        placeholder="Ej: Acme Corp, Cliente X..."
                      />
                    </div>
                  )}
                </div>

                {/* Botones del modal */}
                <div className="mt-6 flex gap-3 justify-end">
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={onSave} loading={saving}>
                    {editingExpenseId ? 'Actualizar Gasto' : 'Agregar Gasto'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lista de gastos */}
      {filteredExpenses.length > 0 ? (
        viewMode === 'cards' ? (
          /* Vista Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredExpenses.map((expense, index) => {
                const { status, daysRemaining } = getPaymentStatus(expense)
                const badge = getPaymentStatusBadge(status, daysRemaining)

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative group"
                  >
                    {/* Glow */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: expense.category.color }}
                    />

                    <div
                      className={`relative rounded-2xl p-5 border transition-all ${
                        expense.endDate ? 'opacity-60' : ''
                      }`}
                      style={{
                        backgroundColor: `${expense.category.color}10`,
                        borderColor: `${expense.category.color}30`
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${expense.category.color}25` }}
                          >
                            {getCategoryIcon(expense.category.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{expense.name}</p>
                            <p className="text-xs text-gray-400">{expense.category.name}</p>
                          </div>
                        </div>
                        {expense.endDate && (
                          <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs">
                            Cancelado
                          </span>
                        )}
                      </div>

                      {/* Monto */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-red-400">
                          {formatCurrency(expense.amount)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {expense.type === 'recurring' ? '/mes' : 'unico'}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          expense.type === 'recurring'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {expense.type === 'recurring' ? 'Fijo' : 'Variable'}
                        </span>
                        {!expense.endDate && (
                          <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs">
                            ✓ Activo
                          </span>
                        )}
                        {badge && (
                          <span className={`px-2 py-1 rounded-lg text-xs ${badge.bgClass} ${badge.textClass}`}>
                            {badge.label}
                          </span>
                        )}
                        {expense.billingDay && (
                          <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs">
                            Dia {expense.billingDay}
                          </span>
                        )}
                        {expense.paidByClient && (
                          <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs">
                            {expense.paidByClient}
                          </span>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-all"
                        >
                          Editar
                        </button>
                        {expense.billingDay && !expense.endDate && status !== 'paid' && (
                          <button
                            onClick={() => onMarkPaid(expense.id)}
                            className="flex-1 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-sm text-green-400 hover:text-green-300 transition-all"
                          >
                            Pagado
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 hover:text-red-300 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Vista Lista - Tabla actualizada */
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Nombre</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Categoria</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Monto</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Fecha de pago</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Ultimo pago</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Dias rest.</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense, index) => {
                    const { status, daysRemaining } = getPaymentStatus(expense)
                    const badge = getPaymentStatusBadge(status, daysRemaining)

                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          expense.endDate ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                              style={{ backgroundColor: `${expense.category.color}25` }}
                            >
                              {getCategoryIcon(expense.category.name)}
                            </div>
                            <span className="font-medium">{expense.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: expense.category.color }}
                            />
                            {expense.category.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-red-400 font-semibold">
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-300">
                          {formatPaymentDate(expense.billingDay)}
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-300">
                          {formatLastPaymentDate(expense.lastPaymentDate)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {status === 'upcoming' && daysRemaining !== null ? (
                            <span className="text-blue-400 font-medium">{daysRemaining}</span>
                          ) : status === 'expired' ? (
                            <span className="text-red-400 font-medium text-xs">Expirado</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {badge ? (
                            <span className={`px-2 py-1 rounded-lg text-xs ${badge.bgClass} ${badge.textClass}`}>
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-[#44e1fc] hover:text-white text-sm transition-colors px-1"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            {expense.billingDay && !expense.endDate && status !== 'paid' && (
                              <button
                                onClick={() => onMarkPaid(expense.id)}
                                className="text-green-400 hover:text-green-300 text-sm transition-colors px-1"
                                title="Marcar pagado"
                              >
                                ✅
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors px-1"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )
      ) : (
        /* Estado vacio */
        <GlassCard>
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
            >
              <span className="text-5xl">💸</span>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold mb-2"
            >
              {expenses.length === 0 ? 'No hay gastos registrados' : 'No hay gastos con estos filtros'}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-md mx-auto"
            >
              {expenses.length === 0
                ? 'Registra tus gastos fijos y variables para llevar un control de tus finanzas.'
                : 'Intenta cambiar los filtros para ver otros gastos.'}
            </motion.p>
            {expenses.length === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowForm(true)}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                + Agregar primer gasto
              </motion.button>
            )}
          </div>
        </GlassCard>
      )}

      {/* Contador de resultados */}
      {filteredExpenses.length > 0 && filteredExpenses.length !== expenses.length && (
        <p className="text-center text-sm text-gray-500">
          Mostrando {filteredExpenses.length} de {expenses.length} gastos
        </p>
      )}
    </div>
  )
}
