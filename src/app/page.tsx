'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PeriodMetrics } from '@/components/dashboard/PeriodMetrics'
import { CadenceTree } from '@/components/dashboard/CadenceTree'
import { BillingMetrics } from '@/components/dashboard/BillingMetrics'
import { UpcomingClientPayments } from '@/components/dashboard/UpcomingClientPayments'
import { ProposalsBoard } from '@/components/dashboard/ProposalsBoard'
import { CallsBoard } from '@/components/dashboard/CallsBoard'
import type {
  Settings,
  FinanceSummary,
  MonthlyGoal,
  UpcomingClientPayment,
  Proposal,
  CallRecord
} from '@/types'

const currentYYYYMM = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mes seleccionado ('' = mes actual). Controla finanzas, cuentas, métricas y propuestas.
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [billingSummary, setBillingSummary] = useState<FinanceSummary | null>(null)
  const [billingGoal, setBillingGoal] = useState<MonthlyGoal | null>(null)
  const [upcomingClients, setUpcomingClients] = useState<UpcomingClientPayment[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [calendlyConfigured, setCalendlyConfigured] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const fetchBilling = useCallback(async (month: string) => {
    const target = month || currentYYYYMM()
    const [summaryRes, goalRes] = await Promise.all([
      fetch(`/api/finance/summary?month=${target}`, { cache: 'no-store' }),
      fetch(`/api/finance/goals?month=${target}-01`, { cache: 'no-store' })
    ])
    if (summaryRes.ok) {
      const d = await summaryRes.json()
      setBillingSummary(d.data ?? null)
    }
    if (goalRes.ok) {
      const d = await goalRes.json()
      setBillingGoal(d.data ?? null)
    }
  }, [])

  const fetchLists = useCallback(async () => {
    const [upcomingRes, proposalsRes] = await Promise.all([
      fetch('/api/sales/upcoming', { cache: 'no-store' }),
      fetch('/api/proposals', { cache: 'no-store' })
    ])
    if (upcomingRes.ok) setUpcomingClients((await upcomingRes.json()).data || [])
    if (proposalsRes.ok) setProposals((await proposalsRes.json()).data || [])
  }, [])

  const fetchCalls = useCallback(async () => {
    const res = await fetch('/api/calls', { cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      setCalls(d.data?.calls ?? [])
      setCalendlyConfigured(!!d.data?.configured)
    }
  }, [])

  // Trae llamadas nuevas de Calendly; si hay novedades recalcula métricas
  const syncCalendly = useCallback(async (force = false) => {
    setSyncing(true)
    try {
      const res = await fetch('/api/calls/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      })
      const d = (await res.json()).data
      setSyncError(d?.error ?? '')
      if (d && (d.created > 0 || d.updated > 0)) {
        await fetchCalls()
        setRefreshKey(k => k + 1)
      }
    } catch {
      setSyncError('No se pudo contactar al servidor')
    } finally {
      setSyncing(false)
    }
  }, [fetchCalls])

  // Carga inicial
  useEffect(() => {
    async function init() {
      try {
        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok) setSettings((await settingsRes.json()).data)
        await Promise.all([fetchBilling(''), fetchLists(), fetchCalls()])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [fetchBilling, fetchLists, fetchCalls])

  // Sincronización automática con Calendly: al abrir y cada 5 minutos mientras la página esté abierta
  useEffect(() => {
    if (loading) return
    syncCalendly()
    const id = setInterval(() => syncCalendly(), 5 * 60_000)
    return () => clearInterval(id)
  }, [loading, syncCalendly])

  // El selector de mes recarga las finanzas y cuentas de ese mes
  useEffect(() => {
    if (!loading) fetchBilling(selectedMonth).catch(err => console.error('Error fetching billing:', err))
  }, [selectedMonth, loading, fetchBilling])

  // Tras crear/editar propuestas o registrar ventas: recarga todo y recalcula métricas
  const reloadAll = useCallback(async () => {
    try {
      await Promise.all([fetchBilling(selectedMonth), fetchLists(), fetchCalls()])
    } catch (err) {
      console.error('Error reloading:', err)
    }
    setRefreshKey(k => k + 1)
  }, [fetchBilling, fetchLists, fetchCalls, selectedMonth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="glass-card text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header con glass effect */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {settings?.logoUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  src={settings.logoUrl}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Sistema de <span className="text-brand-primary">Control</span>
                </h1>
                <p className="text-brand-muted text-sm hidden sm:block">
                  Métricas de negocio en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.a
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                href="/finanzas"
                className="btn-secondary text-sm flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="text-green-500">$</span>
                <span className="hidden sm:inline">Finanzas</span>
              </motion.a>
              <motion.a
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                href="/admin"
                className="btn-secondary text-sm backdrop-blur-sm"
              >
                <span className="hidden sm:inline">Panel Admin</span>
                <span className="sm:hidden">Admin</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Finanzas del Mes */}
        <section>
          <BillingMetrics
            summary={billingSummary}
            goal={billingGoal}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onSalesImported={reloadAll}
          />
        </section>

        {/* Cobros esta semana */}
        <section>
          <UpcomingClientPayments payments={upcomingClients} />
        </section>

        {/* Métricas automáticas: semana / mes / trimestre */}
        <section>
          <PeriodMetrics
            month={selectedMonth}
            followMonth
            refreshKey={refreshKey}
            title="Métricas"
          />
        </section>

        {/* Llamadas (Calendly) */}
        <section>
          <CallsBoard
            calls={calls}
            configured={calendlyConfigured}
            syncing={syncing}
            syncError={syncError}
            month={selectedMonth}
            onSync={() => syncCalendly(true)}
            onChanged={reloadAll}
          />
        </section>

        {/* Propuestas */}
        <section>
          <ProposalsBoard proposals={proposals} month={selectedMonth} onChanged={reloadAll} />
        </section>

        {/* Cadencia de Revisión */}
        <section>
          <CadenceTree />
        </section>
      </main>

      {/* Footer con glass */}
      <footer className="glass border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-brand-muted text-sm">
            Dashboard de Métricas - Sistema de Control
          </p>
        </div>
      </footer>
    </div>
  )
}
