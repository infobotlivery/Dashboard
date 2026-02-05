'use client'

import { motion } from 'framer-motion'
import type { WeeklyMetric } from '@/types'

interface WeeklyComparisonProps {
  currentWeek: WeeklyMetric | null
  previousWeek: WeeklyMetric | null
}

export function WeeklyComparison({ currentWeek, previousWeek }: WeeklyComparisonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }

  const calculateChange = (current: number, previous: number, inverted: boolean = false) => {
    const diff = current - previous
    const percentage = previous !== 0 ? ((diff / previous) * 100).toFixed(0) : (current > 0 ? 100 : 0)

    // Para métricas invertidas (como entregas pendientes), menos es mejor
    const isPositive = inverted ? diff <= 0 : diff >= 0

    return {
      diff,
      percentage,
      isPositive,
      color: isPositive ? 'text-green-400' : 'text-red-400',
      bgColor: isPositive ? 'bg-green-400/10' : 'bg-red-400/10',
      arrow: diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    }
  }

  const metrics = [
    {
      key: 'mrr',
      label: 'MRR Clientes',
      format: formatCurrency,
      inverted: false
    },
    {
      key: 'mrrComunidad',
      label: 'MRR Comunidad',
      format: formatCurrency,
      inverted: false
    },
    {
      key: 'pipelineActivo',
      label: 'Propuestas Enviadas',
      format: (v: number) => `${v} propuestas`,
      inverted: false
    },
    {
      key: 'cierresSemana',
      label: 'Cierres de Semana',
      format: formatCurrency,
      inverted: false
    },
    {
      key: 'contenidoPublicado',
      label: 'Contenido Publicado',
      format: (v: number) => `${v} piezas`,
      inverted: false
    },
    {
      key: 'leadsEntrantes',
      label: 'Leads Entrantes',
      format: (v: number) => `${v} nuevos`,
      inverted: false
    },
    {
      key: 'entregasPendientes',
      label: 'Entregas Pendientes',
      format: (v: number) => `${v} proyectos`,
      inverted: true // Menos es mejor
    },
  ]

  if (!currentWeek) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card text-center py-8"
      >
        <p className="text-brand-muted">No hay datos para comparar</p>
      </motion.div>
    )
  }

  const current = currentWeek
  const previous = previousWeek || {
    mrr: 0,
    mrrComunidad: 0,
    pipelineActivo: 0,
    cierresSemana: 0,
    contenidoPublicado: 0,
    leadsEntrantes: 0,
    entregasPendientes: 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comparativa Semanal</h2>
          <p className="text-brand-muted">
            {previousWeek ? formatDate(previousWeek.weekStart) : 'Sin datos'} vs {formatDate(current.weekStart)}
          </p>
        </div>
        <span className="text-brand-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-primary backdrop-blur-sm bg-brand-primary/5">
          TENDENCIA
        </span>
      </div>

      {/* Tabla de comparación con glass */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-brand-muted font-medium text-sm">
                  Métrica
                </th>
                <th className="text-center py-4 px-6 text-brand-muted font-medium text-sm">
                  Semana Anterior
                </th>
                <th className="text-center py-4 px-6 text-brand-muted font-medium text-sm">
                  Esta Semana
                </th>
                <th className="text-center py-4 px-6 text-brand-muted font-medium text-sm">
                  Cambio
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => {
                const currentValue = (current as unknown as Record<string, number>)[metric.key] || 0
                const previousValue = (previous as unknown as Record<string, number>)[metric.key] || 0
                const change = calculateChange(currentValue, previousValue, metric.inverted)

                return (
                  <motion.tr
                    key={metric.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium">
                      {metric.label}
                    </td>
                    <td className="text-center py-4 px-6 text-brand-muted">
                      {metric.format(previousValue)}
                    </td>
                    <td className="text-center py-4 px-6 font-semibold text-white">
                      {metric.format(currentValue)}
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${change.color} ${change.bgColor}`}>
                        {change.arrow}
                        {change.diff !== 0 && (
                          <span>
                            {change.diff > 0 ? '+' : ''}{change.percentage}%
                          </span>
                        )}
                        {change.diff === 0 && <span>Sin cambio</span>}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
