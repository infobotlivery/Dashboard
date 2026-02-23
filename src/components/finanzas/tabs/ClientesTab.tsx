'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/finanzas/GlassCard'
import { AnimatedNumber } from '@/components/finanzas/AnimatedNumber'
import type { SalesClose, SalesSummary } from '@/types'

interface ClientesTabProps {
  sales: SalesClose[]
  summary: SalesSummary | null
  selectedMonth: string
  onMonthChange: (m: string) => void
}

function getCurrentYYYYMM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthYear(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getContractEndDate(createdAt: string, contractMonths: number | null): string {
  if (!contractMonths) return '-'
  const date = new Date(createdAt)
  date.setMonth(date.getMonth() + contractMonths)
  return formatMonthYear(date.toISOString())
}

function getProductDisplay(product: string, customProduct: string | null) {
  return product === 'Otro' && customProduct ? customProduct : product
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Activo
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Cancelado
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
          Completado
        </span>
      )
    default:
      return <span>{status}</span>
  }
}

export function ClientesTab({ sales, summary, selectedMonth, onMonthChange }: ClientesTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const currentYM = getCurrentYYYYMM()

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

  // Filtrar por mes seleccionado y status
  const filtered = useMemo(() => {
    return sales.filter(sale => {
      if (filterStatus !== 'todos' && sale.status !== filterStatus) return false
      if (selectedMonth) {
        const d = new Date(sale.createdAt)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (ym !== selectedMonth) return false
      }
      return true
    })
  }, [sales, filterStatus, selectedMonth])

  const handleExportCSV = () => {
    const headers = ['Mes Cierre', 'Cliente', 'Producto', 'Onboarding', 'Recurrente', 'Duracion', 'Fin Contrato', 'Estado', 'Fecha Registro']
    const rows = filtered.map(sale => [
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

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'cancelled', label: 'Cancelados' },
            { id: 'completed', label: 'Completados' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === f.id
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => onMonthChange(e.target.value)}
          max={currentYM}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/50"
          style={{ colorScheme: 'dark' }}
          placeholder="Todos los meses"
        />
        {selectedMonth && (
          <button
            onClick={() => onMonthChange('')}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5"
          >
            Limpiar
          </button>
        )}
        <button onClick={handleExportCSV} className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-white/10">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          CSV
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard variant="cyan" delay={0.1}>
            <p className="text-gray-400 text-sm mb-1">MRR Activo</p>
            <AnimatedNumber
              value={summary.mrrActivo}
              delay={0.2}
              className="text-2xl font-bold text-brand-primary"
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
          </GlassCard>
          <GlassCard variant="green" delay={0.15}>
            <p className="text-gray-400 text-sm mb-1">Onboarding Total</p>
            <AnimatedNumber
              value={summary.totalOnboardingHistorico}
              delay={0.25}
              className="text-2xl font-bold text-green-400"
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
          </GlassCard>
          <GlassCard variant="default" delay={0.2}>
            <p className="text-gray-400 text-sm mb-1">Onboarding Mes</p>
            <AnimatedNumber
              value={summary.totalOnboardingMes}
              delay={0.3}
              className="text-2xl font-bold text-yellow-400"
              formatOptions={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0 }}
            />
          </GlassCard>
          <GlassCard variant="default" delay={0.25}>
            <p className="text-gray-400 text-sm mb-1">Clientes</p>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={summary.clientesActivos}
                delay={0.35}
                className="text-2xl font-bold text-white"
                formatOptions={{ style: 'decimal', minimumFractionDigits: 0 }}
              />
              <span className="text-gray-400 text-sm">/ {summary.clientesTotales}</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No hay cierres que coincidan con los filtros
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-center py-4 px-4 text-gray-400 font-medium text-sm">Mes</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Cliente</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Producto</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium text-sm">Onboarding</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium text-sm">Recurrente</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium text-sm">Fin Contrato</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale, idx) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="text-center py-4 px-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-primary/10 text-brand-primary">
                        {formatMonthYear(sale.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-white">{sale.clientName}</td>
                    <td className="py-4 px-4 text-gray-400">{getProductDisplay(sale.product, sale.customProduct)}</td>
                    <td className="text-right py-4 px-4 font-semibold text-green-400">
                      {sale.onboardingValue > 0 ? formatCurrency(sale.onboardingValue) : '-'}
                    </td>
                    <td className="text-right py-4 px-4 font-semibold">
                      {sale.recurringValue > 0 ? (
                        <span className="text-brand-primary">{formatCurrency(sale.recurringValue)}/mes</span>
                      ) : '-'}
                    </td>
                    <td className="text-center py-4 px-4 text-gray-400">
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
      )}
    </div>
  )
}
