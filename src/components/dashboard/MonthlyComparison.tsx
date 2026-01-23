'use client'

import { motion } from 'framer-motion'

interface MonthlyScorecard {
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

interface MonthlyComparisonProps {
  currentMonth: MonthlyScorecard | null
  previousMonth: MonthlyScorecard | null
}

export function MonthlyComparison({ currentMonth, previousMonth }: MonthlyComparisonProps) {
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const calculateChange = (current: number, previous: number, inverted: boolean = false) => {
    const diff = current - previous
    const percentage = previous !== 0 ? ((diff / previous) * 100).toFixed(0) : (current > 0 ? 100 : 0)

    // Para métricas invertidas (como clientes perdidos), menos es mejor
    const isPositive = inverted ? diff <= 0 : diff >= 0

    return {
      diff,
      percentage,
      isPositive,
      color: isPositive ? 'text-green-400' : 'text-red-400',
      arrow: diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    }
  }

  const metrics = [
    {
      key: 'facturacionTotal',
      label: 'Facturación Total',
      format: formatCurrency,
      inverted: false
    },
    {
      key: 'mrr',
      label: 'MRR',
      format: formatCurrency,
      inverted: false
    },
    {
      key: 'clientesNuevos',
      label: 'Clientes Nuevos',
      format: (v: number) => `${v} clientes`,
      inverted: false
    },
    {
      key: 'clientesPerdidos',
      label: 'Clientes Perdidos',
      format: (v: number) => `${v} clientes`,
      inverted: true // Menos es mejor
    },
    {
      key: 'enigmaVendidos',
      label: 'Enigma Vendidos',
      format: (v: number) => `${v} unidades`,
      inverted: false
    },
    {
      key: 'serviciosRecurrentes',
      label: 'Servicios Recurrentes',
      format: (v: number) => `${v} activos`,
      inverted: false
    },
    {
      key: 'leadsTotales',
      label: 'Leads Totales',
      format: (v: number) => `${v} leads`,
      inverted: false
    },
    {
      key: 'tasaCierre',
      label: 'Tasa de Cierre',
      format: formatPercentage,
      inverted: false
    },
  ]

  if (!currentMonth) {
    return (
      <div className="card text-center py-8">
        <p className="text-brand-muted">No hay datos mensuales para comparar</p>
      </div>
    )
  }

  const current = currentMonth
  const previous = previousMonth || {
    facturacionTotal: 0,
    mrr: 0,
    clientesNuevos: 0,
    clientesPerdidos: 0,
    enigmaVendidos: 0,
    serviciosRecurrentes: 0,
    leadsTotales: 0,
    tasaCierre: 0
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
          <h2 className="text-2xl font-bold">Comparativa Mensual</h2>
          <p className="text-brand-muted">
            {previousMonth ? formatMonth(previousMonth.month) : 'Sin datos'} vs {formatMonth(current.month)}
          </p>
        </div>
        <span className="text-brand-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-primary">
          TENDENCIA
        </span>
      </div>

      {/* Tabla de comparación */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">
                Métrica
              </th>
              <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">
                Mes Anterior
              </th>
              <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">
                Este Mes
              </th>
              <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">
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
                  className="border-t border-brand-border hover:bg-brand-dark/50 transition-colors"
                >
                  <td className="py-4 px-4 font-medium">
                    {metric.label}
                  </td>
                  <td className="text-center py-4 px-4 text-brand-muted">
                    {metric.format(previousValue)}
                  </td>
                  <td className="text-center py-4 px-4 font-semibold">
                    {metric.format(currentValue)}
                  </td>
                  <td className={`text-center py-4 px-4 font-medium ${change.color}`}>
                    <span className="inline-flex items-center gap-1">
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
    </motion.div>
  )
}
