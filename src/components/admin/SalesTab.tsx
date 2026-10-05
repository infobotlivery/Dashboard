'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import NumberInput from '@/components/ui/NumberInput'
import DateSelector from '@/components/ui/DateSelector'
import { Select } from '@/components/ui/Select'
import { SalesCsvImport } from '@/components/finanzas/SalesCsvImport'
import { apiFetch } from '@/lib/apiFetch'
import { formatLocalDate, parseLocalDate } from '@/lib/dates'
import type { SalesClose } from '@/types'

interface SalesTabProps {
  onMessage: (type: 'success' | 'error', text: string) => void
}

const emptySale = (): SalesClose => ({
  clientName: '',
  product: 'CRM',
  customProduct: '',
  onboardingValue: 0,
  recurringValue: 0,
  contractMonths: null,
  status: 'active',
  createdAt: formatLocalDate(new Date()),
  cancelledAt: null
})

export function SalesTab({ onMessage }: SalesTabProps) {
  const [salesClose, setSalesClose] = useState<SalesClose>(emptySale())
  const [salesList, setSalesList] = useState<(SalesClose & { id: number })[]>([])
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function reloadSales() {
    const res = await apiFetch('/api/sales')
    const data = await res.json()
    if (data.data) setSalesList(data.data)
  }

  useEffect(() => {
    reloadSales().catch(err => console.error('Error loading sales:', err))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      // createdAt se maneja como "YYYY-MM-DD" local; se convierte a ISO para el API
      const createdAt = salesClose.createdAt ? parseLocalDate(salesClose.createdAt).toISOString() : undefined
      const body = { ...salesClose, createdAt, ...(editingSaleId && { id: editingSaleId }) }
      const res = await apiFetch('/api/sales', {
        method: editingSaleId ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        onMessage('success', 'Guardado correctamente')
        await reloadSales()
        setSalesClose(emptySale())
        setEditingSaleId(null)
      } else {
        onMessage('error', data.error || 'Error al guardar')
      }
    } catch {
      onMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          {editingSaleId ? 'Editar Cierre' : 'Nuevo Cierre de Venta'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DateSelector
            label="📅 Fecha del Cierre"
            value={salesClose.createdAt ? parseLocalDate(salesClose.createdAt) : new Date()}
            onChange={(date) => setSalesClose({ ...salesClose, createdAt: formatLocalDate(date) })}
          />
          <Input
            label="Nombre del Cliente"
            value={salesClose.clientName}
            onChange={(e) => setSalesClose({ ...salesClose, clientName: e.target.value })}
            placeholder="Ej: Juan Pérez"
          />
          <Select
            label="Producto"
            value={salesClose.product}
            onChange={(value) => setSalesClose({ ...salesClose, product: value })}
            options={[
              { value: 'CRM', label: 'CRM', icon: '📊' },
              { value: 'Agente IA', label: 'Agente IA', icon: '🤖' },
              { value: 'Enigma', label: 'Enigma', icon: '🎯' },
              { value: 'Comunidad', label: 'Comunidad', icon: '👥' },
              { value: 'Asesoría', label: 'Asesoría', icon: '💡' },
              { value: 'Otro', label: 'Otro', icon: '📦' }
            ]}
          />
          {salesClose.product === 'Otro' && (
            <Input
              label="Producto Personalizado"
              value={salesClose.customProduct || ''}
              onChange={(e) => setSalesClose({ ...salesClose, customProduct: e.target.value })}
              placeholder="Especifica el producto"
            />
          )}
          <NumberInput
            label="Valor Onboarding"
            value={salesClose.onboardingValue}
            onChange={(value) => setSalesClose({ ...salesClose, onboardingValue: value })}
            prefix="$"
            step={100}
            color="#10b981"
          />
          <NumberInput
            label="Valor Recurrente (mensual)"
            value={salesClose.recurringValue}
            onChange={(value) => setSalesClose({ ...salesClose, recurringValue: value })}
            prefix="$"
            suffix="/mes"
            step={50}
            color="#3b82f6"
          />
          <NumberInput
            label="Duración Contrato (meses)"
            value={salesClose.contractMonths || 0}
            onChange={(value) => setSalesClose({ ...salesClose, contractMonths: value || null })}
            suffix="meses"
            min={0}
            max={60}
            color="#8b5cf6"
          />
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-2">Estado</label>
            <select
              value={salesClose.status}
              onChange={(e) => setSalesClose({ ...salesClose, status: e.target.value as SalesClose['status'] })}
              className="dark-select w-full"
            >
              <option value="active">🟢 Activo</option>
              <option value="cancelled">🔴 Cancelado</option>
              <option value="completed">✅ Completado</option>
            </select>
          </div>
        </div>
        {editingSaleId && (
          <div className="mt-4">
            <button
              onClick={() => {
                setEditingSaleId(null)
                setSalesClose(emptySale())
              }}
              className="text-brand-muted hover:text-white text-sm"
            >
              Cancelar edición
            </button>
          </div>
        )}
      </Card>
      <div>
      <Button onClick={handleSave} loading={saving} size="lg">
        Guardar Cambios
      </Button>
    </div>

    <SalesCsvImport onImported={reloadSales} />
      {/* Lista de cierres existentes */}
      {salesList.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Cierres Registrados</h2>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Fecha</th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Cliente</th>
                  <th className="text-left py-2 px-3 text-brand-muted font-medium text-sm">Producto</th>
                  <th className="text-right py-2 px-3 text-brand-muted font-medium text-sm">Onboarding</th>
                  <th className="text-right py-2 px-3 text-brand-muted font-medium text-sm">Recurrente</th>
                  <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Estado</th>
                  <th className="text-center py-2 px-3 text-brand-muted font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salesList.map((sale) => (
                  <tr key={sale.id} className="border-t border-brand-border">
                    <td className="py-3 px-3 text-brand-muted text-sm">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="py-3 px-3">{sale.clientName}</td>
                    <td className="py-3 px-3 text-brand-muted">
                      {sale.product === 'Otro' ? sale.customProduct : sale.product}
                    </td>
                    <td className="py-3 px-3 text-right text-green-400">
                      ${sale.onboardingValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-brand-primary">
                      ${sale.recurringValue.toLocaleString()}/mes
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        sale.status === 'active' ? 'text-green-400' :
                        sale.status === 'cancelled' ? 'text-red-400' : 'text-brand-primary'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          sale.status === 'active' ? 'bg-green-400' :
                          sale.status === 'cancelled' ? 'bg-red-400' : 'bg-brand-primary'
                        }`}></span>
                        {sale.status === 'active' ? 'Activo' :
                         sale.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingSaleId(sale.id)
                          setSalesClose({
                            clientName: sale.clientName,
                            product: sale.product,
                            customProduct: sale.customProduct || '',
                            onboardingValue: sale.onboardingValue,
                            recurringValue: sale.recurringValue,
                            contractMonths: sale.contractMonths,
                            status: sale.status,
                            createdAt: sale.createdAt
                              ? formatLocalDate(new Date(sale.createdAt))
                              : formatLocalDate(new Date()),
                            cancelledAt: sale.cancelledAt
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-brand-primary hover:text-white text-sm mr-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
