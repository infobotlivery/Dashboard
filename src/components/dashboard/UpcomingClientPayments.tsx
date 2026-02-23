'use client'

import { motion } from 'framer-motion'
import type { UpcomingClientPayment } from '@/types'

interface UpcomingClientPaymentsProps {
  payments: UpcomingClientPayment[]
}

export function UpcomingClientPayments({ payments }: UpcomingClientPaymentsProps) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getUrgencyClass = (days: number) => {
    if (days <= 3) return 'text-red-400 bg-red-400/10'
    return 'text-yellow-400 bg-yellow-400/10'
  }

  const getUrgencyLabel = (days: number) => {
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Mañana'
    return `${days} días`
  }

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card py-6 text-center"
      >
        <p className="text-brand-muted text-sm">No hay cobros de clientes esta semana</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h2 className="text-xl font-bold text-white">
        Cobros Esta Semana
        <span className="ml-2 text-sm font-normal text-brand-muted">
          ({payments.length} cliente{payments.length !== 1 ? 's' : ''})
        </span>
      </h2>

      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">Cliente</th>
                <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm hidden sm:table-cell">Servicio</th>
                <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">Monto/mes</th>
                <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Fecha</th>
                <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">Días</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-white">{p.clientName}</td>
                  <td className="py-3 px-4 text-brand-muted hidden sm:table-cell">{p.product}</td>
                  <td className="py-3 px-4 text-right font-semibold text-brand-primary">
                    {formatCurrency(p.recurringValue)}
                  </td>
                  <td className="py-3 px-4 text-center text-brand-muted text-sm">
                    {formatDate(p.nextPaymentDate)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getUrgencyClass(p.daysUntil)}`}>
                      {getUrgencyLabel(p.daysUntil)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
