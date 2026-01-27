'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type GlassVariant = 'default' | 'green' | 'red' | 'cyan'

interface GlassCardProps {
  children: ReactNode
  variant?: GlassVariant
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
}

const variantClasses: Record<GlassVariant, string> = {
  default: 'glass-card',
  green: 'glass-card-green',
  red: 'glass-card-red',
  cyan: 'glass-card-cyan'
}

export function GlassCard({
  children,
  variant = 'default',
  className = '',
  delay = 0,
  hover = true,
  onClick
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={hover ? { scale: 1.01 } : undefined}
      onClick={onClick}
      className={`${variantClasses[variant]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
  )
}
