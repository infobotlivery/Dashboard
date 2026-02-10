'use client'

import { motion } from 'framer-motion'
import { MetricCard } from './MetricCard'
import type { MonthlyScorecard } from '@/types'

interface MonthlyMetricsProps {
  scorecard: MonthlyScorecard | null
}

export function MonthlyMetrics({ scorecard }: MonthlyMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Metas mensuales
  const targets = {
    mrr: { min: 1500, goal: 3000 },
    mrrComunidad: { min: 1000, goal: 2000 }
  }

  const getTrend = (value: number, target: { min?: number; goal?: number }) => {
    if (target.min !== undefined) {
      return value >= target.min ? 'up' : 'down'
    }
    return 'neutral'
  }

  if (!scorecard) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-brand-muted">No hay datos mensuales disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">Métricas Mensuales</h2>
          <p className="text-brand-muted">
            {formatMonth(scorecard.month)}
          </p>
        </div>
        <span className="text-brand-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-primary backdrop-blur-sm bg-brand-primary/5">
          VISTA MENSUAL
        </span>
      </motion.div>

      {/* Grid de métricas mensuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="MRR Clientes"
          value={formatCurrency(scorecard.mrr)}
          subtitle="Ingresos recurrentes mensuales"
          target={`${formatCurrency(targets.mrr.min)} → ${formatCurrency(targets.mrr.goal)}`}
          trend={getTrend(scorecard.mrr, targets.mrr)}
          delay={0}
          icon={<span>💰</span>}
          currentValue={scorecard.mrr}
          targetValue={targets.mrr.goal}
          isCurrency
        />

        <MetricCard
          title="MRR Comunidad"
          value={formatCurrency(scorecard.mrrComunidad || 0)}
          subtitle="Ingresos recurrentes comunidad"
          target={`${formatCurrency(targets.mrrComunidad.min)} → ${formatCurrency(targets.mrrComunidad.goal)}`}
          trend={getTrend(scorecard.mrrComunidad || 0, targets.mrrComunidad)}
          delay={0.05}
          icon={<span>👥</span>}
          currentValue={scorecard.mrrComunidad || 0}
          targetValue={targets.mrrComunidad.goal}
          isCurrency
        />
      </div>
    </div>
  )
}
