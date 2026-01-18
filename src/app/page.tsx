'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WeeklyDashboard } from '@/components/dashboard/WeeklyDashboard'
import { MonthlyScorecardTable } from '@/components/dashboard/MonthlyScorecard'
import { CadenceTree } from '@/components/dashboard/CadenceTree'

interface WeeklyMetric {
  id: number
  weekStart: string
  mrr: number
  pipelineActivo: number
  cierresSemana: number
  contenidoPublicado: number
  leadsEntrantes: number
  entregasPendientes: number
}

interface MonthlyScorecard {
  id: number
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

interface DailyCheck {
  id: number
  date: string
  publicoContenido: boolean
  respondioLeads: boolean
}

export default function DashboardPage() {
  const [currentMetric, setCurrentMetric] = useState<WeeklyMetric | null>(null)
  const [scorecards, setScorecards] = useState<MonthlyScorecard[]>([])
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [metricsRes, scorecardsRes, dailyRes] = await Promise.all([
          fetch('/api/metrics/current'),
          fetch('/api/scorecard?limit=6'),
          fetch('/api/daily?limit=30')
        ])

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          setCurrentMetric(metricsData.data)
        }

        if (scorecardsRes.ok) {
          const scorecardsData = await scorecardsRes.json()
          setScorecards(scorecardsData.data || [])
        }

        if (dailyRes.ok) {
          const dailyData = await dailyRes.json()
          setDailyChecks(dailyData.data || [])
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
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
      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Sistema de <span className="text-brand-primary">Control</span>
              </h1>
              <p className="text-brand-muted mt-1">
                Métricas de negocio en tiempo real
              </p>
            </div>
            <a
              href="/admin"
              className="btn-secondary text-sm"
            >
              Panel Admin
            </a>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Dashboard Semanal - Nivel 1 */}
        <section>
          <WeeklyDashboard metric={currentMetric} />
        </section>

        {/* Scorecard Mensual - Nivel 4 */}
        <section>
          <MonthlyScorecardTable scorecards={scorecards} />
        </section>

        {/* Cadencia de Revisión */}
        <section>
          <CadenceTree dailyChecks={dailyChecks} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-brand-muted text-sm">
            Dashboard de Métricas - Sistema de Control
          </p>
        </div>
      </footer>
    </div>
  )
}
