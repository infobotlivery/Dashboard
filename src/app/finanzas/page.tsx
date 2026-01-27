'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FinanceSidebar,
  LoginScreen,
  ExportButton
} from '@/components/finanzas'
import { financeAuthFetch } from '@/lib/authFetch'
import type { FinanceTab } from '@/components/finanzas'
import {
  ResumenTab,
  GastosTab,
  CategoriasTab,
  HistorialTab,
  MetasTab
} from '@/components/finanzas/tabs'

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

interface MonthlyGoal {
  id: number
  month: string
  incomeTarget: number
  expenseLimit: number
  savingsTarget: number
  notes: string | null
}

const tabTitles: Record<FinanceTab, string> = {
  resumen: 'Resumen Financiero',
  gastos: 'Gestion de Gastos',
  categorias: 'Categorias de Gastos',
  historial: 'Historial Mensual',
  metas: 'Metas Mensuales'
}

export default function FinanzasPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<FinanceTab>('resumen')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Data states
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null)
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

  function handleLogout() {
    localStorage.removeItem('finance_token')
    setIsAuthenticated(false)
  }

  // Cargar datos
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      setLoading(true)
      try {
        const [summaryRes, historyRes, categoriesRes, expensesRes] = await Promise.all([
          financeAuthFetch('/api/finance/summary'),
          financeAuthFetch('/api/finance/history'),
          financeAuthFetch('/api/finance/categories'),
          financeAuthFetch('/api/finance/expenses')
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

        // Cargar meta del mes actual
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const goalRes = await financeAuthFetch(`/api/finance/goals?month=${currentMonth}`)
        const goalData = await goalRes.json()
        if (goalData.data) setCurrentGoal(goalData.data)
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
      showMessage('error', 'El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const res = await financeAuthFetch('/api/finance/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory)
      })
      const data = await res.json()

      if (data.success) {
        setCategories([...categories, { ...data.data, _count: { expenses: 0 } }])
        setNewCategory({ name: '', color: '#44e1fc' })
        showMessage('success', 'Categoria creada')
      } else {
        showMessage('error', data.error)
      }
    } catch {
      showMessage('error', 'Error al crear categoria')
    } finally {
      setSaving(false)
    }
  }

  // Crear/Actualizar gasto
  async function handleSaveExpense() {
    if (!newExpense.name.trim() || !newExpense.categoryId || newExpense.amount <= 0) {
      showMessage('error', 'Completa todos los campos')
      return
    }

    setSaving(true)
    try {
      const method = editingExpenseId ? 'PUT' : 'POST'
      const body = editingExpenseId
        ? { ...newExpense, id: editingExpenseId }
        : newExpense

      const res = await financeAuthFetch('/api/finance/expenses', {
        method,
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.success) {
        // Recargar gastos
        const expensesRes = await financeAuthFetch('/api/finance/expenses')
        const expensesData = await expensesRes.json()
        if (expensesData.data) setExpenses(expensesData.data)

        // Recargar resumen
        const summaryRes = await financeAuthFetch('/api/finance/summary')
        const summaryData = await summaryRes.json()
        if (summaryData.data) setSummary(summaryData.data)

        setNewExpense({ name: '', amount: 0, type: 'recurring', categoryId: '', notes: '' })
        setEditingExpenseId(null)
        showMessage('success', editingExpenseId ? 'Gasto actualizado' : 'Gasto creado')
      } else {
        showMessage('error', data.error)
      }
    } catch {
      showMessage('error', 'Error al guardar gasto')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar gasto
  async function handleDeleteExpense(id: number) {
    if (!confirm('Eliminar este gasto?')) return

    try {
      const res = await financeAuthFetch(`/api/finance/expenses?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setExpenses(expenses.filter(e => e.id !== id))
        // Recargar resumen
        const summaryRes = await financeAuthFetch('/api/finance/summary')
        const summaryData = await summaryRes.json()
        if (summaryData.data) setSummary(summaryData.data)
        showMessage('success', 'Gasto eliminado')
      }
    } catch {
      showMessage('error', 'Error al eliminar')
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <LoginScreen
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        loading={authLoading}
        error={authError}
      />
    )
  }

  // Dashboard financiero
  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <FinanceSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-white/5 lg:top-0 top-14">
          <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{tabTitles[activeTab]}</h1>
                <p className="text-sm text-gray-400">
                  {new Date().toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <ExportButton />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-400 mt-4">Cargando datos...</p>
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
                {activeTab === 'resumen' && summary && (
                  <ResumenTab summary={summary} currentGoal={currentGoal} />
                )}

                {activeTab === 'gastos' && (
                  <GastosTab
                    expenses={expenses}
                    categories={categories}
                    newExpense={newExpense}
                    setNewExpense={setNewExpense}
                    editingExpenseId={editingExpenseId}
                    setEditingExpenseId={setEditingExpenseId}
                    onSave={handleSaveExpense}
                    onDelete={handleDeleteExpense}
                    saving={saving}
                  />
                )}

                {activeTab === 'categorias' && (
                  <CategoriasTab
                    categories={categories}
                    newCategory={newCategory}
                    setNewCategory={setNewCategory}
                    onCreate={handleCreateCategory}
                    saving={saving}
                  />
                )}

                {activeTab === 'historial' && (
                  <HistorialTab history={history} />
                )}

                {activeTab === 'metas' && (
                  <MetasTab summary={summary} onMessage={showMessage} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Toast de mensajes */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 lg:bottom-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
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
    </div>
  )
}
