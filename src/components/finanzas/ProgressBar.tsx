'use client'

import { motion } from 'framer-motion'

type ProgressColor = 'green' | 'red' | 'cyan' | 'yellow'

interface ProgressBarProps {
  current: number
  target: number
  label?: string
  showValues?: boolean
  color?: ProgressColor
  height?: 'sm' | 'md' | 'lg'
  className?: string
  formatValue?: (value: number) => string
}

const colorClasses: Record<ProgressColor, { bg: string; fill: string; text: string }> = {
  green: {
    bg: 'bg-green-500/20',
    fill: 'bg-green-500',
    text: 'text-green-500'
  },
  red: {
    bg: 'bg-red-500/20',
    fill: 'bg-red-500',
    text: 'text-red-500'
  },
  cyan: {
    bg: 'bg-[#44e1fc]/20',
    fill: 'bg-[#44e1fc]',
    text: 'text-[#44e1fc]'
  },
  yellow: {
    bg: 'bg-yellow-500/20',
    fill: 'bg-yellow-500',
    text: 'text-yellow-500'
  }
}

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4'
}

export function ProgressBar({
  current,
  target,
  label,
  showValues = true,
  color = 'cyan',
  height = 'md',
  className = '',
  formatValue = (v) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(v)
}: ProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOverTarget = current > target
  const colors = colorClasses[color]

  return (
    <div className={`w-full ${className}`}>
      {(label || showValues) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm text-gray-400">{label}</span>
          )}
          {showValues && (
            <span className="text-sm">
              <span className={colors.text}>{formatValue(current)}</span>
              <span className="text-gray-500"> / {formatValue(target)}</span>
            </span>
          )}
        </div>
      )}

      <div className={`w-full ${colors.bg} rounded-full ${heightClasses[height]} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`${colors.fill} ${heightClasses[height]} rounded-full ${
            isOverTarget ? 'shadow-[0_0_10px_rgba(34,197,94,0.5)]' : ''
          }`}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${percentage >= 100 ? 'text-green-400' : 'text-gray-500'}`}>
          {percentage.toFixed(0)}%
        </span>
        {isOverTarget && (
          <span className="text-xs text-green-400">
            +{formatValue(current - target)} extra
          </span>
        )}
      </div>
    </div>
  )
}
