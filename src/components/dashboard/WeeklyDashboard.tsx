'use client'

import { motion } from 'framer-motion'
import { MetricCard } from './MetricCard'

interface WeeklyMetric {
  id: number
  weekStart: string
  mrr: number
  mrrComunidad: number
  pipelineActivo: number
  cierresSemana: number
  contenidoPublicado: number
  leadsEntrantes: number
  entregasPendientes: number
}

interface WeeklyDashboardProps {
  metric: WeeklyMetric | null
}

export function WeeklyDashboard({ metric }: WeeklyDashboardProps) {
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

  // Metas mínimas según tu sistema
  const targets = {
    mrr: { min: 875, goal: 1500 },
    mrrComunidad: { min: 500, goal: 1000 },
    pipelineActivo: { min: 5, goal: 5 },
    cierresSemana: { min: 1000, goal: 1000 },
    contenidoPublicado: { min: 3, goal: 5 },
    leadsEntrantes: { min: 5, goal: 5 },
    entregasPendientes: { max: 3 }
  }

  const getTrend = (value: number, target: { min?: number; max?: number; goal?: number }) => {
    if (target.max !== undefined) {
      return value <= target.max ? 'up' : 'down'
    }
    if (target.min !== undefined) {
      return value >= target.min ? 'up' : 'down'
    }
    return 'neutral'
  }

  if (!metric) {
    return (
      <div className="card text-center py-12">
        <p className="text-brand-muted">No hay datos para esta semana</p>
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
          <h2 className="text-2xl font-bold">Dashboard Semanal</h2>
          <p className="text-brand-muted">
            Semana del {formatDate(metric.weekStart)}
          </p>
        </div>
        <span className="text-brand-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-primary">
          NIVEL 1
        </span>
      </motion.div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="MRR Clientes"
          value={formatCurrency(metric.mrr)}
          subtitle="Ingresos recurrentes clientes"
          target={`${formatCurrency(targets.mrr.min)} → ${formatCurrency(targets.mrr.goal)}`}
          trend={getTrend(metric.mrr, targets.mrr)}
          delay={0}
          icon={<span>💰</span>}
        />

        <MetricCard
          title="MRR Comunidad"
          value={formatCurrency(metric.mrrComunidad || 0)}
          subtitle="Ingresos recurrentes comunidad"
          target={`${formatCurrency(targets.mrrComunidad.min)} → ${formatCurrency(targets.mrrComunidad.goal)}`}
          trend={getTrend(metric.mrrComunidad || 0, targets.mrrComunidad)}
          delay={0.05}
          icon={<span>👥</span>}
        />

        <MetricCard
          title="Pipeline Activo"
          value={metric.pipelineActivo}
          subtitle="Leads calientes"
          target={`${targets.pipelineActivo.min}+`}
          trend={getTrend(metric.pipelineActivo, targets.pipelineActivo)}
          delay={0.1}
          icon={<span>🔥</span>}
        />

        <MetricCard
          title="Cierres de la Semana"
          value={formatCurrency(metric.cierresSemana)}
          subtitle="Ventas cerradas"
          target={`${formatCurrency(targets.cierresSemana.min)}+/semana`}
          trend={getTrend(metric.cierresSemana, targets.cierresSemana)}
          delay={0.15}
          icon={<span>🎯</span>}
        />

        <MetricCard
          title="Contenido Publicado"
          value={metric.contenidoPublicado}
          subtitle="Piezas creadas"
          target={`${targets.contenidoPublicado.min}-${targets.contenidoPublicado.goal}/semana`}
          trend={getTrend(metric.contenidoPublicado, targets.contenidoPublicado)}
          delay={0.2}
          icon={<span>📝</span>}
        />

        <MetricCard
          title="Leads Entrantes"
          value={metric.leadsEntrantes}
          subtitle="Nuevas consultas"
          target={`${targets.leadsEntrantes.min}+/semana`}
          trend={getTrend(metric.leadsEntrantes, targets.leadsEntrantes)}
          delay={0.25}
          icon={<span>📥</span>}
        />

        <MetricCard
          title="Entregas Pendientes"
          value={metric.entregasPendientes}
          subtitle="Proyectos sin cerrar"
          target={`Máximo ${targets.entregasPendientes.max}`}
          trend={getTrend(metric.entregasPendientes, targets.entregasPendientes)}
          delay={0.3}
          icon={<span>📦</span>}
        />
      </div>
    </div>
  )
}
