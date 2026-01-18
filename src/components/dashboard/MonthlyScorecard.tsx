'use client'

import { motion } from 'framer-motion'

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

interface MonthlyScorecardProps {
  scorecards: MonthlyScorecard[]
}

export function MonthlyScorecardTable({ scorecards }: MonthlyScorecardProps) {
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
      month: 'short',
      year: 'numeric'
    })
  }

  const indicators = [
    { key: 'facturacionTotal', label: 'Facturación Total', format: formatCurrency },
    { key: 'mrr', label: 'MRR', format: formatCurrency },
    { key: 'clientesNuevos', label: 'Clientes Nuevos', format: (v: number) => v.toString() },
    { key: 'clientesPerdidos', label: 'Clientes Perdidos', format: (v: number) => v.toString() },
    { key: 'enigmaVendidos', label: 'ENIGMA Vendidos', format: (v: number) => v.toString() },
    { key: 'serviciosRecurrentes', label: 'Servicios Recurrentes', format: (v: number) => v.toString() },
    { key: 'leadsTotales', label: 'Leads Totales', format: (v: number) => v.toString() },
    { key: 'tasaCierre', label: 'Tasa de Cierre (%)', format: (v: number) => `${v.toFixed(1)}%` }
  ]

  if (scorecards.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-brand-muted">No hay datos de scorecards mensuales</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scorecard Mensual</h2>
          <p className="text-brand-muted">
            La película completa del año
          </p>
        </div>
        <span className="text-brand-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-primary">
          NIVEL 4
        </span>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">
                Indicador
              </th>
              {scorecards.slice(0, 6).map((sc) => (
                <th
                  key={sc.id}
                  className="text-center py-3 px-4 text-brand-muted font-medium text-sm capitalize"
                >
                  {formatMonth(sc.month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator, idx) => (
              <motion.tr
                key={indicator.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                className="border-t border-brand-border hover:bg-brand-dark/50 transition-colors"
              >
                <td className="py-4 px-4 font-medium">
                  {indicator.label}
                </td>
                {scorecards.slice(0, 6).map((sc) => (
                  <td
                    key={sc.id}
                    className="text-center py-4 px-4"
                  >
                    {indicator.format((sc as unknown as Record<string, number>)[indicator.key] || 0)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
