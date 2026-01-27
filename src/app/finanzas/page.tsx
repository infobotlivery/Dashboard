'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import NumberInput from '@/components/ui/NumberInput'

type Tab = 'resumen' | 'gastos' | 'categorias' | 'historial'

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
    list: { id: number; name: string; amount: number; type: string; category: string; categoryColor: string }[]
  }
  netProfit: number
  activeClients: number
}

interface HistoryEntry {
  month: string
  monthLabel: string
  totalIncome: number
  totalOnboarding: number
  totalMrrServices: number
  totalMrrCommunity: number
  totalExpenses: number
  netProfit: number
}

interface Category {
  id: number
  name: string
  color: string
  _count: { expenses: number }
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

export default function FinanzasPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('resumen')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Data states
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', color: '#44e1fc' })
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: 0,
    type: 'recurring',
    categoryId: '',
    notes: ''
  })
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null)

  // Autenticacion
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (data.success) {
        setIsAuthenticated(true)
        localStorage.setItem('finance_token', data.data.token)
      } else {
        setAuthError(data.error || 'Contrasena incorrecta')
      }
    } catch {
      setAuthError('Error de conexion')
    } finally {
      setAuthLoading(false)
    }
  }

  // Cargar datos
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      setLoading(true)
      try {
        const [summaryRes, historyRes, categoriesRes, expensesRes] = await Promise.all([
          fetch('/api/finance/summary'),
          fetch('/api/finance/history'),
          fetch('/api/finance/categories'),
          fetch('/api/finance/expenses')
        ])

        const [summaryData, historyData, categoriesData, expensesData] = await Promise.all([
          summaryRes.json(),
          historyRes.json(),
          categoriesRes.json(),
          expensesRes.json()
        ])

        if (summaryData.data) setSummary(summaryData.data)
        if (historyData.data) setHistory(historyData.data)
        if (categoriesData.data) setCategories(categoriesData.data)
        if (expensesData.data) setExpenses(expensesData.data)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // Crear categoria
  async function handleCreateCategory() {
    if (!newCategory.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })
      const data = await res.json()

      if (data.success) {
        setCategories([...categories, { ...data.data, _count: { expenses: 0 } }])
        setNewCategory({ name: '', color: '#44e1fc' })
        setMessage({ type: 'success', text: 'Categoria creada' })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al crear categoria' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Crear/Actualizar gasto
  async function handleSaveExpense() {
    if (!newExpense.name.trim() || !newExpense.categoryId || newExpense.amount <= 0) {
      setMessage({ type: 'error', text: 'Completa todos los campos' })
      return
    }

    setSaving(true)
    try {
      const method = editingExpenseId ? 'PUT' : 'POST'
      const body = editingExpenseId
        ? { ...newExpense, id: editingExpenseId }
        : newExpense

      const res = await fetch('/api/finance/expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.success) {
        // Recargar gastos
        const expensesRes = await fetch('/api/finance/expenses')
        const expensesData = await expensesRes.json()
        if (expensesData.data) setExpenses(expensesData.data)

        // Recargar resumen
        const summaryRes = await fetch('/api/finance/summary')
        const summaryData = await summaryRes.json()
        if (summaryData.data) setSummary(summaryData.data)

        setNewExpense({ name: '', amount: 0, type: 'recurring', categoryId: '', notes: '' })
        setEditingExpenseId(null)
        setMessage({ type: 'success', text: editingExpenseId ? 'Gasto actualizado' : 'Gasto creado' })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar gasto' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Eliminar gasto
  async function handleDeleteExpense(id: number) {
    if (!confirm('Eliminar este gasto?')) return

    try {
      const res = await fetch(`/api/finance/expenses?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setExpenses(expenses.filter(e => e.id !== id))
        // Recargar resumen
        const summaryRes = await fetch('/api/finance/summary')
        const summaryData = await summaryRes.json()
        if (summaryData.data) setSummary(summaryData.data)
        setMessage({ type: 'success', text: 'Gasto eliminado' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  // Formatear moneda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
              <p className="text-brand-muted mt-2">Ingresa tu contrasena para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />

              {authError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center bg-red-400/10 py-2 px-4 rounded-lg"
                >
                  {authError}
                </motion.p>
              )}

              <Button type="submit" className="w-full" loading={authLoading}>
                Ingresar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-brand-muted hover:text-brand-primary text-sm transition-colors">
                Volver al Dashboard
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Dashboard financiero
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-dark/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="text-green-500">$</span> Dashboard Financiero
              </h1>
              <p className="text-brand-muted text-sm">Control de ingresos y gastos</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a href="/" className="btn-secondary text-sm">
                Ver Dashboard
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('finance_token')
                  setIsAuthenticated(false)
                }}
                className="btn-secondary text-sm"
              >
                Cerrar Sesion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-brand-border bg-black/50">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'resumen', label: 'Resumen', icon: '$' },
              { id: 'gastos', label: 'Gastos', icon: '-' },
              { id: 'categorias', label: 'Categorias', icon: '#' },
              { id: 'historial', label: 'Historial', icon: '~' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-5 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-green-500'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <span className="font-mono">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeFinanceTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-brand-muted mt-4">Cargando datos...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tab Resumen */}
              {activeTab === 'resumen' && summary && (
                <div className="space-y-6">
                  {/* Balance General */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-500/10 border-green-500/30">
                      <div className="text-center">
                        <p className="text-brand-muted text-sm mb-1">Ingresos Totales</p>
                        <p className="text-3xl font-bold text-green-500">{formatCurrency(summary.income.total)}</p>
                      </div>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/30">
                      <div className="text-center">
                        <p className="text-brand-muted text-sm mb-1">Gastos Totales</p>
                        <p className="text-3xl font-bold text-red-500">{formatCurrency(summary.expenses.total)}</p>
                      </div>
                    </Card>
                    <Card className={`${summary.netProfit >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <div className="text-center">
                        <p className="text-brand-muted text-sm mb-1">Utilidad Neta</p>
                        <p className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(summary.netProfit)}
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Desglose de Ingresos */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 text-green-500">Desglose de Ingresos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-brand-muted text-sm">Onboarding (este mes)</p>
                        <p className="text-xl font-semibold">{formatCurrency(summary.income.onboarding)}</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-brand-muted text-sm">MRR Servicios</p>
                        <p className="text-xl font-semibold">{formatCurrency(summary.income.mrrServices)}</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-brand-muted text-sm">MRR Comunidad</p>
                        <p className="text-xl font-semibold">{formatCurrency(summary.income.mrrCommunity)}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Desglose de Gastos por Categoria */}
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 text-red-500">Gastos por Categoria</h3>
                    {Object.keys(summary.expenses.byCategory).length === 0 ? (
                      <p className="text-brand-muted text-center py-4">No hay gastos registrados</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(summary.expenses.byCategory).map(([catName, cat]) => (
                          <div key={catName} className="bg-black/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                <span className="font-medium">{catName}</span>
                              </div>
                              <span className="text-red-400 font-semibold">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="space-y-1 text-sm text-brand-muted">
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
                  </Card>

                  {/* Info adicional */}
                  <Card>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Clientes activos</span>
                      <span className="text-xl font-semibold text-brand-primary">{summary.activeClients}</span>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab Gastos */}
              {activeTab === 'gastos' && (
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">
                      {editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        label="Nombre del gasto"
                        value={newExpense.name}
                        onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                        placeholder="Ej: Cursor Pro"
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
                        options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                        placeholder="Seleccionar..."
                      />
                      <Select
                        label="Tipo"
                        value={newExpense.type}
                        onChange={(value) => setNewExpense({ ...newExpense, type: value })}
                        options={[
                          { value: 'recurring', label: 'Recurrente (mensual)' },
                          { value: 'fixed', label: 'Fijo (unico)' }
                        ]}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={handleSaveExpense} loading={saving}>
                        {editingExpenseId ? 'Actualizar' : 'Agregar Gasto'}
                      </Button>
                      {editingExpenseId && (
                        <button
                          onClick={() => {
                            setEditingExpenseId(null)
                            setNewExpense({ name: '', amount: 0, type: 'recurring', categoryId: '', notes: '' })
                          }}
                          className="text-brand-muted hover:text-white text-sm"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </Card>

                  {expenses.length > 0 && (
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">Gastos Registrados</h3>
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-brand-dark">
                            <tr>
                              <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Nombre</th>
                              <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Categoria</th>
                              <th className="text-right py-2 px-3 text-brand-muted font-medium text-sm">Monto</th>
                              <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Tipo</th>
                              <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Estado</th>
                              <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map((expense) => (
                              <tr key={expense.id} className="border-t border-brand-border">
                                <td className="py-3 px-3">{expense.name}</td>
                                <td className="py-3 px-3">
                                  <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.category.color }}></div>
                                    {expense.category.name}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right text-red-400 font-semibold">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="py-3 px-3 text-center text-sm text-brand-muted">
                                  {expense.type === 'recurring' ? 'Mensual' : 'Fijo'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`text-sm ${expense.endDate ? 'text-red-400' : 'text-green-400'}`}>
                                    {expense.endDate ? 'Cancelado' : 'Activo'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      setEditingExpenseId(expense.id)
                                      setNewExpense({
                                        name: expense.name,
                                        amount: expense.amount,
                                        type: expense.type,
                                        categoryId: String(expense.categoryId),
                                        notes: expense.notes || ''
                                      })
                                    }}
                                    className="text-brand-primary hover:text-white text-sm mr-2"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Tab Categorias */}
              {activeTab === 'categorias' && (
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">Nueva Categoria</h3>
                    <div className="flex gap-4 items-end">
                      <Input
                        label="Nombre"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Ej: Herramientas"
                        className="flex-1"
                      />
                      <div>
                        <label className="block text-sm font-medium text-brand-muted mb-2">Color</label>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-brand-border"
                        />
                      </div>
                      <Button onClick={handleCreateCategory} loading={saving}>
                        Crear
                      </Button>
                    </div>
                  </Card>

                  {categories.length > 0 && (
                    <Card>
                      <h3 className="text-lg font-semibold mb-4">Categorias Existentes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between bg-black/30 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <span className="text-brand-muted text-sm">{category._count.expenses} gastos</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Tab Historial */}
              {activeTab === 'historial' && (
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">Historial de 6 Meses</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Mes</th>
                            <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Ingresos</th>
                            <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Gastos</th>
                            <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Utilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((entry, idx) => (
                            <tr key={entry.month} className={`border-t border-brand-border ${idx === 0 ? 'bg-brand-primary/5' : ''}`}>
                              <td className="py-4 px-4 font-medium capitalize">
                                {entry.monthLabel}
                                {idx === 0 && <span className="ml-2 text-xs text-brand-primary">(actual)</span>}
                              </td>
                              <td className="py-4 px-4 text-right text-green-400 font-semibold">
                                {formatCurrency(entry.totalIncome)}
                              </td>
                              <td className="py-4 px-4 text-right text-red-400 font-semibold">
                                {formatCurrency(entry.totalExpenses)}
                              </td>
                              <td className={`py-4 px-4 text-right font-bold ${entry.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(entry.netProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Toast de mensajes */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                message.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
