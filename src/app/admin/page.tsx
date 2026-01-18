'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

type Tab = 'weekly' | 'monthly' | 'daily' | 'settings'

interface WeeklyMetric {
  id?: number
  weekStart: string
  mrr: number
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
    weekStart: getMonday(new Date()).toISOString().split('T')[0],
    mrr: 0,
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
    date: new Date().toISOString().split('T')[0],
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

  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
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
      } else if (activeTab === 'settings') {
        endpoint = '/api/settings'
        body = { ...settings, newPassword: newPassword || undefined }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Guardado correctamente' })
        if (activeTab === 'settings') setNewPassword('')
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
                <p className="text-red-400 text-sm text-center">{authError}</p>
              )}

              <Button type="submit" className="w-full" loading={authLoading}>
                Ingresar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-brand-muted hover:text-brand-primary text-sm">
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
      <header className="border-b border-brand-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-brand-muted text-sm">Edita tus métricas y configuración</p>
            </div>
            <div className="flex gap-3">
              <a href="/" className="btn-secondary text-sm">
                Ver Dashboard
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  setIsAuthenticated(false)
                }}
                className="btn-secondary text-sm text-red-400 border-red-400/30 hover:border-red-400"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-brand-border">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'weekly', label: 'Semanal' },
              { id: 'monthly', label: 'Mensual' },
              { id: 'daily', label: 'Diario' },
              { id: 'settings', label: 'Configuración' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-brand-primary'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
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
      <main className="max-w-5xl mx-auto px-4 py-8">
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
                <div className="flex items-center gap-4 mb-6">
                  <Input
                    type="date"
                    label="Semana del"
                    value={weeklyMetric.weekStart}
                    onChange={(e) =>
                      setWeeklyMetric({ ...weeklyMetric, weekStart: e.target.value })
                    }
                    className="max-w-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="MRR ($)"
                    value={weeklyMetric.mrr}
                    onChange={(e) =>
                      setWeeklyMetric({ ...weeklyMetric, mrr: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <Input
                    type="number"
                    label="Pipeline Activo (leads)"
                    value={weeklyMetric.pipelineActivo}
                    onChange={(e) =>
                      setWeeklyMetric({
                        ...weeklyMetric,
                        pipelineActivo: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Cierres de la Semana ($)"
                    value={weeklyMetric.cierresSemana}
                    onChange={(e) =>
                      setWeeklyMetric({
                        ...weeklyMetric,
                        cierresSemana: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Contenido Publicado"
                    value={weeklyMetric.contenidoPublicado}
                    onChange={(e) =>
                      setWeeklyMetric({
                        ...weeklyMetric,
                        contenidoPublicado: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Leads Entrantes"
                    value={weeklyMetric.leadsEntrantes}
                    onChange={(e) =>
                      setWeeklyMetric({
                        ...weeklyMetric,
                        leadsEntrantes: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Entregas Pendientes"
                    value={weeklyMetric.entregasPendientes}
                    onChange={(e) =>
                      setWeeklyMetric({
                        ...weeklyMetric,
                        entregasPendientes: parseInt(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Monthly Tab */}
            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <Input
                  type="month"
                  label="Mes"
                  value={monthlyScorecard.month.slice(0, 7)}
                  onChange={(e) =>
                    setMonthlyScorecard({ ...monthlyScorecard, month: e.target.value + '-01' })
                  }
                  className="max-w-xs"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    type="number"
                    label="Facturación Total ($)"
                    value={monthlyScorecard.facturacionTotal}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        facturacionTotal: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="MRR ($)"
                    value={monthlyScorecard.mrr}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        mrr: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Clientes Nuevos"
                    value={monthlyScorecard.clientesNuevos}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        clientesNuevos: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Clientes Perdidos"
                    value={monthlyScorecard.clientesPerdidos}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        clientesPerdidos: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="ENIGMA Vendidos"
                    value={monthlyScorecard.enigmaVendidos}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        enigmaVendidos: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Servicios Recurrentes"
                    value={monthlyScorecard.serviciosRecurrentes}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        serviciosRecurrentes: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Leads Totales"
                    value={monthlyScorecard.leadsTotales}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        leadsTotales: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Tasa de Cierre (%)"
                    value={monthlyScorecard.tasaCierre}
                    onChange={(e) =>
                      setMonthlyScorecard({
                        ...monthlyScorecard,
                        tasaCierre: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Daily Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                <Input
                  type="date"
                  label="Fecha"
                  value={dailyCheck.date}
                  onChange={(e) => setDailyCheck({ ...dailyCheck, date: e.target.value })}
                  className="max-w-xs"
                />

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dailyCheck.publicoContenido}
                      onChange={(e) =>
                        setDailyCheck({ ...dailyCheck, publicoContenido: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-primary focus:ring-brand-primary"
                    />
                    <span>¿Publiqué contenido hoy?</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dailyCheck.respondioLeads}
                      onChange={(e) =>
                        setDailyCheck({ ...dailyCheck, respondioLeads: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-primary focus:ring-brand-primary"
                    />
                    <span>¿Respondí a los leads?</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-muted mb-2">
                    Notas del día
                  </label>
                  <textarea
                    value={dailyCheck.notas}
                    onChange={(e) => setDailyCheck({ ...dailyCheck, notas: e.target.value })}
                    rows={4}
                    className="w-full bg-brand-dark border border-brand-border rounded-button px-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
                    placeholder="Observaciones, aprendizajes, pendientes..."
                  />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Colores de Marca</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-muted mb-2">
                        Color Primario
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={settings.brandPrimary}
                          onChange={(e) =>
                            setSettings({ ...settings, brandPrimary: e.target.value })
                          }
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <Input
                          value={settings.brandPrimary}
                          onChange={(e) =>
                            setSettings({ ...settings, brandPrimary: e.target.value })
                          }
                          placeholder="#44e1fc"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-muted mb-2">
                        Color Oscuro
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={settings.brandDark}
                          onChange={(e) => setSettings({ ...settings, brandDark: e.target.value })}
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <Input
                          value={settings.brandDark}
                          onChange={(e) => setSettings({ ...settings, brandDark: e.target.value })}
                          placeholder="#171717"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Logo</h3>
                  <Input
                    label="URL del Logo"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="https://tu-sitio.com/logo.png"
                  />
                  <p className="text-brand-muted text-sm mt-2">
                    Sube tu logo a un servicio de hosting y pega la URL aquí
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
                  <Input
                    type="password"
                    label="Nueva Contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Save Button & Message */}
        <div className="mt-8 flex items-center gap-4">
          <Button onClick={handleSave} loading={saving}>
            Guardar Cambios
          </Button>

          <AnimatePresence>
            {message && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}
              >
                {message.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
