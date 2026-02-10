'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WeeklyDashboard } from '@/components/dashboard/WeeklyDashboard'
import { WeeklyComparison } from '@/components/dashboard/WeeklyComparison'
import { MonthlyComparison } from '@/components/dashboard/MonthlyComparison'
import { MonthlyMetrics } from '@/components/dashboard/MonthlyMetrics'
import { CadenceTree } from '@/components/dashboard/CadenceTree'
import { SalesCloseTable } from '@/components/dashboard/SalesCloseTable'
import type { WeeklyMetric, MonthlyScorecard, DailyCheck, Settings, SalesClose, SalesSummary } from '@/types'

export default function DashboardPage() {
  const [currentMetric, setCurrentMetric] = useState<WeeklyMetric | null>(null)
  const [comparisonData, setComparisonData] = useState<{ currentWeek: WeeklyMetric | null; previousWeek: WeeklyMetric | null }>({ currentWeek: null, previousWeek: null })
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<{ currentMonth: MonthlyScorecard | null; previousMonth: MonthlyScorecard | null }>({ currentMonth: null, previousMonth: null })
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [salesCloses, setSalesCloses] = useState<SalesClose[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [metricsRes, comparisonRes, monthlyComparisonRes, dailyRes, settingsRes, salesRes, salesSummaryRes] = await Promise.all([
          fetch('/api/metrics/current'),
          fetch('/api/metrics/comparison'),
          fetch('/api/scorecard/comparison'),
          fetch('/api/daily?limit=30'),
          fetch('/api/settings'),
          fetch('/api/sales'),
          fetch('/api/sales?summary=true')
        ])

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          setCurrentMetric(metricsData.data)
        }

        if (comparisonRes.ok) {
          const comparisonDataRes = await comparisonRes.json()
          setComparisonData({
            currentWeek: comparisonDataRes.data?.currentWeek || null,
            previousWeek: comparisonDataRes.data?.previousWeek || null
          })
        }

        if (monthlyComparisonRes.ok) {
          const monthlyComparisonDataRes = await monthlyComparisonRes.json()
          setMonthlyComparisonData({
            currentMonth: monthlyComparisonDataRes.data?.currentMonth || null,
            previousMonth: monthlyComparisonDataRes.data?.previousMonth || null
          })
        }

        if (dailyRes.ok) {
          const dailyData = await dailyRes.json()
          setDailyChecks(dailyData.data || [])
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData.data)
        }

        if (salesRes.ok) {
          const salesData = await salesRes.json()
          setSalesCloses(salesData.data || [])
        }

        if (salesSummaryRes.ok) {
          const summaryData = await salesSummaryRes.json()
          setSalesSummary(summaryData.data || null)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
        {/* Dashboard Semanal - Nivel 1 */}
        <section>
          <WeeklyDashboard metric={currentMetric} />
        </section>

        {/* Métricas Mensuales */}
        <section>
          <MonthlyMetrics scorecard={monthlyComparisonData.currentMonth} />
        </section>

        {/* Comparativa Semanal */}
        <section>
          <WeeklyComparison
            currentWeek={comparisonData.currentWeek}
            previousWeek={comparisonData.previousWeek}
          />
        </section>

        {/* Comparativa Mensual */}
        <section>
          <MonthlyComparison
            currentMonth={monthlyComparisonData.currentMonth}
            previousMonth={monthlyComparisonData.previousMonth}
          />
        </section>

        {/* Registro de Cierres */}
        <section>
          <SalesCloseTable sales={salesCloses} summary={salesSummary} />
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
