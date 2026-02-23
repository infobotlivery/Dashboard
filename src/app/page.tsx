'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MonthlyMetrics } from '@/components/dashboard/MonthlyMetrics'
import { CadenceTree } from '@/components/dashboard/CadenceTree'
import { BillingMetrics } from '@/components/dashboard/BillingMetrics'
import { UpcomingClientPayments } from '@/components/dashboard/UpcomingClientPayments'
import { ProposalsTable } from '@/components/dashboard/ProposalsTable'
import type {
  MonthlyScorecard,
  DailyCheck,
  Settings,
  FinanceSummary,
  MonthlyGoal,
  UpcomingClientPayment,
  Proposal
} from '@/types'

export default function DashboardPage() {
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<{ currentMonth: MonthlyScorecard | null; previousMonth: MonthlyScorecard | null }>({ currentMonth: null, previousMonth: null })
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Finance / proposals state
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [billingSummary, setBillingSummary] = useState<FinanceSummary | null>(null)
  const [billingGoal, setBillingGoal] = useState<MonthlyGoal | null>(null)
  const [upcomingClients, setUpcomingClients] = useState<UpcomingClientPayment[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const [monthlyComparisonRes, dailyRes, settingsRes, upcomingRes, proposalsRes] = await Promise.all([
          fetch('/api/scorecard/comparison'),
          fetch('/api/daily?limit=30'),
          fetch('/api/settings'),
          fetch('/api/sales/upcoming'),
          fetch('/api/proposals')
        ])

        if (monthlyComparisonRes.ok) {
          const d = await monthlyComparisonRes.json()
          setMonthlyComparisonData({
            currentMonth: d.data?.currentMonth || null,
            previousMonth: d.data?.previousMonth || null
          })
        }

        if (dailyRes.ok) {
          const d = await dailyRes.json()
          setDailyChecks(d.data || [])
        }

        if (settingsRes.ok) {
          const d = await settingsRes.json()
          setSettings(d.data)
        }

        if (upcomingRes.ok) {
          const d = await upcomingRes.json()
          setUpcomingClients(d.data || [])
        }

        if (proposalsRes.ok) {
          const d = await proposalsRes.json()
          setProposals(d.data || [])
        }

        // Cargar finance summary + goal para mes actual
        await fetchBillingData('')
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Recargar billing cuando cambia el mes seleccionado
  useEffect(() => {
    if (!loading) {
      fetchBillingData(selectedMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth])

  async function fetchBillingData(month: string) {
    try {
      const monthParam = month ? `?month=${month}` : ''
      const [summaryRes, goalRes] = await Promise.all([
        fetch(`/api/finance/summary${monthParam}`),
        fetch(`/api/finance/goals${monthParam ? `?month=${month}-01` : `?month=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`}`)
      ])

      if (summaryRes.ok) {
        const d = await summaryRes.json()
        if (d.data) setBillingSummary(d.data)
      }

      if (goalRes.ok) {
        const d = await goalRes.json()
        if (d.data) setBillingGoal(d.data)
        else setBillingGoal(null)
      }
    } catch (err) {
      console.error('Error fetching billing data:', err)
    }
  }

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
          />
        </section>

        {/* Cobros esta semana */}
        <section>
          <UpcomingClientPayments payments={upcomingClients} />
        </section>

        {/* Métricas Mensuales (Scorecard) */}
        <section>
          <MonthlyMetrics scorecard={monthlyComparisonData.currentMonth} />
        </section>

        {/* Propuestas (read-only) */}
        <section>
          <ProposalsTable proposals={proposals} />
        </section>

        {/* Cadencia de Revisión */}
        <section>
          <CadenceTree dailyChecks={dailyChecks} />
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
