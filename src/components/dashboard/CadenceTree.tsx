'use client'

import { motion } from 'framer-motion'
export function CadenceTree() {
  const cadences = [
    {
      level: 'DIARIO',
      color: 'bg-green-500',
      items: [
        '¿Publiqué contenido?',
        '¿Respondí leads?'
      ]
    },
    {
      level: 'SEMANAL (Lunes)',
      color: 'bg-blue-500',
      items: [
        'Dashboard de 6 métricas',
        'Reunión de 30 min (números + 3 motores + foco)'
      ]
    },
    {
      level: 'MENSUAL (Día 1 del mes)',
      color: 'bg-purple-500',
      items: [
        'Scorecard del mes anterior',
        '¿Cumplí metas? ¿Qué ajusto?'
      ]
    },
    {
      level: 'TRIMESTRAL',
      color: 'bg-orange-500',
      items: [
        'Revisión profunda estilo 12 Week Year',
        '¿Qué funcionó? ¿Qué no? ¿Qué cambia?'
      ]
    }
  ]

  return (
    <motion.details
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-0 overflow-hidden group"
    >
      <summary className="cursor-pointer select-none list-none px-6 py-4 flex items-center justify-between">
        <span>
          <span className="text-xl font-bold text-white">Cadencia de Revisión</span>
          <span className="block text-sm text-brand-muted">Tu sistema de control operativo</span>
        </span>
        <span className="text-brand-muted text-sm group-open:rotate-180 transition-transform">▾</span>
      </summary>

      {/* Árbol de cadencias */}
      <div className="px-6 pb-6 border-t border-white/10 pt-4">
        <div className="space-y-0">
          {cadences.map((cadence, idx) => (
            <motion.div
              key={cadence.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + idx * 0.1 }}
              className={`relative pl-8 py-4 ${
                idx !== cadences.length - 1 ? 'border-b border-brand-border' : ''
              }`}
            >
              {/* Línea vertical */}
              {idx !== cadences.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-brand-border" />
              )}

              {/* Punto de conexión */}
              <div
                className={`absolute left-1.5 top-6 w-3 h-3 rounded-full ${cadence.color}`}
              />

              {/* Contenido */}
              <div>
                <h4 className="font-semibold text-white mb-2">{cadence.level}</h4>
                <ul className="space-y-1">
                  {cadence.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="text-brand-muted text-sm flex items-center gap-2"
                    >
                      <span className="text-brand-primary">└</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.details>
  )
}
