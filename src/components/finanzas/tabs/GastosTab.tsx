'use client'

import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import NumberInput from '@/components/ui/NumberInput'

interface Category {
  id: number
  name: string
  color: string
}

interface Expense {
  id: number
  name: string
  amount: number
  type: string
  categoryId: number
  category: { name: string; color: string }
  startDate: string
  endDate: string | null
  notes: string | null
}

interface NewExpense {
  name: string
  amount: number
  type: string
  categoryId: string
  notes: string
}

interface GastosTabProps {
  expenses: Expense[]
  categories: Category[]
  newExpense: NewExpense
  setNewExpense: (expense: NewExpense) => void
  editingExpenseId: number | null
  setEditingExpenseId: (id: number | null) => void
  onSave: () => void
  onDelete: (id: number) => void
  saving: boolean
}

export function GastosTab({
  expenses,
  categories,
  newExpense,
  setNewExpense,
  editingExpenseId,
  setEditingExpenseId,
  onSave,
  onDelete,
  saving
}: GastosTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)

  return (
    <div className="space-y-6">
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">
          {editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Nombre del gasto"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            placeholder="Ej: Cursor Pro"
          />
          <NumberInput
            label="Monto mensual"
            value={newExpense.amount}
            onChange={(value) => setNewExpense({ ...newExpense, amount: value })}
            prefix="$"
            step={10}
            color="#ef4444"
          />
          <Select
            label="Categoria"
            value={newExpense.categoryId}
            onChange={(value) => setNewExpense({ ...newExpense, categoryId: value })}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Seleccionar..."
          />
          <Select
            label="Tipo"
            value={newExpense.type}
            onChange={(value) => setNewExpense({ ...newExpense, type: value })}
            options={[
              { value: 'recurring', label: 'Recurrente (mensual)' },
              { value: 'fixed', label: 'Fijo (unico)' }
            ]}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={onSave} loading={saving}>
            {editingExpenseId ? 'Actualizar' : 'Agregar Gasto'}
          </Button>
          {editingExpenseId && (
            <button
              onClick={() => {
                setEditingExpenseId(null)
                setNewExpense({
                  name: '',
                  amount: 0,
                  type: 'recurring',
                  categoryId: '',
                  notes: ''
                })
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </GlassCard>

      {expenses.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Gastos Registrados</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#171717]/95 backdrop-blur-sm">
                <tr>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">
                    Nombre
                  </th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">
                    Categoria
                  </th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium text-sm">
                    Monto
                  </th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-sm">
                    Tipo
                  </th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-sm">
                    Estado
                  </th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-white/5">
                    <td className="py-3 px-3">{expense.name}</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: expense.category.color }}
                        />
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-red-400 font-semibold">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-gray-400">
                      {expense.type === 'recurring' ? 'Mensual' : 'Fijo'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-sm ${
                          expense.endDate ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {expense.endDate ? 'Cancelado' : 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingExpenseId(expense.id)
                          setNewExpense({
                            name: expense.name,
                            amount: expense.amount,
                            type: expense.type,
                            categoryId: String(expense.categoryId),
                            notes: expense.notes || ''
                          })
                        }}
                        className="text-[#44e1fc] hover:text-white text-sm mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
