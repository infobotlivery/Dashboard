'use client'

import { motion } from 'framer-motion'

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
  totalOnboardingMes: number
  clientesActivos: number
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
          <span className="inline-flex items-center gap-1 text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Activo
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Cancelado
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-brand-primary">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
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
    const headers = ['Cliente', 'Producto', 'Onboarding', 'Recurrente', 'Duracion', 'Fin Contrato', 'Estado', 'Fecha Registro']

    const rows = sales.map(sale => [
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
        className="card text-center py-8"
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

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-brand-muted font-medium text-sm">
                Producto
              </th>
              <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">
                Onboarding
              </th>
              <th className="text-right py-3 px-4 text-brand-muted font-medium text-sm">
                Recurrente
              </th>
              <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">
                Fin Contrato
              </th>
              <th className="text-center py-3 px-4 text-brand-muted font-medium text-sm">
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
                className="border-t border-brand-border hover:bg-brand-dark/50 transition-colors"
              >
                <td className="py-4 px-4 font-medium">
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

        {/* Footer con resumen */}
        {summary && (
          <div className="border-t border-brand-border mt-4 pt-4 px-4 pb-2">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-brand-muted text-sm">MRR Activo</p>
                <p className="text-xl font-bold text-brand-primary">{formatCurrency(summary.mrrActivo)}</p>
              </div>
              <div>
                <p className="text-brand-muted text-sm">Cierres del mes</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(summary.totalOnboardingMes)}</p>
              </div>
              <div>
                <p className="text-brand-muted text-sm">Clientes activos</p>
                <p className="text-xl font-bold">{summary.clientesActivos}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
