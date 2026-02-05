'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Category } from '@/types'

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

// Paleta de colores predefinidos
const colorPalette = [
  { color: '#22c55e', name: 'Verde' },
  { color: '#ef4444', name: 'Rojo' },
  { color: '#44e1fc', name: 'Cyan' },
  { color: '#f59e0b', name: 'Naranja' },
  { color: '#8b5cf6', name: 'Violeta' },
  { color: '#ec4899', name: 'Rosa' },
  { color: '#06b6d4', name: 'Turquesa' },
  { color: '#84cc16', name: 'Lima' },
  { color: '#f97316', name: 'Mandarina' },
  { color: '#6366f1', name: 'Indigo' },
  { color: '#14b8a6', name: 'Teal' },
  { color: '#eab308', name: 'Amarillo' },
]

// Iconos sugeridos para categorías
const categoryIcons: Record<string, string> = {
  'herramientas': '🛠️',
  'marketing': '📣',
  'software': '💻',
  'suscripciones': '🔄',
  'oficina': '🏢',
  'viajes': '✈️',
  'comida': '🍔',
  'transporte': '🚗',
  'educacion': '📚',
  'salud': '💊',
  'entretenimiento': '🎮',
  'servicios': '⚡',
  'impuestos': '📋',
  'legal': '⚖️',
  'hosting': '☁️',
  'default': '📁'
}

function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return icon
  }
  return categoryIcons.default
}

export function CategoriasTab({
  categories,
  newCategory,
  setNewCategory,
  onCreate,
  saving
}: CategoriasTabProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  const totalExpenses = categories.reduce((sum, cat) => sum + cat._count.expenses, 0)

  return (
    <div className="space-y-6">
      {/* Formulario de nueva categoría */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#44e1fc]/10 flex items-center justify-center">
            <span className="text-xl">🏷️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nueva Categoria</h3>
            <p className="text-sm text-gray-400">Organiza tus gastos por tipo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lado izquierdo: Formulario */}
          <div className="space-y-4">
            <Input
              label="Nombre de la categoria"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ej: Herramientas, Marketing, Software..."
            />

            {/* Selector de color visual */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Color de la categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((item) => (
                  <motion.button
                    key={item.color}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, color: item.color })}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      newCategory.color === item.color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                        : 'hover:ring-1 hover:ring-white/30'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  />
                ))}
                {/* Botón para color personalizado */}
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold"
                    title="Color personalizado"
                  >
                    +
                  </motion.button>
                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 z-10"
                      >
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-20 h-10 rounded-lg cursor-pointer border-0"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <Button onClick={onCreate} loading={saving} className="w-full sm:w-auto">
              Crear Categoria
            </Button>
          </div>

          {/* Lado derecho: Preview */}
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                style={{ backgroundColor: newCategory.color }}
              />

              {/* Preview card */}
              <div
                className="relative w-64 rounded-2xl p-6 border transition-all"
                style={{
                  backgroundColor: `${newCategory.color}15`,
                  borderColor: `${newCategory.color}40`
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${newCategory.color}30` }}
                  >
                    {getCategoryIcon(newCategory.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {newCategory.name || 'Nombre...'}
                    </p>
                    <p className="text-xs text-gray-400">0 gastos</p>
                  </div>
                </div>
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: newCategory.color }}
                />
                <p className="text-center text-xs text-gray-500 mt-4">
                  Vista previa
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </GlassCard>

      {/* Estadísticas rápidas */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-3xl font-bold text-[#44e1fc]">{categories.length}</p>
            <p className="text-sm text-gray-400">Categorias</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-3xl font-bold text-green-500">{totalExpenses}</p>
            <p className="text-sm text-gray-400">Gastos totales</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-3xl font-bold text-purple-500">
              {categories.length > 0 ? Math.round(totalExpenses / categories.length) : 0}
            </p>
            <p className="text-sm text-gray-400">Promedio/cat</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-3xl font-bold text-orange-500">
              {categories.filter(c => c._count.expenses > 0).length}
            </p>
            <p className="text-sm text-gray-400">Con gastos</p>
          </motion.div>
        </div>
      )}

      {/* Lista de categorías */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>Tus Categorias</span>
            <span className="text-sm font-normal text-gray-400">({categories.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="relative group"
                >
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: category.color }}
                  />

                  <div
                    className="relative rounded-2xl p-5 border transition-all cursor-pointer"
                    style={{
                      backgroundColor: `${category.color}10`,
                      borderColor: `${category.color}30`
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${category.color}25` }}
                        >
                          {getCategoryIcon(category.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{category.name}</p>
                          <p className="text-sm text-gray-400">
                            {category._count.expenses} {category._count.expenses === 1 ? 'gasto' : 'gastos'}
                          </p>
                        </div>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>

                    {/* Progress bar visual */}
                    <div className="mt-4">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: totalExpenses > 0
                              ? `${(category._count.expenses / totalExpenses) * 100}%`
                              : '0%'
                          }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalExpenses > 0
                          ? `${Math.round((category._count.expenses / totalExpenses) * 100)}% del total`
                          : 'Sin gastos'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {categories.length === 0 && (
        <GlassCard>
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#44e1fc]/20 to-purple-500/20 flex items-center justify-center"
            >
              <span className="text-5xl">🏷️</span>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold mb-2"
            >
              No hay categorias todavia
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-md mx-auto"
            >
              Las categorias te ayudan a organizar tus gastos y ver exactamente
              en que estas invirtiendo tu dinero. Crea tu primera categoria arriba.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 mt-6"
            >
              {['Herramientas', 'Marketing', 'Software', 'Servicios'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setNewCategory({ ...newCategory, name: suggestion })}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-all"
                >
                  {getCategoryIcon(suggestion)} {suggestion}
                </button>
              ))}
            </motion.div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
