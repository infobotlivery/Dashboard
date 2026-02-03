'use client'

import { motion } from 'framer-motion'
import { GlassCard } from './GlassCard'

interface UpcomingPayment {
  id: number
  name: string
  amount: number
  billingDay: number
  paidByClient: string | null
  category: { name: string; color: string }
  nextPaymentDate: string
  daysUntil: number
}

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[]
  total: number
  loading?: boolean
}

export function UpcomingPayments({ payments, total, loading }: UpcomingPaymentsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  // Formatear fecha como "15 feb"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Obtener color de urgencia basado en días restantes
  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 3) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
    if (daysUntil <= 7) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
  }

  if (loading) {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-xl">📅</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Proximos Pagos</h3>
            <p className="text-sm text-gray-400">Cargando...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded-lg" />
          ))}
        </div>
      </GlassCard>
    )
  }

  if (payments.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-xl">📅</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Proximos Pagos</h3>
            <p className="text-sm text-gray-400">No hay pagos programados</p>
          </div>
        </div>
        <div className="text-center py-6">
          <span className="text-4xl mb-2 block">💤</span>
          <p className="text-gray-400 text-sm">
            Agrega un dia de cobro a tus gastos recurrentes para verlos aqui
          </p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-xl">📅</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Proximos Pagos</h3>
            <p className="text-sm text-gray-400">Los 5 mas cercanos</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total proximos 5</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-xs text-gray-400 font-medium">Gasto</th>
              <th className="text-center py-2 px-2 text-xs text-gray-400 font-medium">Fecha</th>
              <th className="text-center py-2 px-2 text-xs text-gray-400 font-medium">En X dias</th>
              <th className="text-right py-2 px-2 text-xs text-gray-400 font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => {
              const urgency = getUrgencyColor(payment.daysUntil)
              return (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: payment.category.color }}
                      />
                      <span className="font-medium text-sm">{payment.name}</span>
                      {payment.paidByClient && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">
                          👤 {payment.paidByClient}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-sm font-medium text-white bg-white/10 px-2 py-1 rounded">
                      {formatDate(payment.nextPaymentDate)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${urgency.bg} ${urgency.text} ${urgency.border} border`}>
                      {payment.daysUntil === 0 ? 'Hoy' : payment.daysUntil === 1 ? 'Manana' : `${payment.daysUntil} dias`}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-semibold text-red-400">{formatCurrency(payment.amount)}</span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda de urgencia */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
        <span className="text-xs text-gray-500">Urgencia:</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-gray-400">&lt; 3 dias</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-400">&lt; 7 dias</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">+7 dias</span>
        </div>
      </div>
    </GlassCard>
  )
}
