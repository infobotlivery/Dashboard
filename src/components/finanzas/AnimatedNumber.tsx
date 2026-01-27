'use client'

import { useEffect, useRef } from 'react'
import { useSpring, useTransform, motion, useInView } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  delay?: number
  formatOptions?: Intl.NumberFormatOptions
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  delay = 0,
  formatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  })

  const display = useTransform(spring, (current) => {
    const formatted = new Intl.NumberFormat('es-MX', formatOptions).format(current)
    return `${prefix}${formatted}${suffix}`
  })

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        spring.set(value)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, spring, delay])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

interface AnimatedPercentProps {
  value: number
  duration?: number
  delay?: number
  className?: string
}

export function AnimatedPercent({
  value,
  duration = 1.5,
  delay = 0,
  className = ''
}: AnimatedPercentProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  })

  const display = useTransform(spring, (current) => {
    return `${Math.round(current)}%`
  })

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        spring.set(value)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, spring, delay])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}
