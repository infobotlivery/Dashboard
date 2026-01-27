'use client'

import { ReactNode } from 'react'
import { GlassCard } from '../finanzas/GlassCard'
import { AnimatedNumber } from '../finanzas/AnimatedNumber'
import { ProgressBar } from '../finanzas/ProgressBar'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  target?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
  // Nuevas props para progreso
  currentValue?: number
  targetValue?: number
  isCurrency?: boolean
}

type GlassVariant = 'default' | 'green' | 'red' | 'cyan'

export function MetricCard({
  title,
  value,
  subtitle,
  target,
  icon,
  trend,
  delay = 0,
  currentValue,
  targetValue,
  isCurrency = false
}: MetricCardProps) {
  // Determinar variante según trend
  const getVariant = (trend?: 'up' | 'down' | 'neutral'): GlassVariant => {
    switch (trend) {
      case 'up':
        return 'green'
      case 'down':
        return 'red'
      default:
        return 'default'
    }
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  }

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-brand-muted'
  }

  // Determinar color de progreso según trend
  const getProgressColor = (trend?: 'up' | 'down' | 'neutral'): 'green' | 'red' | 'cyan' => {
    switch (trend) {
      case 'up':
        return 'green'
      case 'down':
        return 'red'
      default:
        return 'cyan'
    }
  }

  // Extraer valor numérico del string si es necesario
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0

  return (
    <GlassCard variant={getVariant(trend)} delay={delay} hover>
      {/* Gradiente decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-brand-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-brand-muted text-sm font-medium uppercase tracking-wide">
            {title}
          </span>
          {icon && (
            <span className="text-xl opacity-80">
              {icon}
            </span>
          )}
        </div>

        {/* Valor principal animado */}
        <div className="mb-3">
          {isCurrency || typeof value === 'string' && value.includes('$') ? (
            <AnimatedNumber
              value={numericValue}
              delay={delay}
              className="text-4xl font-bold text-white tracking-tight"
              formatOptions={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          ) : typeof value === 'number' ? (
            <AnimatedNumber
              value={numericValue}
              delay={delay}
              className="text-4xl font-bold text-white tracking-tight"
              formatOptions={{
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          ) : (
            <span className="text-4xl font-bold text-white tracking-tight">
              {value}
            </span>
          )}
          {trend && (
            <span className={`ml-2 text-sm ${trendColors[trend]}`}>
              {trendIcons[trend]}
            </span>
          )}
        </div>

        {/* Barra de progreso si hay meta */}
        {currentValue !== undefined && targetValue !== undefined && targetValue > 0 && (
          <div className="mb-3">
            <ProgressBar
              current={currentValue}
              target={targetValue}
              color={getProgressColor(trend)}
              height="sm"
              showValues={false}
              formatValue={isCurrency
                ? (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
                : (v) => v.toString()
              }
            />
          </div>
        )}

        {/* Subtítulo y meta */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <span className="text-brand-muted text-sm">
              {subtitle}
            </span>
          )}
          {target && (
            <span className="text-brand-primary text-xs font-medium">
              Meta: {target}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
