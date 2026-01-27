'use client'

import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Category {
  id: number
  name: string
  color: string
  _count: { expenses: number }
}

interface NewCategory {
  name: string
  color: string
}

interface CategoriasTabProps {
  categories: Category[]
  newCategory: NewCategory
  setNewCategory: (category: NewCategory) => void
  onCreate: () => void
  saving: boolean
}

export function CategoriasTab({
  categories,
  newCategory,
  setNewCategory,
  onCreate,
  saving
}: CategoriasTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Nueva Categoria</h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Nombre"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ej: Herramientas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Color
            </label>
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-12 h-12 rounded-lg cursor-pointer border border-white/10 bg-transparent"
            />
          </div>
          <Button onClick={onCreate} loading={saving}>
            Crear
          </Button>
        </div>
      </GlassCard>

      {categories.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Categorias Existentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between bg-black/30 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {category._count.expenses} gastos
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {categories.length === 0 && (
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-gray-400">No hay categorias creadas</p>
            <p className="text-sm text-gray-500 mt-1">
              Crea tu primera categoria para organizar tus gastos
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
