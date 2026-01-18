'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  target?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}

export function MetricCard({
  title,
  value,
  subtitle,
  target,
  icon,
  trend,
  delay = 0
}: MetricCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-brand-muted'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{
        scale: 1.02,
        borderColor: 'var(--brand-primary)',
        boxShadow: '0 0 30px rgba(68, 225, 252, 0.15)'
      }}
      className="card relative overflow-hidden"
    >
      {/* Gradiente decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-brand-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-brand-muted text-sm font-medium uppercase tracking-wide">
            {title}
          </span>
          {icon && (
            <span className="text-brand-primary text-xl">
              {icon}
            </span>
          )}
        </div>

        {/* Valor principal */}
        <div className="mb-2">
          <span className="text-4xl font-bold text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`ml-2 text-sm ${trendColors[trend]}`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
            </span>
          )}
        </div>

        {/* Subtítulo y meta */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <span className="text-brand-muted text-sm">
              {subtitle}
            </span>
          )}
          {target && (
            <span className="text-brand-primary text-sm font-medium">
              Meta: {target}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
