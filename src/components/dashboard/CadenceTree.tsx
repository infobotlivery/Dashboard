'use client'

import { motion } from 'framer-motion'

interface DailyCheck {
  id: number
  date: string
  publicoContenido: boolean
  respondioLeads: boolean
}

interface CadenceTreeProps {
  dailyChecks?: DailyCheck[]
}

export function CadenceTree({ dailyChecks = [] }: CadenceTreeProps) {
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

  // Contar checks del último mes
  const recentChecks = dailyChecks.slice(0, 30)
  const contentDays = recentChecks.filter(c => c.publicoContenido).length
  const leadsDays = recentChecks.filter(c => c.respondioLeads).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cadencia de Revisión</h2>
          <p className="text-brand-muted">
            Tu sistema de control operativo
          </p>
        </div>
      </div>

      {/* Stats rápidos de checks diarios */}
      {recentChecks.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="text-brand-muted text-sm mb-1">Contenido (últimos 30 días)</div>
            <div className="text-2xl font-bold text-brand-primary">{contentDays}/30</div>
          </div>
          <div className="card">
            <div className="text-brand-muted text-sm mb-1">Leads respondidos (últimos 30 días)</div>
            <div className="text-2xl font-bold text-brand-primary">{leadsDays}/30</div>
          </div>
        </div>
      )}

      {/* Árbol de cadencias */}
      <div className="card">
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
    </motion.div>
  )
}
