'use client'

import { GlassCard } from '../GlassCard'
import { AnimatedNumber } from '../AnimatedNumber'

interface HistoryEntry {
  month: string
  monthLabel: string
  totalIncome: number
  totalOnboarding: number
  totalMrrServices: number
  totalMrrCommunity: number
  totalExpenses: number
  netProfit: number
}

interface HistorialTabProps {
  history: HistoryEntry[]
}

export function HistorialTab({ history }: HistorialTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  if (history.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <p className="text-gray-400">No hay datos historicos disponibles</p>
          <p className="text-sm text-gray-500 mt-1">
            Los datos del historial apareceran aqui conforme se registren
          </p>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="green" delay={0.1}>
          <p className="text-gray-400 text-sm mb-1">Total Ingresos (periodo)</p>
          <AnimatedNumber
            value={history.reduce((sum, h) => sum + h.totalIncome, 0)}
            className="text-2xl font-bold text-green-500"
          />
        </GlassCard>
        <GlassCard variant="red" delay={0.2}>
          <p className="text-gray-400 text-sm mb-1">Total Gastos (periodo)</p>
          <AnimatedNumber
            value={history.reduce((sum, h) => sum + h.totalExpenses, 0)}
            className="text-2xl font-bold text-red-500"
          />
        </GlassCard>
        <GlassCard variant="cyan" delay={0.3}>
          <p className="text-gray-400 text-sm mb-1">Utilidad Total (periodo)</p>
          <AnimatedNumber
            value={history.reduce((sum, h) => sum + h.netProfit, 0)}
            className={`text-2xl font-bold ${
              history.reduce((sum, h) => sum + h.netProfit, 0) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }`}
          />
        </GlassCard>
      </div>

      {/* Tabla de historial */}
      <GlassCard delay={0.4}>
        <h3 className="text-lg font-semibold mb-4">Historial Mensual</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                  Mes
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
                  Ingresos
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
                  Gastos
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
                  Utilidad
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, idx) => (
                <tr
                  key={entry.month}
                  className={`border-t border-white/5 ${
                    idx === 0 ? 'bg-[#44e1fc]/5' : ''
                  }`}
                >
                  <td className="py-4 px-4 font-medium capitalize">
                    {entry.monthLabel}
                    {idx === 0 && (
                      <span className="ml-2 text-xs text-[#44e1fc]">(actual)</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right text-green-400 font-semibold">
                    {formatCurrency(entry.totalIncome)}
                  </td>
                  <td className="py-4 px-4 text-right text-red-400 font-semibold">
                    {formatCurrency(entry.totalExpenses)}
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-bold ${
                      entry.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(entry.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Detalle expandido */}
      <GlassCard delay={0.5}>
        <h3 className="text-lg font-semibold mb-4">Detalle por Mes</h3>
        <div className="space-y-4">
          {history.map((entry, idx) => (
            <div
              key={entry.month}
              className={`bg-black/30 rounded-lg p-4 ${
                idx === 0 ? 'ring-1 ring-[#44e1fc]/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium capitalize">
                  {entry.monthLabel}
                  {idx === 0 && (
                    <span className="ml-2 text-xs text-[#44e1fc]">(actual)</span>
                  )}
                </h4>
                <span
                  className={`font-bold ${
                    entry.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(entry.netProfit)}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Onboarding</p>
                  <p className="text-green-400">{formatCurrency(entry.totalOnboarding)}</p>
                </div>
                <div>
                  <p className="text-gray-500">MRR Servicios</p>
                  <p className="text-green-400">{formatCurrency(entry.totalMrrServices)}</p>
                </div>
                <div>
                  <p className="text-gray-500">MRR Comunidad</p>
                  <p className="text-green-400">{formatCurrency(entry.totalMrrCommunity)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gastos</p>
                  <p className="text-red-400">{formatCurrency(entry.totalExpenses)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
