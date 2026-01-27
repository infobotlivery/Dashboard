'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import NumberInput from '@/components/ui/NumberInput'

interface Category {
  id: number
  name: string
  color: string
}

interface Expense {
  id: number
  name: string
  amount: number
  type: string
  categoryId: number
  category: { name: string; color: string }
  startDate: string
  endDate: string | null
  notes: string | null
}

interface NewExpense {
  name: string
  amount: number
  type: string
  categoryId: string
  notes: string
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
  saving: boolean
}

// Iconos para categorías
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

type FilterType = 'all' | 'recurring' | 'fixed'
type FilterStatus = 'all' | 'active' | 'cancelled'
type ViewMode = 'cards' | 'list'

export function GastosTab({
  expenses,
  categories,
  newExpense,
  setNewExpense,
  editingExpenseId,
  setEditingExpenseId,
  onSave,
  onDelete,
  saving
}: GastosTabProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [showForm, setShowForm] = useState(false)

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
      if (filterType !== 'all' && expense.type !== filterType) return false
      if (filterStatus === 'active' && expense.endDate) return false
      if (filterStatus === 'cancelled' && !expense.endDate) return false
      return true
    })
  }, [expenses, filterCategory, filterType, filterStatus])

  // Estadísticas
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

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id)
    setNewExpense({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      categoryId: String(expense.categoryId),
      notes: expense.notes || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingExpenseId(null)
    setNewExpense({
      name: '',
      amount: 0,
      type: 'recurring',
      categoryId: '',
      notes: ''
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">💸</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-gray-400">Total mensual</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">{formatCurrency(stats.recurringAmount)}</p>
              <p className="text-xs text-gray-400">Recurrentes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-xl">📌</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{formatCurrency(stats.fixedAmount)}</p>
              <p className="text-xs text-gray-400">Fijos</p>
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
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.totalActive}</p>
              <p className="text-xs text-gray-400">Gastos activos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botón agregar y filtros */}
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
          {/* Filtro categoría */}
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

          {/* Filtro tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="dark-select px-3 py-2 rounded-lg bg-[#171717] border border-white/10 text-sm text-white focus:border-[#44e1fc] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            <option value="recurring">Recurrentes</option>
            <option value="fixed">Fijos</option>
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
        </div>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    { value: 'recurring', label: '🔄 Recurrente (mensual)' },
                    { value: 'fixed', label: '📌 Fijo (pago único)' }
                  ]}
                />
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={onSave} loading={saving}>
                  {editingExpenseId ? 'Actualizar Gasto' : 'Agregar Gasto'}
                </Button>
                {editingExpenseId && (
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de gastos */}
      {filteredExpenses.length > 0 ? (
        viewMode === 'cards' ? (
          /* Vista Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredExpenses.map((expense, index) => (
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
                        {expense.type === 'recurring' ? '/mes' : 'único'}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        expense.type === 'recurring'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {expense.type === 'recurring' ? '🔄 Recurrente' : '📌 Fijo'}
                      </span>
                      {!expense.endDate && (
                        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs">
                          ✓ Activo
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-all"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 hover:text-red-300 transition-all"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Vista Lista */
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Gasto</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Categoria</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Monto</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Tipo</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Estado</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense, index) => (
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
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          expense.type === 'recurring'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {expense.type === 'recurring' ? 'Mensual' : 'Único'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          expense.endDate
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {expense.endDate ? 'Cancelado' : 'Activo'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-[#44e1fc] hover:text-white text-sm mr-3 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )
      ) : (
        /* Estado vacío */
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
                ? 'Registra tus gastos recurrentes y fijos para llevar un control de tus finanzas.'
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
