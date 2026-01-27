'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Toggle from '@/components/ui/Toggle'
import NumberInput from '@/components/ui/NumberInput'
import DateSelector from '@/components/ui/DateSelector'
import { Select } from '@/components/ui/Select'

type Tab = 'weekly' | 'monthly' | 'daily' | 'sales' | 'settings'

interface WeeklyMetric {
  id?: number
  weekStart: string
  mrr: number
  mrrComunidad: number
  pipelineActivo: number
  cierresSemana: number
  contenidoPublicado: number
  leadsEntrantes: number
  entregasPendientes: number
}

interface MonthlyScorecard {
  id?: number
  month: string
  facturacionTotal: number
  mrr: number
  clientesNuevos: number
  clientesPerdidos: number
  enigmaVendidos: number
  serviciosRecurrentes: number
  leadsTotales: number
  tasaCierre: number
}

interface Settings {
  brandPrimary: string
  brandDark: string
  logoUrl: string | null
}

interface SalesClose {
  id?: number
  clientName: string
  product: string
  customProduct: string
  onboardingValue: number
  recurringValue: number
  contractMonths: number | null
  status: string
}

// Iconos para las métricas
const icons = {
  mrr: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
    </svg>
  ),
  comunidad: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  ),
  pipeline: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  ),
  cierres: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  contenido: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),
  leads: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  ),
  entregas: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  ),
  facturacion: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  ),
  clientes: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  ),
  porcentaje: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('weekly')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Weekly metric state
  const [weeklyMetric, setWeeklyMetric] = useState<WeeklyMetric>({
    weekStart: formatLocalDate(getMonday(new Date())),
    mrr: 0,
    mrrComunidad: 0,
    pipelineActivo: 0,
    cierresSemana: 0,
    contenidoPublicado: 0,
    leadsEntrantes: 0,
    entregasPendientes: 0
  })

  // Monthly scorecard state
  const [monthlyScorecard, setMonthlyScorecard] = useState<MonthlyScorecard>({
    month: new Date().toISOString().slice(0, 7) + '-01',
    facturacionTotal: 0,
    mrr: 0,
    clientesNuevos: 0,
    clientesPerdidos: 0,
    enigmaVendidos: 0,
    serviciosRecurrentes: 0,
    leadsTotales: 0,
    tasaCierre: 0
  })

  // Daily check state
  const [dailyCheck, setDailyCheck] = useState({
    date: formatLocalDate(new Date()),
    publicoContenido: false,
    respondioLeads: false,
    notas: ''
  })

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    brandPrimary: '#44e1fc',
    brandDark: '#171717',
    logoUrl: null
  })
  const [newPassword, setNewPassword] = useState('')

  // Sales close state
  const [salesClose, setSalesClose] = useState<SalesClose>({
    clientName: '',
    product: 'CRM',
    customProduct: '',
    onboardingValue: 0,
    recurringValue: 0,
    contractMonths: null,
    status: 'active'
  })
  const [salesList, setSalesList] = useState<(SalesClose & { id: number })[]>([])
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null)

  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
  }

  // Formatear fecha local como YYYY-MM-DD (sin conversión a UTC)
  function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Parsear fecha YYYY-MM-DD como hora local (no UTC)
  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Autenticación
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
        localStorage.setItem('admin_token', data.data.token)
      } else {
        setAuthError(data.error || 'Contraseña incorrecta')
      }
    } catch {
      setAuthError('Error de conexión')
    } finally {
      setAuthLoading(false)
    }
  }

  // Cargar datos al cambiar de tab
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      try {
        if (activeTab === 'weekly') {
          const res = await fetch('/api/metrics/current')
          const data = await res.json()
          if (data.data) {
            setWeeklyMetric({
              ...data.data,
              weekStart: data.data.weekStart.split('T')[0]
            })
          }
        } else if (activeTab === 'monthly') {
          const res = await fetch('/api/scorecard?current=true')
          const data = await res.json()
          if (data.data) {
            setMonthlyScorecard({
              ...data.data,
              month: data.data.month.split('T')[0]
            })
          }
        } else if (activeTab === 'daily') {
          const res = await fetch('/api/daily?today=true')
          const data = await res.json()
          if (data.data) {
            setDailyCheck({
              ...data.data,
              date: data.data.date.split('T')[0],
              notas: data.data.notas || ''
            })
          }
        } else if (activeTab === 'sales') {
          const res = await fetch('/api/sales')
          const data = await res.json()
          if (data.data) {
            setSalesList(data.data)
          }
        } else if (activeTab === 'settings') {
          const res = await fetch('/api/settings')
          const data = await res.json()
          if (data.data) {
            setSettings(data.data)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }

    loadData()
  }, [activeTab, isAuthenticated])

  // Guardar datos
  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      let endpoint = ''
      let body = {}

      if (activeTab === 'weekly') {
        endpoint = '/api/metrics'
        body = weeklyMetric
      } else if (activeTab === 'monthly') {
        endpoint = '/api/scorecard'
        body = monthlyScorecard
      } else if (activeTab === 'daily') {
        endpoint = '/api/daily'
        body = dailyCheck
      } else if (activeTab === 'sales') {
        endpoint = '/api/sales'
        body = salesClose
        if (editingSaleId) {
          body = { ...salesClose, id: editingSaleId }
        }
      } else if (activeTab === 'settings') {
        endpoint = '/api/settings'
        body = { ...settings, newPassword: newPassword || undefined }
      }

      const res = await fetch(endpoint, {
        method: activeTab === 'sales' && editingSaleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Guardado correctamente' })
        if (activeTab === 'settings') setNewPassword('')
        if (activeTab === 'sales') {
          // Recargar lista y limpiar formulario
          const salesRes = await fetch('/api/sales')
          const salesData = await salesRes.json()
          if (salesData.data) setSalesList(salesData.data)
          setSalesClose({
            clientName: '',
            product: 'CRM',
            customProduct: '',
            onboardingValue: 0,
            recurringValue: 0,
            contractMonths: null,
            status: 'active'
          })
          setEditingSaleId(null)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

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
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-brand-muted mt-2">Ingresa tu contraseña para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Contraseña"
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
                ← Volver al Dashboard
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Panel de admin
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-dark/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-brand-muted text-sm">Edita tus métricas y configuración</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a href="/" className="btn-secondary text-sm">
                Ver Dashboard
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  setIsAuthenticated(false)
                }}
                className="btn-secondary text-sm"
              >
                Cerrar Sesión
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
              { id: 'weekly', label: 'Semanal', icon: '📊' },
              { id: 'monthly', label: 'Mensual', icon: '📈' },
              { id: 'daily', label: 'Diario', icon: '✅' },
              { id: 'sales', label: 'Cierres', icon: '💰' },
              { id: 'settings', label: 'Configuración', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-5 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-brand-primary'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Weekly Tab */}
            {activeTab === 'weekly' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Métricas de la Semana</h2>
                  <DateSelector
                    value={parseLocalDate(weeklyMetric.weekStart)}
                    onChange={(date) => setWeeklyMetric({ ...weeklyMetric, weekStart: formatLocalDate(date) })}
                    label="Semana del"
                    mode="week"
                  />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberInput
                    label="MRR Clientes"
                    value={weeklyMetric.mrr}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, mrr: value })}
                    icon={icons.mrr}
                    prefix="$"
                    step={100}
                    color="#10b981"
                  />
                  <NumberInput
                    label="MRR Comunidad"
                    value={weeklyMetric.mrrComunidad}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, mrrComunidad: value })}
                    icon={icons.comunidad}
                    prefix="$"
                    step={100}
                    color="#06b6d4"
                  />
                  <NumberInput
                    label="Propuestas Enviadas"
                    value={weeklyMetric.pipelineActivo}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, pipelineActivo: value })}
                    icon={icons.pipeline}
                    suffix="propuestas"
                    color="#3b82f6"
                  />
                  <NumberInput
                    label="Cierres de la Semana"
                    value={weeklyMetric.cierresSemana}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, cierresSemana: value })}
                    icon={icons.cierres}
                    prefix="$"
                    step={100}
                    color="#f59e0b"
                  />
                  <NumberInput
                    label="Contenido Publicado"
                    value={weeklyMetric.contenidoPublicado}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, contenidoPublicado: value })}
                    icon={icons.contenido}
                    suffix="piezas"
                    color="#8b5cf6"
                  />
                  <NumberInput
                    label="Leads Entrantes"
                    value={weeklyMetric.leadsEntrantes}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, leadsEntrantes: value })}
                    icon={icons.leads}
                    suffix="nuevos"
                    color="#ec4899"
                  />
                  <NumberInput
                    label="Entregas Pendientes"
                    value={weeklyMetric.entregasPendientes}
                    onChange={(value) => setWeeklyMetric({ ...weeklyMetric, entregasPendientes: value })}
                    icon={icons.entregas}
                    suffix="proyectos"
                    color="#ef4444"
                  />
                </div>
              </div>
            )}

            {/* Monthly Tab */}
            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Scorecard Mensual</h2>
                  <DateSelector
                    value={parseLocalDate(monthlyScorecard.month)}
                    onChange={(date) => setMonthlyScorecard({ ...monthlyScorecard, month: formatLocalDate(date) })}
                    label="Mes"
                    mode="month"
                  />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberInput
                    label="Facturación Total"
                    value={monthlyScorecard.facturacionTotal}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, facturacionTotal: value })}
                    icon={icons.facturacion}
                    prefix="$"
                    step={500}
                    color="#10b981"
                  />
                  <NumberInput
                    label="MRR"
                    value={monthlyScorecard.mrr}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, mrr: value })}
                    icon={icons.mrr}
                    prefix="$"
                    step={100}
                    color="#3b82f6"
                  />
                  <NumberInput
                    label="Clientes Nuevos"
                    value={monthlyScorecard.clientesNuevos}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, clientesNuevos: value })}
                    icon={icons.clientes}
                    color="#8b5cf6"
                  />
                  <NumberInput
                    label="Clientes Perdidos"
                    value={monthlyScorecard.clientesPerdidos}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, clientesPerdidos: value })}
                    icon={icons.clientes}
                    color="#ef4444"
                  />
                  <NumberInput
                    label="ENIGMA Vendidos"
                    value={monthlyScorecard.enigmaVendidos}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, enigmaVendidos: value })}
                    icon={icons.cierres}
                    color="#f59e0b"
                  />
                  <NumberInput
                    label="Servicios Recurrentes"
                    value={monthlyScorecard.serviciosRecurrentes}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, serviciosRecurrentes: value })}
                    icon={icons.mrr}
                    color="#06b6d4"
                  />
                  <NumberInput
                    label="Leads Totales"
                    value={monthlyScorecard.leadsTotales}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, leadsTotales: value })}
                    icon={icons.leads}
                    color="#ec4899"
                  />
                  <NumberInput
                    label="Tasa de Cierre"
                    value={monthlyScorecard.tasaCierre}
                    onChange={(value) => setMonthlyScorecard({ ...monthlyScorecard, tasaCierre: value })}
                    icon={icons.porcentaje}
                    suffix="%"
                    step={0.5}
                    max={100}
                    color="#22c55e"
                  />
                </div>
              </div>
            )}

            {/* Daily Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Check Diario</h2>
                  <DateSelector
                    value={parseLocalDate(dailyCheck.date)}
                    onChange={(date) => setDailyCheck({ ...dailyCheck, date: formatLocalDate(date) })}
                    label="Fecha"
                    mode="date"
                  />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Toggle
                    checked={dailyCheck.publicoContenido}
                    onChange={(checked) => setDailyCheck({ ...dailyCheck, publicoContenido: checked })}
                    label="¿Publiqué contenido hoy?"
                    description="Registra si creaste y publicaste algún contenido"
                  />
                  <Toggle
                    checked={dailyCheck.respondioLeads}
                    onChange={(checked) => setDailyCheck({ ...dailyCheck, respondioLeads: checked })}
                    label="¿Respondí a los leads?"
                    description="Registra si atendiste las consultas de potenciales clientes"
                  />
                </div>

                <Card>
                  <label className="block text-sm font-medium text-brand-muted mb-3">
                    Notas del día
                  </label>
                  <textarea
                    value={dailyCheck.notas}
                    onChange={(e) => setDailyCheck({ ...dailyCheck, notas: e.target.value })}
                    rows={5}
                    className="w-full bg-black/30 border border-brand-border rounded-xl px-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
                    placeholder="Observaciones, aprendizajes, pendientes..."
                  />
                </Card>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4">
                    {editingSaleId ? 'Editar Cierre' : 'Nuevo Cierre de Venta'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      label="Nombre del Cliente"
                      value={salesClose.clientName}
                      onChange={(e) => setSalesClose({ ...salesClose, clientName: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                    />
                    <Select
                      label="Producto"
                      value={salesClose.product}
                      onChange={(value) => setSalesClose({ ...salesClose, product: value })}
                      options={[
                        { value: 'CRM', label: 'CRM', icon: '📊' },
                        { value: 'Agente IA', label: 'Agente IA', icon: '🤖' },
                        { value: 'Enigma', label: 'Enigma', icon: '🎯' },
                        { value: 'Asesoría', label: 'Asesoría', icon: '💡' },
                        { value: 'Otro', label: 'Otro', icon: '📦' }
                      ]}
                    />
                    {salesClose.product === 'Otro' && (
                      <Input
                        label="Producto Personalizado"
                        value={salesClose.customProduct}
                        onChange={(e) => setSalesClose({ ...salesClose, customProduct: e.target.value })}
                        placeholder="Especifica el producto"
                      />
                    )}
                    <NumberInput
                      label="Valor Onboarding"
                      value={salesClose.onboardingValue}
                      onChange={(value) => setSalesClose({ ...salesClose, onboardingValue: value })}
                      prefix="$"
                      step={100}
                      color="#10b981"
                    />
                    <NumberInput
                      label="Valor Recurrente (mensual)"
                      value={salesClose.recurringValue}
                      onChange={(value) => setSalesClose({ ...salesClose, recurringValue: value })}
                      prefix="$"
                      suffix="/mes"
                      step={50}
                      color="#3b82f6"
                    />
                    <NumberInput
                      label="Duración Contrato (meses)"
                      value={salesClose.contractMonths || 0}
                      onChange={(value) => setSalesClose({ ...salesClose, contractMonths: value || null })}
                      suffix="meses"
                      min={0}
                      max={60}
                      color="#8b5cf6"
                    />
                    <Select
                      label="Estado"
                      value={salesClose.status}
                      onChange={(value) => setSalesClose({ ...salesClose, status: value })}
                      options={[
                        { value: 'active', label: 'Activo', icon: '🟢' },
                        { value: 'cancelled', label: 'Cancelado', icon: '🔴' },
                        { value: 'completed', label: 'Completado', icon: '✅' }
                      ]}
                    />
                  </div>
                  {editingSaleId && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setEditingSaleId(null)
                          setSalesClose({
                            clientName: '',
                            product: 'CRM',
                            customProduct: '',
                            onboardingValue: 0,
                            recurringValue: 0,
                            contractMonths: null,
                            status: 'active'
                          })
                        }}
                        className="text-brand-muted hover:text-white text-sm"
                      >
                        Cancelar edición
                      </button>
                    </div>
                  )}
                </Card>

                {/* Lista de cierres existentes */}
                {salesList.length > 0 && (
                  <Card>
                    <h2 className="text-lg font-semibold mb-4">Cierres Registrados</h2>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Cliente</th>
                            <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Producto</th>
                            <th className="text-right py-2 px-3 text-brand-muted font-medium text-sm">Onboarding</th>
                            <th className="text-right py-2 px-3 text-brand-muted font-medium text-sm">Recurrente</th>
                            <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Estado</th>
                            <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesList.map((sale) => (
                            <tr key={sale.id} className="border-t border-brand-border">
                              <td className="py-3 px-3">{sale.clientName}</td>
                              <td className="py-3 px-3 text-brand-muted">
                                {sale.product === 'Otro' ? sale.customProduct : sale.product}
                              </td>
                              <td className="py-3 px-3 text-right text-green-400">
                                ${sale.onboardingValue.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right text-brand-primary">
                                ${sale.recurringValue.toLocaleString()}/mes
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex items-center gap-1 text-sm ${
                                  sale.status === 'active' ? 'text-green-400' :
                                  sale.status === 'cancelled' ? 'text-red-400' : 'text-brand-primary'
                                }`}>
                                  <span className={`w-2 h-2 rounded-full ${
                                    sale.status === 'active' ? 'bg-green-400' :
                                    sale.status === 'cancelled' ? 'bg-red-400' : 'bg-brand-primary'
                                  }`}></span>
                                  {sale.status === 'active' ? 'Activo' :
                                   sale.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => {
                                    setEditingSaleId(sale.id)
                                    setSalesClose({
                                      clientName: sale.clientName,
                                      product: sale.product,
                                      customProduct: sale.customProduct || '',
                                      onboardingValue: sale.onboardingValue,
                                      recurringValue: sale.recurringValue,
                                      contractMonths: sale.contractMonths,
                                      status: sale.status
                                    })
                                  }}
                                  className="text-brand-primary hover:text-white text-sm mr-2"
                                >
                                  Editar
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-6">Colores de Marca</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-brand-muted mb-3">
                        Color Primario
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-brand-border cursor-pointer overflow-hidden"
                          style={{ backgroundColor: settings.brandPrimary }}
                        >
                          <input
                            type="color"
                            value={settings.brandPrimary}
                            onChange={(e) => setSettings({ ...settings, brandPrimary: e.target.value })}
                            className="w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={settings.brandPrimary}
                          onChange={(e) => setSettings({ ...settings, brandPrimary: e.target.value })}
                          placeholder="#44e1fc"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-muted mb-3">
                        Color Oscuro
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-brand-border cursor-pointer overflow-hidden"
                          style={{ backgroundColor: settings.brandDark }}
                        >
                          <input
                            type="color"
                            value={settings.brandDark}
                            onChange={(e) => setSettings({ ...settings, brandDark: e.target.value })}
                            className="w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={settings.brandDark}
                          onChange={(e) => setSettings({ ...settings, brandDark: e.target.value })}
                          placeholder="#171717"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-semibold mb-4">Logo</h2>
                  <Input
                    label="URL del Logo"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://tu-sitio.com/logo.png"
                  />
                  <p className="text-brand-muted text-sm mt-3">
                    Sube tu logo a un servicio de hosting y pega la URL aquí
                  </p>
                  {settings.logoUrl && (
                    <div className="mt-4 p-4 bg-black/30 rounded-xl">
                      <p className="text-sm text-brand-muted mb-2">Vista previa:</p>
                      <img
                        src={settings.logoUrl}
                        alt="Logo preview"
                        className="max-h-16 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </Card>

                <Card>
                  <h2 className="text-lg font-semibold mb-4">Cambiar Contraseña</h2>
                  <Input
                    type="password"
                    label="Nueva Contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Save Button & Message */}
        <div className="mt-8 flex items-center gap-4">
          <Button onClick={handleSave} loading={saving} size="lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Guardar Cambios
          </Button>

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
        </div>
      </main>
    </div>
  )
}
