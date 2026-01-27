'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '../finanzas/GlassCard'
import { AnimatedNumber } from '../finanzas/AnimatedNumber'

interface SalesClose {
  id: number
  clientName: string
  product: string
  customProduct: string | null
  onboardingValue: number
  recurringValue: number
  contractMonths: number | null
  status: string
  createdAt: string
  cancelledAt: string | null
}

interface SalesSummary {
  mrrActivo: number
  totalOnboardingHistorico: number
  totalOnboardingMes: number
  clientesActivos: number
  clientesTotales: number
  cierresMes: number
}

interface SalesCloseTableProps {
  sales: SalesClose[]
  summary: SalesSummary | null
}

export function SalesCloseTable({ sales, summary }: SalesCloseTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric'
    })
  }

  const getContractEndDate = (createdAt: string, contractMonths: number | null): string => {
    if (!contractMonths) return '-'
    const date = new Date(createdAt)
    date.setMonth(date.getMonth() + contractMonths)
    return formatMonthYear(date.toISOString())
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Activo
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Cancelado
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completado
          </span>
        )
      default:
        return status
    }
  }

  const getProductDisplay = (product: string, customProduct: string | null) => {
    if (product === 'Otro' && customProduct) {
      return customProduct
    }
    return product
  }

  const handleExportCSV = () => {
    const headers = ['Mes Cierre', 'Cliente', 'Producto', 'Onboarding', 'Recurrente', 'Duracion', 'Fin Contrato', 'Estado', 'Fecha Registro']

    const rows = sales.map(sale => [
      formatMonthYear(sale.createdAt),
      sale.clientName,
      getProductDisplay(sale.product, sale.customProduct),
      sale.onboardingValue,
      sale.recurringValue,
      sale.contractMonths || '-',
      getContractEndDate(sale.createdAt, sale.contractMonths),
      sale.status === 'active' ? 'Activo' : sale.status === 'cancelled' ? 'Cancelado' : 'Completado',
      formatDate(sale.createdAt)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cierres_ventas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (sales.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card text-center py-8"
      >
        <p className="text-brand-muted">No hay cierres de venta registrados</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registro de Cierres</h2>
          <p className="text-brand-muted">
            {sales.length} cierre{sales.length !== 1 ? 's' : ''} registrado{sales.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* KPI Cards con GlassCard */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard variant="cyan" delay={0.1}>
            <p className="text-brand-muted text-sm mb-1">MRR Activo</p>
            <AnimatedNumber
              value={summary.mrrActivo}
              delay={0.2}
              className="text-2xl font-bold text-brand-primary"
              formatOptions={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          </GlassCard>

          <GlassCard variant="green" delay={0.15}>
            <p className="text-brand-muted text-sm mb-1">Total Onboarding</p>
            <AnimatedNumber
              value={summary.totalOnboardingHistorico}
              delay={0.25}
              className="text-2xl font-bold text-green-400"
              formatOptions={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          </GlassCard>

          <GlassCard variant="default" delay={0.2}>
            <p className="text-brand-muted text-sm mb-1">Onboarding este mes</p>
            <AnimatedNumber
              value={summary.totalOnboardingMes}
              delay={0.3}
              className="text-2xl font-bold text-yellow-400"
              formatOptions={{
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          </GlassCard>

          <GlassCard variant="default" delay={0.25}>
            <p className="text-brand-muted text-sm mb-1">Clientes</p>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={summary.clientesActivos}
                delay={0.35}
                className="text-2xl font-bold text-white"
                formatOptions={{
                  style: 'decimal',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }}
              />
              <span className="text-brand-muted text-sm font-normal">/ {summary.clientesTotales}</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tabla con glass */}
      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-center py-4 px-4 text-brand-muted font-medium text-sm">
                  Mes
                </th>
                <th className="text-left py-4 px-4 text-brand-muted font-medium text-sm">
                  Cliente
                </th>
                <th className="text-left py-4 px-4 text-brand-muted font-medium text-sm">
                  Producto
                </th>
                <th className="text-right py-4 px-4 text-brand-muted font-medium text-sm">
                  Onboarding
                </th>
                <th className="text-right py-4 px-4 text-brand-muted font-medium text-sm">
                  Recurrente
                </th>
                <th className="text-center py-4 px-4 text-brand-muted font-medium text-sm">
                  Fin Contrato
                </th>
                <th className="text-center py-4 px-4 text-brand-muted font-medium text-sm">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, idx) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-primary/10 text-brand-primary">
                      {formatMonthYear(sale.createdAt)}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-white">
                    {sale.clientName}
                  </td>
                  <td className="py-4 px-4 text-brand-muted">
                    {getProductDisplay(sale.product, sale.customProduct)}
                  </td>
                  <td className="text-right py-4 px-4 font-semibold text-green-400">
                    {sale.onboardingValue > 0 ? formatCurrency(sale.onboardingValue) : '-'}
                  </td>
                  <td className="text-right py-4 px-4 font-semibold">
                    {sale.recurringValue > 0 ? (
                      <span className="text-brand-primary">{formatCurrency(sale.recurringValue)}/mes</span>
                    ) : '-'}
                  </td>
                  <td className="text-center py-4 px-4 text-brand-muted">
                    {getContractEndDate(sale.createdAt, sale.contractMonths)}
                  </td>
                  <td className="text-center py-4 px-4">
                    {getStatusBadge(sale.status)}
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
